const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/madar');
    
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({ email: /taiz/i }).toArray();
    console.log(JSON.stringify(users, null, 2));
    
    const unis = await db.collection('universities').find({ nameAr: /تعز/ }).toArray();
    console.log(JSON.stringify(unis, null, 2));

    const totalUnis = await db.collection('universities').countDocuments();
    console.log('Total universities:', totalUnis);
    
    await mongoose.disconnect();
  } catch(e) {
    console.error(e);
  }
}

checkUsers();
