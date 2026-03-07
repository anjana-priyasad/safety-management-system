
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Dashboard from './pages/Dashboard';
import CreateIncident from './pages/CreateIncident';
import Inspection from './pages/Inspection';
import ActionTracker from './pages/ActionTracker';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Team from './pages/Team';
import Hazards from './pages/Hazards';
import Settings from './pages/Settings';
import Messages from './pages/Messages';
import InspectionList from './pages/inspections/InspectionList';
import TemplateBuilder from './pages/inspections/TemplateBuilder';
import PerformInspection from './pages/inspections/PerformInspection';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/report-incident" element={<CreateIncident />} />
      <Route path="/inspection" element={<Inspection />} />
      <Route path="/actions" element={<ActionTracker />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/hazards" element={<Hazards />} />
      <Route path="/team" element={<Team />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/messages" element={<Messages />} />

      {/* Inspection Routes */}
      <Route path="/inspections" element={<InspectionList />} />
      <Route path="/inspections/create" element={<TemplateBuilder />} />
      <Route path="/inspections/perform/:templateId" element={<PerformInspection />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
