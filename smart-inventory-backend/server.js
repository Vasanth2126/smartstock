require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');

// Validate critical environment variables (skip during tests where test setup provides it)
if (process.env.NODE_ENV !== 'test' && !process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

const app = express();

// Trust reverse proxy (e.g. Render, Nginx) so rate limiters inspect actual client IP
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Security Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
// CORS configuration supporting mobile apps (no Origin header), local development, and production domains
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Mobile apps (React Native Android/iOS), Postman, and server-to-server have no Origin header
    if (!origin) return callback(null, true);
    // Allow local development and test environments
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return callback(null, true);
    }
    // Whitelist check in production
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global API rate limiting
app.use('/api/', apiLimiter);

// Interactive Swagger OpenAPI Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'SmartStock API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/audit-logs', require('./routes/audit'));

// Helper to determine active database state
const getDbStatus = () => {
  const states = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };
  return states[mongoose.connection.readyState] || 'Disconnected';
};

// Root & API Status endpoints
app.get(['/', '/api'], (req, res) => {
  res.json({
    success: true,
    message: 'SmartStock Enterprise API is running and healthy.',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/api/health',
    database: getDbStatus(),
  });
});

// Health check endpoint
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    system: 'SmartStock Enterprise API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: getDbStatus(),
  });
});

// Swagger JSON redirect
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartStock API Server running on http://0.0.0.0:${PORT}`);
    console.log(`Swagger OpenAPI Documentation available at http://localhost:${PORT}/api/docs`);
  });
}

module.exports = app;
