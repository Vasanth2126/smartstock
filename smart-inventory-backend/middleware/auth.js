const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized. No token.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    if (!req.user.isActive) {
      return res.status(401).json({ message: 'Your account has been deactivated. Contact your shop owner or admin.' });
    }

    if (req.user.role === 'staff') {
      const owner = await User.findById(req.user.owner);
      if (!owner || !owner.isActive) {
        return res.status(401).json({ message: 'Your shop has been deactivated. Contact the platform admin.' });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalid or expired.' });
  }
};

// Restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: 'You do not have permission for this action.' });
    }
    next();
  };
};

module.exports = { protect, restrictTo };