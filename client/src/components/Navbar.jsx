import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Landmark,
  LayoutDashboard,
  Users,
  CreditCard,
  FileBarChart,
  Sun,
  Moon,
  LogOut,
  RotateCcw,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onDataReset }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [resetting, setResetting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'loans', label: 'Loans & EMIs', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
  ];

  const handleReset = async () => {
    if (!window.confirm('Reset all demo data back to initial seed state? Any freshly added loans/members will be cleared.')) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        if (onDataReset) onDataReset();
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                Loan EMI Tracker
                <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  8% Reducing
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
                Staff Portfolio & Repayment Hub
              </p>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* Reset Database Button */}
            <button
              onClick={handleReset}
              disabled={resetting}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs flex items-center gap-1.5"
              title="Reset data to initial state"
            >
              <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden lg:inline text-xs">Reset Data</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile & Logout */}
            <div className="hidden sm:flex items-center pl-2 ml-1 border-l border-slate-200 dark:border-slate-800 gap-2.5">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {user?.name || 'Staff User'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {user?.role || 'Loan Officer'}
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-3">
              <span className="text-xs text-slate-500">{user?.name}</span>
              <button
                onClick={logout}
                className="text-xs text-rose-600 font-medium flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
