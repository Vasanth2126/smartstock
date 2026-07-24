// NEW FILE: smart-inventory-backend/routes/admin.js

const express = require('express');
const router  = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getPlatformStats,
  getAllShops,
  getShopDetail,
  toggleUserActive,
  getAllUsers,
  getMyStaff,
  addStaff,
  removeStaff,
  updateStaff,
} = require('../controllers/adminController');

// All admin routes require login
router.use(protect);

// ── Super Admin only ───────────────────────────────────────────────────────────
router.get('/stats',              restrictTo('superadmin'), getPlatformStats);
router.get('/shops',              restrictTo('superadmin'), getAllShops);
router.get('/shops/:ownerId',     restrictTo('superadmin'), getShopDetail);
router.get('/users',              restrictTo('superadmin'), getAllUsers);
router.patch('/users/:id/toggle', restrictTo('superadmin'), toggleUserActive);

// ── Shop Owner: manage their staff ────────────────────────────────────────────
router.get('/staff',         restrictTo('owner', 'superadmin'), getMyStaff);
router.post('/staff',        restrictTo('owner', 'superadmin'), addStaff);
router.put('/staff/:id',     restrictTo('owner', 'superadmin'), updateStaff);
router.delete('/staff/:id',  restrictTo('owner', 'superadmin'), removeStaff);

module.exports = router;
