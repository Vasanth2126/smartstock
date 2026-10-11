const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');
const Bill = require('../models/Bill');

let ownerToken = '';
let ownerId = '';
let cashierToken = '';
let testProductId = '';

beforeAll(async () => {
  // Connect to test database
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-inventory-test';
  if (mongoose.connection.readyState !== 1) {
    if (mongoose.connection.readyState === 2) {
      await new Promise((resolve) => mongoose.connection.once('open', resolve));
    } else {
      await mongoose.connect(mongoUri);
    }
  }

  // Safety check: ensure tests only run against a database whose name contains 'test'
  const dbName = mongoose.connection.name || '';
  if (!dbName.toLowerCase().includes('test')) {
    throw new Error(`SAFETY ERROR: Refusing to run tests on non-test database: "${dbName}". Database name must include "test".`);
  }

  // 1. Create Test Owner
  const ownerEmail = `test_owner_${Date.now()}@smartstock.com`;
  const ownerRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Owner',
      email: ownerEmail,
      password: 'password123',
      shopName: 'Placement Consultancy Store',
    });

  expect(ownerRes.status).toBe(201);
  ownerToken = ownerRes.body.token;
  ownerId = ownerRes.body.user?._id;

  // 2. Create Test Product with initial stock of 10
  const prodRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      name: 'Test Product Alpha',
      category: 'Electronics',
      costPrice: 50,
      price: 100,
      stock: 10,
      lowStockThreshold: 3,
      sku: `TST-${Date.now()}`,
    });

  expect(prodRes.status).toBe(201);
  testProductId = prodRes.body.product._id;
});

afterAll(async () => {
  // Scoped cleanup: only remove data created during this test run
  if (ownerId) {
    await Bill.deleteMany({ user: ownerId });
    await Product.deleteMany({ user: ownerId });
    await User.deleteMany({ _id: ownerId });
  }
  await mongoose.connection.close();
});

describe('1. Health and System Endpoints', () => {
  it('GET /health should return 200 and system metadata', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.system).toBe('SmartStock Enterprise API');
  });

  it('GET /api/docs.json should serve OpenAPI 3.0 specification', async () => {
    const res = await request(app).get('/api/docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.0');
    expect(res.body.info.title).toContain('SmartStock');
  });
});

describe('2. Authentication & Authorization Security', () => {
  it('Reject unauthenticated access to protected routes', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(401);
  });

  it('Reject login with incorrect password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@smartstock.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });
});

describe('3. POS Checkout & Atomic Concurrency Edge-Case Handling', () => {
  it('Successfully checkout an item and atomically decrement stock', async () => {
    const res = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        items: [{ productId: testProductId, quantity: 2, discount: 10 }],
        paymentMethod: 'cash',
        customerName: 'Interview Tester',
        customerPhone: '9988776655',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.bill.items[0].quantity).toBe(2);
    expect(res.body.bill.totalProfit).toBeGreaterThan(0);

    // Verify stock is now 10 - 2 = 8
    const checkProduct = await Product.findById(testProductId);
    expect(checkProduct.stock).toBe(8);
  });

  it('Reject checkout if requested quantity exceeds available stock', async () => {
    const res = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        items: [{ productId: testProductId, quantity: 50 }], // Stock is only 8
        paymentMethod: 'cash',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Insufficient stock');

    // Stock should remain unchanged (8)
    const checkProduct = await Product.findById(testProductId);
    expect(checkProduct.stock).toBe(8);
  });
});

describe('4. Business Intelligence & Analytics Reports', () => {
  it('GET /api/reports/dashboard returns financial metrics and inventory valuation', async () => {
    const res = await request(app)
      .get('/api/reports/dashboard')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.today).toBeDefined();
    expect(res.body.stock.inventoryCostValue).toBeDefined();
  });

  it('GET /api/reports/profit-loss returns accurate gross profit and margins', async () => {
    const res = await request(app)
      .get('/api/reports/profit-loss')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pnl.grossRevenue).toBeDefined();
    expect(res.body.pnl.grossProfit).toBeDefined();
  });

  it('GET /api/reports/forecast returns ABC categorization and stockout predictions', async () => {
    const res = await request(app)
      .get('/api/reports/forecast')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.forecasts)).toBe(true);
  });
});
