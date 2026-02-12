const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { run, get, all } = require('../database/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all products (Staff and Admin)
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, category, status } = req.query;
    
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    
    if (search) {
      sql += ' AND (name LIKE ? OR category LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const products = await all(sql, params);
    
    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get single product
router.get('/:id', authenticate, [
  param('id').isInt().withMessage('Invalid product ID')
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
    const product = await get('SELECT * FROM products WHERE id = ?', [id]);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create product (Admin only)
router.post('/', authenticate, requireAdmin, [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('salePrice').isFloat({ min: 0 }).withMessage('Valid sale price is required'),
  body('stockQuantity').isInt({ min: 0 }).withMessage('Valid stock quantity is required'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { name, category, salePrice, stockQuantity, status = 'active' } = req.body;
    
    const result = await run(`
      INSERT INTO products (name, category, sale_price, stock_quantity, status)
      VALUES (?, ?, ?, ?, ?)
    `, [name, category, salePrice, stockQuantity, status]);
    
    const product = await get('SELECT * FROM products WHERE id = ?', [result.id]);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update product (Admin only)
router.put('/:id', authenticate, requireAdmin, [
  param('id').isInt().withMessage('Invalid product ID'),
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('salePrice').optional().isFloat({ min: 0 }).withMessage('Valid sale price is required'),
  body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Valid stock quantity is required'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
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
    const updates = req.body;
    
    // Check if product exists
    const existing = await get('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Build update query
    const fields = [];
    const values = [];
    
    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.category) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.salePrice !== undefined) {
      fields.push('sale_price = ?');
      values.push(updates.salePrice);
    }
    if (updates.stockQuantity !== undefined) {
      fields.push('stock_quantity = ?');
      values.push(updates.stockQuantity);
    }
    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await run(`
      UPDATE products SET ${fields.join(', ')} WHERE id = ?
    `, values);
    
    const product = await get('SELECT * FROM products WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete product (Admin only)
router.delete('/:id', authenticate, requireAdmin, [
  param('id').isInt().withMessage('Invalid product ID')
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
    
    // Check if product exists
    const existing = await get('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    await run('DELETE FROM products WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get low stock products
router.get('/alert/low-stock', authenticate, requireAdmin, async (req, res) => {
  try {
    const { threshold = 20 } = req.query;
    
    const products = await all(
      'SELECT * FROM products WHERE stock_quantity <= ? ORDER BY stock_quantity ASC',
      [threshold]
    );
    
    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
