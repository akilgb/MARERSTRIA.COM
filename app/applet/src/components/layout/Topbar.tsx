import React from 'react';
import { Menu, Search, Bell, Sparkles, ShieldAlert, Bot } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Topbar() {
  const { toggleSidebar, isExpertMode, toggleExpertMode, isCopilotOpen, toggleCopilot } = useAppStore();

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar (Cmd+K) */}
        <div className="hidden md:flex items-center bg-gray-100 rounded-md px-3 py-1.5 w-64 border border-transparent focus-within:border-indigo-500 focus-within:bg-white transition-colors">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Buscar... (Cmd+K)" 
            className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Expert Mode Toggle */}
        <button
          onClick={toggleExpertMode}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border",
            isExpertMode 
              ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" 
              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
          )}
        >
          {isExpertMode ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5 opacity-50" />}
          <span className="hidden sm:inline">{isExpertMode ? 'Modo Experto' : 'Modo Básico'}</span>
        </button>

        {/* Copilot Toggle */}
        <button
          onClick={toggleCopilot}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border",
            isCopilotOpen 
              ? "bg-indigo-100 text-indigo-700 border-indigo-200" 
              : "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100"
          )}
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Copiloto IA</span>
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>

        {/* Notifications */}
        <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </header>
  );
}
