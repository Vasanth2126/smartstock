// ADD this file as: routes/superadmin.js in your backend

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/admin');
const {
  getPlatformStats,
  getAllShops,
  getShopSales,
  getAllUsers,
} = require('../controllers/superAdminController');

router.use(protect, isSuperAdmin);

router.get('/stats',              getPlatformStats);
router.get('/shops',              getAllShops);
router.get('/shops/:ownerId/sales', getShopSales);
router.get('/users',              getAllUsers);

module.exports = router;
