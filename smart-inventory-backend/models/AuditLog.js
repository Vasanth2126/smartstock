const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'PRODUCT_CREATE',
        'PRODUCT_UPDATE',
        'PRODUCT_DELETE',
        'STOCK_ADJUSTMENT',
        'BILL_CREATE',
        'BILL_REFUND',
        'SUPPLIER_CREATE',
        'SUPPLIER_UPDATE',
        'USER_LOGIN',
        'SETTINGS_UPDATE',
      ],
    },
    entityType: {
      type: String,
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    summary: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ shop: 1, createdAt: -1 });
auditLogSchema.index({ shop: 1, action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
