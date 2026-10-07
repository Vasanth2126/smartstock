const express = require('express');
const router = express.Router();
const {
  createBill,
  getBills,
  getTodaysBills,
  getBill,
  refundBill,
} = require('../controllers/billController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getBills)
  .post(createBill);

router.get('/today', getTodaysBills);
router.get('/:id', getBill);
router.post('/:id/refund', restrictTo('owner', 'superadmin'), refundBill);

module.exports = router;
