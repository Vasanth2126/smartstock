// ADD this file as: controllers/staffController.js

const User = require('../models/User');
const jwt  = require('jsonwebtoken');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// GET /api/staff  — owner lists their own staff
const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff', owner: req.user._id })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: staff.length, staff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/staff  — owner creates a staff account
const createStaff = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered.' });

    const staff = await User.create({
      name,
      email,
      password,
      role: 'staff',
      owner: req.user._id,         // link to this owner
      shopName: req.user.shopName, // inherit shop name
    });

    staff.password = undefined;
    res.status(201).json({ success: true, staff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/staff/:id  — update staff name/email/password
const updateStaff = async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.params.id, owner: req.user._id, role: 'staff' });
    if (!staff) return res.status(404).json({ message: 'Staff member not found.' });

    const { name, email, password } = req.body;
    if (name)     staff.name  = name;
    if (email)    staff.email = email;
    if (password) staff.password = password; // pre-save hook will re-hash

    await staff.save();
    staff.password = undefined;
    res.json({ success: true, staff });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/staff/:id  — owner removes their staff
const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOneAndDelete({ _id: req.params.id, owner: req.user._id, role: 'staff' });
    if (!staff) return res.status(404).json({ message: 'Staff member not found.' });
    res.json({ success: true, message: 'Staff account removed.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getStaff, createStaff, updateStaff, deleteStaff };
