// NEW FILE: smart-inventory-backend/controllers/adminController.js

const User    = require('../models/User');
const Product = require('../models/Product');
const Bill    = require('../models/Bill');

// ── SUPER ADMIN ───────────────────────────────────────────────────────────────

// GET /api/admin/stats  — platform-wide numbers
const getPlatformStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      totalShops,
      totalStaff,
      totalProducts,
      totalBills,
      todayBills,
      recentOwners,
    ] = await Promise.all([
      User.countDocuments({ role: 'owner', isActive: true }),
      User.countDocuments({ role: 'staff', isActive: true }),
      Product.countDocuments({ isActive: true }),
      Bill.countDocuments(),
      Bill.find({ billDate: today }),
      User.find({ role: 'owner' }).sort({ createdAt: -1 }).limit(5).select('name shopName email createdAt isActive'),
    ]);

    const todayRevenue = todayBills.reduce((s, b) => s + b.totalAmount, 0);

    res.json({
      success: true,
      stats: {
        totalShops,
        totalStaff,
        totalProducts,
        totalBills,
        todayRevenue,
        todayBillCount: todayBills.length,
      },
      recentOwners,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/shops  — all shop owners with their sales summary
const getAllShops = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { role: 'owner' };
    if (search) filter.$or = [
      { name:     { $regex: search, $options: 'i' } },
      { shopName: { $regex: search, $options: 'i' } },
      { email:    { $regex: search, $options: 'i' } },
    ];

    const owners = await User.find(filter).sort({ createdAt: -1 }).select('-password');

    // Attach bill count and total revenue per shop
    const enriched = await Promise.all(
      owners.map(async (owner) => {
        const bills = await Bill.find({ user: owner._id });
        const totalRevenue  = bills.reduce((s, b) => s + b.totalAmount, 0);
        const productCount  = await Product.countDocuments({ user: owner._id, isActive: true });
        const staffCount    = await User.countDocuments({ role: 'staff', owner: owner._id, isActive: true });
        return {
          ...owner.toObject(),
          totalRevenue,
          billCount: bills.length,
          productCount,
          staffCount,
        };
      })
    );

    res.json({ success: true, count: enriched.length, shops: enriched });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/shops/:ownerId  — one shop's detail
const getShopDetail = async (req, res) => {
  try {
    const owner = await User.findOne({ _id: req.params.ownerId, role: 'owner' }).select('-password');
    if (!owner) return res.status(404).json({ message: 'Shop not found.' });

    const today = new Date().toISOString().split('T')[0];
    const [products, bills, staff, todayBills] = await Promise.all([
      Product.find({ user: owner._id, isActive: true }).limit(10),
      Bill.find({ user: owner._id }).sort({ createdAt: -1 }).limit(10),
      User.find({ owner: owner._id, isActive: true }).select('name email role createdAt lastLogin'),
      Bill.find({ user: owner._id, billDate: today }),
    ]);

    res.json({
      success: true,
      owner,
      summary: {
        productCount: products.length,
        totalBills: bills.length,
        todaySales: todayBills.reduce((s, b) => s + b.totalAmount, 0),
        todayBillCount: todayBills.length,
      },
      recentBills: bills,
      products,
      staff,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/users/:id/toggle  — activate / deactivate any user
const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'superadmin')
      return res.status(403).json({ message: 'Cannot deactivate superadmin.' });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'}.`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/users  — all users (owners + staff)
const getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .select('-password')
      .populate('owner', 'name shopName');

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── SHOP OWNER: STAFF MANAGEMENT ─────────────────────────────────────────────

// GET /api/admin/staff  — owner sees their own staff
const getMyStaff = async (req, res) => {
  try {
    const staff = await User.find({ owner: req.user._id, role: 'staff' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: staff.length, staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/staff  — owner creates a staff account
const addStaff = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password required.' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use.' });

    const staff = await User.create({
      name,
      email,
      password,
      role: 'staff',
      owner: req.user._id,
      shopName: req.user.shopName,
    });

    staff.password = undefined;
    res.status(201).json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/staff/:id  — owner removes a staff member
const removeStaff = async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.params.id, owner: req.user._id, role: 'staff' });
    if (!staff) return res.status(404).json({ message: 'Staff member not found.' });

    staff.isActive = false;
    await staff.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Staff member removed.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/staff/:id  — owner updates staff name/password
const updateStaff = async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.params.id, owner: req.user._id, role: 'staff' });
    if (!staff) return res.status(404).json({ message: 'Staff member not found.' });

    if (req.body.name)     staff.name = req.body.name;
    if (req.body.password) staff.password = req.body.password; // will be hashed by pre-save

    await staff.save();
    staff.password = undefined;
    res.json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPlatformStats,
  getAllShops,
  getShopDetail,
  toggleUserActive,
  getAllUsers,
  getMyStaff,
  addStaff,
  removeStaff,
  updateStaff,
};
