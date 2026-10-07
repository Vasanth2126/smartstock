import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Btn, Badge, Spinner, Empty, Modal } from '../components/ui/UI';
import {
  Search,
  ScanLine,
  Trash2,
  Printer,
  CheckCircle2,
  ShoppingCart,
  Plus,
  Minus,
  CreditCard,
  QrCode,
  Banknote,
  Sparkles,
  UserCheck,
  Tag,
  Receipt,
  Keyboard,
  Coins,
  FileDown,
  Layers,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import './POS.css';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [cart, setCart] = useState({}); // { productId: { product, qty, discount } }
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Payment & Customer States
  const [payMethod, setPayMethod] = useState('cash');
  const [splitAmounts, setSplitAmounts] = useState({ cash: 0, upi: 0, card: 0 });
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [manualDiscount, setManualDiscount] = useState(0);
  const [orderNotes, setOrderNotes] = useState('');

  // Receipt & Print Modal States
  const [lastBill, setLastBill] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptFormat, setReceiptFormat] = useState('thermal'); // 'thermal' (80mm) | 'a4'

  const searchRef = useRef(null);
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(Date.now());

  // Load products catalogue
  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products || []);
      setFiltered(data.products || []);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    searchRef.current?.focus();
  }, [fetchProducts]);

  // Barcode Gun Keyboard-Emulation Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Hotkeys
      if (e.key === 'F2') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setCart({});
        toast('Cart cleared', { icon: '🧹' });
        return;
      }
      if (e.key === 'Escape' && showReceiptModal) {
        setShowReceiptModal(false);
        return;
      }

      // Barcode Gun scanner detection (detect rapid input stream < 40ms per character)
      const currentTime = Date.now();
      if (currentTime - lastKeyTime.current > 60) {
        barcodeBuffer.current = '';
      }
      lastKeyTime.current = currentTime;

      if (e.key === 'Enter' && barcodeBuffer.current.length >= 4) {
        const scannedCode = barcodeBuffer.current;
        barcodeBuffer.current = '';
        const found = products.find(
          (p) => p.barcode === scannedCode || p.sku?.toUpperCase() === scannedCode.toUpperCase()
        );
        if (found) {
          e.preventDefault();
          addToCart(found);
          toast.success(`Scanned: ${found.name}`);
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [products, showReceiptModal]);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const filterProducts = (q, cat) => {
    let result = products;
    if (cat !== 'All') {
      result = result.filter((p) => p.category === cat);
    }
    if (q) {
      const lower = q.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.barcode?.includes(q) ||
          p.sku?.toLowerCase().includes(lower)
      );
    }
    setFiltered(result);
  };

  const handleSearch = (q) => {
    setSearch(q);
    filterProducts(q, selectedCategory);
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    filterProducts(search, cat);
  };

  // Add Product to Cart
  const addToCart = (product) => {
    if (product.stock === 0) {
      toast.error(`"${product.name}" is out of stock!`);
      return;
    }
    const currentItem = cart[product._id];
    const currentQty = currentItem ? currentItem.qty : 0;
    if (currentQty >= product.stock) {
      toast.error(`Only ${product.stock} units available in stock!`);
      return;
    }
    setCart((prev) => ({
      ...prev,
      [product._id]: {
        product,
        qty: currentQty + 1,
        discount: currentItem ? currentItem.discount : 0,
      },
    }));
  };

  const changeQty = (productId, delta) => {
    const item = cart[productId];
    if (!item) return;
    const nextQty = item.qty + delta;
    if (nextQty <= 0) {
      const copy = { ...cart };
      delete copy[productId];
      setCart(copy);
    } else if (nextQty > item.product.stock) {
      toast.error(`Max stock limit: ${item.product.stock}`);
    } else {
      setCart((prev) => ({
        ...prev,
        [productId]: { ...item, qty: nextQty },
      }));
    }
  };

  // Lookup Customer by Phone
  const handlePhoneBlur = async () => {
    const cleanPhone = customerPhone.trim();
    if (!cleanPhone || cleanPhone.length < 5) return;
    try {
      const { data } = await api.get(`/customers/lookup/${cleanPhone}`);
      if (data.customer) {
        setCustomerData(data.customer);
        setCustomerName(data.customer.name);
        toast.success(`Welcome back, ${data.customer.name}! (${data.customer.loyaltyPoints} points available)`);
      }
    } catch (err) {
      // New customer - leave name input editable
      setCustomerData(null);
    }
  };

  // Financial Calculations
  const cartList = Object.values(cart);
  const rawSubtotal = cartList.reduce((sum, { product, qty }) => sum + product.price * qty, 0);
  const estimatedTax = cartList.reduce((sum, { product, qty }) => {
    const itemTax = ((product.price * qty * (product.taxRate || 0)) / 100);
    return sum + itemTax;
  }, 0);

  const totalDiscount = Number(manualDiscount || 0) + Number(redeemPoints || 0);
  const grandTotal = Math.max(0, rawSubtotal + estimatedTax - totalDiscount);

  // Complete POS Sale
  const handleCheckout = async () => {
    if (cartList.length === 0) {
      toast.error('Cart is empty. Add products before checking out.');
      return;
    }

    // Validate split payment
    let splitsArray = [];
    if (payMethod === 'split') {
      const sumSplits = Number(splitAmounts.cash || 0) + Number(splitAmounts.upi || 0) + Number(splitAmounts.card || 0);
      if (Math.abs(sumSplits - grandTotal) > 1) {
        toast.error(`Split payments (₹${sumSplits}) must equal Grand Total (₹${grandTotal})`);
        return;
      }
      splitsArray = [
        { method: 'cash', amount: Number(splitAmounts.cash || 0) },
        { method: 'upi', amount: Number(splitAmounts.upi || 0) },
        { method: 'card', amount: Number(splitAmounts.card || 0) },
      ].filter((s) => s.amount > 0);
    }

    setSaving(true);
    try {
      const payload = {
        items: cartList.map(({ product, qty, discount }) => ({
          productId: product._id,
          quantity: qty,
          discount: discount || 0,
        })),
        paymentMethod: payMethod,
        paymentSplits: splitsArray,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        discountTotal: Number(manualDiscount || 0),
        loyaltyPointsToRedeem: Number(redeemPoints || 0),
        notes: orderNotes,
      };

      const { data } = await api.post('/bills', payload);

      // Celebration effect
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}

      setLastBill(data.bill);
      setShowReceiptModal(true);
      setCart({});
      setCustomerName('');
      setCustomerPhone('');
      setCustomerData(null);
      setRedeemPoints(0);
      setManualDiscount(0);
      setOrderNotes('');

      // Refresh stock
      fetchProducts();
      toast.success(`Invoice ${data.bill.billNumber} created successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed. Stock preserved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pos-page animate-fade-in">
      {/* Left Column: Product Catalog & Fast Search */}
      <div className="pos-products glass-card">
        {/* Search & Scanner Bar */}
        <div className="pos-search-wrapper">
          <Search size={18} className="pos-search-icon" />
          <input
            ref={searchRef}
            className="pos-search-input"
            placeholder="Search by Product Name, SKU, or Scan Barcode... [F2]"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <div className="barcode-chip font-mono">
            <ScanLine size={14} className="animate-pulse text-emerald" /> BARCODE SCANNER ACTIVE
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategorySelect(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <Empty icon="📦" title="No matching items" sub="Adjust search keywords or category filters" />
        ) : (
          <div className="prod-grid">
            {filtered.map((p) => {
              const isOut = p.stock === 0;
              const isLow = p.stock > 0 && p.stock <= p.lowStockThreshold;
              const cartItem = cart[p._id];

              return (
                <button
                  key={p._id}
                  className={`prod-tile ${isOut ? 'prod-out' : ''} ${cartItem ? 'prod-in-cart' : ''}`}
                  onClick={() => addToCart(p)}
                  disabled={isOut}
                >
                  <div className="prod-tile-top">
                    <span className="prod-tile-category">{p.category}</span>
                    {p.sku && <span className="prod-tile-sku font-mono">{p.sku}</span>}
                  </div>
                  <div className="prod-tile-name">{p.name}</div>
                  <div className="prod-tile-price font-mono">₹{p.price}</div>
                  <div className="prod-tile-stock">
                    {isOut ? (
                      <span className="out-label">Out of Stock</span>
                    ) : isLow ? (
                      <span className="low-label">⚡ Only {p.stock} {p.unit || 'pcs'} left</span>
                    ) : (
                      <span>{p.stock} {p.unit || 'pcs'} in stock</span>
                    )}
                  </div>
                  {cartItem && <div className="cart-badge font-mono">{cartItem.qty}</div>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: Checkout Drawer & Financial Engine */}
      <div className="pos-bill glass-card">
        <div className="bill-header">
          <div className="bill-title-wrap">
            <ShoppingCart size={20} className="text-indigo" />
            <span className="bill-title">Active POS Checkout</span>
            <span className="hotkey-badge">F4 Clear</span>
          </div>
          {cartList.length > 0 && (
            <button className="clear-btn" onClick={() => setCart({})}>
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>

        {/* Cart Item List */}
        <div className="bill-items-list">
          {cartList.length === 0 ? (
            <Empty icon="🛒" title="POS Cart is Empty" sub="Click products or scan barcodes to begin checkout" />
          ) : (
            cartList.map(({ product, qty }) => (
              <div className="cart-item" key={product._id}>
                <div className="cart-item-info">
                  <div className="cart-item-name">{product.name}</div>
                  <div className="cart-item-price-unit font-mono">
                    ₹{product.price} / {product.unit || 'pc'} {product.taxRate ? `(+${product.taxRate}% GST)` : ''}
                  </div>
                </div>
                <div className="cart-item-actions">
                  <div className="qty-ctrl">
                    <button className="qty-btn" onClick={() => changeQty(product._id, -1)}>
                      <Minus size={12} />
                    </button>
                    <span className="qty-num font-mono">{qty}</span>
                    <button className="qty-btn" onClick={() => changeQty(product._id, 1)}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="cart-item-sub font-mono">₹{(product.price * qty).toFixed(2)}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary & Controls */}
        {cartList.length > 0 && (
          <div className="bill-footer">
            {/* Customer CRM Lookup */}
            <div className="customer-crm-box">
              <div className="crm-input-row">
                <input
                  className="form-input"
                  placeholder="Customer Phone (10 digits)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  onBlur={handlePhoneBlur}
                />
                <input
                  className="form-input"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              {customerData && (
                <div className="loyalty-badge-row">
                  <span className="loyalty-pill font-mono">
                    <Coins size={12} className="text-amber" /> {customerData.loyaltyPoints} Loyalty Points
                  </span>
                  {customerData.loyaltyPoints > 0 && (
                    <div className="redeem-box">
                      <span className="redeem-label">Redeem:</span>
                      <input
                        type="number"
                        min="0"
                        max={customerData.loyaltyPoints}
                        className="redeem-input font-mono"
                        value={redeemPoints}
                        onChange={(e) =>
                          setRedeemPoints(
                            Math.min(customerData.loyaltyPoints, Math.max(0, Number(e.target.value)))
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Discounts & Payment Modes */}
            <div className="payment-modes-grid">
              <button
                type="button"
                className={`pay-mode-btn ${payMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPayMethod('cash')}
              >
                <Banknote size={14} /> Cash
              </button>
              <button
                type="button"
                className={`pay-mode-btn ${payMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setPayMethod('upi')}
              >
                <QrCode size={14} /> UPI
              </button>
              <button
                type="button"
                className={`pay-mode-btn ${payMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPayMethod('card')}
              >
                <CreditCard size={14} /> Card
              </button>
              <button
                type="button"
                className={`pay-mode-btn ${payMethod === 'split' ? 'active' : ''}`}
                onClick={() => setPayMethod('split')}
              >
                <Layers size={14} /> Split
              </button>
            </div>

            {/* Split inputs if split selected */}
            {payMethod === 'split' && (
              <div className="split-inputs-grid">
                <input
                  type="number"
                  placeholder="Cash ₹"
                  className="form-input font-mono"
                  value={splitAmounts.cash || ''}
                  onChange={(e) =>
                    setSplitAmounts({ ...splitAmounts, cash: Number(e.target.value) || 0 })
                  }
                />
                <input
                  type="number"
                  placeholder="UPI ₹"
                  className="form-input font-mono"
                  value={splitAmounts.upi || ''}
                  onChange={(e) =>
                    setSplitAmounts({ ...splitAmounts, upi: Number(e.target.value) || 0 })
                  }
                />
                <input
                  type="number"
                  placeholder="Card ₹"
                  className="form-input font-mono"
                  value={splitAmounts.card || ''}
                  onChange={(e) =>
                    setSplitAmounts({ ...splitAmounts, card: Number(e.target.value) || 0 })
                  }
                />
              </div>
            )}

            {/* Calculation Breakdown */}
            <div className="pos-calc-breakdown font-mono">
              <div className="calc-row">
                <span>Subtotal:</span>
                <span>₹{rawSubtotal.toFixed(2)}</span>
              </div>
              {estimatedTax > 0 && (
                <div className="calc-row">
                  <span>Est. GST / Taxes:</span>
                  <span>+₹{estimatedTax.toFixed(2)}</span>
                </div>
              )}
              {totalDiscount > 0 && (
                <div className="calc-row text-emerald">
                  <span>Total Discount / Points:</span>
                  <span>-₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Grand Total Bar */}
            <div className="bill-total-box">
              <div className="total-label">Grand Total</div>
              <div className="bill-total-amt font-mono">₹{grandTotal.toFixed(2)}</div>
            </div>

            <Btn
              variant="primary"
              size="lg"
              style={{ width: '100%', padding: '14px' }}
              loading={saving}
              onClick={handleCheckout}
            >
              <CheckCircle2 size={18} />
              <span>Complete Sale & Print Receipt</span>
            </Btn>
          </div>
        )}
      </div>

      {/* Dual Format Thermal & Tax Invoice Receipt Modal */}
      <Modal
        open={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Official Sales Receipt & Invoice"
        width={receiptFormat === 'thermal' ? 440 : 640}
      >
        {lastBill && (
          <div className="receipt-container">
            {/* Format Toggle */}
            <div className="format-toggle-bar">
              <button
                className={`format-btn ${receiptFormat === 'thermal' ? 'active' : ''}`}
                onClick={() => setReceiptFormat('thermal')}
              >
                <Receipt size={14} /> 80mm Thermal Receipt
              </button>
              <button
                className={`format-btn ${receiptFormat === 'a4' ? 'active' : ''}`}
                onClick={() => setReceiptFormat('a4')}
              >
                <FileDown size={14} /> A4 Tax Invoice
              </button>
            </div>

            {/* Printable Area */}
            <div className={`receipt-print-area ${receiptFormat === 'a4' ? 'a4-preview' : 'thermal-preview'}`}>
              <div className="receipt-header-print">
                <div className="store-brand">SMARTSTOCK RETAIL</div>
                <div className="store-sub">GST REGISTERED ENTERPRISE</div>
                <div className="invoice-badge font-mono">TAX INVOICE: {lastBill.billNumber}</div>
                <div className="receipt-meta font-mono">
                  <span>Date: {lastBill.billDate}</span>
                  <span>Customer: {lastBill.customerName}</span>
                </div>
                {lastBill.customerPhone && (
                  <div className="receipt-meta font-mono">
                    <span>Phone: {lastBill.customerPhone}</span>
                  </div>
                )}
              </div>

              <div className="receipt-divider-dashed" />

              <div className="receipt-items-print">
                <div className="items-header font-mono">
                  <span>ITEM</span>
                  <span>QTY</span>
                  <span>RATE</span>
                  <span>TOTAL</span>
                </div>
                {lastBill.items.map((item, idx) => (
                  <div key={idx} className="item-row font-mono">
                    <span className="item-name">{item.productName}</span>
                    <span>{item.quantity}</span>
                    <span>₹{item.price}</span>
                    <span className="item-sub">₹{item.subtotal}</span>
                  </div>
                ))}
              </div>

              <div className="receipt-divider-dashed" />

              <div className="receipt-totals font-mono">
                <div className="tot-row">
                  <span>Subtotal:</span>
                  <span>₹{lastBill.subtotal || lastBill.totalAmount}</span>
                </div>
                {lastBill.taxTotal > 0 && (
                  <div className="tot-row">
                    <span>Tax (GST/VAT):</span>
                    <span>₹{lastBill.taxTotal}</span>
                  </div>
                )}
                {lastBill.discountTotal > 0 && (
                  <div className="tot-row text-emerald">
                    <span>Discount:</span>
                    <span>-₹{lastBill.discountTotal}</span>
                  </div>
                )}
                <div className="tot-row grand font-bold">
                  <span>TOTAL PAID ({lastBill.paymentMethod?.toUpperCase()}):</span>
                  <span>₹{lastBill.totalAmount}</span>
                </div>
              </div>

              {lastBill.loyaltyPointsEarned > 0 && (
                <div className="loyalty-notice font-mono">
                  ✨ Loyalty Points Earned: +{lastBill.loyaltyPointsEarned} pts
                </div>
              )}

              <div className="receipt-footer-print">
                <p>Thank you for shopping with us!</p>
                <p className="font-mono text-muted">Powered by SmartStock Enterprise</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="receipt-modal-actions">
              <Btn variant="primary" style={{ flex: 1 }} onClick={() => window.print()}>
                <Printer size={16} /> Print Receipt
              </Btn>
              <Btn variant="default" onClick={() => setShowReceiptModal(false)}>
                Close
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
