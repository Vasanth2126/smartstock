const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

const getShopId = (user) => (user.role === 'owner' || user.role === 'superadmin' ? user._id : user.owner);

// GET /api/suppliers
const getSuppliers = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const suppliers = await Supplier.find({ user: shopId }).sort({ name: 1 });
    res.json({ success: true, count: suppliers.length, suppliers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/suppliers/:id
const getSupplier = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      user: shopId,
    });
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });

    const products = await Product.find({
      user: shopId,
      supplier: supplier._id,
      isActive: true,
    }).select('name price stock stockStatus');

    res.json({ success: true, supplier, products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/suppliers
const createSupplier = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const supplier = await Supplier.create({ ...req.body, user: shopId });
    res.status(201).json({ success: true, supplier });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/suppliers/:id
const updateSupplier = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, user: shopId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });
    res.json({ success: true, supplier });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/suppliers/:id
const deleteSupplier = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const supplier = await Supplier.findOneAndDelete({
      _id: req.params.id,
      user: shopId,
    });
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });

    await Product.updateMany(
      { user: shopId, supplier: supplier._id },
      { supplier: null }
    );

    res.json({ success: true, message: 'Supplier deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};