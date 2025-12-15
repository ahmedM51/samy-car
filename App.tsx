import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InstallmentContracts from './components/InstallmentContracts';
import TitleTransferContracts from './components/TitleTransferContracts';
import Showroom from './components/Showroom';
import Reports from './components/Reports';
import Login from './components/Login';
import Signup from './components/Signup';

// مكون لحماية المسارات الخاصة
const PrivateRoute = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return user && isAdmin ? <Outlet /> : <Navigate to="/login" />;
};

// مكون لمنع الوصول لصفحات الدخول إذا كان المستخدم مسجلاً بالفعل كأدمن
const PublicRoute = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return null;

  // لو الأدمن داخل بالفعل يرجع للصفحة الرئيسية، غير كده يسمح بعرض صفحة الدخول / التسجيل
  return !user || !isAdmin ? <Outlet /> : <Navigate to="/" />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes (Login/Signup) */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* Protected Routes (Main App) */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/installment-contracts" element={<InstallmentContracts />} />
              <Route path="/title-transfer" element={<TitleTransferContracts />} />
              <Route path="/showroom" element={<Showroom />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;