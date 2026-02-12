const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname);
const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, 'pos.db');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Database connection
let db = null;

function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
      }
    });
  }
  return db;
}

// Promisify database methods
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Initialize database tables
async function initDatabase() {
  const database = getDatabase();
  
  // Enable foreign keys
  await run('PRAGMA foreign_keys = ON');
  
  // Users table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'staff')) NOT NULL DEFAULT 'staff',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Products table
  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sale_price REAL NOT NULL CHECK(sale_price >= 0),
      stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK(stock_quantity >= 0),
      status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Invoices table
  await run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      subtotal REAL NOT NULL CHECK(subtotal >= 0),
      total REAL NOT NULL CHECK(total >= 0),
      payment_method TEXT CHECK(payment_method IN ('cash', 'online_bank')) NOT NULL,
      staff_id INTEGER NOT NULL,
      staff_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES users(id)
    )
  `);
  
  // Invoice items table
  await run(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      unit_price REAL NOT NULL CHECK(unit_price >= 0),
      total REAL NOT NULL CHECK(total >= 0),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);
  
  // Expenses table
  await run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      date DATE NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Insert default admin user if not exists
  const bcrypt = require('bcryptjs');
  const adminExists = await get('SELECT id FROM users WHERE username = ?', ['admin']);
  
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await run(`
      INSERT INTO users (username, password, full_name, role)
      VALUES (?, ?, ?, ?)
    `, ['admin', hashedPassword, 'Administrator', 'admin']);
    console.log('Default admin user created');
  }
  
  // Insert default staff user if not exists
  const staffExists = await get('SELECT id FROM users WHERE username = ?', ['staff']);
  
  if (!staffExists) {
    const hashedPassword = await bcrypt.hash('staff123', 10);
    await run(`
      INSERT INTO users (username, password, full_name, role)
      VALUES (?, ?, ?, ?)
    `, ['staff', hashedPassword, 'Staff Member', 'staff']);
    console.log('Default staff user created');
  }
  
  // Insert sample products if none exist
  const productCount = await get('SELECT COUNT(*) as count FROM products');
  
  if (productCount.count === 0) {
    const sampleProducts = [
      ['Chicken Shawarma', 'Shawarma', 8.99, 50],
      ['Beef Shawarma', 'Shawarma', 9.99, 40],
      ['Mixed Shawarma', 'Shawarma', 11.99, 30],
      ['Falafel Wrap', 'Wraps', 6.99, 25],
      ['Hummus Plate', 'Sides', 5.99, 20],
      ['Baba Ganoush', 'Sides', 5.99, 15],
      ['French Fries', 'Sides', 3.99, 100],
      ['Soft Drink', 'Beverages', 2.49, 80],
      ['Bottled Water', 'Beverages', 1.99, 60],
      ['Baklava', 'Desserts', 4.99, 20],
    ];
    
    for (const [name, category, price, stock] of sampleProducts) {
      await run(`
        INSERT INTO products (name, category, sale_price, stock_quantity, status)
        VALUES (?, ?, ?, ?, 'active')
      `, [name, category, price, stock]);
    }
    console.log('Sample products inserted');
  }
  
  console.log('Database initialization complete');
}

module.exports = {
  getDatabase,
  run,
  get,
  all,
  initDatabase,
};
