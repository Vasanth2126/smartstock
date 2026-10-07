const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price cannot be negative'],
    },
    price: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    taxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },
    unit: {
      type: String,
      default: 'pcs', // pcs, kg, litre, box, meter, pack
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    batchNumber: {
      type: String,
      trim: true,
      default: '',
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Virtuals
productSchema.virtual('stockStatus').get(function () {
  if (this.stock === 0) return 'out_of_stock';
  if (this.stock <= this.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

productSchema.virtual('margin').get(function () {
  return parseFloat(((this.price || 0) - (this.costPrice || 0)).toFixed(2));
});

productSchema.virtual('marginPercentage').get(function () {
  if (!this.costPrice || this.costPrice <= 0) return 100;
  return parseFloat((((this.price - this.costPrice) / this.costPrice) * 100).toFixed(1));
});

productSchema.virtual('isExpired').get(function () {
  if (!this.expiryDate) return false;
  return new Date(this.expiryDate) < new Date();
});

productSchema.virtual('isNearExpiry').get(function () {
  if (!this.expiryDate) return false;
  const now = new Date();
  const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const exp = new Date(this.expiryDate);
  return exp >= now && exp <= thirtyDaysOut;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Compound indexes for optimal search and uniqueness per shop
productSchema.index({ user: 1, barcode: 1 });
productSchema.index({ user: 1, sku: 1 });
productSchema.index({ user: 1, name: 'text', category: 'text' });
productSchema.index({ user: 1, isActive: 1, stock: 1 });

module.exports = mongoose.model('Product', productSchema);
