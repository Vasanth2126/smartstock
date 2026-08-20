# Admin Panel — Installation Guide

Follow these steps to add the Admin Panel to your existing SmartStock project.

---

## Step 1 — Backend files

Copy these files into your backend folder:

| Source file (from this zip)              | Destination |
|------------------------------------------|-------------|
| `backend-additions/User.js`              | `smart-inventory-backend/models/User.js` *(replace)* |
| `backend-additions/authController.js`    | `smart-inventory-backend/controllers/authController.js` *(replace)* |
| `backend-additions/adminController.js`   | `smart-inventory-backend/controllers/adminController.js` *(new file)* |
| `backend-additions/admin.js`             | `smart-inventory-backend/routes/admin.js` *(new file)* |
| `backend-additions/server.js`            | `smart-inventory-backend/server.js` *(replace)* |
| `backend-additions/seed.js`              | `smart-inventory-backend/seed.js` *(replace)* |

Then restart the backend:
```bash
cd smart-inventory-backend
npm run dev
```

Re-seed the database to get all test accounts:
```bash
npm run seed
```

---

## Step 2 — Frontend files

Copy these files into your frontend folder:

| Source file (from this zip)                    | Destination |
|------------------------------------------------|-------------|
| `frontend-additions/SuperAdmin.jsx`            | `smart-inventory-frontend/src/pages/SuperAdmin.jsx` *(new)* |
| `frontend-additions/SuperAdmin.css`            | `smart-inventory-frontend/src/pages/SuperAdmin.css` *(new)* |
| `frontend-additions/StaffManagement.jsx`       | `smart-inventory-frontend/src/pages/StaffManagement.jsx` *(new)* |
| `frontend-additions/Layout.jsx`                | `smart-inventory-frontend/src/components/layout/Layout.jsx` *(replace)* |
| `frontend-additions/App.jsx`                   | `smart-inventory-frontend/src/App.jsx` *(replace)* |

React will hot-reload automatically — no restart needed.

---

## Step 3 — Test

### Super Admin login
```
Email:    admin@smartstock.com
Password: admin123
```
→ You'll see **⚡ Admin Panel** in the sidebar
→ Go to Admin Panel → see all shops, all users, platform stats
→ Click any shop → see its bills, staff, products

### Shop Owner login
```
Email:    ramesh@shop.com
Password: password123
```
→ You'll see **👥 Staff** in the sidebar
→ Go to Staff → add a staff member
→ Staff member can log in and use POS, Products, Alerts

### Staff login
```
Email:    suresh@shop.com
Password: staff123
```
→ Sidebar shows only: Dashboard, Billing, Products, Alerts
→ Cannot access Suppliers, Reports, Staff, Admin Panel

---

## Role permissions table

| Feature         | Staff | Owner | Super Admin |
|-----------------|-------|-------|-------------|
| Dashboard       | ✅    | ✅    | ✅          |
| Billing (POS)   | ✅    | ✅    | ✅          |
| Products        | ✅    | ✅    | ✅          |
| Alerts          | ✅    | ✅    | ✅          |
| Suppliers       | ❌    | ✅    | ✅          |
| Reports         | ❌    | ✅    | ✅          |
| Staff Mgmt      | ❌    | ✅    | ✅          |
| Admin Panel     | ❌    | ❌    | ✅          |
| Block users     | ❌    | ❌    | ✅          |
| View all shops  | ❌    | ❌    | ✅          |
