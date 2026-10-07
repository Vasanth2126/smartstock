const User = require('../models/User');
const Product = require('../models/Product');
const Bill = require('../models/Bill');

// Helper: get all user ids (owner + their staff) belonging to a shop
const getShopUserIds = async (ownerId) => {
  const staff = await User.find({ owner: ownerId }).select('_id');
  return [ownerId, ...staff.map((s) => s._id)];
};

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// GET /api/admin/stats
const getPlatformStats = async (req, res) => {
  try {
    const totalShops = await User.countDocuments({ role: 'owner' });
    const totalStaff = await User.countDocuments({ role: 'staff' });
    const totalProducts = await Product.countDocuments();

    const { start, end } = getTodayRange();
    const todayBills = await Bill.find({ createdAt: { $gte: start, $lte: end } });
    const todayRevenue = todayBills.reduce((sum, b) => sum + b.totalAmount, 0);

    res.json({
      stats: {
        totalShops,
        totalStaff,
        totalProducts,
        todayRevenue,
        todayBillCount: todayBills.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: calculate today, 7-day, and 30-day (monthly) sales metrics
const calculateSalesBreakdown = (bills) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let todayRevenue = 0;
  let todayBillCount = 0;
  let sevenDayRevenue = 0;
  let sevenDayBillCount = 0;
  let monthlyRevenue = 0;
  let monthlyBillCount = 0;
  let totalRevenue = 0;

  // Daily trend map for the last 7 days
  const dailyMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    dailyMap[key] = { date: key, total: 0, count: 0 };
  }

  bills.forEach((b) => {
    const bDate = new Date(b.createdAt || b.billDate);
    const amt = b.totalAmount || 0;
    totalRevenue += amt;

    if (bDate >= todayStart) {
      todayRevenue += amt;
      todayBillCount += 1;
    }
    if (bDate >= sevenDaysAgo) {
      sevenDayRevenue += amt;
      sevenDayBillCount += 1;
    }
    if (bDate >= thirtyDaysAgo) {
      monthlyRevenue += amt;
      monthlyBillCount += 1;
    }

    const dateKey = bDate.toISOString().split('T')[0];
    if (dailyMap[dateKey]) {
      dailyMap[dateKey].total += amt;
      dailyMap[dateKey].count += 1;
    }
  });

  return {
    today: { revenue: todayRevenue, count: todayBillCount },
    sevenDays: { revenue: sevenDayRevenue, count: sevenDayBillCount, daily: Object.values(dailyMap) },
    monthly: { revenue: monthlyRevenue, count: monthlyBillCount },
    allTime: { revenue: totalRevenue, count: bills.length },
  };
};

// GET /api/admin/shops
const getAllShops = async (req, res) => {
  try {
    const owners = await User.find({ role: 'owner' }).sort({ createdAt: -1 });

    const shops = await Promise.all(
      owners.map(async (owner) => {
        const userIds = await getShopUserIds(owner._id);
        const productCount = await Product.countDocuments({ user: { $in: userIds } });
        const bills = await Bill.find({ user: { $in: userIds } });
        const sales = calculateSalesBreakdown(bills);

        return {
          _id: owner._id,
          name: owner.name,
          shopName: owner.shopName || owner.name,
          email: owner.email,
          phone: owner.phone || '',
          isActive: owner.isActive,
          createdAt: owner.createdAt,
          productCount,
          billCount: bills.length,
          totalRevenue: sales.allTime.revenue,
          sales, // contains today, sevenDays, monthly
          staffCount: userIds.length - 1,
        };
      })
    );

    res.json({ shops });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/shops/:ownerId
const getShopDetail = async (req, res) => {
  try {
    const owner = await User.findById(req.params.ownerId);
    if (!owner || owner.role !== 'owner') {
      return res.status(404).json({ message: 'Shop not found.' });
    }

    const staff = await User.find({ owner: owner._id }).sort({ createdAt: -1 });
    const userIds = [owner._id, ...staff.map((s) => s._id)];

    const allBills = await Bill.find({ user: { $in: userIds } }).sort({ createdAt: -1 });
    const recentBills = allBills.slice(0, 15);
    const sales = calculateSalesBreakdown(allBills);

    res.json({
      owner,
      staff,
      sales,
      summary: {
        totalBills: allBills.length,
        todaySales: sales.today.revenue,
        sevenDaySales: sales.sevenDays.revenue,
        monthlySales: sales.monthly.revenue,
        totalRevenue: sales.allTime.revenue,
      },
      recentBills,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).populate('owner', 'shopName name');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/users/:id/toggle
const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot block a superadmin.' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `${user.name} has been ${user.isActive ? 'unblocked' : 'blocked'}.`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/staff
const getStaff = async (req, res) => {
  try {
    const ownerId = req.user.role === 'owner' ? req.user._id : req.query.ownerId;
    const staff = await User.find({ owner: ownerId, role: 'staff' }).sort({ createdAt: -1 });
    res.json({ staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/staff
const createStaff = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const staff = await User.create({
      name,
      email,
      password,
      role: 'staff',
      owner: req.user._id,
      shopName: req.user.shopName,
    });

    res.status(201).json({ message: 'Staff account created.', staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/staff/:id
const updateStaff = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found.' });
    }
    if (String(staff.owner) !== String(req.user._id) && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to edit this staff member.' });
    }

    if (req.body.name) staff.name = req.body.name;
    if (req.body.password) staff.password = req.body.password;
    await staff.save();

    res.json({ message: 'Staff member updated.', staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/staff/:id
const removeStaff = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found.' });
    }
    if (String(staff.owner) !== String(req.user._id) && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to remove this staff member.' });
    }

    staff.isActive = false;
    await staff.save();

    res.json({ message: 'Staff member removed.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPlatformStats,
  getAllShops,
  getShopDetail,
  getAllUsers,
  toggleUserActive,
  getStaff,
  createStaff,
  updateStaff,
  removeStaff,
};