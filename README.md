# ⚡ SmartStock Enterprise: Cloud Inventory, POS & Business Analytics

> **Enterprise-Grade Multi-Tenant Retail & Warehouse Management System with ACID Concurrency Safety, P&L Analytics, Real-Time Hardware Barcode Scanning, and Automated Demand Forecasting.**

[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express.js-4.18-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Swagger](https://img.shields.io/badge/OpenAPI-3.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](http://localhost:5000/api/docs)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## 🎯 Executive Overview & Consultancy Scope

**SmartStock Enterprise** is engineered as a high-throughput, low-latency Point-of-Sale (POS) and Enterprise Resource Planning (ERP) platform designed for retail chains, supermarkets, and multi-branch pharmacies.

### 🌟 Key Architectural Innovations
1. **Bulletproof Concurrency Safety**: Solves checkout race conditions via atomic conditional MongoDB operators (`$inc` guarded with `{ stock: { $gte: quantity } }`) and multi-document rollback mechanisms.
2. **Profit & Loss (P&L) Intelligence**: Real-time Cost of Goods Sold (COGS), Gross Profit, and Margin % calculations alongside tax and discounts.
3. **ABC Pareto Inventory Matrix**: Automatically segments catalog into Class A (top 70% revenue), Class B (20%), and Class C (tail items) for optimized capital allocation.
4. **Hardware & Camera Barcode Scanner Integration**: Auto-detects USB barcode gun scan bursts (<40ms cadence) with zero latency.
5. **Customer CRM & Loyalty Ledger (Khata)**: Tracks lifetime spend, automated point accrual (1 pt / ₹100), and store credit balances.
6. **Dual Format Invoicing**: 80mm ESC/POS Thermal Receipt preview + A4 Official Tax Invoice with GST breakdown.
7. **Interactive OpenAPI 3.0 Documentation**: Live Swagger explorer accessible at `/api/docs`.
8. **Compliance & Audit Logging**: Immutable chronological ledger of every mutation, stock change, price revision, and cashier login.

---

## 📐 System Architecture

```
                                  +-----------------------+
                                  |   Web & POS Clients   |
                                  |  (React 18 / Lucide)  |
                                  +-----------+-----------+
                                              |
                                     HTTPS / REST JSON
                                              |
                                  +-----------v-----------+
                                  |  Express API Gateway  |
                                  |  (Helmet / RateLimit) |
                                  +-----------+-----------+
                                              |
                     +------------------------+------------------------+
                     |                        |                        |
         +-----------v-----------+  +---------v---------+  +-----------v-----------+
         |   POS / Atomic Sale   |  |   P&L & Analytics |  |  Compliance & Audit   |
         | (Conditional Lockless)|  |  (ABC Pareto Matrix)| |     (Audit Logs)      |
         +-----------+-----------+  +---------+---------+  +-----------+-----------+
                     |                        |                        |
                     +------------------------+------------------------+
                                              |
                                  +-----------v-----------+
                                  |    MongoDB Database   |
                                  | (Compound Index Tier) |
                                  +-----------------------+
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) running locally or MongoDB Atlas URI

### 2. Backend Setup
```bash
cd smart-inventory-backend
npm install
npm run seed     # Populate realistic enterprise catalogue and sample data
npm run dev      # Server starts on http://localhost:5000
```
> 📚 **API Docs**: Open [http://localhost:5000/api/docs](http://localhost:5000/api/docs) to explore all endpoints interactively.

### 3. Frontend Setup
```bash
cd smart-inventory-frontend
npm install
npm start        # Client starts on http://localhost:3000
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Super Admin** | `admin@smartstock.com` | `password123` | Global Platform & Tenant Control |
| **Shop Owner** | `owner@retailhub.com` | `password123` | Complete Inventory, P&L, Staff & POS |
| **Cashier / Staff** | `cashier@retailhub.com` | `password123` | POS Terminal, Search & Invoicing |

---

## 🧪 Automated Testing

Execute the automated integration & concurrency test suite:
```bash
cd smart-inventory-backend
npm test
```

---

## 💡 Placement & Interview Discussion Points
- **Why atomic updates over distributed locks?** Atomic conditional updates in MongoDB eliminate lock contention and deadlocks, providing high throughput during simultaneous cash counter checkouts.
- **How is P&L calculated without performance degradation?** Each invoice records item cost prices at the moment of sale, ensuring accurate historical margin tracking even if supplier cost prices fluctuate later.
- **How is data integrity maintained across multi-item bills?** If a 5-item cart fails on item 4 due to a concurrent stockout, the system executes an automated rollback to replenish items 1 through 3 before returning a structured error.
