const Bill = require('../models/Bill');
const Product = require('../models/Product');

const getShopId = (user) => (user.role === 'owner' || user.role === 'superadmin' ? user._id : user.owner);

// GET /api/reports/dashboard
const getDashboard = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const today = new Date().toISOString().split('T')[0];

    const todaysBills = await Bill.find({ user: shopId, billDate: today });
    const todaysSales = todaysBills.reduce((s, b) => s + b.totalAmount, 0);

    const products = await Product.find({ user: shopId, isActive: true });
    const lowStock = products.filter(
      (p) => p.stock > 0 && p.stock <= p.lowStockThreshold
    );
    const outOfStock = products.filter((p) => p.stock === 0);

    const salesMap = {};
    todaysBills.forEach((bill) => {
      bill.items.forEach((item) => {
        const key = item.productName;
        salesMap[key] = (salesMap[key] || 0) + item.quantity;
      });
    });
    const topProducts = Object.entries(salesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    res.json({
      success: true,
      today: {
        date: today,
        totalSales: todaysSales,
        billCount: todaysBills.length,
        avgBillValue:
          todaysBills.length > 0
            ? Math.round(todaysSales / todaysBills.length)
            : 0,
      },
      stock: {
        total: products.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        lowStockItems: lowStock.map((p) => ({
          _id: p._id,
          name: p.name,
          stock: p.stock,
          threshold: p.lowStockThreshold,
        })),
        outOfStockItems: outOfStock.map((p) => ({ _id: p._id, name: p.name })),
      },
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD
const getSalesReport = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const { from, to } = req.query;
    const filter = { user: shopId };
    if (from || to) {
      filter.billDate = {};
      if (from) filter.billDate.$gte = from;
      if (to) filter.billDate.$lte = to;
    }

    const bills = await Bill.find(filter).sort({ billDate: 1 });

    const byDate = {};
    bills.forEach((b) => {
      byDate[b.billDate] = byDate[b.billDate] || { date: b.billDate, total: 0, count: 0 };
      byDate[b.billDate].total += b.totalAmount;
      byDate[b.billDate].count += 1;
    });

    const productSales = {};
    bills.forEach((b) => {
      b.items.forEach((item) => {
        if (!productSales[item.productName]) {
          productSales[item.productName] = { name: item.productName, qty: 0, revenue: 0 };
        }
        productSales[item.productName].qty += item.quantity;
        productSales[item.productName].revenue += item.subtotal;
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      success: true,
      period: { from, to },
      totalRevenue: bills.reduce((s, b) => s + b.totalAmount, 0),
      totalBills: bills.length,
      dailySales: Object.values(byDate),
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboard, getSalesReport };