const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { run, get, all } = require('../database/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all expenses (Admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];
    
    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }
    
    sql += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const expenses = await all(sql, params);
    
    // Get total count and sum
    let countSql = 'SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as totalAmount FROM expenses WHERE 1=1';
    const countParams = [];
    
    if (startDate) {
      countSql += ' AND date >= ?';
      countParams.push(startDate);
    }
    if (endDate) {
      countSql += ' AND date <= ?';
      countParams.push(endDate);
    }
    
    const { total, totalAmount } = await get(countSql, countParams);
    
    res.json({
      success: true,
      data: {
        expenses,
        summary: {
          total,
          totalAmount
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get single expense
router.get('/:id', authenticate, requireAdmin, [
  param('id').isInt().withMessage('Invalid expense ID')
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
    const expense = await get('SELECT * FROM expenses WHERE id = ?', [id]);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      data: { expense }
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create expense (Admin only)
router.post('/', authenticate, requireAdmin, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  body('date').isDate().withMessage('Valid date is required'),
  body('notes').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { title, amount, date, notes = '' } = req.body;
    
    const result = await run(`
      INSERT INTO expenses (title, amount, date, notes)
      VALUES (?, ?, ?, ?)
    `, [title, amount, date, notes]);
    
    const expense = await get('SELECT * FROM expenses WHERE id = ?', [result.id]);
    
    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: { expense }
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update expense (Admin only)
router.put('/:id', authenticate, requireAdmin, [
  param('id').isInt().withMessage('Invalid expense ID'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  body('date').optional().isDate().withMessage('Valid date is required'),
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
    
    // Check if expense exists
    const existing = await get('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    // Build update query
    const fields = [];
    const values = [];
    
    if (updates.title) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.amount !== undefined) {
      fields.push('amount = ?');
      values.push(updates.amount);
    }
    if (updates.date) {
      fields.push('date = ?');
      values.push(updates.date);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    values.push(id);
    
    await run(`
      UPDATE expenses SET ${fields.join(', ')} WHERE id = ?
    `, values);
    
    const expense = await get('SELECT * FROM expenses WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense }
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete expense (Admin only)
router.delete('/:id', authenticate, requireAdmin, [
  param('id').isInt().withMessage('Invalid expense ID')
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
    
    // Check if expense exists
    const existing = await get('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    await run('DELETE FROM expenses WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get today's expenses
router.get('/stats/today', authenticate, requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const stats = await get(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date = ?
    `, [today]);
    
    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get today expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
