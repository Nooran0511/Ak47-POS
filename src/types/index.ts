export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'staff';
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  salePrice: number;
  stockQuantity: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  paymentMethod: 'cash' | 'online_bank';
  staffId: number;
  staffName: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  date: string;
  notes: string;
  createdAt: string;
}

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  todayExpenses: number;
  todayProfit: number;
}

export interface SalesChartData {
  labels: string[];
  data: number[];
}

export interface BestSellingProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export type PaymentMethod = 'cash' | 'online_bank';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
