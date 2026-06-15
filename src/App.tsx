import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import OrgListDashboard from './components/OrgListDashboard';
import CreateOrgPage from './components/CreateOrgPage';
import OrgBudgetDashboard from './components/OrgBudgetDashboard';
import ProfileSettingsPage from './components/ProfileSettingsPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('landing');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // Protected route guard logic
  const navigateWithGuard = (view: string) => {
    if (!user && ['dashboard', 'create-org', 'budget-dashboard', 'profile'].includes(view)) {
      setCurrentView('login');
    } else {
      setCurrentView(view);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest font-mono">
          Booting Isolated Workspaces...
        </p>
      </div>
    );
  }

  // Active view switches
  switch (currentView) {
    case 'landing':
      return <LandingPage onNavigate={navigateWithGuard} />;
    
    case 'login':
      return <AuthPage onNavigate={navigateWithGuard} />;
    
    case 'dashboard':
      return (
        <OrgListDashboard 
          onNavigate={navigateWithGuard} 
          onSelectOrg={setSelectedOrgId} 
        />
      );
    
    case 'create-org':
      return (
        <CreateOrgPage 
          onNavigate={navigateWithGuard} 
          onSelectOrg={setSelectedOrgId} 
        />
      );
    
    case 'budget-dashboard':
      if (!selectedOrgId) {
        navigateWithGuard('dashboard');
        return null;
      }
      return (
        <OrgBudgetDashboard 
          orgId={selectedOrgId} 
          onNavigate={navigateWithGuard} 
        />
      );
    
    case 'profile':
      return <ProfileSettingsPage onNavigate={navigateWithGuard} />;

    default:
      return <LandingPage onNavigate={navigateWithGuard} />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
