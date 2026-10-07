const Bill = require('../models/Bill');
const Product = require('../models/Product');

const getShopId = (user) => (user.role === 'owner' || user.role === 'superadmin' ? user._id : user.owner);

// GET /api/reports/dashboard
const getDashboard = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const today = new Date().toISOString().split('T')[0];

    // Today's completed bills
    const todaysBills = await Bill.find({ user: shopId, billDate: today, status: 'completed' });
    const todaysSales = todaysBills.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
    const todaysProfit = todaysBills.reduce((s, b) => s + (Number(b.totalProfit) || 0), 0);

    const products = await Product.find({ user: shopId, isActive: true });
    const lowStock = products.filter((p) => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= (Number(p.lowStockThreshold) || 5));
    const outOfStock = products.filter((p) => (Number(p.stock) || 0) === 0);
    const nearExpiry = products.filter((p) => Boolean(p.isNearExpiry));
    const expired = products.filter((p) => Boolean(p.isExpired));

    // Total Inventory Value (Cost vs Retail Valuation)
    const inventoryCostValue = products.reduce((sum, p) => sum + (Number(p.costPrice) || 0) * (Number(p.stock) || 0), 0);
    const inventoryRetailValue = products.reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0), 0);

    const salesMap = {};
    todaysBills.forEach((bill) => {
      (bill.items || []).forEach((item) => {
        if (!item) return;
        const key = item.productName || 'Unknown Item';
        salesMap[key] = (salesMap[key] || 0) + (Number(item.quantity) || 0);
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
        totalSales: parseFloat(todaysSales.toFixed(2)),
        totalProfit: parseFloat(todaysProfit.toFixed(2)),
        billCount: todaysBills.length,
        avgBillValue:
          todaysBills.length > 0 ? parseFloat((todaysSales / todaysBills.length).toFixed(2)) : 0,
      },
      stock: {
        total: products.length,
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        nearExpiryCount: nearExpiry.length,
        expiredCount: expired.length,
        inventoryCostValue: parseFloat(inventoryCostValue.toFixed(2)),
        inventoryRetailValue: parseFloat(inventoryRetailValue.toFixed(2)),
        potentialProfit: parseFloat((inventoryRetailValue - inventoryCostValue).toFixed(2)),
        lowStockItems: lowStock.map((p) => ({
          _id: p._id,
          name: p.name,
          sku: p.sku,
          stock: p.stock,
          threshold: p.lowStockThreshold,
          lowStockThreshold: p.lowStockThreshold,
        })),
        outOfStockItems: outOfStock.map((p) => ({ _id: p._id, name: p.name, sku: p.sku })),
      },
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD
const getSalesReport = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const { from, to } = req.query;
    const filter = { user: shopId, status: 'completed' };

    if (from || to) {
      filter.billDate = {};
      if (from) filter.billDate.$gte = from;
      if (to) filter.billDate.$lte = to;
    }

    const bills = await Bill.find(filter).sort({ billDate: 1 });

    const byDate = {};
    const productSales = {};
    const paymentBreakdown = { cash: 0, card: 0, upi: 0, credit: 0 };

    let totalRevenue = 0;
    let totalProfit = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    bills.forEach((b) => {
      const bTotal = Number(b.totalAmount) || 0;
      const bProfit = Number(b.totalProfit) || 0;
      const bTax = Number(b.taxTotal) || 0;
      const bDiscount = Number(b.discountTotal) || 0;

      totalRevenue += bTotal;
      totalProfit += bProfit;
      totalTax += bTax;
      totalDiscount += bDiscount;

      // Group by Date
      const dateKey = b.billDate || 'Unknown Date';
      byDate[dateKey] = byDate[dateKey] || {
        date: dateKey,
        revenue: 0,
        profit: 0,
        count: 0,
      };
      byDate[dateKey].revenue = parseFloat((byDate[dateKey].revenue + bTotal).toFixed(2));
      byDate[dateKey].profit = parseFloat(
        (byDate[dateKey].profit + bProfit).toFixed(2)
      );
      byDate[dateKey].count += 1;

      // Group by Payment Mode
      if (b.paymentSplits && b.paymentSplits.length > 0) {
        b.paymentSplits.forEach((sp) => {
          if (sp && sp.method) {
            paymentBreakdown[sp.method] = (paymentBreakdown[sp.method] || 0) + (Number(sp.amount) || 0);
          }
        });
      } else {
        const method = b.paymentMethod || 'cash';
        paymentBreakdown[method] = (paymentBreakdown[method] || 0) + bTotal;
      }

      // Group by Product
      (b.items || []).forEach((item) => {
        if (!item || !item.productName) return;
        const name = item.productName;
        if (!productSales[name]) {
          productSales[name] = {
            name,
            sku: item.sku || '',
            qty: 0,
            revenue: 0,
          };
        }
        productSales[name].qty += Number(item.quantity) || 0;
        productSales[name].revenue += Number(item.subtotal) || 0;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((p) => ({ ...p, revenue: parseFloat(p.revenue.toFixed(2)) }));

    const overallMargin =
      totalRevenue > 0 ? parseFloat(((totalProfit / totalRevenue) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      period: { from, to },
      summary: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        profitMarginPercentage: overallMargin,
        totalTax: parseFloat(totalTax.toFixed(2)),
        totalDiscount: parseFloat(totalDiscount.toFixed(2)),
        totalBills: bills.length,
        avgTicketSize: bills.length > 0 ? parseFloat((totalRevenue / bills.length).toFixed(2)) : 0,
      },
      paymentBreakdown,
      dailySales: Object.values(byDate),
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/profit-loss
const getProfitLossReport = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const { from, to } = req.query;
    const filter = { user: shopId, status: 'completed' };

    if (from || to) {
      filter.billDate = {};
      if (from) filter.billDate.$gte = from;
      if (to) filter.billDate.$lte = to;
    }

    const bills = await Bill.find(filter);

    let grossRevenue = 0;
    let costOfGoodsSold = 0;
    let totalDiscounts = 0;
    let netTaxCollected = 0;

    bills.forEach((bill) => {
      grossRevenue += Number(bill.subtotal) || 0;
      totalDiscounts += Number(bill.discountTotal) || 0;
      netTaxCollected += Number(bill.taxTotal) || 0;

      (bill.items || []).forEach((item) => {
        if (!item) return;
        costOfGoodsSold += (Number(item.costPrice) || 0) * (Number(item.quantity) || 0);
      });
    });

    const netSales = Math.max(0, grossRevenue - totalDiscounts);
    const grossProfit = parseFloat((netSales - costOfGoodsSold).toFixed(2));
    const grossMarginPercent =
      netSales > 0 ? parseFloat(((grossProfit / netSales) * 100).toFixed(2)) : 0;

    res.json({
      success: true,
      pnl: {
        grossRevenue: parseFloat(grossRevenue.toFixed(2)),
        discounts: parseFloat(totalDiscounts.toFixed(2)),
        netSales: parseFloat(netSales.toFixed(2)),
        cogs: parseFloat(costOfGoodsSold.toFixed(2)),
        grossProfit,
        grossMarginPercent,
        netTaxCollected: parseFloat(netTaxCollected.toFixed(2)),
        totalInvoices: bills.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/forecast (AI Demand Velocity & ABC Classification)
const getForecastReport = async (req, res) => {
  try {
    const shopId = getShopId(req.user);
    const products = await Product.find({ user: shopId, isActive: true });

    // Last 30 days of sales
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromStr = thirtyDaysAgo.toISOString().split('T')[0];

    const bills = await Bill.find({
      user: shopId,
      billDate: { $gte: fromStr },
      status: 'completed',
    });

    const itemSalesCount = {};
    const itemRevenueCount = {};

    bills.forEach((b) => {
      (b.items || []).forEach((item) => {
        if (!item) return;
        const idStr = item.product ? item.product.toString() : null;
        if (idStr) {
          itemSalesCount[idStr] = (itemSalesCount[idStr] || 0) + (Number(item.quantity) || 0);
          itemRevenueCount[idStr] = (itemRevenueCount[idStr] || 0) + (Number(item.subtotal) || 0);
        }
      });
    });

    const total30DayRevenue = Object.values(itemRevenueCount).reduce((a, b) => a + b, 0) || 1;

    // Calculate velocity and sort by revenue for ABC classification
    let productAnalysis = products.map((p) => {
      const pIdStr = p._id ? p._id.toString() : '';
      const sold30 = itemSalesCount[pIdStr] || 0;
      const revenue30 = itemRevenueCount[pIdStr] || 0;
      const dailyVelocity = parseFloat((sold30 / 30).toFixed(2));
      const currentStock = Number(p.stock) || 0;
      const threshold = Number(p.lowStockThreshold) || 5;

      let daysUntilStockout = 999;
      if (dailyVelocity > 0) {
        daysUntilStockout = Math.round(currentStock / dailyVelocity);
      } else if (currentStock === 0) {
        daysUntilStockout = 0;
      }

      let riskLevel = 'normal';
      if (currentStock === 0) riskLevel = 'critical';
      else if (daysUntilStockout <= 7 || currentStock <= threshold) riskLevel = 'warning';

      // Recommended safety stock reorder
      const recommendedReorder = Math.max(0, threshold * 3 - currentStock);

      return {
        _id: p._id,
        name: p.name || 'Unnamed Item',
        sku: p.sku || '',
        category: p.category || 'General',
        costPrice: Number(p.costPrice) || 0,
        price: Number(p.price) || 0,
        stock: currentStock,
        lowStockThreshold: threshold,
        dailyVelocity,
        totalSoldLast30Days: sold30,
        revenueLast30Days: parseFloat(revenue30.toFixed(2)),
        revenueContribution: parseFloat(((revenue30 / total30DayRevenue) * 100).toFixed(2)),
        daysUntilStockout,
        predictedDaysLeft: daysUntilStockout,
        riskLevel,
        recommendedReorder,
      };
    });

    // ABC Pareto Classification
    productAnalysis.sort((a, b) => b.revenueLast30Days - a.revenueLast30Days);

    let cumulativeRevenue = 0;
    productAnalysis = productAnalysis.map((item) => {
      cumulativeRevenue += item.revenueLast30Days;
      const cumulativePercent = (cumulativeRevenue / total30DayRevenue) * 100;

      let abcCategory = 'C';
      if (cumulativePercent <= 70) abcCategory = 'A'; // Top 70% revenue
      else if (cumulativePercent <= 90) abcCategory = 'B'; // Next 20% revenue

      return { ...item, abcCategory };
    });

    res.json({
      success: true,
      analyzedPeriodDays: 30,
      totalProductsAnalyzed: products.length,
      highRiskCount: productAnalysis.filter((f) => f.riskLevel !== 'normal').length,
      forecasts: productAnalysis,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboard,
  getSalesReport,
  getProfitLossReport,
  getForecastReport,
};