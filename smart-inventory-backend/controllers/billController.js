const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { recordAuditLog } = require('../middleware/auditLogger');

const getShopId = (user) => (user.role === 'owner' || user.role === 'superadmin' ? user._id : user.owner);

// Generate unique, collision-proof invoice number
const generateBillNumber = async (shopId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await Bill.countDocuments({
    user: shopId,
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lte: new Date(new Date().setHours(23, 59, 59, 999)),
    },
  });
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${String(countToday + 1).padStart(4, '0')}-${randomSuffix}`;
};

/**
 * POST /api/bills
 * Creates a bill with atomic stock deduction, rollback on partial failure,
 * profit calculation, customer loyalty, and audit logging.
 */
const createBill = async (req, res) => {
  const shopId = getShopId(req.user);
  const {
    items,
    paymentMethod = 'cash',
    paymentSplits = [],
    customerName = 'Walk-in Customer',
    customerPhone = '',
    customerEmail = '',
    discountTotal = 0,
    loyaltyPointsToRedeem = 0,
    notes = '',
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Bill must have at least one item.' });
  }

  const successfullyDeducted = []; // For rollback if transaction fails mid-way
  const billItems = [];
  let calculatedSubtotal = 0;
  let calculatedTaxTotal = 0;
  let calculatedProfit = 0;

  try {
    // 1. Process and atomically deduct each item
    for (const item of items) {
      const { productId, quantity, discount = 0 } = item;
      const numQty = Number(quantity);

      if (!numQty || numQty < 1 || isNaN(numQty)) {
        throw new Error('Quantity must be an integer >= 1 for all items.');
      }

      // Atomic conditional update: only decrement if active and stock >= quantity
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: productId,
          user: shopId,
          isActive: true,
          stock: { $gte: numQty },
        },
        { $inc: { stock: -numQty } },
        { new: true }
      );

      if (!updatedProduct) {
        // Find product to give an informative error
        const existing = await Product.findOne({ _id: productId, user: shopId, isActive: true });
        if (!existing) {
          throw new Error(`Product not found or inactive.`);
        } else {
          throw new Error(
            `Insufficient stock for "${existing.name}". Available: ${existing.stock}, requested: ${numQty}.`
          );
        }
      }

      // Track for rollback safety
      successfullyDeducted.push({ productId, quantity: numQty });

      const unitPrice = updatedProduct.price;
      const unitCost = updatedProduct.costPrice || 0;
      const itemTaxRate = updatedProduct.taxRate || 0;

      const itemRawTotal = unitPrice * numQty;
      const itemDiscountAmount = Number(discount) || 0;
      const itemTaxableAmount = Math.max(0, itemRawTotal - itemDiscountAmount);
      const itemTaxAmount = parseFloat(((itemTaxableAmount * itemTaxRate) / 100).toFixed(2));
      const itemSubtotal = parseFloat((itemTaxableAmount + itemTaxAmount).toFixed(2));

      const itemProfit = parseFloat(
        (itemTaxableAmount - unitCost * numQty).toFixed(2)
      );

      calculatedSubtotal += itemTaxableAmount;
      calculatedTaxTotal += itemTaxAmount;
      calculatedProfit += itemProfit;

      billItems.push({
        product: updatedProduct._id,
        productName: updatedProduct.name,
        sku: updatedProduct.sku || '',
        price: unitPrice,
        costPrice: unitCost,
        quantity: numQty,
        taxRate: itemTaxRate,
        taxAmount: itemTaxAmount,
        discountAmount: itemDiscountAmount,
        subtotal: itemSubtotal,
      });
    }

    // 2. Loyalty Point redemption calculation (1 point = 1 currency unit)
    let loyaltyDiscount = 0;
    let customerDoc = null;

    if (customerPhone && customerPhone.trim()) {
      customerDoc = await Customer.findOne({ user: shopId, phone: customerPhone.trim() });
      if (!customerDoc) {
        customerDoc = await Customer.create({
          user: shopId,
          name: customerName || 'Valued Customer',
          phone: customerPhone.trim(),
          email: customerEmail || '',
        });
      }

      if (loyaltyPointsToRedeem > 0) {
        const availablePoints = customerDoc.loyaltyPoints || 0;
        loyaltyDiscount = Math.min(loyaltyPointsToRedeem, availablePoints);
      }
    }

    // 3. Final Totals
    const totalDiscounts = parseFloat(
      (Number(discountTotal || 0) + loyaltyDiscount).toFixed(2)
    );
    const rawTotal = calculatedSubtotal + calculatedTaxTotal;
    const finalGrandTotal = Math.max(0, parseFloat((rawTotal - (Number(discountTotal) || 0) - loyaltyDiscount).toFixed(2)));
    const finalProfit = parseFloat((calculatedProfit - (Number(discountTotal) || 0) - loyaltyDiscount).toFixed(2));

    // Loyalty points earned (1 point for every 100 spent)
    const pointsEarned = Math.floor(finalGrandTotal / 100);

    // 4. Update Customer Stats
    if (customerDoc) {
      customerDoc.loyaltyPoints = Math.max(
        0,
        (customerDoc.loyaltyPoints || 0) - loyaltyDiscount + pointsEarned
      );
      customerDoc.totalSpent = parseFloat(((customerDoc.totalSpent || 0) + finalGrandTotal).toFixed(2));
      customerDoc.visitCount = (customerDoc.visitCount || 0) + 1;
      customerDoc.lastVisit = new Date();
      if (customerName && customerName !== 'Walk-in Customer') {
        customerDoc.name = customerName;
      }
      await customerDoc.save();
    }

    // 5. Create Bill Document
    const today = new Date().toISOString().split('T')[0];
    const billNumber = await generateBillNumber(shopId);

    const bill = await Bill.create({
      user: shopId,
      cashier: req.user._id,
      billNumber,
      customer: customerDoc ? customerDoc._id : null,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone ? customerPhone.trim() : '',
      items: billItems,
      subtotal: parseFloat(calculatedSubtotal.toFixed(2)),
      taxTotal: parseFloat(calculatedTaxTotal.toFixed(2)),
      discountTotal: totalDiscounts,
      totalAmount: finalGrandTotal,
      totalProfit: finalProfit,
      paymentMethod,
      paymentSplits: Array.isArray(paymentSplits) ? paymentSplits : [],
      loyaltyPointsEarned: pointsEarned,
      loyaltyPointsRedeemed: loyaltyDiscount,
      status: 'completed',
      notes,
      billDate: today,
    });

    // 6. Record System Audit Log
    await recordAuditLog({
      user: req.user._id,
      shop: shopId,
      action: 'BILL_CREATE',
      entityType: 'Bill',
      entityId: bill._id,
      summary: `Created Invoice ${billNumber} for ₹${finalGrandTotal} (${billItems.length} items)`,
      details: {
        billNumber,
        totalAmount: finalGrandTotal,
        paymentMethod,
        itemCount: billItems.length,
      },
      req,
    });

    res.status(201).json({ success: true, bill });
  } catch (error) {
    // Rollback stock for any items that were decremented before the error occurred
    for (const item of successfullyDeducted) {
      try {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });
      } catch (rollbackErr) {
        console.error('CRITICAL: Stock rollback failed for item:', item.productId, rollbackErr);
      }
    }

    console.error('POS Checkout Error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/bills
 * Paginated bills with date range, search, customer, and cashier filtering
 */
const getBills = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const { date, from, to, customerPhone, status, search, limit = 20, page = 1 } = req.query;
    const filter = { user: shopId };

    if (date) {
      filter.billDate = date;
    } else if (from || to) {
      filter.billDate = {};
      if (from) filter.billDate.$gte = from;
      if (to) filter.billDate.$lte = to;
    }

    if (customerPhone) {
      filter.customerPhone = customerPhone;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [total, bills] = await Promise.all([
      Bill.countDocuments(filter),
      Bill.find(filter)
        .populate('cashier', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      bills,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/bills/today
 */
const getTodaysBills = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const today = new Date().toISOString().split('T')[0];
    const bills = await Bill.find({ user: shopId, billDate: today, status: 'completed' })
      .populate('cashier', 'name')
      .sort({ createdAt: -1 });

    const totalSales = bills.reduce((s, b) => s + b.totalAmount, 0);
    const totalProfit = bills.reduce((s, b) => s + (b.totalProfit || 0), 0);
    const totalItems = bills.reduce(
      (s, b) => s + b.items.reduce((a, i) => a + i.quantity, 0),
      0
    );

    res.json({
      success: true,
      date: today,
      billCount: bills.length,
      totalSales: parseFloat(totalSales.toFixed(2)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      totalItems,
      bills,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/bills/:id
 */
const getBill = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const bill = await Bill.findOne({ _id: req.params.id, user: shopId })
      .populate('cashier', 'name email')
      .populate('customer', 'name phone email loyaltyPoints');

    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });
    res.json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/bills/:id/refund
 * Enterprise Bill Refund / Cancellation with automatic stock restock
 */
const refundBill = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const { reason = 'Customer requested refund' } = req.body;

    const bill = await Bill.findOne({ _id: req.params.id, user: shopId });
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });

    if (bill.status === 'refunded') {
      return res.status(400).json({ success: false, message: 'Bill is already refunded.' });
    }

    // 1. Restock products atomically
    for (const item of bill.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    // 2. Reverse customer points if applicable
    if (bill.customer) {
      await Customer.findByIdAndUpdate(bill.customer, {
        $inc: {
          loyaltyPoints: -(bill.loyaltyPointsEarned || 0) + (bill.loyaltyPointsRedeemed || 0),
          totalSpent: -bill.totalAmount,
        },
      });
    }

    // 3. Mark bill as refunded
    bill.status = 'refunded';
    bill.notes = `${bill.notes ? bill.notes + ' | ' : ''}Refunded on ${new Date().toISOString()} (${reason})`;
    await bill.save();

    // 4. Record Audit Log
    await recordAuditLog({
      user: req.user._id,
      shop: shopId,
      action: 'BILL_REFUND',
      entityType: 'Bill',
      entityId: bill._id,
      summary: `Refunded Invoice ${bill.billNumber} of amount ₹${bill.totalAmount}`,
      details: { reason, billNumber: bill.billNumber },
      req,
    });

    res.json({ success: true, message: 'Bill successfully refunded and stock replenished.', bill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBill,
  getBills,
  getTodaysBills,
  getBill,
  refundBill,
};