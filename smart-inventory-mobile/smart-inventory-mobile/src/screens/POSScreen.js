import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  FlatList, Alert, StyleSheet, Modal, Dimensions
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Btn, Spinner, Empty, Badge, ConfettiBurst, PillTabs } from '../components/UI';
import { colors, spacing, radius, font, shadows } from '../utils/theme';
import api from '../services/api';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function POSScreen() {
  const [products, setProducts]       = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [cart, setCart]               = useState({});   // { productId: quantity }
  const [search, setSearch]           = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [customerName, setCustomerName]= useState('');
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [payMethod, setPayMethod]     = useState('cash');
  const [scanOpen, setScanOpen]       = useState(false);
  const [lastBill, setLastBill]       = useState(null);
  const [receiptModal, setReceiptModal] = useState(false);
  const [scanned, setScanned]         = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/products');
      const list = data.products || [];
      setProducts(list);
      setFiltered(list);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load POS catalogue' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filterProducts = (q, cat) => {
    let result = products;
    if (cat !== 'All') {
      result = result.filter(p => p.category === cat);
    }
    if (q) {
      const lower = q.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lower) || (p.barcode || '').includes(q));
    }
    setFiltered(result);
  };

  const handleSearch = (q) => {
    setSearch(q);
    filterProducts(q, selectedCat);
  };

  const handleCategorySelect = (cat) => {
    setSelectedCat(cat);
    filterProducts(search, cat);
  };

  const addToCart = (product) => {
    if (product.stock === 0) {
      Toast.show({ type: 'error', text1: 'Product is out of stock' });
      return;
    }
    const cur = cart[product._id] || 0;
    if (cur >= product.stock) {
      Toast.show({ type: 'error', text1: `Only ${product.stock} units available in stock` });
      return;
    }
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
    } else if (product && next > product.stock) {
      Toast.show({ type: 'error', text1: `Stock limit reached (${product.stock} available)` });
    } else {
      setCart(c => ({ ...c, [productId]: next }));
    }
  };

  const handleBarcode = async ({ data: barcode }) => {
    if (scanned) return;
    setScanned(true);
    setScanOpen(false);
    try {
      const { data } = await api.get(`/products/barcode/${barcode}`);
      addToCart(data.product);
      Toast.show({ type: 'success', text1: `Scanned: ${data.product.name}` });
    } catch {
      Toast.show({ type: 'error', text1: 'Product barcode not found in catalog' });
    }
    setTimeout(() => setScanned(false), 2000);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Camera Permission', 'Camera access is required for scanning product barcodes.');
        return;
      }
    }
    setScanned(false);
    setScanOpen(true);
  };

  const cartItems = Object.entries(cart).map(([id, qty]) => ({
    product: products.find(p => p._id === id),
    qty,
  })).filter(i => i.product);

  const total = cartItems.reduce((s, { product, qty }) => s + product.price * qty, 0);

  const saveBill = async () => {
    if (cartItems.length === 0) {
      Toast.show({ type: 'error', text1: 'Add items to cart before completing sale' });
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/bills', {
        items: cartItems.map(({ product, qty }) => ({
          productId: product._id,
          quantity: qty,
        })),
        paymentMethod: payMethod,
        customerName: customerName.trim() || undefined,
      });

      setLastBill(data.bill);
      setReceiptModal(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);

      setCart({});
      setCustomerName('');
      await loadProducts();
      Toast.show({ type: 'success', text1: `Sale ${data.bill.billNumber} complete!`, text2: 'Inventory deducted' });
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Checkout failed' });
    } finally {
      setSaving(false);
    }
  };

  const printPdfReceipt = async () => {
    if (!lastBill) return;
    const htmlContent = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #111; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #6366f1; padding-bottom: 14px; }
            .title { font-size: 22px; font-weight: 800; color: #6366f1; letter-spacing: 1px; }
            .sub { font-size: 11px; color: #666; margin-top: 4px; }
            .details { margin: 16px 0; font-size: 12px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { text-align: left; background: #f3f4f6; padding: 8px; font-size: 11px; text-transform: uppercase; }
            td { padding: 8px; border-bottom: 1px solid #eee; font-size: 12px; }
            .total-row { font-size: 16px; font-weight: bold; text-align: right; padding-top: 16px; }
            .footer { text-align: center; font-size: 11px; color: #888; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">SMARTSTOCK POS</div>
            <div class="sub">Official Digital Tax Receipt</div>
          </div>
          <div class="details">
            <div><strong>Bill Number:</strong> ${lastBill.billNumber}</div>
            <div><strong>Date & Time:</strong> ${lastBill.billDate || new Date().toLocaleString('en-IN')}</div>
            ${lastBill.customerName ? `<div><strong>Customer:</strong> ${lastBill.customerName}</div>` : ''}
            <div><strong>Payment Mode:</strong> ${lastBill.paymentMethod.toUpperCase()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th style="text-align:right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${lastBill.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.price}</td>
                  <td style="text-align:right">₹${item.subtotal}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-row">
            Grand Total: ₹${lastBill.totalAmount.toLocaleString('en-IN')}
          </div>
          <div class="footer">
            Thank you for shopping with us!<br/>Powered by SmartStock Cloud
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch {
      Alert.alert('PDF Generation', 'Unable to generate receipt PDF');
    }
  };

  const PAY_METHODS = [
    { key: 'cash',   label: '💵 Cash' },
    { key: 'upi',    label: '📱 UPI' },
    { key: 'card',   label: '💳 Card' },
    { key: 'credit', label: '📝 Credit' },
  ];

  if (loading) return <Spinner />;

  return (
    <View style={s.screen}>
      <ConfettiBurst active={showConfetti} />

      {/* Barcode Scanner Modal */}
      <Modal visible={scanOpen} animationType="slide" onRequestClose={() => setScanOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
          {permission?.granted && (
            <CameraView
              style={{ flex: 1 }}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'upc_a', 'qr'] }}
              onBarcodeScanned={scanned ? undefined : handleBarcode}
            />
          )}
          <TouchableOpacity style={s.scanClose} onPress={() => setScanOpen(false)}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: font.bold }}>✕ Cancel Barcode Scanner</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Main Dual-Panel POS View */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Left Catalog Panel */}
        <View style={s.catalogPanel}>
          {/* Search + Barcode Button */}
          <View style={s.searchRow}>
            <TextInput
              style={s.searchInput}
              placeholder="Search items or barcode…"
              placeholderTextColor={colors.text3}
              value={search}
              onChangeText={handleSearch}
            />
            <TouchableOpacity style={s.scanBtn} onPress={openScanner} activeOpacity={0.8}>
              <Text style={{ fontSize: 18 }}>📷</Text>
            </TouchableOpacity>
          </View>

          {/* Category Filter Carousel */}
          <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 4 }}>
            <PillTabs
              tabs={categories}
              activeTab={selectedCat}
              onSelect={handleCategorySelect}
            />
          </View>

          {/* Products Grid */}
          <FlatList
            data={filtered}
            keyExtractor={p => p._id}
            numColumns={2}
            columnWrapperStyle={{ gap: spacing.xs }}
            contentContainerStyle={{ padding: spacing.xs, gap: spacing.xs, paddingBottom: 20 }}
            ListEmptyComponent={<Empty icon="📦" title="No Items Found" sub="Try another search keyword" />}
            renderItem={({ item: p }) => {
              const inCartQty = cart[p._id] || 0;
              const isOut = p.stock === 0;

              return (
                <TouchableOpacity
                  style={[
                    s.prodCard,
                    isOut && s.prodOut,
                    inCartQty > 0 && s.prodInCart,
                  ]}
                  onPress={() => addToCart(p)}
                  disabled={isOut}
                  activeOpacity={0.75}
                >
                  <Text style={s.prodCat} numberOfLines={1}>{p.category || 'General'}</Text>
                  <Text style={s.prodName} numberOfLines={2}>{p.name}</Text>
                  <Text style={s.prodPrice}>₹{p.price}</Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={[
                      s.prodStock,
                      isOut && { color: colors.redLight },
                      p.stock > 0 && p.stock <= p.lowStockThreshold && { color: colors.amberLight },
                    ]}>
                      {isOut ? 'Depleted' : `${p.stock} ${p.unit || 'pcs'}`}
                    </Text>
                  </View>

                  {inCartQty > 0 && (
                    <View style={s.cartBadge}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: font.heavy }}>
                        {inCartQty}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Right Active Checkout Drawer */}
        <View style={s.cartPanel}>
          <View style={s.cartHeader}>
            <Text style={s.cartTitle}>Active Cart</Text>
            {cartItems.length > 0 && (
              <TouchableOpacity onPress={() => setCart({})}>
                <Text style={{ color: colors.redLight, fontSize: 11, fontWeight: font.bold }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Customer Name Input */}
          <TextInput
            style={s.customerInput}
            placeholder="Customer (Optional)"
            placeholderTextColor={colors.text3}
            value={customerName}
            onChangeText={setCustomerName}
          />

          {/* Itemized List */}
          <ScrollView style={{ flex: 1 }}>
            {cartItems.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 24, marginBottom: 8 }}>🛒</Text>
                <Text style={{ color: colors.text3, fontSize: 11, textAlign: 'center' }}>Tap products on the left to add items</Text>
              </View>
            ) : (
              cartItems.map(({ product, qty }) => (
                <View key={product._id} style={s.cartItem}>
                  <View style={{ flex: 1, marginRight: 4 }}>
                    <Text style={s.cartItemName} numberOfLines={1}>{product.name}</Text>
                    <Text style={s.cartItemPrice}>₹{product.price} × {qty}</Text>
                  </View>

                  <View style={s.stepperRow}>
                    <TouchableOpacity style={s.stepBtn} onPress={() => changeQty(product._id, -1)}>
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: font.bold }}>−</Text>
                    </TouchableOpacity>
                    <Text style={s.stepNum}>{qty}</Text>
                    <TouchableOpacity style={s.stepBtn} onPress={() => changeQty(product._id, 1)}>
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: font.bold }}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={s.cartSubtotal}>₹{product.price * qty}</Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Payment Method Selector */}
          <View style={s.payGrid}>
            {PAY_METHODS.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[s.payTile, payMethod === m.key && s.payTileActive]}
                onPress={() => setPayMethod(m.key)}
              >
                <Text style={[s.payLabel, payMethod === m.key && s.payLabelActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bill Summary */}
          <View style={s.totalBox}>
            <Text style={{ color: colors.text2, fontSize: 12 }}>Total Payable</Text>
            <Text style={s.totalAmt}>₹{total.toLocaleString('en-IN')}</Text>
          </View>

          <Btn
            title={saving ? 'Processing…' : '✓ Complete Sale'}
            variant="success"
            size="lg"
            loading={saving}
            onPress={saveBill}
          />
        </View>
      </View>

      {/* Digital Thermal Receipt Modal */}
      <Modal visible={receiptModal} animationType="slide" onRequestClose={() => setReceiptModal(false)}>
        <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.md, justifyContent: 'center' }}>
          {lastBill && (
            <View style={s.receiptBox}>
              <View style={s.receiptPrintArea}>
                <Text style={s.receiptHeaderTitle}>SMARTSTOCK POS</Text>
                <Text style={s.receiptSub}>TAX INVOICE / CASH MEMO</Text>
                <View style={s.dividerDashed} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 }}>
                  <Text style={s.receiptMeta}>Bill #: {lastBill.billNumber}</Text>
                  <Text style={s.receiptMeta}>Mode: {lastBill.paymentMethod.toUpperCase()}</Text>
                </View>
                <Text style={s.receiptMeta}>Date: {lastBill.billDate || new Date().toLocaleDateString('en-IN')}</Text>
                {lastBill.customerName && <Text style={s.receiptMeta}>Customer: {lastBill.customerName}</Text>}
                
                <View style={s.dividerDashed} />

                {lastBill.items.map((item, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 }}>
                    <Text style={s.receiptItemText}>{item.productName} × {item.quantity}</Text>
                    <Text style={s.receiptItemAmt}>₹{item.subtotal}</Text>
                  </View>
                ))}

                <View style={s.dividerDashed} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={s.receiptTotalLabel}>TOTAL PAID</Text>
                  <Text style={s.receiptTotalAmt}>₹{lastBill.totalAmount.toLocaleString('en-IN')}</Text>
                </View>

                <Text style={s.receiptFooterText}>Thank you for your purchase!</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
                <Btn title="📄 Share PDF Receipt" variant="primary" onPress={printPdfReceipt} style={{ flex: 1 }} />
                <Btn title="Done" variant="ghost" onPress={() => setReceiptModal(false)} style={{ flex: 1 }} />
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: colors.bg },
  catalogPanel:  { flex: 1, borderRightWidth: 1, borderColor: colors.border },
  searchRow:     { flexDirection: 'row', gap: spacing.xs, padding: spacing.xs, borderBottomWidth: 1, borderColor: colors.border },
  searchInput:   { flex: 1, backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border2, borderRadius: radius.md, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: 8, fontSize: 12 },
  scanBtn:       { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg3, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border2 },
  
  prodCard:      { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, position: 'relative', minHeight: 96, ...shadows.card },
  prodOut:       { opacity: 0.38 },
  prodInCart:    { borderColor: colors.accentLight, backgroundColor: 'rgba(99, 102, 241, 0.12)' },
  prodCat:       { color: colors.text3, fontSize: 9, fontWeight: font.bold, textTransform: 'uppercase' },
  prodName:      { color: colors.text, fontSize: 12, fontWeight: font.bold, marginTop: 2, marginBottom: 4 },
  prodPrice:     { color: colors.greenLight, fontSize: 14, fontWeight: font.heavy, fontFamily: 'monospace' },
  prodStock:     { color: colors.text2, fontSize: 10 },
  cartBadge:     { position: 'absolute', top: -5, right: -5, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg },

  cartPanel:     { width: SCREEN_WIDTH * 0.44, maxWidth: 240, padding: spacing.sm, backgroundColor: colors.bgCard, borderLeftWidth: 1, borderColor: colors.border },
  cartHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cartTitle:     { fontSize: 14, fontWeight: font.heavy, color: colors.text },
  customerInput: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, color: colors.text, paddingHorizontal: spacing.sm, paddingVertical: 6, fontSize: 11, marginBottom: 8 },

  cartItem:      { borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 6 },
  cartItemName:  { color: colors.text, fontSize: 11, fontWeight: font.semibold },
  cartItemPrice: { color: colors.text2, fontSize: 10, marginTop: 1 },
  stepperRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  stepBtn:       { width: 22, height: 22, borderRadius: 4, backgroundColor: colors.bg3, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border2 },
  stepNum:       { color: colors.text, fontSize: 12, fontWeight: font.bold, minWidth: 16, textAlign: 'center', fontFamily: 'monospace' },
  cartSubtotal:  { color: colors.greenLight, fontSize: 11, fontWeight: font.bold, fontFamily: 'monospace', alignSelf: 'flex-end', marginTop: -18 },

  payGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginVertical: 8 },
  payTile:       { flex: 1, minWidth: '46%', paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.bg2 },
  payTileActive: { borderColor: colors.accentLight, backgroundColor: colors.accentBg },
  payLabel:      { fontSize: 10, color: colors.text2, fontWeight: font.bold },
  payLabelActive:{ color: colors.accentLight },

  totalBox:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.sm, backgroundColor: colors.bg2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  totalAmt:      { color: colors.greenLight, fontSize: 16, fontWeight: font.heavy, fontFamily: 'monospace' },

  scanClose:     { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.85)', paddingVertical: 12, paddingHorizontal: 24, borderRadius: radius.full, borderWidth: 1, borderColor: '#fff' },

  receiptBox:    { backgroundColor: colors.bgCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderGlow, padding: spacing.lg, ...shadows.card },
  receiptPrintArea: { backgroundColor: '#ffffff', borderRadius: radius.md, padding: spacing.md },
  receiptHeaderTitle: { textAlign: 'center', fontSize: 18, fontWeight: font.heavy, color: '#111' },
  receiptSub:    { textAlign: 'center', fontSize: 10, color: '#666', marginTop: 2 },
  dividerDashed: { borderBottomWidth: 1, borderColor: '#ccc', borderStyle: 'dashed', marginVertical: 8 },
  receiptMeta:   { fontSize: 11, color: '#444' },
  receiptItemText:{ fontSize: 12, color: '#111', fontWeight: font.medium },
  receiptItemAmt: { fontSize: 12, color: '#111', fontWeight: font.bold, fontFamily: 'monospace' },
  receiptTotalLabel:{ fontSize: 14, fontWeight: font.heavy, color: '#111' },
  receiptTotalAmt:{ fontSize: 16, fontWeight: font.heavy, color: '#111', fontFamily: 'monospace' },
  receiptFooterText:{ textAlign: 'center', fontSize: 10, color: '#888', marginTop: 14 },
});