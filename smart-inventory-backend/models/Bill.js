const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    taxRate: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const paymentSplitSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'credit'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reference: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    billNumber: {
      type: String,
      required: true,
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    customerName: {
      type: String,
      trim: true,
      default: 'Walk-in Customer',
    },
    customerPhone: {
      type: String,
      trim: true,
      default: '',
    },
    items: [billItemSchema],
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalProfit: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'credit', 'split'],
      default: 'cash',
    },
    paymentSplits: [paymentSplitSchema],
    loyaltyPointsEarned: {
      type: Number,
      default: 0,
    },
    loyaltyPointsRedeemed: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['completed', 'refunded', 'cancelled'],
      default: 'completed',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    billDate: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

billSchema.index({ user: 1, billNumber: 1 });
billSchema.index({ user: 1, billDate: 1 });
billSchema.index({ user: 1, createdAt: -1 });
billSchema.index({ customerPhone: 1 });

module.exports = mongoose.model('Bill', billSchema);