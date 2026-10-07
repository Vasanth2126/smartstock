const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartStock Enterprise Inventory & POS API',
      version: '2.0.0',
      description:
        'Enterprise-grade multi-tenant Inventory Management, Point of Sale (POS), CRM, and Business Analytics REST API with atomic concurrency safety and audit logging.',
      contact: {
        name: 'SmartStock Engineering Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
      schemas: {
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Organic Almond Milk 1L' },
            sku: { type: 'string', example: 'ALM-1001' },
            barcode: { type: 'string', example: '8901234567890' },
            category: { type: 'string', example: 'Beverages' },
            costPrice: { type: 'number', example: 120 },
            price: { type: 'number', example: 180 },
            taxRate: { type: 'number', example: 5 },
            stock: { type: 'number', example: 45 },
            lowStockThreshold: { type: 'number', example: 10 },
            unit: { type: 'string', example: 'pcs' },
            batchNumber: { type: 'string', example: 'BATCH-2026-08' },
            expiryDate: { type: 'string', format: 'date-time' },
          },
        },
        Bill: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            billNumber: { type: 'string', example: 'INV-20260822-00042' },
            customerName: { type: 'string', example: 'John Doe' },
            customerPhone: { type: 'string', example: '9876543210' },
            totalAmount: { type: 'number', example: 450 },
            totalProfit: { type: 'number', example: 110 },
            paymentMethod: { type: 'string', example: 'cash' },
            status: { type: 'string', example: 'completed' },
            billDate: { type: 'string', example: '2026-08-22' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
