const express = require('express');
const { all, get } = require('../database/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's sales
    const todaySales = await get(`
      SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
      FROM invoices
      WHERE DATE(created_at) = ?
    `, [today]);
    
    // Today's expenses
    const todayExpenses = await get(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date = ?
    `, [today]);
    
    // Calculate profit
    const todayProfit = (todaySales.total || 0) - (todayExpenses.total || 0);
    
    res.json({
      success: true,
      data: {
        todaySales: todaySales.total || 0,
        todayOrders: todaySales.count || 0,
        todayExpenses: todayExpenses.total || 0,
        todayProfit
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get sales chart data (last 7 days)
router.get('/sales-chart', authenticate, requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const labels = [];
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const label = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const result = await get(`
        SELECT COALESCE(SUM(total), 0) as total
        FROM invoices
        WHERE DATE(created_at) = ?
      `, [dateStr]);
      
      labels.push(label);
      data.push(result.total || 0);
    }
    
    res.json({
      success: true,
      data: { labels, data }
    });
  } catch (error) {
    console.error('Get sales chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get best-selling products
router.get('/best-sellers', authenticate, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const products = await all(`
      SELECT 
        product_name as name,
        SUM(quantity) as quantity,
        SUM(total) as revenue
      FROM invoice_items
      GROUP BY product_id, product_name
      ORDER BY quantity DESC
      LIMIT ?
    `, [limit]);
    
    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('Get best sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get low stock products
router.get('/low-stock', authenticate, requireAdmin, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 20;
    
    const products = await all(`
      SELECT * FROM products
      WHERE stock_quantity <= ?
      ORDER BY stock_quantity ASC
    `, [threshold]);
    
    res.json({
      success: true,
      data: { products, count: products.length }
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get recent activity
router.get('/recent-activity', authenticate, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Recent invoices
    const invoices = await all(`
      SELECT 
        'invoice' as type,
        invoice_number as description,
        total as amount,
        staff_name as user,
        created_at as time
      FROM invoices
      ORDER BY created_at DESC
      LIMIT ?
    `, [limit]);
    
    // Recent expenses
    const expenses = await all(`
      SELECT 
        'expense' as type,
        title as description,
        amount,
        'Admin' as user,
        created_at as time
      FROM expenses
      ORDER BY created_at DESC
      LIMIT ?
    `, [limit]);
    
    // Combine and sort
    const activity = [...invoices, ...expenses]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, limit);
    
    res.json({
      success: true,
      data: { activity }
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
