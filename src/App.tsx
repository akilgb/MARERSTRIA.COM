import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import CalendarView from './pages/CalendarView';
import Workspace from './pages/Workspace';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import DatabasePanel from './pages/DatabasePanel';
import Onboarding from './components/Onboarding';
import { useAppStore } from './store/useAppStore';
import { auth, onAuthStateChanged, signInWithPopup, googleProvider } from './firebase';
import { Toaster } from 'sonner';

function ProtectedExpertRoute({ children }: { children: React.ReactNode }) {
  const isExpertMode = useAppStore((state) => state.isExpertMode);
  if (!isExpertMode) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    return localStorage.getItem('onboardingComplete') === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      // Reset onboarding state on auth change
      if (!currentUser) {
        setOnboardingComplete(false);
        localStorage.removeItem('onboardingComplete');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboardingComplete', 'true');
    setOnboardingComplete(true);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Cargando...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center max-w-md w-full">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Docente AI Copilot</h1>
          <p className="text-gray-600 mb-6">Inicia sesión para acceder a tu entorno de trabajo.</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Iniciar sesión con Google
          </button>
        </div>
      </div>
    );
  }

  if (!onboardingComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="workspace" element={<Workspace />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route 
            path="database" 
            element={
              <ProtectedExpertRoute>
                <DatabasePanel />
              </ProtectedExpertRoute>
            } 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
