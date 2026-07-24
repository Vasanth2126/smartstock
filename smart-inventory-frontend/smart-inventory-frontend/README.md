# SmartStock — React Frontend

React web app for the Smart Inventory Management System.

## Setup

```bash
cd smart-inventory-frontend
npm install
npm start          # runs on http://localhost:3000
```

Make sure the backend is running on `http://localhost:5000` first.

## Environment (optional)

Create a `.env` file if your backend is on a different URL:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Today's sales, stock alerts, top products chart |
| `/pos` | Billing (POS) | Create bills, auto stock deduction |
| `/products` | Products | Add/edit/delete products, barcode, supplier link |
| `/suppliers` | Suppliers | Manage vendor contacts |
| `/alerts` | Alerts | Low stock and out-of-stock items |
| `/reports` | Reports | Sales charts, date range filter, top products |
| `/login` | Login | JWT auth |
| `/register` | Register | New shop owner signup |

## Tech stack

- React 18 + React Router v6
- Axios (API calls with JWT injection)
- Recharts (bar + line charts)
- react-hot-toast (notifications)
- CSS variables design system (dark theme)

## Demo login (after seeding backend)

```
Email:    ramesh@shop.com
Password: password123
```
