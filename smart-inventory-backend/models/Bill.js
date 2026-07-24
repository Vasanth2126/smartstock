const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema(
  {
    product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    price:       { type: Number, required: true },
    quantity:    { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
    subtotal:    { type: Number, required: true },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    billNumber:    { type: String, default: '' },
    items:         [billItemSchema],
    totalAmount:   { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['cash', 'upi', 'card', 'credit'], default: 'cash' },
    customerName:  { type: String, trim: true, default: '' },
    notes:         { type: String, trim: true, default: '' },
    billDate:      { type: String, required: true },
  },
  { timestamps: true }
);

billSchema.index({ user: 1, billDate: 1 });
billSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Bill', billSchema);