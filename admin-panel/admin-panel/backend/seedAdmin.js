// ADD this to your existing seed.js, or run separately
// This creates the superadmin account

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');

const seedAdmin = async () => {
  await connectDB();

  const exists = await User.findOne({ role: 'superadmin' });
  if (exists) {
    console.log('Superadmin already exists:', exists.email);
    process.exit(0);
  }

  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@smartstock.com',
    password: 'admin123456',
    role: 'superadmin',
    shopName: 'SmartStock HQ',
  });

  console.log('✅ Superadmin created!');
  console.log('Email:   ', admin.email);
  console.log('Password: admin123456');
  process.exit(0);
};

seedAdmin().catch(err => { console.error(err); process.exit(1); });
