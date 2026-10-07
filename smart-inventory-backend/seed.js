require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Supplier = require('./models/Supplier');
const Bill = require('./models/Bill');
const Customer = require('./models/Customer');
const AuditLog = require('./models/AuditLog');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart-inventory');
    console.log('MongoDB Connected for enterprise seeding...');
  } catch (err) {
    console.error('DB Connection error:', err.message);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  console.log('Clearing existing collections...');
  await User.deleteMany({});
  await Product.deleteMany({});
  await Supplier.deleteMany({});
  await Bill.deleteMany({});
  await Customer.deleteMany({});
  await AuditLog.deleteMany({});

  console.log('Creating Users...');
  const superadmin = await User.create({
    name: 'Platform Superadmin',
    email: 'admin@smartstock.com',
    password: 'password123',
    role: 'superadmin',
    shopName: 'SmartStock Headquarters',
  });

  const owner = await User.create({
    name: 'Alex Mercer (Owner)',
    email: 'owner@retailhub.com',
    password: 'password123',
    role: 'owner',
    shopName: 'Metro SuperMart & Electronics',
  });

  const ramesh = await User.create({
    name: 'Ramesh Patel (Owner)',
    email: 'ramesh@shop.com',
    password: 'password123',
    role: 'owner',
    shopName: 'Ramesh General Stores',
  });

  const cashier = await User.create({
    name: 'Sarah Connor (Cashier)',
    email: 'cashier@retailhub.com',
    password: 'password123',
    role: 'staff',
    owner: owner._id,
    shopName: 'Metro SuperMart & Electronics',
  });

  console.log('Creating Suppliers...');
  const supplierA = await Supplier.create({
    user: owner._id,
    name: 'Apex FMCG Distributors',
    phone: '+91 98111 22334',
    email: 'sales@apexfmcg.com',
    address: 'Sector 62, Industrial Area, Logistics Hub',
  });

  const supplierB = await Supplier.create({
    user: owner._id,
    name: 'NexGen Electronics Supply',
    phone: '+91 98222 33445',
    email: 'orders@nexgenelec.com',
    address: 'Tech City, Electronic Zone',
  });

  const supplierC = await Supplier.create({
    user: owner._id,
    name: 'PureHealth Pharma & Organics',
    phone: '+91 98333 44556',
    email: 'contact@purehealth.org',
    address: 'Green Valley Pharma Park',
  });

  console.log('Creating Products with Enterprise Attributes (SKU, Cost, Barcode, Batch, Expiry)...');
  const now = new Date();
  const futureExp1 = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 6 months
  const futureExp2 = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);  // 20 days (near expiry)
  const expiredExp = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);  // Expired 15 days ago

  const productData = [
    {
      user: owner._id,
      name: 'Organic Almond Milk 1L',
      sku: 'BEV-1001',
      barcode: '8901030383821',
      category: 'Beverages',
      costPrice: 160,
      price: 240,
      taxRate: 5,
      unit: 'litre',
      stock: 48,
      lowStockThreshold: 10,
      batchNumber: 'BATCH-2026-04',
      expiryDate: futureExp1,
      supplier: supplierA._id,
    },
    {
      user: owner._id,
      name: 'Cold Brew Arabica Coffee 500ml',
      sku: 'BEV-1002',
      barcode: '8901030383838',
      category: 'Beverages',
      costPrice: 90,
      price: 150,
      taxRate: 5,
      unit: 'pcs',
      stock: 6, // Low Stock
      lowStockThreshold: 10,
      batchNumber: 'BATCH-2026-03',
      expiryDate: futureExp2,
      supplier: supplierA._id,
    },
    {
      user: owner._id,
      name: 'Wireless Ergonomic Mouse',
      sku: 'ELE-2001',
      barcode: '8902040484812',
      category: 'Electronics',
      costPrice: 450,
      price: 899,
      taxRate: 18,
      unit: 'pcs',
      stock: 25,
      lowStockThreshold: 5,
      batchNumber: 'TECH-2026-Q1',
      supplier: supplierB._id,
    },
    {
      user: owner._id,
      name: 'USB-C Fast Charging Cable 65W',
      sku: 'ELE-2002',
      barcode: '8902040484829',
      category: 'Electronics',
      costPrice: 120,
      price: 299,
      taxRate: 18,
      unit: 'pcs',
      stock: 0, // Out of Stock
      lowStockThreshold: 10,
      batchNumber: 'TECH-2026-Q1',
      supplier: supplierB._id,
    },
    {
      user: owner._id,
      name: 'Mechanical Gaming Keyboard RGB',
      sku: 'ELE-2003',
      barcode: '8902040484836',
      category: 'Electronics',
      costPrice: 1400,
      price: 2499,
      taxRate: 18,
      unit: 'pcs',
      stock: 14,
      lowStockThreshold: 4,
      batchNumber: 'TECH-2026-Q2',
      supplier: supplierB._id,
    },
    {
      user: owner._id,
      name: 'Multivitamin Immunity Complex 60 Tabs',
      sku: 'PHA-3001',
      barcode: '8903050585813',
      category: 'Health & Pharma',
      costPrice: 280,
      price: 499,
      taxRate: 12,
      unit: 'box',
      stock: 35,
      lowStockThreshold: 8,
      batchNumber: 'MED-2026-08',
      expiryDate: futureExp1,
      supplier: supplierC._id,
    },
    {
      user: owner._id,
      name: 'Fresh Greek Yogurt 400g',
      sku: 'GRO-4001',
      barcode: '8904060686814',
      category: 'Groceries',
      costPrice: 60,
      price: 95,
      taxRate: 0,
      unit: 'pcs',
      stock: 8, // Low Stock & Near Expiry
      lowStockThreshold: 12,
      batchNumber: 'DAIRY-2026-02',
      expiryDate: futureExp2,
      supplier: supplierA._id,
    },
    {
      user: owner._id,
      name: 'Artisan Whole Wheat Sourdough',
      sku: 'BAK-5001',
      barcode: '8905070787815',
      category: 'Bakery',
      costPrice: 50,
      price: 90,
      taxRate: 0,
      unit: 'pcs',
      stock: 2,
      lowStockThreshold: 5,
      batchNumber: 'BAKE-2026-01',
      expiryDate: expiredExp, // Expired sample
      supplier: supplierA._id,
    },
  ];

  const createdProducts = await Product.insertMany(productData);

  console.log('Creating Customers with Loyalty Points & Khata Balance...');
  const customer1 = await Customer.create({
    user: owner._id,
    name: 'David Miller',
    phone: '9876543210',
    email: 'david.miller@gmail.com',
    loyaltyPoints: 45,
    totalSpent: 4500,
    creditBalance: 0,
    visitCount: 6,
  });

  const customer2 = await Customer.create({
    user: owner._id,
    name: 'Emily Watson',
    phone: '9812345678',
    email: 'emily.w@outlook.com',
    loyaltyPoints: 120,
    totalSpent: 12500,
    creditBalance: -250, // Has store credit debt
    visitCount: 14,
  });

  console.log('Creating Realistic Sample Bills across past days...');
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];

  const pAlmond = createdProducts[0];
  const pMouse = createdProducts[2];
  const pKeyboard = createdProducts[4];
  const pVitamin = createdProducts[5];

  const billsToCreate = [
    {
      user: owner._id,
      cashier: cashier._id,
      billNumber: 'INV-20260820-0001-1042',
      customer: customer2._id,
      customerName: customer2.name,
      customerPhone: customer2.phone,
      items: [
        {
          product: pKeyboard._id,
          productName: pKeyboard.name,
          sku: pKeyboard.sku,
          price: pKeyboard.price,
          costPrice: pKeyboard.costPrice,
          quantity: 1,
          taxRate: 18,
          taxAmount: 449.82,
          discountAmount: 100,
          subtotal: 2848.82,
        },
      ],
      subtotal: 2399,
      taxTotal: 449.82,
      discountTotal: 100,
      totalAmount: 2848.82,
      totalProfit: 999,
      paymentMethod: 'card',
      loyaltyPointsEarned: 28,
      status: 'completed',
      billDate: twoDaysAgo,
    },
    {
      user: owner._id,
      cashier: cashier._id,
      billNumber: 'INV-20260821-0002-3921',
      customer: customer1._id,
      customerName: customer1.name,
      customerPhone: customer1.phone,
      items: [
        {
          product: pMouse._id,
          productName: pMouse.name,
          sku: pMouse.sku,
          price: pMouse.price,
          costPrice: pMouse.costPrice,
          quantity: 2,
          taxRate: 18,
          taxAmount: 323.64,
          discountAmount: 0,
          subtotal: 2121.64,
        },
        {
          product: pAlmond._id,
          productName: pAlmond.name,
          sku: pAlmond.sku,
          price: pAlmond.price,
          costPrice: pAlmond.costPrice,
          quantity: 2,
          taxRate: 5,
          taxAmount: 24,
          discountAmount: 0,
          subtotal: 504,
        },
      ],
      subtotal: 2278,
      taxTotal: 347.64,
      discountTotal: 0,
      totalAmount: 2625.64,
      totalProfit: 1058,
      paymentMethod: 'upi',
      loyaltyPointsEarned: 26,
      status: 'completed',
      billDate: yesterday,
    },
    {
      user: owner._id,
      cashier: cashier._id,
      billNumber: 'INV-20260822-0003-8812',
      customer: customer1._id,
      customerName: customer1.name,
      customerPhone: customer1.phone,
      items: [
        {
          product: pVitamin._id,
          productName: pVitamin.name,
          sku: pVitamin.sku,
          price: pVitamin.price,
          costPrice: pVitamin.costPrice,
          quantity: 1,
          taxRate: 12,
          taxAmount: 59.88,
          discountAmount: 20,
          subtotal: 538.88,
        },
      ],
      subtotal: 479,
      taxTotal: 59.88,
      discountTotal: 20,
      totalAmount: 538.88,
      totalProfit: 199,
      paymentMethod: 'cash',
      loyaltyPointsEarned: 5,
      status: 'completed',
      billDate: today,
    },
  ];

  await Bill.insertMany(billsToCreate);

  console.log('Creating Initial Audit Logs...');
  await AuditLog.create([
    {
      user: owner._id,
      shop: owner._id,
      action: 'SETTINGS_UPDATE',
      entityType: 'User',
      entityId: owner._id,
      summary: 'System initialized with GST & Multi-Category catalogue',
    },
    {
      user: cashier._id,
      shop: owner._id,
      action: 'BILL_CREATE',
      entityType: 'Bill',
      summary: 'Created Invoice INV-20260822-0003-8812 for ₹538.88',
    },
  ]);

  console.log('\n=============================================');
  console.log('✅ Enterprise Seed Complete!');
  console.log('Superadmin Login : admin@smartstock.com / password123');
  console.log('Shop Owner Login : owner@retailhub.com / password123');
  console.log('Cashier Login    : cashier@retailhub.com / password123');
  console.log('=============================================\n');

  process.exit(0);
};

seedData().catch((e) => {
  console.error('Seed Error:', e);
  process.exit(1);
});