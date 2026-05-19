import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthProvider } from './contexts/AuthContext';
import { fetchJson } from './utils/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function App() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await fetchJson(`${API_URL}/settings`);
      if (data && (data as any).success) {
        setSettings((data as any).settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg animate-pulse">
            <div className="h-8 w-8 bg-white rounded animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 font-medium">Memuat Aplikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <Routes>
            <Route path="/" element={<LandingPage settings={settings} />} />
            <Route path="/student" element={<StudentDashboard settings={settings} />} />
            <Route path="/admin/*" element={<AdminDashboard settings={settings} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
