import React from 'react';
import { 
  Calendar, 
  Database, 
  Zap, 
  BarChart3, 
  User 
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <Calendar className="w-5 h-5" /> },
    { id: 'tasks', label: 'Tasks', icon: <Database className="w-5 h-5" /> },
    { id: 'ai', label: 'AI Insights', icon: <Zap className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0E1322] border-t border-white/5 px-2 py-1.5 flex justify-around items-center z-30 shadow-lg shadow-black/25">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex flex-col items-center justify-center py-1 px-3.5 rounded-xl transition-all
              ${isActive ? 'text-[#4F46E5] bg-[#4F46E5]/10' : 'text-slate-400'}
            `}
          >
            <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
              {tab.icon}
            </div>
            <span className="text-[9px] font-bold mt-1 tracking-tight">
              {tab.label.split(' ')[0]} {/* Grab first word for screen compact fit */}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
