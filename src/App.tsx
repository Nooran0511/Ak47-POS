import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Products } from '@/pages/Products';
import { Invoice } from '@/pages/Invoice';
import { Expenses } from '@/pages/Expenses';
import { Reports } from '@/pages/Reports';
import { Users } from '@/pages/Users';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';

function AppRoutes() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'staff' ? '/invoice' : '/'} replace />
          ) : (
            <Login />
          )
        } 
      />

      {/* Protected Admin Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Products />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Expenses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Users />
          </ProtectedRoute>
        }
      />

      {/* Protected Invoice Route (Admin + Staff) */}
      <Route
        path="/invoice"
        element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <Invoice />
          </ProtectedRoute>
        }
      />

      {/* Default Redirect */}
      <Route 
        path="*" 
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'staff' ? '/invoice' : '/'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
