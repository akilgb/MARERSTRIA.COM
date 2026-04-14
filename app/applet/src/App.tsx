import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import CalendarView from './pages/CalendarView';
import Workspace from './pages/Workspace';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import DatabasePanel from './pages/DatabasePanel';
import { useAppStore } from './store/useAppStore';

function ProtectedExpertRoute({ children }: { children: React.ReactNode }) {
  const isExpertMode = useAppStore((state) => state.isExpertMode);
  if (!isExpertMode) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
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
