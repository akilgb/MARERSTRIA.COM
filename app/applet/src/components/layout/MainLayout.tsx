import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAppStore } from '../../store/useAppStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, FileText, CheckCircle2 } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function MainLayout() {
  const { isCopilotOpen } = useAppStore();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        
        <main className="flex-1 flex overflow-hidden relative">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto bg-white">
            <Outlet />
          </div>

          {/* Right Panel: AI Copilot */}
          <AnimatePresence>
            {isCopilotOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '22rem', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="hidden lg:flex flex-col border-l border-gray-200 bg-gray-50/50 z-20 shrink-0"
              >
                <div className="h-12 border-b border-gray-200 flex items-center px-4 font-semibold text-sm text-gray-800 bg-white shrink-0">
                  <Sparkles className="w-4 h-4 mr-2 text-indigo-600" />
                  Inspector IA
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Context Card */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contexto Activo</h4>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Sesión 1: Recolección</p>
                          <p className="text-xs text-gray-500 mt-0.5">Matemáticas • 4to Grado</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Acciones Rápidas</h4>
                    <div className="space-y-2">
                      <button className="w-full flex items-center gap-2 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-left px-3 py-2 rounded-lg transition-colors text-sm text-gray-700">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Generar Rúbrica de Evaluación
                      </button>
                      <button className="w-full flex items-center gap-2 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-left px-3 py-2 rounded-lg transition-colors text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Alinear con CNEB
                      </button>
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Asistente</h4>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-900">
                      👋 Hola, estoy analizando esta sesión. Veo que falta definir el tiempo exacto para el "Cierre". ¿Quieres que te sugiera una dinámica de 10 minutos?
                    </div>
                  </div>
                </div>

                {/* Chat Input */}
                <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Pídele algo a la IA..." 
                      className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-lg pl-3 pr-10 py-2 text-sm transition-all outline-none"
                    />
                    <button className="absolute right-2 top-1.5 p-1 text-indigo-600 hover:bg-indigo-50 rounded-md">
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
