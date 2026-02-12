# 🍖 AK47 Shawarma Stop - POS System

A complete Point of Sale (POS) system for fast-food restaurants, built with modern web technologies.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based secure authentication
- Role-based access control (Admin & Staff)
- Password change functionality

### 📊 Dashboard (Admin Only)
- Real-time sales statistics
- Today's orders and revenue
- Daily expense tracking
- Net profit calculation
- Interactive sales charts (Chart.js)
- Best-selling products visualization

### 📦 Product Management (Admin Only)
- Add, edit, delete products
- Category management
- Stock quantity tracking
- Low stock alerts
- Search functionality
- Active/Inactive status

### 🧾 Invoice Module (Staff + Admin)
- Quick product selection
- Cart management
- Quantity adjustments
- Multiple payment methods (Cash, Online Bank)
- Automatic invoice numbering
- Stock deduction on sale
- **Professional thermal receipt printing (80mm)**
- **PDF download capability**

### 💰 Expense Management (Admin Only)
- Track business expenses
- Daily expense recording
- Expense categorization
- Profit calculation integration

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router DOM** - Client-side routing
- **Chart.js & React-Chartjs-2** - Data visualization
- **Zustand** - State management
- **jsPDF & html2canvas** - PDF generation
- **date-fns** - Date formatting

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite3** - Embedded database
- **JSON Web Tokens (JWT)** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## 📁 Project Structure

```
ak47-pos-system/
├── 📂 backend/                 # Node.js/Express Backend
│   ├── 📂 database/
│   │   └── db.js              # Database connection & initialization
│   ├── 📂 middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── 📂 routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── products.js        # Product CRUD routes
│   │   ├── invoices.js        # Invoice routes
│   │   ├── expenses.js        # Expense routes
│   │   └── dashboard.js       # Dashboard stats routes
│   ├── 📜 .env.example        # Environment variables template
│   ├── 📜 package.json        # Backend dependencies
│   └── 📜 server.js           # Main server entry
│
├── 📂 src/                     # React Frontend
│   ├── 📂 components/
│   │   ├── 📂 Auth/
│   │   │   └── ProtectedRoute.tsx
│   │   └── 📂 Layout/
│   │       ├── Header.tsx
│   │       └── Sidebar.tsx
│   ├── 📂 pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Products.tsx
│   │   ├── Invoice.tsx
│   │   └── Expenses.tsx
│   ├── 📂 store/
│   │   ├── authStore.ts       # Authentication state
│   │   └── dataStore.ts       # Mock data store
│   ├── 📂 types/
│   │   └── index.ts           # TypeScript interfaces
│   ├── 📂 utils/
│   │   └── cn.ts              # Tailwind class utilities
│   ├── 📜 App.tsx             # Main app with routing
│   ├── 📜 main.tsx            # React entry point
│   └── 📜 index.css           # Global styles
│
├── 📜 index.html              # HTML template
├── 📜 package.json            # Frontend dependencies
├── 📜 vite.config.ts          # Vite configuration
├── 📜 tsconfig.json           # TypeScript config
├── 📜 tailwind.config.ts      # Tailwind CSS config
└── 📜 README.md               # This file
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### 1. Clone & Navigate
```bash
git clone <repository-url>
cd ak47-pos-system
```

### 2. Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start development server
npm run dev
```
Frontend will run on http://localhost:5173

### 3. Backend Setup
```bash
# Navigate to backend folder
cd backend

# Install backend dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start backend server
npm start

# Or for development with auto-reload
npm run dev
```
Backend will run on http://localhost:5000

### 4. Initialize Database (First Run)
```bash
cd backend
npm run init-db
```

## 🔑 Default Login Credentials

| Role     | Username | Password  |
|----------|----------|-----------|
| Admin    | `admin`  | `admin123`|
| Staff    | `staff`  | `staff123`|

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin', 'staff')) NOT NULL DEFAULT 'staff',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sale_price REAL NOT NULL CHECK(sale_price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK(stock_quantity >= 0),
  status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Invoices Table
```sql
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  subtotal REAL NOT NULL CHECK(subtotal >= 0),
  total REAL NOT NULL CHECK(total >= 0),
  payment_method TEXT CHECK(payment_method IN ('cash', 'online_bank')) NOT NULL,
  staff_id INTEGER NOT NULL,
  staff_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES users(id)
);
```

### Invoice Items Table
```sql
CREATE TABLE invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_price REAL NOT NULL CHECK(unit_price >= 0),
  total REAL NOT NULL CHECK(total >= 0),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### Expenses Table
```sql
CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  amount REAL NOT NULL CHECK(amount > 0),
  date DATE NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/change-password` | Change password |

### Products
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/products` | List all products | Admin, Staff |
| GET | `/api/products/:id` | Get single product | Admin, Staff |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/:id` | Update product | Admin |
| DELETE | `/api/products/:id` | Delete product | Admin |
| GET | `/api/products/alert/low-stock` | Get low stock items | Admin |

### Invoices
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/invoices` | List invoices | Admin, Staff* |
| GET | `/api/invoices/:id` | Get single invoice | Admin, Staff* |
| POST | `/api/invoices` | Create invoice | Admin, Staff |
| GET | `/api/invoices/stats/today` | Today's stats | Admin, Staff |

