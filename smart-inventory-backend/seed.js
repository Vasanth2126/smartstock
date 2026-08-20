require('dotenv').config();
const mongoose  = require('mongoose');
const connectDB = require('./config/db');
const User      = require('./models/User');
const Supplier  = require('./models/Supplier');
const Product   = require('./models/Product');

const seed = async () => {
  await connectDB();

  await User.deleteMany({});
  await Supplier.deleteMany({});
  await Product.deleteMany({});

  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'admin@smartstock.com',
    password: 'admin123',
    role: 'superadmin',
    shopName: 'SmartStock HQ',
    isActive: true,
  });
  console.log('Superadmin created:', superAdmin.email);

  const owner1 = await User.create({
    name: 'Ramesh Kumar',
    email: 'ramesh@shop.com',
    password: 'password123',
    role: 'owner',
    shopName: 'Ramesh General Store',
    isActive: true,
  });
  console.log('Owner created:', owner1.email);

  const staff1 = await User.create({
    name: 'Suresh Helper',
    email: 'suresh@shop.com',
    password: 'staff123',
    role: 'staff',
    owner: owner1._id,
    shopName: owner1.shopName,
    isActive: true,
  });
  console.log('Staff created:', staff1.email);

  const suppliers = await Supplier.insertMany([
    { user: owner1._id, name: 'Sunrise Bakery',  phone: '9876543210', category: 'Bakery' },
    { user: owner1._id, name: 'Amul Dairy',       phone: '9123456780', category: 'Dairy' },
    { user: owner1._id, name: 'AgroTrade',        phone: '9000011111', category: 'Grains' },
    { user: owner1._id, name: 'Tata Traders',     phone: '9888877776', category: 'Beverages' },
  ]);

  await Product.insertMany([
    { user: owner1._id, name: 'Bread',      price: 30, stock: 48, lowStockThreshold: 10, barcode: '100001', category: 'Bakery',    supplier: suppliers[0]._id, unit: 'pcs' },
    { user: owner1._id, name: 'Milk 500ml', price: 25, stock: 20, lowStockThreshold: 12, barcode: '100002', category: 'Dairy',     supplier: suppliers[1]._id, unit: 'pcs' },
    { user: owner1._id, name: 'Rice 1kg',   price: 60, stock: 30, lowStockThreshold: 10, barcode: '100003', category: 'Grains',    supplier: suppliers[2]._id, unit: 'kg'  },
    { user: owner1._id, name: 'Sugar 1kg',  price: 45, stock: 15, lowStockThreshold: 8,  barcode: '100004', category: 'Grains',    supplier: suppliers[2]._id, unit: 'kg'  },
    { user: owner1._id, name: 'Tea Powder', price: 55, stock: 20, lowStockThreshold: 5,  barcode: '100005', category: 'Beverages', supplier: suppliers[3]._id, unit: 'pcs' },
    { user: owner1._id, name: 'Biscuits',   price: 20, stock: 50, lowStockThreshold: 10, barcode: '100006', category: 'Snacks',    unit: 'pcs' },
    { user: owner1._id, name: 'Butter 100g',price: 55, stock: 15, lowStockThreshold: 5,  barcode: '100007', category: 'Dairy',     supplier: suppliers[1]._id, unit: 'pcs' },
    { user: owner1._id, name: 'Eggs (dozen)',price: 90, stock: 10, lowStockThreshold: 5,  barcode: '100008', category: 'Dairy',     unit: 'pcs' },
  ]);

  console.log('\n✅ Seed complete!');
  console.log('─────────────────────────────────────');
  console.log('Super Admin : admin@smartstock.com  / admin123');
  console.log('Owner       : ramesh@shop.com       / password123');
  console.log('Staff       : suresh@shop.com       / staff123');
  console.log('─────────────────────────────────────');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });