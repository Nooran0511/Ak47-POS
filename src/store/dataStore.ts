import type { Product, Invoice, Expense, DashboardStats, BestSellingProduct } from '@/types';

// Initialize from localStorage or use defaults
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
  }
  return defaultValue;
};

const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('dataStoreUpdate', { detail: { key } }));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
};

// Start with EMPTY products - user will add manually
const defaultProducts: Product[] = [];

// Data store with localStorage persistence - ALL EMPTY FOR FRESH START
let _products: Product[] = loadFromStorage('pos_products', defaultProducts);
let _invoices: Invoice[] = loadFromStorage('pos_invoices', []);
let _expenses: Expense[] = loadFromStorage('pos_expenses', []);

// Getters that always return fresh data
export const getProducts = (): Product[] => {
  _products = loadFromStorage('pos_products', []);
  return _products;
};

export const getInvoices = (): Invoice[] => {
  _invoices = loadFromStorage('pos_invoices', []);
  return _invoices;
};

export const getExpenses = (): Expense[] => {
  _expenses = loadFromStorage('pos_expenses', []);
  return _expenses;
};

// For backward compatibility - use these sparingly
export const products = new Proxy([] as Product[], {
  get(_target, prop) {
    const currentProducts = getProducts();
    if (prop === 'length') return currentProducts.length;
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      return currentProducts[Number(prop)];
    }
    if (prop === Symbol.iterator) {
      return function* () {
        for (const item of currentProducts) {
          yield item;
        }
      };
    }
    if (typeof prop === 'string' && typeof Array.prototype[prop as keyof typeof Array.prototype] === 'function') {
      return (...args: any[]) => (currentProducts as any)[prop](...args);
    }
    return (currentProducts as any)[prop];
  },
});

export const invoices = new Proxy([] as Invoice[], {
  get(_target, prop) {
    const currentInvoices = getInvoices();
    if (prop === 'length') return currentInvoices.length;
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      return currentInvoices[Number(prop)];
    }
    if (prop === Symbol.iterator) {
      return function* () {
        for (const item of currentInvoices) {
          yield item;
        }
      };
    }
    if (typeof prop === 'string' && typeof Array.prototype[prop as keyof typeof Array.prototype] === 'function') {
      return (...args: any[]) => (currentInvoices as any)[prop](...args);
    }
    return (currentInvoices as any)[prop];
  },
});

export const expenses = new Proxy([] as Expense[], {
  get(_target, prop) {
    const currentExpenses = getExpenses();
    if (prop === 'length') return currentExpenses.length;
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      return currentExpenses[Number(prop)];
    }
    if (prop === Symbol.iterator) {
      return function* () {
        for (const item of currentExpenses) {
          yield item;
        }
      };
    }
    if (typeof prop === 'string' && typeof Array.prototype[prop as keyof typeof Array.prototype] === 'function') {
      return (...args: any[]) => (currentExpenses as any)[prop](...args);
    }
    return (currentExpenses as any)[prop];
  },
});

// Product Operations
export const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
  const currentProducts = getProducts();
  const newProduct: Product = {
    ...product,
    id: Math.max(0, ...currentProducts.map(p => p.id)) + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  currentProducts.push(newProduct);
  saveToStorage('pos_products', currentProducts);
  _products = currentProducts;
  return newProduct;
};

export const updateProduct = (id: number, updates: Partial<Product>): Product | null => {
  const currentProducts = getProducts();
  const index = currentProducts.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  currentProducts[index] = {
    ...currentProducts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveToStorage('pos_products', currentProducts);
  _products = currentProducts;
  return currentProducts[index];
};

export const deleteProduct = (id: number): boolean => {
  const currentProducts = getProducts();
  const index = currentProducts.findIndex(p => p.id === id);
  if (index === -1) return false;
  currentProducts.splice(index, 1);
  saveToStorage('pos_products', currentProducts);
  _products = currentProducts;
  return true;
};

export const getProductById = (id: number): Product | undefined => {
  return getProducts().find(p => p.id === id);
};

export const searchProducts = (query: string): Product[] => {
  const lowerQuery = query.toLowerCase();
  return getProducts().filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.category.toLowerCase().includes(lowerQuery)
  );
};

export const reduceStock = (productId: number, quantity: number): boolean => {
  const currentProducts = getProducts();
  const index = currentProducts.findIndex(p => p.id === productId);
  if (index === -1 || currentProducts[index].stockQuantity < quantity) return false;
  
  currentProducts[index].stockQuantity -= quantity;
  currentProducts[index].updatedAt = new Date().toISOString();
  saveToStorage('pos_products', currentProducts);
  _products = currentProducts;
  return true;
};

// Invoice Operations
export const createInvoice = (
  items: { productId: number; quantity: number }[],
  paymentMethod: 'cash' | 'online_bank',
  staffId: number,
  staffName: string
): Invoice => {
  const currentProducts = getProducts();
  const currentInvoices = getInvoices();
  
  const invoiceItems = items.map(item => {
    const product = currentProducts.find(p => p.id === item.productId)!;
    return {
      id: Math.floor(Math.random() * 1000000),
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.salePrice,
      total: product.salePrice * item.quantity,
    };
  });

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  
  const newInvoice: Invoice = {
    id: Math.max(0, ...currentInvoices.map(i => i.id)) + 1,
    invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
    items: invoiceItems,
    subtotal,
    total: subtotal,
    paymentMethod,
    staffId,
    staffName,
    createdAt: new Date().toISOString(),
  };
  
  currentInvoices.push(newInvoice);
  saveToStorage('pos_invoices', currentInvoices);
  _invoices = currentInvoices;
  
  // Reduce stock for each item
  items.forEach(item => reduceStock(item.productId, item.quantity));
  
  return newInvoice;
};

