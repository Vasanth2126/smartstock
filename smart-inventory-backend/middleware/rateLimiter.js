const rateLimit = require('express-rate-limit');

// General API rate limiter (15 minutes, 500 requests per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

// Strict rate limiter for Authentication (Login / Register) (15 minutes, 30 attempts)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. For security, please try again in 15 minutes.',
  },
});

module.exports = { apiLimiter, authLimiter };
