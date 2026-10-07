const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { recordAuditLog } = require('../middleware/auditLogger');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'smartstock_jwt_super_secret_consultancy_key_2026', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;
  res.status(statusCode).json({
    success: true,
    token,
    user,
  });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, shopName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      shopName: shopName ? shopName.trim() : `${name}'s Store`,
      role: 'owner',
    });

    await recordAuditLog({
      user: user._id,
      shop: user._id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      summary: `Owner registered and initialized shop "${user.shopName}"`,
      req,
    });

    sendToken(user, 201, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact your shop owner or admin.',
      });
    }

    if (user.role === 'staff') {
      const owner = await User.findById(user.owner);
      if (!owner || !owner.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your shop has been deactivated. Contact the platform admin.',
        });
      }
    }

    user.lastLogin = new Date();
    await user.save();

    const shopId = user.role === 'owner' || user.role === 'superadmin' ? user._id : user.owner;
    await recordAuditLog({
      user: user._id,
      shop: shopId,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      summary: `User ${user.name} (${user.role}) logged in`,
      req,
    });

    sendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

module.exports = { register, login, getMe };