*Staff can only see their own invoices

### Expenses
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/expenses` | List expenses | Admin |
| GET | `/api/expenses/:id` | Get single expense | Admin |
| POST | `/api/expenses` | Create expense | Admin |
| PUT | `/api/expenses/:id` | Update expense | Admin |
| DELETE | `/api/expenses/:id` | Delete expense | Admin |

### Dashboard
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/dashboard/stats` | Main statistics | Admin |
| GET | `/api/dashboard/sales-chart` | Sales chart data | Admin |
| GET | `/api/dashboard/best-sellers` | Best-selling products | Admin |
| GET | `/api/dashboard/low-stock` | Low stock alert | Admin |
| GET | `/api/dashboard/recent-activity` | Recent activity | Admin |

## 🌐 Deployment

### Deploy on Render (Free)

1. **Create a Web Service on Render:**
   - Sign up at https://render.com
   - Create a new Web Service
   - Connect your GitHub repository

2. **Backend Configuration:**
```bash
# Build Command
cd backend && npm install

# Start Command
npm start
```

3. **Environment Variables:**
```
NODE_ENV=production
PORT=10000
JWT_SECRET=your-super-secret-key-here
CORS_ORIGIN=https://your-frontend-url.onrender.com
```

4. **Frontend Static Site:**
   - Build the frontend: `npm run build`
   - Deploy the `dist` folder as a static site
   - Or use the same backend to serve static files

### Deploy on Railway (Free)

1. Sign up at https://railway.app
2. Create a new project from GitHub repo
3. Add environment variables
4. Deploy automatically on push

### Deploy on Vercel (Frontend Only)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcryptjs
- ✅ Role-based access control
- ✅ Input validation & sanitization
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ XSS protection
- ✅ Secure headers

## 🎨 Theme Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Yellow | `#FACC15` | Buttons, highlights |
| Primary Dark | `#EAB308` | Hover states |
| Black | `#0F0F0F` | Sidebar, dark elements |
| Dark Gray | `#1A1A1A` | Cards, secondary dark |
| Gray | `#374151` | Text, borders |
| White | `#FFFFFF` | Backgrounds |

## 🧪 Testing

### Manual Testing Checklist

#### Authentication
- [ ] Login with admin credentials
- [ ] Login with staff credentials
- [ ] Invalid login shows error
- [ ] Logout functionality works
- [ ] Protected routes redirect to login

#### Dashboard
- [ ] Stats display correctly
- [ ] Charts render properly
- [ ] Data updates on refresh

#### Products
- [ ] Add new product
- [ ] Edit existing product
- [ ] Delete product with confirmation
- [ ] Search products
- [ ] Low stock warning displays

#### Invoice
- [ ] Add products to cart
- [ ] Update quantities
- [ ] Remove items from cart
- [ ] Payment method selection
- [ ] Confirm invoice popup
- [ ] Invoice generates correctly
- [ ] Print function works
- [ ] PDF download works

#### Expenses
- [ ] Add new expense
- [ ] Delete expense
- [ ] Expenses affect profit calculation

## 📱 Responsive Design

The system is optimized for desktop use (primary) with responsive elements for tablets.

## 🐛 Known Issues & Troubleshooting

### Issue: "Cannot find module"
**Solution:** Run `npm install` in both root and backend directories.

### Issue: "Database is locked"
**Solution:** Stop the server and restart. SQLite handles one connection at a time.

### Issue: "Port already in use"
**Solution:** Change the PORT in backend/.env or kill the process using the port.

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Powered by SixSenses**

## 🆘 Support

For support, email support@sixsenses.com or create an issue in the repository.

---

## 🔄 Version History

### v1.0.0 (MVP)
- ✅ Authentication system
- ✅ Dashboard with charts
- ✅ Product management
- ✅ Invoice generation
- ✅ Expense tracking
- ✅ Print & PDF functionality
- ✅ Role-based access control

## 🎯 Roadmap

### v1.1.0 (Planned)
- [ ] Multi-currency support
- [ ] Customer management
- [ ] Supplier management
- [ ] Advanced reporting
- [ ] Inventory alerts via email

### v1.2.0 (Planned)
- [ ] Multi-location support
- [ ] Kitchen display system
- [ ] Mobile app companion
- [ ] Cloud sync
- [ ] Backup & restore

---

<p align="center">
  <strong>AK47 Shawarma Stop - POS System</strong><br>
  Made with ❤️ by SixSenses
</p>
"# Ak47-POS" 
