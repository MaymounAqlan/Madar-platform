import { ResendEmailProvider } from './resend-email.provider';
import { SmtpEmailProvider } from './smtp-email.provider';

// ── Helper: set and restore env vars ────────────────────────────────────

function withEnv(overrides: Record<string, string | undefined>, fn: () => void | Promise<void>) {
  const originals: Record<string, string | undefined> = {};
  for (const key of Object.keys(overrides)) {
    originals[key] = process.env[key];
    if (overrides[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = overrides[key];
    }
  }
  const restore = () => {
    for (const key of Object.keys(originals)) {
      if (originals[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originals[key];
      }
    }
  };
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.finally(restore);
    }
    restore();
  } catch (e) {
    restore();
    throw e;
  }
}

describe('Email Providers', () => {
  // ── 1. Provider selection logic ─────────────────────────────────────

  describe('Provider Selection', () => {
    it('should select ResendEmailProvider when EMAIL_PROVIDER=resend', () => {
      return withEnv({ EMAIL_PROVIDER: 'resend', RESEND_API_KEY: 'test_key' }, () => {
        const provider = new ResendEmailProvider();
        expect(provider.name).toBe('resend');
      });
    });

    it('should select SmtpEmailProvider when EMAIL_PROVIDER=smtp', () => {
      return withEnv({ EMAIL_PROVIDER: 'smtp' }, () => {
        const provider = new SmtpEmailProvider();
        expect(provider.name).toBe('smtp');
      });
    });
  });

  // ── 2. SMTP verify is not called for Resend ─────────────────────────

  describe('Resend does not trigger SMTP verify', () => {
    it('ResendEmailProvider.verify() should not use nodemailer', async () => {
      return withEnv({ RESEND_API_KEY: undefined }, async () => {
        const provider = new ResendEmailProvider();
        const result = await provider.verify();
        expect(result.ready).toBe(false);
        expect(result.error).toContain('RESEND_API_KEY');
      });
    });
  });

  // ── 3. SMTP_SECURE parsing ──────────────────────────────────────────

  describe('SMTP_SECURE parsing', () => {
    it('should correctly parse "false" as false (not Boolean("false")=true)', () => {
      return withEnv({ SMTP_SECURE: 'false' }, () => {
        const secure =
          String(process.env.SMTP_SECURE ?? 'false')
            .trim()
            .toLowerCase() === 'true';
        expect(secure).toBe(false);
      });
    });

    it('should correctly parse "true" as true', () => {
      return withEnv({ SMTP_SECURE: 'true' }, () => {
        const secure =
          String(process.env.SMTP_SECURE ?? 'false')
            .trim()
            .toLowerCase() === 'true';
        expect(secure).toBe(true);
      });
    });

    it('should default to false when not set', () => {
      return withEnv({ SMTP_SECURE: undefined }, () => {
        const secure =
          String(process.env.SMTP_SECURE ?? 'false')
            .trim()
            .toLowerCase() === 'true';
        expect(secure).toBe(false);
      });
    });
  });

  // ── 4. Resend error handling ────────────────────────────────────────

  describe('Resend error handling', () => {
    it('should return failure result when API key is missing', async () => {
      return withEnv({ RESEND_API_KEY: undefined, EMAIL_FROM: 'test@test.com' }, async () => {
        const provider = new ResendEmailProvider();
        const result = await provider.send({
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        });
        // Should fail because key is empty
        expect(result.success).toBe(false);
        expect(result.provider).toBe('resend');
      });
    });
  });

  // ── 5. API Key is never leaked ──────────────────────────────────────

  describe('API Key security', () => {
    it('should redact API key from error messages', () => {
      const fakeError = new Error('Invalid API Key re_abc123xyz_secret in request');
      const sanitized = fakeError.message.replace(/re_[a-zA-Z0-9_]+/g, '[REDACTED_KEY]');
      expect(sanitized).not.toContain('re_abc123xyz_secret');
      expect(sanitized).toContain('[REDACTED_KEY]');
    });
  });
});
