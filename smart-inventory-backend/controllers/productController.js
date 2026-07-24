const Product = require('../models/Product');

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    const filter = { user: req.user._id, isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: search },
      ];
    }
    if (category) filter.category = category;

    const products = await Product.find(filter)
      .populate('supplier', 'name phone')
      .sort({ name: 1 });

    // Apply status filter after populating (uses virtual)
    const filtered =
      status
        ? products.filter((p) => p.stockStatus === status)
        : products;

    res.json({ success: true, count: filtered.length, products: filtered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/barcode/:barcode
const getByBarcode = async (req, res) => {
  try {
    const product = await Product.findOne({
      user: req.user._id,
      barcode: req.params.barcode,
      isActive: true,
    }).populate('supplier', 'name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found for this barcode.' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/low-stock
const getLowStock = async (req, res) => {
  try {
    const products = await Product.find({
      user: req.user._id,
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    }).sort({ stock: 1 });

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/:id
const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('supplier', 'name phone');

    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ success: true, product });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/products/:id  (soft delete)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ success: true, message: 'Product deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProduct,
  getByBarcode,
  getLowStock,
  createProduct,
  updateProduct,
  deleteProduct,
};
