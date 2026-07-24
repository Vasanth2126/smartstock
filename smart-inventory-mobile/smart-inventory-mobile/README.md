# SmartStock — React Native Mobile App (Expo)

Mobile app for Android & iOS using Expo.

---

## Setup

```bash
cd smart-inventory-mobile
npm install
```

### Configure your backend IP

Open `src/services/api.js` and set the correct URL:

| Situation | URL to use |
|-----------|-----------|
| Android Emulator | `http://10.0.2.2:5000/api` |
| iOS Simulator | `http://localhost:5000/api` |
| Real phone (same WiFi) | `http://YOUR_PC_IP:5000/api` e.g. `http://192.168.1.5:5000/api` |

Find your PC IP: run `ipconfig` on Windows, look for IPv4 Address.

---

## Run

```bash
# Start Expo
npm start

# Then press:
# a → Android emulator
# i → iOS simulator
# w → Web browser
# Scan QR code → Expo Go app on your phone
```

---

## Install Expo Go on your phone

Download **Expo Go** from Play Store / App Store, then scan the QR code shown in terminal.

---

## Features

- **Dashboard** — today's sales, stock alerts, bills summary, pull-to-refresh
- **Billing (POS)** — tap products to add, +/− qty, barcode scanner (camera), save bill → auto stock deduction
- **Products** — list, search, add/edit/delete, stock status badges
- **Alerts** — low stock and out-of-stock with reorder info
- **Suppliers** — add/edit/delete vendor contacts
- **Reports** — 7-day revenue, top products, daily breakdown

---

## Barcode Scanner

The POS screen has a 📷 button. Tap it → camera opens → scan any barcode → product is automatically added to the bill. Supports EAN-13, EAN-8, Code128, QR.

---

## Demo login

```
Email:    ramesh@shop.com
Password: password123
```

(Run `npm run seed` in the backend folder first)

---

## Project structure

```
smart-inventory-mobile/
├── App.js
├── app.json              # Expo config
├── src/
│   ├── context/
│   │   └── AuthContext.js
│   ├── services/
│   │   └── api.js        # ← set your backend URL here
│   ├── utils/
│   │   └── theme.js      # colors, spacing, typography
│   ├── components/
│   │   └── UI.js         # Btn, Card, Badge, Input, Modal, etc.
│   ├── navigation/
│   │   └── AppNavigator.js
│   └── screens/
│       ├── LoginScreen.js
│       ├── RegisterScreen.js
│       ├── DashboardScreen.js
│       ├── POSScreen.js        # ← barcode scanner here
│       ├── ProductsScreen.js
│       └── OtherScreens.js     # Alerts, Suppliers, Reports
```
