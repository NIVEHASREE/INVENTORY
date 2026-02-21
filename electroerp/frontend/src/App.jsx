import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import BillingScreen from './pages/billing/BillingScreen';
import BillHistory from './pages/billing/BillHistory';
import ProductList from './pages/inventory/ProductList';
import SupplierList from './pages/suppliers/SupplierList';
import SupplierLedger from './pages/suppliers/SupplierLedger';
import NewPurchase from './pages/purchases/NewPurchase';
import PurchaseHistory from './pages/purchases/PurchaseHistory';
import GSTReport from './pages/gst/GSTReport';
import SalesReport from './pages/reports/SalesReport';
import UserManagement from './pages/users/UserManagement';
import ActivityLogs from './pages/audit/ActivityLogs';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading ElectroERP...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
              success: { iconTheme: { primary: '#22c55e', secondary: '#f0fdf4' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fef2f2' } },
            }}
          />
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="billing" element={<BillingScreen />} />
              <Route path="billing/history" element={<BillHistory />} />
              <Route path="inventory" element={<ProductList />} />
              <Route path="suppliers" element={<SupplierList />} />
              <Route path="suppliers/:id/ledger" element={<SupplierLedger />} />
              <Route path="purchases/new" element={<NewPurchase />} />
              <Route path="purchases" element={<PurchaseHistory />} />
              <Route path="gst" element={<GSTReport />} />
              <Route path="reports" element={<SalesReport />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="activity-logs" element={<ActivityLogs />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
