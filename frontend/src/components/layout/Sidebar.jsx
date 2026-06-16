import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, TrendingUp, CalendarRange, LineChart, Sparkles,
  BarChart3, Activity, MailCheck, Newspaper, Briefcase, Settings,
  MessageSquare, Search, Bell, ChevronLeft, ChevronRight, X, Zap
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/live-ipos', label: 'Live IPOs', icon: TrendingUp },
  { path: '/upcoming-ipos', label: 'Upcoming IPOs', icon: CalendarRange },
  { path: '/listed-ipos', label: 'Listed IPOs', icon: LineChart },
  { path: '/ai-hub', label: 'AI Hub', icon: Sparkles },
  { path: '/market-trackers', label: 'Market Trackers', icon: BarChart3 },
  { path: '/ipo-news', label: 'IPO News', icon: Newspaper },
  { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { path: '/allotment-center', label: 'Allotment Center', icon: MailCheck },
  { path: '/live-data', label: 'Live Data', icon: Activity },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${collapsed ? 'w-20' : 'w-64'}
        transition-all duration-300 ease-in-out
        bg-dark-bg/95 backdrop-blur-xl border-r border-dark-border
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <Link to="/" className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
            <img src="/Code_Generated_Image.png" alt="HireTrade Logo" className="w-9 h-9 rounded-lg object-cover" />
            {!collapsed && (
              <div>
                <span className="text-white font-bold text-lg tracking-tight">Hire</span>
                <span className="text-accent font-bold text-lg">Trade</span>
                <p className="text-[10px] text-gray-500 -mt-1">AI Decision Engine</p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="text-gray-500 hover:text-white hidden lg:block">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {mobileOpen && (
            <button onClick={() => setMobileOpen(false)} className="text-gray-500 hover:text-white lg:hidden">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`
                    flex items-center ${collapsed ? 'justify-center' : 'gap-3'} 
                    px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-primary/15 text-primary border border-primary/20 shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-dark-card/50 border border-transparent'
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 ${collapsed ? '' : 'shrink-0'}`} />
                  {!collapsed && <span>{item.label}</span>}
                  {isActive && !collapsed && (
                    <motion.div layoutId="activeTab" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {!collapsed && (
          <div className="p-4 border-t border-dark-border">
            <div className="glass-card p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-accent" />
                <span className="text-xs font-medium text-gray-300">AI Market Analyst</span>
              </div>
              <p className="text-[11px] text-gray-500">Ask me about any IPO</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export function Header({ setMobileOpen }) {
  return (
    <header className="sticky top-0 z-30 bg-dark-bg/80 backdrop-blur-xl border-b border-dark-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setMobileOpen(true)}>
          <ChevronRight className="w-6 h-6" />
        </button>

        <div className="hidden md:flex items-center flex-1 max-w-md ml-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search IPOs, companies, industries..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-dark-card border border-dark-border text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-card transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent" />
          </button>
          <Link to="/ipo-copilot">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 text-primary hover:from-primary/30 hover:to-accent/30 transition-all text-sm font-medium">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">AI Market Analyst</span>
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
