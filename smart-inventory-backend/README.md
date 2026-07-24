# Smart Inventory Management System — Backend API

Node.js + Express + MongoDB backend for the Smart Inventory app.

---

## Setup

```bash
cd smart-inventory-backend
npm install
cp .env.example .env        # fill in your MONGO_URI and JWT_SECRET
npm run seed                 # optional: load sample data
npm run dev                  # starts server with nodemon on port 5000
```

---

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register shop owner |
| POST | `/api/auth/login` | Login → returns JWT token |
| GET | `/api/auth/me` | Get current user |

**Register body:**
```json
{ "name": "Ramesh Kumar", "email": "r@shop.com", "password": "pass123", "shopName": "Ramesh Store" }
```

**Login body:**
```json
{ "email": "r@shop.com", "password": "pass123" }
```

All other routes require `Authorization: Bearer <token>` header.

---

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products?search=bread` | Search by name or barcode |
| GET | `/api/products?status=low_stock` | Filter by stock status |
| GET | `/api/products/low-stock` | All low/out-of-stock items |
| GET | `/api/products/barcode/:barcode` | Look up by barcode |
| POST | `/api/products` | Add a product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Soft delete |

**Create product body:**
```json
{
  "name": "Bread",
  "price": 30,
  "stock": 50,
  "lowStockThreshold": 10,
  "barcode": "100001",
  "category": "Bakery",
  "unit": "pcs",
  "supplier": "<supplier_id>"
}
```

---

### Bills (POS)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bills` | Create bill (auto-deducts stock) |
| GET | `/api/bills/today` | Today's bills + total sales |
| GET | `/api/bills` | All bills (with date filters) |
| GET | `/api/bills?date=2024-07-01` | Bills for a specific date |
| GET | `/api/bills?from=2024-07-01&to=2024-07-31` | Date range |
| GET | `/api/bills/:id` | Single bill |

**Create bill body:**
```json
{
  "items": [
    { "productId": "<id>", "quantity": 2 },
    { "productId": "<id>", "quantity": 1 }
  ],
  "paymentMethod": "cash",
  "customerName": "optional"
}
```

> Stock is deducted automatically inside a MongoDB transaction.
> If bread stock is 10 and you bill qty 2, it becomes 8.

---

### Suppliers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/suppliers` | List all suppliers |
| GET | `/api/suppliers/:id` | Supplier + linked products |
| POST | `/api/suppliers` | Add supplier |
| PUT | `/api/suppliers/:id` | Update supplier |
| DELETE | `/api/suppliers/:id` | Delete (unlinks from products) |

---

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/dashboard` | Today's summary + stock alerts |
| GET | `/api/reports/sales?from=&to=` | Sales report for date range |

**Dashboard response includes:**
- Today's total sales, bill count, avg bill value
- Low stock items, out-of-stock items
- Top 5 selling products today

---

## Project Structure

```
smart-inventory-backend/
├── server.js               # Express app + route mounting
├── seed.js                 # Sample data loader
├── .env.example
├── config/
│   └── db.js               # MongoDB connection
├── middleware/
│   └── auth.js             # JWT protect + restrictTo
├── models/
│   ├── User.js             # Shop owner account
│   ├── Product.js          # Inventory item (with stockStatus virtual)
│   ├── Bill.js             # Sale record + line items
│   └── Supplier.js         # Vendor contact
├── controllers/
│   ├── authController.js
│   ├── productController.js
│   ├── billController.js   # ← stock deduction logic lives here
│   ├── supplierController.js
│   └── reportController.js
└── routes/
    ├── auth.js
    ├── products.js
    ├── bills.js
    ├── suppliers.js
    └── reports.js
```

---

## Key Business Logic

**Auto stock deduction on bill save** (`billController.js`):
- Runs inside a MongoDB transaction (session)
- For each item in the bill: checks stock, deducts quantity, saves product
- If any item has insufficient stock → entire transaction rolls back
- Prevents overselling even with concurrent requests

**Today's sales** (`GET /api/bills/today`):
- Bills stored with a `billDate` field (`"YYYY-MM-DD"`)
- Query filters by today's date string (fast index scan)
- Returns total sales, bill count, and all bill details

---

## Sample Login (after seed)

```
Email:    ramesh@shop.com
Password: password123
```
