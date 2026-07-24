import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  FlatList, Alert, StyleSheet, Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Btn, Badge, Spinner, Empty } from '../components/UI';
import { colors, spacing, radius, font } from '../utils/theme';
import api from '../services/api';
import Toast from 'react-native-toast-message';

export default function POSScreen() {
  const [products, setProducts]     = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [cart, setCart]             = useState({});
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [payMethod, setPayMethod]   = useState('cash');
  const [scanOpen, setScanOpen]     = useState(false);
  const [lastBill, setLastBill]     = useState(null);
  const [permission, requestPermission] = useCameraPermissions();

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products);
      setFiltered(data.products);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const handleSearch = (q) => {
    setSearch(q);
    const lower = q.toLowerCase();
    setFiltered(products.filter(p =>
      p.name.toLowerCase().includes(lower) || (p.barcode || '').includes(q)
    ));
  };

  const addToCart = (product) => {
    if (product.stock === 0) { Toast.show({ type: 'error', text1: 'Out of stock' }); return; }
    const cur = cart[product._id] || 0;
    if (cur >= product.stock) { Toast.show({ type: 'error', text1: `Only ${product.stock} in stock` }); return; }
    setCart(c => ({ ...c, [product._id]: cur + 1 }));
  };

  const changeQty = (productId, delta) => {
    const product = products.find(p => p._id === productId);
    const next = (cart[productId] || 0) + delta;
    if (next <= 0) {
      const updated = { ...cart }; delete updated[productId]; setCart(updated);
    } else if (next > product.stock) {
      Toast.show({ type: 'error', text1: `Max: ${product.stock}` });
    } else {
      setCart(c => ({ ...c, [productId]: next }));
    }
  };

  const handleBarcode = async ({ data: barcode }) => {
    setScanOpen(false);
    try {
      const { data } = await api.get(`/products/barcode/${barcode}`);
      addToCart(data.product);
      Toast.show({ type: 'success', text1: `Added: ${data.product.name}` });
    } catch {
      Toast.show({ type: 'error', text1: 'Product not found for this barcode' });
    }
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) { Alert.alert('Permission needed', 'Camera permission required for barcode scanning'); return; }
    }
    setScanOpen(true);
  };

  const cartItems = Object.entries(cart).map(([id, qty]) => ({
    product: products.find(p => p._id === id), qty,
  })).filter(i => i.product);

  const total = cartItems.reduce((s, { product, qty }) => s + product.price * qty, 0);

  const saveBill = async () => {
    if (cartItems.length === 0) { Toast.show({ type: 'error', text1: 'Add items first' }); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/bills', {
        items: cartItems.map(({ product, qty }) => ({ productId: product._id, quantity: qty })),
        paymentMethod: payMethod,
      });
      setLastBill(data.bill);
      setCart({});
      await loadProducts();
      Toast.show({ type: 'success', text1: `${data.bill.billNumber} saved!`, text2: `Stock updated` });
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const PAY_METHODS = [
    { key: 'cash', label: '💵 Cash' },
    { key: 'upi',  label: '📱 UPI' },
    { key: 'card', label: '💳 Card' },
  ];

  if (loading) return <Spinner />;

  return (
    <View style={s.screen}>
      {/* Scanner modal */}
      <Modal visible={scanOpen} animationType="slide" onRequestClose={() => setScanOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'qr'] }}
            onBarcodeScanned={handleBarcode}
          />
          <TouchableOpacity style={s.scanClose} onPress={() => setScanOpen(false)}>
            <Text style={{ color: '#fff', fontSize: 16 }}>✕ Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Products panel */}
      <View style={s.productsPanel}>
        <View style={s.searchRow}>
          <TextInput
            style={s.searchInput}
            placeholder="Search product…"
            placeholderTextColor={colors.text3}
            value={search}
            onChangeText={handleSearch}
          />
          <TouchableOpacity style={s.scanBtn} onPress={openScanner}>
            <Text style={{ fontSize: 20 }}>📷</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={p => p._id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.sm }}
          contentContainerStyle={{ padding: spacing.sm, gap: spacing.sm }}
          renderItem={({ item: p }) => (
            <TouchableOpacity
              style={[s.prodTile, p.stock === 0 && s.prodOut, cart[p._id] && s.prodInCart]}
              onPress={() => addToCart(p)}
              disabled={p.stock === 0}
              activeOpacity={0.75}
            >
              <Text style={s.prodName} numberOfLines={2}>{p.name}</Text>
              <Text style={s.prodPrice}>₹{p.price}</Text>
              <Text style={[s.prodStock, p.stock === 0 && { color: colors.red }, p.stock > 0 && p.stock <= p.lowStockThreshold && { color: colors.amber }]}>
                {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
              </Text>
              {cart[p._id] > 0 && (
                <View style={s.cartDot}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: font.bold }}>{cart[p._id]}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Empty icon="📦" title="No products" />}
        />
      </View>

      {/* Bill panel */}
      <View style={s.billPanel}>
        <Text style={s.billTitle}>Bill</Text>

        <ScrollView style={{ flex: 1 }}>
          {cartItems.length === 0
            ? <Text style={s.billEmpty}>Tap a product to add</Text>
            : cartItems.map(({ product, qty }) => (
                <View key={product._id} style={s.cartItem}>
                  <Text style={s.cartName} numberOfLines={1}>{product.name}</Text>
                  <View style={s.qtyRow}>
                    <TouchableOpacity style={s.qtyBtn} onPress={() => changeQty(product._id, -1)}>
                      <Text style={{ color: colors.text, fontSize: 16 }}>−</Text>
                    </TouchableOpacity>
                    <Text style={s.qtyNum}>{qty}</Text>
                    <TouchableOpacity style={s.qtyBtn} onPress={() => changeQty(product._id, 1)}>
                      <Text style={{ color: colors.text, fontSize: 16 }}>+</Text>
                    </TouchableOpacity>
                    <Text style={s.cartSub}>₹{product.price * qty}</Text>
                  </View>
                </View>
              ))
          }
        </ScrollView>

        {/* Payment method */}
        <View style={s.payRow}>
          {PAY_METHODS.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[s.payBtn, payMethod === m.key && s.payBtnActive]}
              onPress={() => setPayMethod(m.key)}
            >
              <Text style={{ fontSize: 11, color: payMethod === m.key ? colors.accent : colors.text2 }}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total */}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalAmt}>₹{total.toLocaleString('en-IN')}</Text>
        </View>

        <Btn
          title={saving ? 'Saving…' : '✓ Save Bill'}
          onPress={saveBill}
          variant="success"
          loading={saving}
          size="lg"
        />

        {/* Last bill */}
        {lastBill && (
          <View style={s.receipt}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={{ color: colors.green, fontWeight: font.semibold, fontSize: 13 }}>✅ {lastBill.billNumber}</Text>
              <TouchableOpacity onPress={() => setLastBill(null)}>
                <Text style={{ color: colors.text2 }}>✕</Text>
              </TouchableOpacity>
            </View>
            {lastBill.items.map((i, idx) => (
              <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text2, fontSize: 12 }}>{i.productName} ×{i.quantity}</Text>
                <Text style={{ color: colors.text2, fontSize: 12 }}>₹{i.subtotal}</Text>
              </View>
            ))}
            <Text style={{ color: colors.green, fontWeight: font.bold, textAlign: 'right', marginTop: spacing.sm, fontFamily: 'monospace' }}>
              ₹{lastBill.totalAmount}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: colors.bg, flexDirection: 'row' },
  productsPanel:{ flex: 1, borderRightWidth: 1, borderColor: colors.border },
  searchRow:    { flexDirection: 'row', gap: spacing.sm, padding: spacing.sm, borderBottomWidth: 1, borderColor: colors.border },
  searchInput:  { flex: 1, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border2, borderRadius: radius.sm, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 13 },
  scanBtn:      { width: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg3, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border2 },
  prodTile:     { flex: 1, backgroundColor: colors.bg2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, position: 'relative', minHeight: 90 },
  prodOut:      { opacity: 0.4 },
  prodInCart:   { borderColor: colors.accent, backgroundColor: colors.accentBg },
  prodName:     { color: colors.text, fontSize: 13, fontWeight: font.medium, marginBottom: 4 },
  prodPrice:    { color: colors.green, fontSize: 15, fontWeight: font.bold, fontFamily: 'monospace', marginBottom: 4 },
  prodStock:    { color: colors.text2, fontSize: 11 },
  cartDot:      { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  billPanel:    { width: 180, padding: spacing.md, backgroundColor: colors.bg2, borderLeftWidth: 1, borderColor: colors.border },
  billTitle:    { fontSize: 15, fontWeight: font.semibold, color: colors.text, marginBottom: spacing.md },
  billEmpty:    { color: colors.text3, fontSize: 12, textAlign: 'center', marginTop: spacing.xl },
  cartItem:     { borderBottomWidth: 1, borderColor: colors.border, paddingVertical: spacing.sm },
  cartName:     { color: colors.text, fontSize: 12, fontWeight: font.medium, marginBottom: 4 },
  qtyRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn:       { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: colors.border2, alignItems: 'center', justifyContent: 'center' },
  qtyNum:       { color: colors.text, fontSize: 13, fontWeight: font.semibold, minWidth: 18, textAlign: 'center', fontFamily: 'monospace' },
  cartSub:      { color: colors.green, fontSize: 12, fontFamily: 'monospace', marginLeft: 'auto' },
  payRow:       { flexDirection: 'row', gap: 4, marginTop: spacing.sm, marginBottom: spacing.sm },
  payBtn:       { flex: 1, padding: 5, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  payBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.sm, backgroundColor: colors.bg3, borderRadius: radius.sm, marginBottom: spacing.sm },
  totalLabel:   { color: colors.text2, fontSize: 13 },
  totalAmt:     { color: colors.green, fontSize: 17, fontWeight: font.bold, fontFamily: 'monospace' },
  receipt:      { marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.greenBg, borderRadius: radius.sm, borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)' },
  scanClose:    { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 14, borderRadius: radius.full },
});
