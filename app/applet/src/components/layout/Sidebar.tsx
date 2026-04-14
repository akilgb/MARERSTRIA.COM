import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  FolderTree, 
  LineChart, 
  Settings, 
  Database,
  Menu,
  X
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type NavItem = {
  path: string;
  icon: React.ElementType;
  label: string;
  color?: string;
};

const navItems: NavItem[] = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/calendar', icon: CalendarDays, label: 'Calendario' },
  { path: '/workspace', icon: FolderTree, label: 'Espacio de Trabajo' },
  { path: '/analytics', icon: LineChart, label: 'Analíticas' },
  { path: '/settings', icon: Settings, label: 'Configuración' },
];

export default function Sidebar() {
  const { isExpertMode, isSidebarOpen, setSidebarOpen } = useAppStore();

  const allNavItems = isExpertMode 
    ? [...navItems, { path: '/database', icon: Database, label: 'Panel BD', color: 'text-red-500' }]
    : navItems;

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? '16rem' : '4rem',
          x: isSidebarOpen ? 0 : '-100%' 
        }}
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
          "md:translate-x-0" // Always visible on desktop, width changes
        )}
        style={{
          // Override motion x for desktop
          transform: window.innerWidth >= 768 ? 'none' : undefined
        }}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className={cn("flex items-center gap-3 overflow-hidden", !isSidebarOpen && "md:hidden")}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <span className="font-semibold text-gray-900 whitespace-nowrap">Docente AI</span>
          </div>
          
          {/* Mobile close button */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-2">
          {allNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative",
                isActive 
                  ? "bg-indigo-50 text-indigo-600" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
              title={!isSidebarOpen ? item.label : undefined}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", item.color)} />
              <span className={cn(
                "font-medium whitespace-nowrap transition-opacity duration-200",
                !isSidebarOpen && "md:opacity-0 md:w-0 md:overflow-hidden"
              )}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom section (User profile snippet) */}
        <div className="p-4 border-t border-gray-200">
          <div className={cn("flex items-center gap-3", !isSidebarOpen && "md:justify-center")}>
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
              alt="User" 
              className="w-8 h-8 rounded-full bg-gray-100 shrink-0"
            />
            <div className={cn("flex flex-col overflow-hidden", !isSidebarOpen && "md:hidden")}>
              <span className="text-sm font-medium text-gray-900 truncate">Prof. Juan</span>
              <span className="text-xs text-gray-500 truncate">juan@sanjuan.edu.pe</span>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
