// ── routes/staff.js ──────────────────────────────────────────────────────────
// ADD this file as routes/staff.js in your backend

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { isOwnerOrSuperAdmin } = require('../middleware/admin');
const { getStaff, createStaff, updateStaff, deleteStaff } = require('../controllers/staffController');

router.use(protect, isOwnerOrSuperAdmin);

router.route('/')
  .get(getStaff)
  .post(createStaff);

router.route('/:id')
  .put(updateStaff)
  .delete(deleteStaff);

module.exports = router;


// ── routes/superadmin.js ──────────────────────────────────────────────────────
// ADD this file as routes/superadmin.js in your backend
// (create a separate file for this; shown together for brevity)
