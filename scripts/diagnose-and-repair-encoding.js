#!/usr/bin/env node
/**
 * MADAR Arabic encoding diagnostic and safe repair script.
 *
 * Detects:
 *   - Mojibake patterns (UTF-8 bytes interpreted as latin1)
 *   - Values consisting mainly of question marks
 *   - Hidden U+FEFF (BOM) characters
 *   - Duplicate normalized emails
 *
 * Repairs only confirmed recoverable mojibake after backing up the original value
 * to a `encodingFixBackup` object on the document.
 *
 * Usage:
 *   cd madar-backend
 *   node ../scripts/diagnose-and-repair-encoding.js [--dry-run] [--repair]
 */

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/madar';

const MOJIBAKE_PATTERNS = [
  /[ØÙÃ�]/,
  /[ÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]/,
];
const QUESTION_MARK_PATTERN = /\?{3,}/;
const BOM = '\uFEFF';

function containsMojibake(value) {
  if (typeof value !== 'string') return false;
  return MOJIBAKE_PATTERNS.some((re) => re.test(value));
}

function containsUnrecoverableQuestionMarks(value) {
  if (typeof value !== 'string') return false;
  return QUESTION_MARK_PATTERN.test(value);
}

function containsBom(value) {
  if (typeof value !== 'string') return false;
  return value.includes(BOM);
}

/**
 * Attempt to recover a string that was UTF-8 bytes interpreted as latin1.
 * Returns the repaired string if the result is clearly Arabic/valid UTF-8,
 * otherwise returns null.
 */
