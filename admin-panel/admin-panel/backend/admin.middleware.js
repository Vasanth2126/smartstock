// ADD this file as: middleware/admin.js in your backend

const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Super admin access required.' });
  }
  next();
};

const isOwnerOrSuperAdmin = (req, res, next) => {
  if (!['owner', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Owner access required.' });
  }
  next();
};

module.exports = { isSuperAdmin, isOwnerOrSuperAdmin };
