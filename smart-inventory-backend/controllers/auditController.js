const AuditLog = require('../models/AuditLog');

const getShopId = (user) => (user.role === 'owner' || user.role === 'superadmin' ? user._id : user.owner);

// GET /api/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const { action, entityType, limit = 50, page = 1 } = req.query;
    const filter = { shop: shopId };

    if (action && action !== 'ALL') {
      filter.action = action;
    }
    if (entityType && entityType !== 'ALL') {
      filter.entityType = entityType;
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAuditLogs };
