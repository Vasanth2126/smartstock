const Bill    = require('../models/Bill');
const Product = require('../models/Product');

// POST /api/bills
const createBill = async (req, res) => {
  try {
    const { items, paymentMethod, customerName, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Bill must have at least one item.' });
    }

    const billItems      = [];
    let   totalAmount    = 0;
    const stockUpdates   = [];

    for (const item of items) {
      const { productId, quantity } = item;

      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1.' });
      }

      const product = await Product.findOne({
        _id:      productId,
        user:     req.user._id,
        isActive: true,
      });

      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Not enough stock for "${product.name}". Available: ${product.stock}, requested: ${quantity}.`,
        });
      }

      const subtotal = product.price * quantity;
      totalAmount   += subtotal;

      billItems.push({
        product:     product._id,
        productName: product.name,
        price:       product.price,
        quantity,
        subtotal,
      });

      stockUpdates.push({ id: product._id, newStock: product.stock - quantity });
    }

    // Deduct stock
    for (const { id, newStock } of stockUpdates) {
      await Product.findByIdAndUpdate(id, { stock: newStock });
    }

    // Create bill
    const today      = new Date().toISOString().split('T')[0];
    const totalBills = await Bill.countDocuments({ user: req.user._id });
    const billNumber = `BILL-${String(totalBills + 1).padStart(5, '0')}`;

    const bill = await Bill.create({
      user:          req.user._id,
      billNumber,
      items:         billItems,
      totalAmount,
      paymentMethod: paymentMethod || 'cash',
      customerName:  customerName  || '',
      notes:         notes         || '',
      billDate:      today,
    });

    res.status(201).json({ success: true, bill });

  } catch (error) {
    console.error('Bill error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/bills
const getBills = async (req, res) => {
  try {
    const { date, from, to, limit = 50, page = 1 } = req.query;
    const filter = { user: req.user._id };

    if (date) {
      filter.billDate = date;
    } else if (from || to) {
      filter.billDate = {};
      if (from) filter.billDate.$gte = from;
      if (to)   filter.billDate.$lte = to;
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Bill.countDocuments(filter);
    const bills = await Bill.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), bills });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/bills/today
const getTodaysBills = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const bills = await Bill.find({ user: req.user._id, billDate: today }).sort({ createdAt: -1 });

    const totalSales = bills.reduce((s, b) => s + b.totalAmount, 0);
    const totalItems = bills.reduce((s, b) => s + b.items.reduce((a, i) => a + i.quantity, 0), 0);

    res.json({ success: true, date: today, billCount: bills.length, totalSales, totalItems, bills });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/bills/:id
const getBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, user: req.user._id });
    if (!bill) return res.status(404).json({ message: 'Bill not found.' });
    res.json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBill, getBills, getTodaysBills, getBill };