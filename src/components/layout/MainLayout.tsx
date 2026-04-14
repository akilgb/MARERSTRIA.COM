import React, { useState, useRef, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAppStore } from '../../store/useAppStore';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, FileText, CheckCircle2, Send, Loader2, X } from 'lucide-react';
import { chatWithCopilot } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

export default function MainLayout() {
  const { isCopilotOpen, toggleCopilot, currentSessionId } = useAppStore();
  const { user, sessions, courses } = useFirebaseData();
  
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: '👋 Hola, soy tu Inspector IA. ¿En qué te puedo ayudar con tu sesión hoy?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const currentCourse = currentSession ? courses.find(c => c.id === currentSession.courseId) : null;

  useEffect(() => {
    if (isCopilotOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isCopilotOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Prepare context
      const context = currentSession ? {
        title: currentSession.title,
        course: currentCourse?.name || 'Desconocido',
        content: currentSession.htmlContent || 'Sesión vacía'
      } : undefined;

      // Prepare history for Gemini
      const history = messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Prepare global context
      const globalContext = {
        userName: user?.displayName || 'Docente',
        courses: courses.map(c => ({ id: c.id, name: c.name, level: c.level })),
        sessions: sessions.map(s => ({ 
          id: s.id, 
          title: s.title, 
          courseId: s.courseId, 
          date: s.date,
          resourceCount: s.generatedResources?.length || 0
        }))
      };

      const responseText = await chatWithCopilot(userMsg.text, context, history, globalContext);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'Hubo un error al conectar con la IA. Por favor, intenta de nuevo.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = async (displayMessage: string, promptInstruction: string) => {
    if (isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: displayMessage };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Prepare context
      const context = currentSession ? {
        title: currentSession.title,
        course: currentCourse?.name || 'Desconocido',
        content: currentSession.htmlContent || 'Sesión vacía'
      } : undefined;

      // Prepare history for Gemini
      const history = messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Prepare global context
      const globalContext = {
        userName: user?.displayName || 'Docente',
        courses: courses.map(c => ({ id: c.id, name: c.name, level: c.level })),
        sessions: sessions.map(s => ({ 
          id: s.id, 
          title: s.title, 
          courseId: s.courseId, 
          date: s.date,
          resourceCount: s.generatedResources?.length || 0
        }))
      };

      // Send the specific prompt instruction instead of the display message
      const responseText = await chatWithCopilot(promptInstruction, context, history, globalContext);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'Hubo un error al conectar con la IA. Por favor, intenta de nuevo.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar />
        
        <main className="flex-1 flex overflow-hidden relative">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto bg-white">
            <Outlet />
          </div>
        </main>

        {/* Floating Copilot Bubble */}
        <AnimatePresence>
          {!isCopilotOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={toggleCopilot}
              className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-50 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Sparkles className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Floating Copilot Window */}
        <AnimatePresence>
          {isCopilotOpen && (
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed bottom-6 right-6 w-96 h-[600px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden"
            >
              <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-indigo-600 text-white shrink-0">
                <div className="flex items-center font-semibold text-sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Inspector IA
                </div>
                <button onClick={toggleCopilot} className="text-white/80 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 bg-gray-50/50">
                {/* Context Card */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contexto Activo</h4>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    {currentSession ? (
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{currentSession.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{currentCourse?.name}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">Ninguna sesión seleccionada</div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                {currentSession && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Acciones Rápidas</h4>
                    <div className="space-y-2">
                      <button 
                        onClick={() => handleQuickAction(
                          "Generar Rúbrica de Evaluación",
                          "Genera una rúbrica de evaluación en formato de tabla (Markdown) para esta sesión, basándote en su propósito y criterios de evaluación actuales. La tabla debe tener columnas para: Criterio, Logro Destacado, Logro Esperado, En Proceso, y En Inicio."
                        )}
                        disabled={isTyping}
                        className="w-full flex items-center gap-2 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-left px-3 py-2 rounded-lg transition-colors text-sm text-gray-700 disabled:opacity-50"
                      >
                        <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="truncate">Generar Rúbrica de Evaluación</span>
                      </button>
                      <button 
                        onClick={() => handleQuickAction(
                          "Alinear con CNEB",
                          "Revisa esta sesión y sugiere qué competencias, capacidades y desempeños del Currículo Nacional de Educación Básica (CNEB) de Perú se alinean mejor con las actividades descritas. Dame la respuesta estructurada en Markdown."
                        )}
                        disabled={isTyping}
                        className="w-full flex items-center gap-2 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-left px-3 py-2 rounded-lg transition-colors text-sm text-gray-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="truncate">Alinear con CNEB</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Chat Area */}
                <div className="flex-1 flex flex-col min-h-[200px]">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Asistente</h4>
                  <div className="flex-1 bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-3 space-y-4">
                      {messages.map((msg) => (
                        <div key={msg.id} className={cn(
                          "text-sm p-3 rounded-lg max-w-[90%]",
                          msg.role === 'user' 
                            ? "bg-indigo-600 text-white ml-auto rounded-br-none" 
                            : "bg-gray-100 text-gray-800 mr-auto rounded-bl-none"
                        )}>
                          {msg.role === 'model' ? (
                            <div className="markdown-body prose prose-sm max-w-none prose-p:leading-snug prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                              <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                          ) : (
                            msg.text
                          )}
                        </div>
                      ))}
                      {isTyping && (
                        <div className="bg-gray-100 text-gray-800 mr-auto rounded-lg rounded-bl-none p-3 max-w-[80%] flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                          <span className="text-xs text-gray-500">Escribiendo...</span>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Chat Input */}
                    <div className="p-2 border-t border-gray-100 bg-gray-50">
                      <div className="relative flex items-center">
                        <input 
                          type="text" 
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Pídele algo a la IA..." 
                          className="w-full bg-white border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-3 pr-10 py-2 text-sm transition-all outline-none"
                        />
                        <button 
                          onClick={handleSendMessage}
                          disabled={!inputValue.trim() || isTyping}
                          className="absolute right-1.5 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md disabled:opacity-50 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
