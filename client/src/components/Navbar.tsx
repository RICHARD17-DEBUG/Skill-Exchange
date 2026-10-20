import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  User, 
  LogOut, 
  ChevronDown, 
  Shield, 
  GraduationCap, 
  Presentation, 
  Menu, 
  X,
  CreditCard,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CreditBadge } from './CreditBadge';
import { NotificationDropdown } from './NotificationDropdown';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, switchRole } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleSwitching, setRoleSwitching] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleChange = async (role: UserRole) => {
    if (role === user?.currentRole) return;
    setRoleSwitching(true);
    await switchRole(role);
    setRoleSwitching(false);
    setUserMenuOpen(false);

    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'provider') navigate('/provider/dashboard');
    else navigate('/learner/dashboard');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.currentRole === 'admin') return '/admin/dashboard';
    if (user.currentRole === 'provider') return '/provider/dashboard';
    return '/learner/dashboard';
  };

  const roleLabels = {
    learner: 'Skill Seeker (Learner)',
    provider: 'Skill Provider',
    admin: 'Administrator',
  };

  const roleIcons = {
    learner: <GraduationCap size={14} className="text-indigo-600" />,
    provider: <Presentation size={14} className="text-emerald-600" />,
    admin: <Shield size={14} className="text-purple-600" />,
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-900 border-b-2 border-black shadow-[0_3px_0_0_#000] text-stone-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Logo & Public Nav */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 border-2 border-black bg-amber-400 flex items-center justify-center text-black font-pixel text-xs shadow-[2px_2px_0px_#000] group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-transform">
                👾
              </div>
              <div className="flex flex-col">
                <span className="font-pixel text-xs tracking-tight text-stone-100">
                  SKILL<span className="text-amber-400">EXCHANGE</span>
                </span>
                <span className="font-arcade text-[11px] text-stone-400 tracking-wider">
                  [ARCADE CO-OP v2.4]
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              <Link
                to="/explore"
                className={`retro-btn font-pixel text-[9px] px-3 py-1.5 flex items-center gap-1.5 ${
                  location.pathname === '/explore'
                    ? 'bg-amber-400 text-black font-bold'
                    : 'bg-stone-800 text-stone-300 hover:text-white'
                }`}
              >
                <span>[EXPLORE SKILLS]</span>
              </Link>
              {isAuthenticated && (
                <Link
                  to={getDashboardPath()}
                  className={`retro-btn font-pixel text-[9px] px-3 py-1.5 flex items-center gap-1.5 ${
                    location.pathname.includes('/dashboard')
                      ? 'bg-amber-400 text-black font-bold'
                      : 'bg-stone-800 text-stone-300 hover:text-white'
                  }`}
                >
                  <span>[MY DASHBOARD]</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Right: User State / Credits / Role Switcher */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {/* Skill Credit Balance Badge */}
                <Link
                  to="/learner/credits"
                  className="retro-btn p-0.5 inline-block"
                  title="Your Arcade Coin Balance"
                >
                  <CreditBadge amount={user.creditBalance} size="sm" />
                </Link>

                {/* Role Switcher Pill */}
                <div className="relative">
                  <div className="flex items-center border-2 border-black bg-stone-950 p-1 text-xs gap-1 shadow-[2px_2px_0px_#000]">
                    <button
                      onClick={() => handleRoleChange('learner')}
                      disabled={roleSwitching}
                      className={`flex items-center gap-1 px-2 py-1 font-pixel text-[8px] transition-all ${
                        user.currentRole === 'learner'
                          ? 'bg-amber-400 text-black border border-black shadow-[1px_1px_0px_#000] font-bold'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <GraduationCap size={12} />
                      <span>P1:LEARNER</span>
                    </button>
                    <button
                      onClick={() => handleRoleChange('provider')}
                      disabled={roleSwitching}
                      className={`flex items-center gap-1 px-2 py-1 font-pixel text-[8px] transition-all ${
                        user.currentRole === 'provider'
                          ? 'bg-emerald-500 text-black border border-black shadow-[1px_1px_0px_#000] font-bold'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Presentation size={12} />
                      <span>P2:PROVIDER</span>
                    </button>
                    {user.roles.includes('admin') && (
                      <button
                        onClick={() => handleRoleChange('admin')}
                        disabled={roleSwitching}
                        className={`flex items-center gap-1 px-2 py-1 font-pixel text-[8px] transition-all ${
                          user.currentRole === 'admin'
                            ? 'bg-red-500 text-white border border-black shadow-[1px_1px_0px_#000] font-bold'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <Shield size={12} />
                        <span>ADMIN</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifications Dropdown */}
                <NotificationDropdown />

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="retro-btn p-1.5 bg-stone-800 hover:bg-stone-700 flex items-center gap-2"
                  >
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=44403c&color=facc15&bold=true`}
                      alt={user.name}
                      className="w-7 h-7 border border-black object-cover"
                    />
                    <span className="font-pixel text-[8px] text-stone-200 max-w-[100px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown size={12} className="text-stone-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 retro-card bg-stone-900 border-2 border-black py-1.5 z-50 divide-y-2 divide-black">
                      <div className="px-3.5 py-2">
                        <p className="font-pixel text-[8px] text-stone-400">PLAYER PROFILE</p>
                        <p className="font-pixel text-[10px] text-amber-300 truncate mt-0.5">{user.name}</p>
                        <p className="font-retro-mono text-[10px] text-stone-400 truncate">{user.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to={getDashboardPath()}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2 font-pixel text-[9px] text-stone-300 hover:bg-stone-800 hover:text-amber-400"
                        >
                          {roleIcons[user.currentRole]}
                          <span>[DASHBOARD]</span>
                        </Link>
                        <Link
                          to="/learner/sessions"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2 font-pixel text-[9px] text-stone-300 hover:bg-stone-800 hover:text-amber-400"
                        >
                          <Calendar size={13} />
                          <span>[MY BOOKINGS]</span>
                        </Link>
                        <Link
                          to="/learner/credits"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2 font-pixel text-[9px] text-stone-300 hover:bg-stone-800 hover:text-amber-400"
                        >
                          <Sparkles size={13} />
                          <span>[COIN LEDGER]</span>
                        </Link>
                        <Link
                          to="/learner/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2 font-pixel text-[9px] text-stone-300 hover:bg-stone-800 hover:text-amber-400"
                        >
                          <User size={13} />
                          <span>[EDIT AVATAR]</span>
                        </Link>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2 font-pixel text-[9px] text-red-400 hover:bg-stone-800 hover:text-red-300"
                        >
                          <LogOut size={13} />
                          <span>[QUIT GAME]</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="retro-btn font-pixel text-[9px] px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200"
                >
                  [LOG IN]
                </Link>
                <Link
                  to="/register"
                  className="retro-btn font-pixel text-[9px] px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold flex items-center gap-1.5"
                >
                  <span>JOIN & GET 100 COINS</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && user && (
              <CreditBadge amount={user.creditBalance} size="sm" />
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="retro-btn p-1.5 bg-stone-800 text-stone-200 hover:bg-stone-700"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-black bg-stone-900 px-4 pt-3 pb-6 space-y-2.5">
          <Link
            to="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 border-2 border-black bg-stone-800 font-pixel text-[9px] text-stone-200 hover:bg-stone-700"
          >
            [EXPLORE SKILLS]
          </Link>
          {isAuthenticated && user ? (
            <>
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 border-2 border-black bg-stone-800 font-pixel text-[9px] text-stone-200 hover:bg-stone-700"
              >
                [MY DASHBOARD - {user.currentRole.toUpperCase()}]
              </Link>
              <Link
                to="/learner/credits"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 border-2 border-black bg-stone-800 font-pixel text-[9px] text-amber-400 hover:bg-stone-700"
              >
                [COIN LEDGER: {user.creditBalance} COINS]
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 border-2 border-black bg-red-950 font-pixel text-[9px] text-red-300 hover:bg-red-900"
              >
                [QUIT GAME / LOG OUT]
              </button>
            </>
          ) : (
            <div className="pt-2 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 retro-btn font-pixel text-[9px] bg-stone-800 text-stone-200"
              >
                [LOG IN]
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 retro-btn font-pixel text-[9px] bg-amber-400 text-black font-bold"
              >
                GET 100 COINS
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};