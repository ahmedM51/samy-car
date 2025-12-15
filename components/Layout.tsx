import React from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Car, 
  Settings, 
  FileSignature, 
  Menu,
  X,
  LogOut
} from 'lucide-react';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { signOut, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "الرئيسية" },
    { to: "/installment-contracts", icon: FileText, label: "إدارة الأقساط" },
    { to: "/title-transfer", icon: FileSignature, label: "عقود وتوكيلات" },
    { to: "/showroom", icon: Car, label: "المعرض والعربيات" },
    { to: "/reports", icon: Settings, label: "التقارير والحسابات" },
    { to: "/settings", icon: Settings, label: "إعدادات الشركة" },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 right-0 z-30 w-64 bg-dark text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } no-print flex flex-col`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-slate-900 shadow-md">
          <span className="text-xl font-bold">سيستم المعرض</span>
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* User Info */}
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
            <p className="text-xs text-gray-400">مرحباً،</p>
            <p className="text-sm font-bold text-white truncate dir-ltr text-right">{user?.email}</p>
        </div>

        <nav className="mt-4 px-4 space-y-2 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${isActive ? 'bg-primary text-white shadow-lg' : 'text-gray-300 hover:bg-slate-700 hover:text-white'}
              `}
              onClick={() => setIsSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5 ml-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Sign Out Button */}
        <div className="p-4 border-t border-slate-700">
            <button 
                onClick={() => signOut()} 
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
                <LogOut className="w-5 h-5 ml-3" />
                تسجيل خروج
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b lg:hidden no-print">
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-semibold text-gray-800">سيستم الإدارة</span>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;