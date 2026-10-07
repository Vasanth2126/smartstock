const Product = require('../models/Product');
const { recordAuditLog } = require('../middleware/auditLogger');

const getShopId = (user) => (user.role === 'owner' || user.role === 'superadmin' ? user._id : user.owner);

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const { search, category, status, expiryStatus, page, limit } = req.query;
    const filter = { user: shopId, isActive: true };

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { barcode: q },
        { category: { $regex: q, $options: 'i' } },
        { batchNumber: { $regex: q, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    let query = Product.find(filter)
      .populate('supplier', 'name phone email')
      .sort({ name: 1 });

    if (page && limit) {
      const p = Math.max(1, parseInt(page));
      const l = Math.max(1, parseInt(limit));
      query = query.skip((p - 1) * l).limit(l);
    }

    const products = await query;
    const total = await Product.countDocuments(filter);

    // Filter by virtual status if requested
    let filtered = products;
    if (status && status !== 'all') {
      filtered = filtered.filter((p) => p.stockStatus === status);
    }
    if (expiryStatus === 'expired') {
      filtered = filtered.filter((p) => p.isExpired);
    } else if (expiryStatus === 'near_expiry') {
      filtered = filtered.filter((p) => p.isNearExpiry);
    }

    // Categories list for quick filtering in frontend
    const categories = await Product.distinct('category', { user: shopId, isActive: true });

    res.json({
      success: true,
      total,
      count: filtered.length,
      categories,
      products: filtered,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/barcode/:barcode
const getByBarcode = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const barcodeOrSku = req.params.barcode.trim();

    const product = await Product.findOne({
      user: shopId,
      isActive: true,
      $or: [{ barcode: barcodeOrSku }, { sku: barcodeOrSku.toUpperCase() }],
    }).populate('supplier', 'name');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found for this barcode/SKU.' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/low-stock
const getLowStock = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const products = await Product.find({
      user: shopId,
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    })
      .populate('supplier', 'name phone')
      .sort({ stock: 1 });

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/:id
const getProduct = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const product = await Product.findOne({
      _id: req.params.id,
      user: shopId,
    }).populate('supplier', 'name phone email');

    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const payload = { ...req.body, user: shopId };

    // Auto-generate SKU if omitted
    if (!payload.sku) {
      const count = await Product.countDocuments({ user: shopId });
      const prefix = (payload.category || 'PRD').substring(0, 3).toUpperCase();
      payload.sku = `${prefix}-${String(count + 101).padStart(4, '0')}`;
    }

    const product = await Product.create(payload);

    await recordAuditLog({
      user: req.user._id,
      shop: shopId,
      action: 'PRODUCT_CREATE',
      entityType: 'Product',
      entityId: product._id,
      summary: `Created product "${product.name}" (SKU: ${product.sku}, Stock: ${product.stock}, Price: ₹${product.price})`,
      details: product,
      req,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const oldProduct = await Product.findOne({ _id: req.params.id, user: shopId });
    if (!oldProduct) return res.status(404).json({ success: false, message: 'Product not found.' });

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, user: shopId },
      req.body,
      { new: true, runValidators: true }
    );

    await recordAuditLog({
      user: req.user._id,
      shop: shopId,
      action: 'PRODUCT_UPDATE',
      entityType: 'Product',
      entityId: product._id,
      summary: `Updated product "${product.name}"`,
      details: { previous: oldProduct.toObject(), current: product.toObject() },
      req,
    });

    res.json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/products/:id/adjust-stock
const adjustStock = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const { adjustment, reason = 'Inventory Count Adjustment', newStock } = req.body;

    const product = await Product.findOne({ _id: req.params.id, user: shopId });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const previousStock = product.stock;
    let targetStock = previousStock;

    if (typeof newStock === 'number') {
      targetStock = Math.max(0, newStock);
    } else if (typeof adjustment === 'number') {
      targetStock = Math.max(0, previousStock + adjustment);
    } else {
      return res.status(400).json({ success: false, message: 'Provide either adjustment (+/-) or newStock value.' });
    }

    product.stock = targetStock;
    await product.save();

    await recordAuditLog({
      user: req.user._id,
      shop: shopId,
      action: 'STOCK_ADJUSTMENT',
      entityType: 'Product',
      entityId: product._id,
      summary: `Adjusted stock for "${product.name}" from ${previousStock} to ${targetStock} (Reason: ${reason})`,
      details: { previousStock, targetStock, diff: targetStock - previousStock, reason },
      req,
    });

    res.json({
      success: true,
      message: `Stock updated successfully from ${previousStock} to ${targetStock}`,
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/products/:id  (soft delete)
const deleteProduct = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, user: shopId },
      { isActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    await recordAuditLog({
      user: req.user._id,
      shop: shopId,
      action: 'PRODUCT_DELETE',
      entityType: 'Product',
      entityId: product._id,
      summary: `Deactivated product "${product.name}"`,
      req,
    });

    res.json({ success: true, message: 'Product deactivated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/products/bulk-import
const bulkImportProducts = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide an array of products to import.' });
    }

    const inserted = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      const item = products[i];
      if (!item.name || item.price === undefined) {
        errors.push({ row: i + 1, message: 'Name and Price are required.' });
        continue;
      }

      try {
        const p = await Product.create({
          user: shopId,
          name: item.name,
          sku: item.sku || `SKU-${Date.now()}-${i}`,
          barcode: item.barcode || '',
          category: item.category || 'General',
          costPrice: Number(item.costPrice) || 0,
          price: Number(item.price) || 0,
          stock: Number(item.stock) || 0,
          unit: item.unit || 'pcs',
          lowStockThreshold: Number(item.lowStockThreshold) || 5,
          batchNumber: item.batchNumber || '',
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
        });
        inserted.push(p);
      } catch (err) {
        errors.push({ row: i + 1, name: item.name, error: err.message });
      }
    }

    res.json({
      success: true,
      importedCount: inserted.length,
      errorCount: errors.length,
      errors,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProduct,
  getByBarcode,
  getLowStock,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct,
  bulkImportProducts,
};