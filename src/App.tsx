import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';

// Splash & Onboarding Flow Components
import { SplashScreen } from './components/SplashScreen';
import { Onboarding } from './components/Onboarding';
import { AuthScreen } from './components/AuthScreen';

// Core Navigation Elements
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';

// Dynamic Sub-Pages & Tab Views
import { Dashboard } from './pages/Dashboard';
import { TasksPlaceholder } from './pages/TasksPlaceholder';
import { AIInsightsPlaceholder } from './pages/AIInsightsPlaceholder';
import { AnalyticsPlaceholder } from './pages/AnalyticsPlaceholder';
import { ProfilePlaceholder } from './pages/ProfilePlaceholder';

import { useTasks } from './contexts/TaskContext';
import { Menu, X, Send, WifiOff } from 'lucide-react';

function LandingDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isOnline, lastSyncTime } = useTasks();
  
  // App states
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Check if onboarding completed once before
    const onboardingCompleted = localStorage.getItem('taskpilot_onboarding_completed') === 'true';
    if (!onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  // Handle Splash Screen complete
  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Handle Onboarding complete
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Wait for loading processes
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-[#0B0F19] flex flex-col items-center justify-center font-sans">
        <div className="w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Verifying Pilot Profile...</span>
      </div>
    );
  }

  // 1. Splash Screen
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // 2. Onboarding Screens (only once)
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // 3. User Authentication screen
  if (!user) {
    return <AuthScreen onSuccess={() => {}} />;
  }

  // Dynamic Page Selector based on Active Navigation Tab
  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'tasks':
        return <TasksPlaceholder setActiveTab={setActiveTab} />;
      case 'ai':
        return <AIInsightsPlaceholder />;
      case 'analytics':
        return <AnalyticsPlaceholder />;
      case 'profile':
        return <ProfilePlaceholder />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-100 font-sans flex overflow-hidden">
      
      {/* Sidebar Navigation - Desktop view (collapsible) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
      />

      {/* Main Content Dashboard Page */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto pb-24 lg:pb-12 bg-[#0A0A0B]">
        
        {/* Mobile Header Row */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#4F46E5] rounded-lg flex items-center justify-center shrink-0 transform -rotate-12">
              <Send className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-extrabold text-white tracking-tight">TaskPilot AI</span>
          </div>

          <span className="text-[9px] text-[#4F46E5] bg-[#4F46E5]/10 px-2 py-0.5 rounded-full border border-[#4F46E5]/20 uppercase font-mono font-bold">
            Active
          </span>
        </header>

        {/* Dynamic Page Container */}
        <div className="p-4 sm:p-8 flex-1">
          {!isOnline && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/15 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <WifiOff className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 text-left">
                  <h5 className="text-xs font-bold text-amber-500 uppercase tracking-wider font-mono">Offline Flight Active</h5>
                  <p className="text-[11px] text-slate-400">
                    TaskPilot is operating offline. All viewing, adding and completing of tasks is fully operational. AI optimization is suspended until online connectivity returns.
                  </p>
                </div>
              </div>
              <span className="text-[9px] text-slate-500 font-mono shrink-0">
                Last Sync: {lastSyncTime || 'Just Now'}
              </span>
            </div>
          )}
          {renderActivePage()}
        </div>

      </main>

      {/* Mobile Bottom Tab Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <LandingDashboard />
      </TaskProvider>
    </AuthProvider>
  );
}
