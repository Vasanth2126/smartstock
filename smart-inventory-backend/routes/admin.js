const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getPlatformStats,
  getAllShops,
  getShopDetail,
  getAllUsers,
  toggleUserActive,
  getStaff,
  createStaff,
  updateStaff,
  removeStaff,
} = require('../controllers/adminController');

router.use(protect);

// Superadmin-only platform routes
router.get('/stats', restrictTo('superadmin'), getPlatformStats);
router.get('/shops', restrictTo('superadmin'), getAllShops);
router.get('/shops/:ownerId', restrictTo('superadmin'), getShopDetail);
router.get('/users', restrictTo('superadmin'), getAllUsers);
router.patch('/users/:id/toggle', restrictTo('superadmin'), toggleUserActive);

// Owner staff management routes
router.get('/staff', restrictTo('owner', 'superadmin'), getStaff);
router.post('/staff', restrictTo('owner', 'superadmin'), createStaff);
router.put('/staff/:id', restrictTo('owner', 'superadmin'), updateStaff);
router.delete('/staff/:id', restrictTo('owner', 'superadmin'), removeStaff);

module.exports = router;