export const getTodayInvoices = (): Invoice[] => {
  const today = new Date().toISOString().split('T')[0];
  return getInvoices().filter(inv => inv.createdAt.startsWith(today));
};

export const getInvoicesByDateRange = (startDate: string, endDate: string): Invoice[] => {
  return getInvoices().filter(inv => {
    const invDate = inv.createdAt.split('T')[0];
    return invDate >= startDate && invDate <= endDate;
  });
};

// Expense Operations
export const addExpense = (expense: Omit<Expense, 'id' | 'createdAt'>): Expense => {
  const currentExpenses = getExpenses();
  const newExpense: Expense = {
    ...expense,
    id: Math.max(0, ...currentExpenses.map(e => e.id)) + 1,
    createdAt: new Date().toISOString(),
  };
  currentExpenses.push(newExpense);
  saveToStorage('pos_expenses', currentExpenses);
  _expenses = currentExpenses;
  return newExpense;
};

export const deleteExpense = (id: number): boolean => {
  const currentExpenses = getExpenses();
  const index = currentExpenses.findIndex(e => e.id === id);
  if (index === -1) return false;
  currentExpenses.splice(index, 1);
  saveToStorage('pos_expenses', currentExpenses);
  _expenses = currentExpenses;
  return true;
};

export const getTodayExpenses = (): Expense[] => {
  const today = new Date().toISOString().split('T')[0];
  return getExpenses().filter(exp => exp.date === today);
};

export const getExpensesByDateRange = (startDate: string, endDate: string): Expense[] => {
  return getExpenses().filter(exp => exp.date >= startDate && exp.date <= endDate);
};

// Dashboard Stats
export const getDashboardStats = (): DashboardStats => {
  const todayInvoices = getTodayInvoices();
  const todayExpenses = getTodayExpenses();
  
  const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const todayOrders = todayInvoices.length;
  const todayExpensesTotal = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const todayProfit = todaySales - todayExpensesTotal;
  
  return {
    todaySales,
    todayOrders,
    todayExpenses: todayExpensesTotal,
    todayProfit,
  };
};

export const getBestSellingProducts = (): BestSellingProduct[] => {
  const productSales: Record<string, { quantity: number; revenue: number }> = {};
  
  getInvoices().forEach(invoice => {
    invoice.items.forEach(item => {
      if (!productSales[item.productName]) {
        productSales[item.productName] = { quantity: 0, revenue: 0 };
      }
      productSales[item.productName].quantity += item.quantity;
      productSales[item.productName].revenue += item.total;
    });
  });
  
  return Object.entries(productSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
};

export const getSalesChartData = (): { labels: string[]; data: number[] } => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });
  
  const labels = last7Days.map(date => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  });
  
  const currentInvoices = getInvoices();
  const data = last7Days.map(date => {
    return currentInvoices
      .filter(inv => inv.createdAt.startsWith(date))
      .reduce((sum, inv) => sum + inv.total, 0);
  });
  
  return { labels, data };
};

// Report Data
export const getReportData = (startDate: string, endDate: string) => {
  const filteredInvoices = getInvoicesByDateRange(startDate, endDate);
  const filteredExpenses = getExpensesByDateRange(startDate, endDate);
  
  const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalSales - totalExpenses;
  
  // Sales by payment method
  const cashSales = filteredInvoices
    .filter(inv => inv.paymentMethod === 'cash')
    .reduce((sum, inv) => sum + inv.total, 0);
  const onlineSales = filteredInvoices
    .filter(inv => inv.paymentMethod === 'online_bank')
    .reduce((sum, inv) => sum + inv.total, 0);
  
  // Product sales summary
  const productSales: Record<string, { quantity: number; revenue: number }> = {};
  filteredInvoices.forEach(invoice => {
    invoice.items.forEach(item => {
      if (!productSales[item.productName]) {
        productSales[item.productName] = { quantity: 0, revenue: 0 };
      }
      productSales[item.productName].quantity += item.quantity;
      productSales[item.productName].revenue += item.total;
    });
  });
  
  const productSummary = Object.entries(productSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue);
  
  // Daily breakdown
  const dailyData: Record<string, { sales: number; expenses: number; orders: number }> = {};
  
  filteredInvoices.forEach(inv => {
    const date = inv.createdAt.split('T')[0];
    if (!dailyData[date]) {
      dailyData[date] = { sales: 0, expenses: 0, orders: 0 };
    }
    dailyData[date].sales += inv.total;
    dailyData[date].orders += 1;
  });
  
  filteredExpenses.forEach(exp => {
    if (!dailyData[exp.date]) {
      dailyData[exp.date] = { sales: 0, expenses: 0, orders: 0 };
    }
    dailyData[exp.date].expenses += exp.amount;
  });
  
  const dailyBreakdown = Object.entries(dailyData)
    .map(([date, data]) => ({ date, ...data, profit: data.sales - data.expenses }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return {
    summary: {
      totalSales,
      totalExpenses,
      netProfit,
      totalOrders: filteredInvoices.length,
      cashSales,
      onlineSales,
    },
    productSummary,
    dailyBreakdown,
    invoices: filteredInvoices,
    expenses: filteredExpenses,
  };
};

// Clear all data (for fresh start)
export const clearAllData = () => {
  localStorage.removeItem('pos_products');
  localStorage.removeItem('pos_invoices');
  localStorage.removeItem('pos_expenses');
  _products = [];
  _invoices = [];
  _expenses = [];
};

// Export for refreshing data
export const refreshData = () => {
  _products = loadFromStorage('pos_products', []);
  _invoices = loadFromStorage('pos_invoices', []);
  _expenses = loadFromStorage('pos_expenses', []);
};
