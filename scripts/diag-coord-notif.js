const API = 'http://localhost:3001/api';
const PASS = 'CoordDiagPass123!';
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const emailBase = `diagcoord.${Date.now()}`;

async function http(method, path, token, body) {
  const opts = { method, headers: {} };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${API}${path}`, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}

(async () => {
  const client = new MongoClient('mongodb://127.0.0.1:27017/madar');
  await client.connect();
  const db = client.db();

  // 1. register university manager
  const uniEmail = `${emailBase}.uni@madar.test`;
  const reg = await http('POST', '/auth/register', null, {
    email: uniEmail,
    password: PASS,
    firstName: 'Uni',
    lastName: 'Diag',
    firstNameAr: 'جامعة',
    lastNameAr: 'تشخيص',
    phone: '+966500000100',
    role: 'university',
    profile: { universityName: 'Diag Coord Uni', universityNameAr: 'جامعة تشخيص منسق', city: 'Riyadh', description: 'Temporary diag university' },
  });
  console.log('uni register:', reg.status, JSON.stringify(reg.body).slice(0, 600));
  const uniLogin = await http('POST', '/auth/login', null, { email: uniEmail, password: PASS });
  const uniToken = uniLogin.body?.data?.tokens?.accessToken;
  const uniUserId = uniLogin.body?.data?.user?._id;
  console.log('uni login:', uniLogin.status, 'uid', uniUserId);

  // 2. activate university + college
  const uniRec = await db.collection('universities').findOne({ userId: new ObjectId(uniUserId) });
  await db.collection('universities').updateOne({ _id: uniRec._id }, { $set: { status: 'active' } });
  const college = await db.collection('colleges').insertOne({
    universityId: uniRec._id, name: 'Diag College', nameAr: 'كلية تشخيص', code: `DC-${Date.now()}`, status: 'active', createdAt: new Date(), updatedAt: new Date(),
  });

  // 3. invite coordinator
  const coordEmail = `${emailBase}.coord@madar.test`;
  const invite = await http('POST', '/universities/staff/invite', uniToken, {
    email: coordEmail, name: 'Diag Coordinator', phone: '+966500000101', role: 'coordinator', collegeId: college.insertedId.toString(), permissions: ['dashboard:read'],
  });
  console.log('invite:', invite.status, JSON.stringify(invite.body).slice(0, 400));

  // 4. set password and activate
  const hash = await bcrypt.hash(PASS, 10);
  const coordUser = await db.collection('users').findOne({ email: coordEmail });
  console.log('coordUser found:', !!coordUser, coordUser?._id, coordUser?.status, coordUser?.role);
  await db.collection('users').updateOne({ _id: coordUser._id }, { $set: { password: hash, status: 'active', profileCompleted: true } });
  await db.collection('collegecoordinators').updateOne({ userId: coordUser._id }, { $set: { invitationStatus: 'accepted', status: 'active' } });

  // 5. login coordinator
  const coordLogin = await http('POST', '/auth/login', null, { email: coordEmail, password: PASS });
  console.log('coord login:', coordLogin.status, JSON.stringify(coordLogin.body?.data?.user || coordLogin.body).slice(0, 600));
  const coordToken = coordLogin.body?.data?.tokens?.accessToken;
  const coordUserId = coordLogin.body?.data?.user?._id || coordLogin.body?.data?.user?.id;
  console.log('coordToken present:', !!coordToken, 'coordUserId', coordUserId);

  // 6. create notification
  const create = await http('POST', '/notifications', coordToken, {
    userId: coordUserId,
    type: 'system',
    title: 'Coord test notification',
    titleAr: 'إشعار تجريبي للمنسق',
    message: 'This is a coordinator test notification.',
    messageAr: 'هذا إشعار تجريبي للمنسق.',
  });
  console.log('create notif:', create.status, JSON.stringify(create.body).slice(0, 1200));

  // cleanup
  await db.collection('colleges').deleteOne({ _id: college.insertedId });
  await db.collection('users').deleteMany({ email: { $in: [uniEmail, coordEmail] } });
  await db.collection('universities').deleteMany({ userId: new ObjectId(uniUserId) });
  await db.collection('collegecoordinators').deleteMany({ $or: [{ email: coordEmail }, { userId: coordUser._id }] });
  await db.collection('notifications').deleteMany({ userId: new ObjectId(coordUserId) });
  await client.close();
})().catch(e => { console.error(e); process.exit(1); });
