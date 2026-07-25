import mongoose from 'mongoose';
import 'dotenv/config';

async function checkTaiz() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/madar');
  
  const uni = await mongoose.connection.db.collection('universities').findOne({ $or: [{ nameAr: /تعز/ }, { name: /تعز/ }] });
  console.log('University found:', uni ? { name: uni.name, nameAr: uni.nameAr, slug: uni.slug } : 'None');

  const admin = await mongoose.connection.db.collection('users').findOne({ email: 'admin@taiz.edu.ye' });
  console.log('Admin user:', admin ? { email: admin.email, userType: admin.userType } : 'None');

  mongoose.disconnect();
}
checkTaiz().catch(console.error);
