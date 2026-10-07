const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerByPhone,
  createCustomer,
  updateCustomer,
  adjustCredit,
} = require('../controllers/customerController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.get('/lookup/:phone', getCustomerByPhone);
router.route('/:id')
  .put(updateCustomer);

router.post('/:id/adjust-credit', restrictTo('owner', 'superadmin'), adjustCredit);

module.exports = router;
