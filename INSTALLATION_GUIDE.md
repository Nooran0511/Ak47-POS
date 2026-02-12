# AK47 Shawarma Stop - POS System Installation Guide

## 📦 STEP 1: Download & Extract Project

### Option A: Download as ZIP
1. Click the **Download** button in the preview panel
2. Extract the ZIP file to a folder on your PC
3. Remember the folder path (e.g., `C:\POS-System` or `~/pos-system`)

---

## 🛠️ STEP 2: Install Node.js

### For Windows:
1. Go to: https://nodejs.org/
2. Download **LTS version** (e.g., 20.x.x)
3. Run the installer and click "Next" through all steps
4. **Restart your computer** after installation

### For Mac:
1. Go to: https://nodejs.org/
2. Download **LTS version**
3. Run the installer
4. Open Terminal to verify

### Verify Installation:
Open **Command Prompt** (Windows) or **Terminal** (Mac/Linux) and type:
```bash
node --version
npm --version
```
Both should show version numbers (e.g., `v20.10.0` and `10.2.3`)

---

## 📂 STEP 3: Open Project in Terminal

### Windows:
1. Open **File Explorer**
2. Navigate to the extracted folder
3. Click on the address bar, type `cmd`, press **Enter**
4. Command Prompt will open in that folder

### Mac/Linux:
1. Open **Terminal**
2. Type: `cd /path/to/extracted/folder`
3. Press **Enter**

---

## 📥 STEP 4: Install Dependencies

In the terminal/command prompt, run:
```bash
npm install
```

Wait for installation to complete (may take 1-3 minutes)

---

## ▶️ STEP 5: Run the Application

### For Development (with hot reload):
```bash
npm run dev
```
Then open your browser and go to: **http://localhost:5173**

### For Production Build:
```bash
npm run build
npm run preview
```
Then open your browser and go to: **http://localhost:4173**

---

## 🔐 STEP 6: Login to the System

### Default Admin Credentials:
- **Username:** `admin`
- **Password:** `admin123`

### ⚠️ IMPORTANT: Change Password Immediately!
1. Login as admin
2. Go to **Users** page
3. Click **Edit** on the admin user
4. Change the password to something secure
5. Save

---

## 📝 STEP 7: Setup Your Products

1. Login as **admin**
2. Go to **Products** page
3. Click **Add Product** button
4. Fill in the details:
   - Product Name (e.g., "Chicken Shawarma")
   - Category (e.g., "Shawarma", "Beverages", "Sides")
   - Sale Price (in Pakistani Rupees)
   - Stock Quantity
   - Status (Active)
5. Click **Save**
6. Repeat for all your products

---

## 👥 STEP 8: Create Staff Accounts

1. Go to **Users** page
2. Click **Add User**
3. Fill in:
   - Full Name
   - Username
   - Password (minimum 6 characters)
   - Role: **Staff**
   - Status: **Active**
4. Click **Add User**

Staff can only access the **Invoice/POS** page.

---

## 🧾 STEP 9: How to Use POS

### Creating an Invoice:
1. Staff/Admin logs in
2. Go to **Invoice / POS** page
3. Click on products to add to cart
4. Use +/- buttons to adjust quantity
5. Select payment method (Cash or Online)
6. Click **Complete Sale**
7. Review and click **Confirm**
8. Print or Download PDF receipt

---

## 📊 Admin Features

### Dashboard:
- View today's sales, orders, expenses, profit
- See sales charts and best-selling products
- Low stock warnings

### Reports:
- Select date range
- Filter by payment method
- View detailed reports
- Download as PDF or Excel

### Expenses:
- Track daily expenses
- Affects profit calculation

---

## 🆓 FREE DEPLOYMENT OPTIONS

### Option 1: Vercel (Recommended - Easiest)

1. Go to: https://vercel.com
2. Sign up with GitHub account
3. Click **Add New Project**
4. Upload your project folder
5. Click **Deploy**
6. Your site will be live at: `your-project.vercel.app`

### Option 2: Netlify

1. Go to: https://netlify.com
2. Sign up for free
3. Click **Add new site** → **Deploy manually**
4. Drag and drop the `dist` folder
5. Your site will be live instantly

### Option 3: GitHub Pages

1. Create a GitHub account: https://github.com
2. Create a new repository
3. Upload your project files
4. Go to Settings → Pages
5. Select source branch and folder
6. Your site will be live at: `username.github.io/repo-name`

### Option 4: Render.com

1. Go to: https://render.com
2. Sign up for free
3. Click **New** → **Static Site**
4. Connect your GitHub repo or upload manually
5. Set build command: `npm run build`
6. Set publish directory: `dist`
7. Click **Create Static Site**

---

## 🔧 Troubleshooting

### "npm not found"
- Restart your computer after installing Node.js
- Reinstall Node.js from https://nodejs.org

### "Permission denied"
- Windows: Run Command Prompt as Administrator
- Mac/Linux: Use `sudo npm install`

### Build errors
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run `npm install` again

### Data not saving
- Make sure you're using a modern browser (Chrome, Firefox, Edge)
- Check if browser allows localStorage

---

## 📱 Browser Support

- Google Chrome (Recommended)
- Microsoft Edge
- Mozilla Firefox
- Safari

---

## 💾 Data Backup

Your data is stored in browser localStorage. To backup:

1. Open browser Developer Tools (F12)
2. Go to **Application** tab
3. Click **Local Storage** → your site
4. Copy all key-value pairs
5. Save to a text file

To restore:
1. Open Developer Tools
2. Go to Application → Local Storage
3. Manually add the saved key-value pairs

---

## 📞 Support

This POS system was built by **SixSenses**.

For any issues or customization requests, contact the developer.

---

## ⚠️ Important Notes

1. **Change default password** immediately after first login
2. **Backup your data** regularly
3. Use **Chrome browser** for best experience
4. Data is stored in browser - clearing browser data will delete everything
5. For production use, consider deploying with a proper backend database

---

**Version:** 1.0.0 (MVP)
**Currency:** Pakistani Rupees (Rs.)
**Powered by:** SixSenses
