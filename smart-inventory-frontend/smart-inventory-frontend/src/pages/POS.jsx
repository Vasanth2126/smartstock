import React, { useEffect, useState, useRef } from 'react';
import { Btn, Badge, Spinner, Empty } from '../components/ui/UI';
import api from '../services/api';
import toast from 'react-hot-toast';
import './POS.css';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [cart, setCart] = useState({});   // { productId: quantity }
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payMethod, setPayMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [lastBill, setLastBill] = useState(null);
  const searchRef = useRef();

  useEffect(() => {
    api.get('/products').then(({ data }) => {
      setProducts(data.products);
      setFiltered(data.products);
    }).finally(() => setLoading(false));
    searchRef.current?.focus();
  }, []);

  const handleSearch = (q) => {
    setSearch(q);
    const lower = q.toLowerCase();
    setFiltered(
      products.filter(p =>
        p.name.toLowerCase().includes(lower) || p.barcode?.includes(q)
      )
    );
  };

  const addToCart = (product) => {
    if (product.stock === 0) { toast.error('Out of stock'); return; }
    const cur = cart[product._id] || 0;
    if (cur >= product.stock) { toast.error(`Only ${product.stock} in stock`); return; }
    setCart(c => ({ ...c, [product._id]: cur + 1 }));
  };

  const changeQty = (productId, delta) => {
    const product = products.find(p => p._id === productId);
    const cur = cart[productId] || 0;
    const next = cur + delta;
    if (next <= 0) {
      const updated = { ...cart };
      delete updated[productId];
      setCart(updated);
    } else if (next > product.stock) {
      toast.error(`Max stock: ${product.stock}`);
    } else {
      setCart(c => ({ ...c, [productId]: next }));
    }
  };

  const cartItems = Object.entries(cart).map(([id, qty]) => ({
    product: products.find(p => p._id === id),
    qty,
  })).filter(i => i.product);

  const total = cartItems.reduce((s, { product, qty }) => s + product.price * qty, 0);

  const saveBill = async () => {
    if (cartItems.length === 0) { toast.error('Add items to the bill first'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/bills', {
        items: cartItems.map(({ product, qty }) => ({ productId: product._id, quantity: qty })),
        paymentMethod: payMethod,
        customerName,
      });
      setLastBill(data.bill);
      setCart({});
      setCustomerName('');
      // Refresh products (stock updated)
      const refreshed = await api.get('/products');
      setProducts(refreshed.data.products);
      setFiltered(refreshed.data.products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)
      ));
      toast.success(`Bill ${data.bill.billNumber} saved!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pos-page">
      {/* Products panel */}
      <div className="pos-products">
        <div className="pos-search-bar">
          <input
            ref={searchRef}
            className="pos-search"
            placeholder="🔍  Search product or scan barcode..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
        {loading
          ? <Spinner />
          : filtered.length === 0
            ? <Empty icon="📦" title="No products found" />
            : <div className="prod-grid">
                {filtered.map(p => (
                  <button
                    key={p._id}
                    className={`prod-tile ${p.stock === 0 ? 'prod-out' : ''} ${cart[p._id] ? 'prod-in-cart' : ''}`}
                    onClick={() => addToCart(p)}
                    disabled={p.stock === 0}
                  >
                    <div className="prod-tile-name">{p.name}</div>
                    <div className="prod-tile-price">₹{p.price}</div>
                    <div className="prod-tile-stock">
                      {p.stock === 0
                        ? <span className="out-label">Out</span>
                        : <span className={p.stock <= p.lowStockThreshold ? 'low-label' : ''}>{p.stock} left</span>
                      }
                    </div>
                    {cart[p._id] && <div className="cart-badge">{cart[p._id]}</div>}
                  </button>
                ))}
              </div>
        }
      </div>

      {/* Bill panel */}
      <div className="pos-bill">
        <div className="bill-header">
          <span className="bill-title">Current Bill</span>
          {cartItems.length > 0 && (
            <button className="clear-btn" onClick={() => setCart({})}>Clear</button>
          )}
        </div>

        <div className="bill-items-list">
          {cartItems.length === 0
            ? <div className="bill-empty">Tap a product to add it</div>
            : cartItems.map(({ product, qty }) => (
                <div className="cart-item" key={product._id}>
                  <div className="cart-item-name">{product.name}</div>
                  <div className="cart-item-row">
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => changeQty(product._id, -1)}>−</button>
                      <span className="qty-num">{qty}</span>
                      <button className="qty-btn" onClick={() => changeQty(product._id, 1)}>+</button>
                    </div>
                    <div className="cart-item-sub">₹{product.price * qty}</div>
                  </div>
                </div>
              ))
          }
        </div>

        {cartItems.length > 0 && (
          <>
            <div className="bill-divider" />
            <div className="bill-meta">
              <input
                className="bill-input"
                placeholder="Customer name (optional)"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
              <select className="bill-input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                <option value="cash">💵 Cash</option>
                <option value="upi">📱 UPI</option>
                <option value="card">💳 Card</option>
                <option value="credit">📝 Credit</option>
              </select>
            </div>
            <div className="bill-total-row">
              <span>Total</span>
              <span className="bill-total-amt">₹{total.toLocaleString('en-IN')}</span>
            </div>
            <Btn variant="success" size="lg" style={{ width: '100%' }} loading={saving} onClick={saveBill}>
              ✓ Save Bill & Update Stock
            </Btn>
          </>
        )}

        {/* Last bill receipt */}
        {lastBill && (
          <div className="receipt">
            <div className="receipt-head">
              <span>✅ {lastBill.billNumber}</span>
              <button className="receipt-close" onClick={() => setLastBill(null)}>✕</button>
            </div>
            {lastBill.items.map((i, idx) => (
              <div className="receipt-row" key={idx}>
                <span>{i.productName} ×{i.quantity}</span>
                <span>₹{i.subtotal}</span>
              </div>
            ))}
            <div className="receipt-total">Total: ₹{lastBill.totalAmount}</div>
          </div>
        )}
      </div>
    </div>
  );
}
