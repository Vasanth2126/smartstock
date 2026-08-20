const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createBill, getBills, getTodaysBills, getBill } = require('../controllers/billController');

router.use(protect);

router.get('/today', getTodaysBills);
router.route('/').get(getBills).post(createBill);
router.get('/:id', getBill);

module.exports = router;
