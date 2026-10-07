const Customer = require('../models/Customer');
const Bill = require('../models/Bill');

const getShopId = (user) => (user.role === 'owner' || user.role === 'superadmin' ? user._id : user.owner);

// GET /api/customers
const getCustomers = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const { search, page = 1, limit = 50 } = req.query;
    const filter = { user: shopId };

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const total = await Customer.countDocuments(filter);
    const customers = await Customer.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/customers/lookup/:phone
const getCustomerByPhone = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const phone = req.params.phone.trim();

    const customer = await Customer.findOne({ user: shopId, phone });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Get last 5 bills for quick customer history
    const recentBills = await Bill.find({ user: shopId, customerPhone: phone })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ success: true, customer, recentBills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/customers
const createCustomer = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const { name, phone, email, address, notes, creditBalance } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and Phone are required.' });
    }

    const existing = await Customer.findOne({ user: shopId, phone: phone.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Customer with this phone already exists.' });
    }

    const customer = await Customer.create({
      user: shopId,
      name: name.trim(),
      phone: phone.trim(),
      email: (email || '').trim(),
      address: (address || '').trim(),
      notes: notes || '',
      creditBalance: Number(creditBalance) || 0,
    });

    res.status(201).json({ success: true, customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/customers/:id
const updateCustomer = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, user: shopId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    res.json({ success: true, customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/customers/:id/adjust-credit (Khata ledger adjustment)
const adjustCredit = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const { amount, reason = 'Store Credit Adjustment' } = req.body;

    if (amount === undefined || isNaN(Number(amount))) {
      return res.status(400).json({ success: false, message: 'Valid amount is required.' });
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, user: shopId },
      { $inc: { creditBalance: Number(amount) } },
      { new: true }
    );

    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    res.json({ success: true, message: `Credit updated by ₹${amount}`, customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerByPhone,
  createCustomer,
  updateCustomer,
  adjustCredit,
};
