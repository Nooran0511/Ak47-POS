const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../database/db');
const { authenticate, requireStaff } = require('../middleware/auth');

const router = express.Router();

// Get all invoices
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT i.*, 
        (SELECT SUM(quantity) FROM invoice_items WHERE invoice_id = i.id) as total_items
      FROM invoices i
      WHERE 1=1
    `;
    const params = [];
    
    if (startDate) {
      sql += ' AND DATE(i.created_at) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND DATE(i.created_at) <= ?';
      params.push(endDate);
    }
    
    // Staff can only see their own invoices
    if (req.user.role === 'staff') {
      sql += ' AND i.staff_id = ?';
      params.push(req.user.id);
    }
    
    sql += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const invoices = await all(sql, params);
    
    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM invoices WHERE 1=1';
    const countParams = [];
    
    if (startDate) {
      countSql += ' AND DATE(created_at) >= ?';
      countParams.push(startDate);
    }
    if (endDate) {
      countSql += ' AND DATE(created_at) <= ?';
      countParams.push(endDate);
    }
    if (req.user.role === 'staff') {
      countSql += ' AND staff_id = ?';
      countParams.push(req.user.id);
    }
    
    const { total } = await get(countSql, countParams);
    
    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get single invoice with items
router.get('/:id', authenticate, [
  param('id').isInt().withMessage('Invalid invoice ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    
    const invoice = await get('SELECT * FROM invoices WHERE id = ?', [id]);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Staff can only view their own invoices
    if (req.user.role === 'staff' && invoice.staff_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const items = await all(
      'SELECT * FROM invoice_items WHERE invoice_id = ?',
      [id]
    );
    
    res.json({
      success: true,
      data: {
        invoice: {
          ...invoice,
          items
        }
      }
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create invoice
router.post('/', authenticate, requireStaff, [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isInt().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required'),
  body('paymentMethod').isIn(['cash', 'online_bank']).withMessage('Valid payment method is required'),
], async (req, res) => {
  const db = require('../database/db').getDatabase();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { items, paymentMethod } = req.body;
    
    // Begin transaction
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    try {
      // Validate products and calculate totals
      let subtotal = 0;
      const invoiceItems = [];
      
      for (const item of items) {
        const product = await get('SELECT * FROM products WHERE id = ? AND status = "active"', [item.productId]);
        
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found or inactive`);
        }
        
        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`);
        }
        
        const itemTotal = product.sale_price * item.quantity;
        subtotal += itemTotal;
        
        invoiceItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.sale_price,
          total: itemTotal
        });
      }
      
      // Generate invoice number
      const date = new Date();
      const invoiceNumber = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${uuidv4().slice(0, 6).toUpperCase()}`;
      
      // Create invoice
      const invoiceResult = await run(`
        INSERT INTO invoices (invoice_number, subtotal, total, payment_method, staff_id, staff_name)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [invoiceNumber, subtotal, subtotal, paymentMethod, req.user.id, req.user.full_name]);
      
      const invoiceId = invoiceResult.id;
      
      // Create invoice items and update stock
      for (const item of invoiceItems) {
        await run(`
          INSERT INTO invoice_items (invoice_id, product_id, product_name, quantity, unit_price, total)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [invoiceId, item.productId, item.productName, item.quantity, item.unitPrice, item.total]);
        
        // Update stock
        await run(`
          UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [item.quantity, item.productId]);
      }
      
      // Commit transaction
      await new Promise((resolve, reject) => {
        db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // Get created invoice
      const invoice = await get('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
      const savedItems = await all('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
      
      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: {
          invoice: {
            ...invoice,
            items: savedItems
          }
        }
      });
    } catch (error) {
      // Rollback transaction
      await new Promise((resolve) => {
        db.run('ROLLBACK', () => resolve());
      });
      throw error;
    }
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// Get today's invoices
router.get('/stats/today', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    let sql = `
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
      FROM invoices
      WHERE DATE(created_at) = ?
    `;
    const params = [today];
    
    if (req.user.role === 'staff') {
      sql += ' AND staff_id = ?';
      params.push(req.user.id);
    }
    
    const stats = await get(sql, params);
    
    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get today stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