function recoverMojibake(value) {
  if (typeof value !== 'string') return null;
  try {
    // Convert latin1 string back to bytes, then decode as UTF-8.
    const bytes = Buffer.from(value, 'latin1');
    const recovered = bytes.toString('utf-8');
    // Accept only if the recovered string no longer contains mojibake markers
    // and contains at least one Arabic character or is non-empty ASCII.
    if (containsMojibake(recovered)) return null;
    if (/[\u0600-\u06FF]/.test(recovered)) return recovered;
    // If original was ASCII mojibake (rare), accept if bytes are valid UTF-8 and content changed.
    if (recovered !== value && /^[\x20-\x7E\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]*$/.test(recovered)) {
      return recovered;
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeEmail(email) {
  if (typeof email !== 'string') return email;
  return email.replace(/\uFEFF/g, '').trim().toLowerCase();
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const repair = args.includes('--repair');

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const report = {
    timestamp: new Date().toISOString(),
    dryRun,
    repaired: 0,
    unrecoverable: [],
    bomFields: [],
    duplicateEmails: [],
    actions: [],
  };

  // 1. Duplicate normalized emails
  const emailMap = new Map();
  const usersCursor = db.collection('users').find({}, { projection: { email: 1 } });
  for await (const user of usersCursor) {
    const normalized = normalizeEmail(user.email);
    if (!normalized) continue;
    if (!emailMap.has(normalized)) {
      emailMap.set(normalized, []);
    }
    emailMap.get(normalized).push(String(user._id));
  }
  for (const [email, ids] of emailMap.entries()) {
    if (ids.length > 1) {
      report.duplicateEmails.push({ email, userIds: ids });
    }
  }

  // 2. Scan and repair user text fields
  const textFields = ['firstName', 'lastName', 'firstNameAr', 'lastNameAr', 'phone'];
  const userCursor = db.collection('users').find({});
  for await (const user of userCursor) {
    const userId = String(user._id);
    const backup = {};
    const updates = {};

    for (const field of textFields) {
      const value = user[field];
      if (typeof value !== 'string') continue;

      if (containsBom(value)) {
        report.bomFields.push({ collection: 'users', id: userId, field, value });
        updates[field] = value.replace(/\uFEFF/g, '').trim();
        backup[field] = value;
      }

      if (containsMojibake(value)) {
        const recovered = recoverMojibake(value);
        if (recovered !== null) {
          updates[field] = recovered;
          backup[field] = value;
          report.actions.push({ collection: 'users', id: userId, field, from: value, to: recovered, action: 'recover_mojibake' });
        } else {
          report.unrecoverable.push({ collection: 'users', id: userId, field, value });
        }
      } else if (containsUnrecoverableQuestionMarks(value)) {
        report.unrecoverable.push({ collection: 'users', id: userId, field, value });
      }
    }

    // Normalize email in-place (no overwrite of value, just trim/BOM/lowercase)
    if (typeof user.email === 'string' && user.email !== normalizeEmail(user.email)) {
      updates.email = normalizeEmail(user.email);
      backup.email = user.email;
      report.actions.push({ collection: 'users', id: userId, field: 'email', from: user.email, to: updates.email, action: 'normalize_email' });
    }

    if (Object.keys(updates).length > 0) {
      if (repair && !dryRun) {
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: updates, $setOnInsert: { encodingFixBackup: backup } },
        );
        // Ensure backup is stored even if document already existed (use $set if no backup)
        const existing = await db.collection('users').findOne({ _id: user._id }, { projection: { encodingFixBackup: 1 } });
        if (!existing.encodingFixBackup) {
          await db.collection('users').updateOne({ _id: user._id }, { $set: { encodingFixBackup: backup } });
        }
        report.repaired++;
      } else {
        report.actions.push({ collection: 'users', id: userId, wouldUpdate: updates, action: dryRun ? 'would_repair' : 'detected' });
      }
    }
  }

  // 3. Scan university names
  const uniTextFields = ['name', 'nameAr', 'shortName', 'description', 'descriptionAr'];
  const uniCursor = db.collection('universities').find({});
  for await (const uni of uniCursor) {
    const uniId = String(uni._id);
    const backup = {};
    const updates = {};

    for (const field of uniTextFields) {
      const value = uni[field];
      if (typeof value !== 'string') continue;

      if (containsBom(value)) {
        report.bomFields.push({ collection: 'universities', id: uniId, field, value });
        updates[field] = value.replace(/\uFEFF/g, '').trim();
        backup[field] = value;
      }

      if (containsMojibake(value)) {
        const recovered = recoverMojibake(value);
        if (recovered !== null) {
          updates[field] = recovered;
          backup[field] = value;
          report.actions.push({ collection: 'universities', id: uniId, field, from: value, to: recovered, action: 'recover_mojibake' });
        } else {
          report.unrecoverable.push({ collection: 'universities', id: uniId, field, value });
        }
      } else if (containsUnrecoverableQuestionMarks(value)) {
        report.unrecoverable.push({ collection: 'universities', id: uniId, field, value });
      }
    }

    if (Object.keys(updates).length > 0) {
      if (repair && !dryRun) {
        await db.collection('universities').updateOne(
          { _id: uni._id },
          { $set: updates, $setOnInsert: { encodingFixBackup: backup } },
        );
        const existing = await db.collection('universities').findOne({ _id: uni._id }, { projection: { encodingFixBackup: 1 } });
        if (!existing.encodingFixBackup) {
          await db.collection('universities').updateOne({ _id: uni._id }, { $set: { encodingFixBackup: backup } });
        }
        report.repaired++;
      } else {
        report.actions.push({ collection: 'universities', id: uniId, wouldUpdate: updates, action: dryRun ? 'would_repair' : 'detected' });
      }
    }
  }

  // 4. Scan college/department names
  for (const collectionName of ['colleges', 'departments']) {
    const cursor = db.collection(collectionName).find({});
    for await (const doc of cursor) {
      const docId = String(doc._id);
      const backup = {};
      const updates = {};
      for (const field of ['name', 'nameAr', 'description']) {
        const value = doc[field];
        if (typeof value !== 'string') continue;
        if (containsBom(value)) {
          report.bomFields.push({ collection: collectionName, id: docId, field, value });
          updates[field] = value.replace(/\uFEFF/g, '').trim();
          backup[field] = value;
        }
        if (containsMojibake(value)) {
          const recovered = recoverMojibake(value);
          if (recovered !== null) {
            updates[field] = recovered;
            backup[field] = value;
            report.actions.push({ collection: collectionName, id: docId, field, from: value, to: recovered, action: 'recover_mojibake' });
          } else {
            report.unrecoverable.push({ collection: collectionName, id: docId, field, value });
          }
        } else if (containsUnrecoverableQuestionMarks(value)) {
          report.unrecoverable.push({ collection: collectionName, id: docId, field, value });
        }
      }
      if (Object.keys(updates).length > 0 && repair && !dryRun) {
        await db.collection(collectionName).updateOne(
          { _id: doc._id },
          { $set: updates, $setOnInsert: { encodingFixBackup: backup } },
        );
        const existing = await db.collection(collectionName).findOne({ _id: doc._id }, { projection: { encodingFixBackup: 1 } });
        if (!existing.encodingFixBackup) {
          await db.collection(collectionName).updateOne({ _id: doc._id }, { $set: { encodingFixBackup: backup } });
        }
        report.repaired++;
      }
    }
  }

  await client.close();

  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
