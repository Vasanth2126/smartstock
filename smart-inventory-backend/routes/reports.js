const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDashboard, getSalesReport } = require('../controllers/reportController');

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/sales', getSalesReport);

module.exports = router;
