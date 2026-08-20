// ADD this file as: controllers/superAdminController.js

const User = require('../models/User');
const Bill = require('../models/Bill');
const Product = require('../models/Product');

// GET /api/superadmin/stats
// Platform-wide overview
const getPlatformStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [totalShops, totalStaff, totalBills, todaysBills, totalProducts] = await Promise.all([
      User.countDocuments({ role: 'owner' }),
      User.countDocuments({ role: 'staff' }),
      Bill.countDocuments({}),
      Bill.find({ billDate: today }),
      Product.countDocuments({ isActive: true }),
    ]);

    const todaysRevenue = todaysBills.reduce((s, b) => s + b.totalAmount, 0);

    // All-time revenue
    const revenueAgg = await Bill.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Revenue last 7 days grouped by date
    const sevenDaysAgo = new Date(Date.now() - 6 * 864e5).toISOString().split('T')[0];
    const dailyRevenue = await Bill.aggregate([
      { $match: { billDate: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$billDate', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: { totalShops, totalStaff, totalBills, totalProducts, todaysRevenue, totalRevenue },
      dailyRevenue,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/superadmin/shops
// All shop owners with their staff count and sales
const getAllShops = async (req, res) => {
  try {
    const owners = await User.find({ role: 'owner' }).select('-password').sort({ createdAt: -1 });

    const shopsWithStats = await Promise.all(
      owners.map(async (owner) => {
        const [staffCount, billCount, revenueAgg, productCount] = await Promise.all([
          User.countDocuments({ role: 'staff', owner: owner._id }),
          Bill.countDocuments({ user: owner._id }),
          Bill.aggregate([
            { $match: { user: owner._id } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
          ]),
          Product.countDocuments({ user: owner._id, isActive: true }),
        ]);

        return {
          ...owner.toObject(),
          staffCount,
          billCount,
          totalRevenue: revenueAgg[0]?.total || 0,
          productCount,
        };
      })
    );

    res.json({ success: true, count: shopsWithStats.length, shops: shopsWithStats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/superadmin/shops/:ownerId/sales
// Sales detail for one shop
const getShopSales = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { from, to } = req.query;

    const filter = { user: ownerId };
    if (from || to) {
      filter.billDate = {};
      if (from) filter.billDate.$gte = from;
      if (to)   filter.billDate.$lte = to;
    }

    const bills = await Bill.find(filter).sort({ createdAt: -1 }).limit(100);
    const total = bills.reduce((s, b) => s + b.totalAmount, 0);

    res.json({ success: true, billCount: bills.length, totalRevenue: total, bills });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/superadmin/users
// All users across the platform
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .populate('owner', 'name shopName')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPlatformStats, getAllShops, getShopSales, getAllUsers };
