import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Receipt, 
  LogOut,
  DollarSign,
  Shield,
  BarChart3,
  Users
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  allowedRoles: ('admin' | 'staff')[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} />, allowedRoles: ['admin'] },
  { path: '/invoice', label: 'Invoice / POS', icon: <Receipt size={20} />, allowedRoles: ['admin', 'staff'] },
  { path: '/products', label: 'Products', icon: <Package size={20} />, allowedRoles: ['admin'] },
  { path: '/expenses', label: 'Expenses', icon: <DollarSign size={20} />, allowedRoles: ['admin'] },
  { path: '/reports', label: 'Reports', icon: <BarChart3 size={20} />, allowedRoles: ['admin'] },
  { path: '/users', label: 'Users', icon: <Users size={20} />, allowedRoles: ['admin'] },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    // Clear localStorage for auth
    logout();
    // Navigate to login page using React Router (no page reload)
    setTimeout(() => {
      navigate('/login', { replace: true });
    }, 0);
  };
  
  const filteredNavItems = navItems.filter(item => 
    user && item.allowedRoles.includes(user.role)
  );

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0F0F0F] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-lg">AK</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">AK47 Shawarma</h1>
            <p className="text-gray-500 text-xs">Stop</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-white font-medium">{user?.name?.charAt(0) || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{user?.name || 'User'}</p>
            <div className="flex items-center gap-1">
              <Shield size={12} className={user?.role === 'admin' ? 'text-yellow-400' : 'text-gray-400'} />
              <span className={cn(
                "text-xs capitalize",
                user?.role === 'admin' ? 'text-yellow-400' : 'text-gray-400'
              )}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-gray-800 text-yellow-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )
            }
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all duration-200 w-full"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-gray-600 text-xs text-center">Powered by SixSenses</p>
      </div>
    </aside>
  );
}
