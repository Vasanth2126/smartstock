const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getSalesReport,
  getProfitLossReport,
  getForecastReport,
} = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/sales', getSalesReport);
router.get('/profit-loss', restrictTo('owner', 'superadmin'), getProfitLossReport);
router.get('/forecast', getForecastReport);

module.exports = router;
