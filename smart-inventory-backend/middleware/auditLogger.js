const AuditLog = require('../models/AuditLog');

/**
 * Helper to record system audit logs
 * @param {Object} params
 * @param {ObjectId} params.user - Performing user ID
 * @param {ObjectId} params.shop - Shop / Owner ID
 * @param {String} params.action - Enum action
 * @param {String} params.entityType - Entity name ('Product', 'Bill', 'Supplier', etc.)
 * @param {ObjectId} params.entityId - Entity ObjectId
 * @param {String} params.summary - Human readable summary
 * @param {Object} params.details - Detailed diff or payload
 * @param {Object} req - Express request (to extract IP)
 */
const recordAuditLog = async ({
  user,
  shop,
  action,
  entityType,
  entityId = null,
  summary,
  details = {},
  req = null,
}) => {
  try {
    const ipAddress =
      (req && (req.headers['x-forwarded-for'] || req.socket?.remoteAddress)) || '127.0.0.1';

    await AuditLog.create({
      user,
      shop,
      action,
      entityType,
      entityId,
      summary,
      details,
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
    });
  } catch (err) {
    console.error('AuditLog writing failed:', err.message);
  }
};

module.exports = { recordAuditLog };
