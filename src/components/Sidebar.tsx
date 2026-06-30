import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Send, 
  Sparkles, 
  Calendar, 
  Zap, 
  BarChart3, 
  User, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Database,
  ShieldAlert,
  Terminal
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen 
}) => {
  const { profile, logOut } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Calendar className="w-5 h-5" /> },
    { id: 'tasks', label: 'Tasks', icon: <Database className="w-5 h-5" /> },
    { id: 'ai', label: 'AI Insights', icon: <Zap className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  const getUserInitials = () => {
    if (profile?.displayName) {
      return profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'TP';
  };

  return (
    <aside className={`
      hidden lg:flex flex-col bg-[#0A0A0B] border-r border-white/5 p-6 h-screen transition-all duration-300 ease-in-out select-none shrink-0
      ${isOpen ? 'w-64' : 'w-24'}
    `}>
      {/* Sidebar Header branding */}
      <div className="flex items-center justify-between mb-10 px-1">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 bg-[#4F46E5] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 transform -rotate-12">
            <Send className="w-5 h-5 text-white" />
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight text-white block truncate">TaskPilot AI</span>
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest block">Core Pilot</span>
            </div>
          )}
        </div>
        
        {/* Toggle Collapse controller */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                w-full px-4 py-3.5 rounded-xl font-bold flex items-center gap-3 transition-all relative group
                ${isActive 
                  ? 'bg-[#4F46E5]/10 text-[#4F46E5]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
            >
              {/* Highlight active dot indicator */}
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] absolute left-1.5 top-1/2 -translate-y-1/2"></div>
              )}
              
              <div className={isActive ? 'text-[#4F46E5]' : 'text-slate-500 group-hover:text-slate-300 transition-colors'}>
                {item.icon}
              </div>

              {isOpen && <span className="text-sm leading-none">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Interactive Coach Box */}
      {isOpen && (
        <div className="mb-6 p-4 bg-slate-900/40 rounded-[20px] border border-white/5 relative overflow-hidden group">
          <p className="text-[9px] text-indigo-400 mb-2 uppercase tracking-widest font-bold flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            AI Coach Quote
          </p>
          <p className="text-xs text-slate-300 italic leading-relaxed font-serif">
            "You're 15% faster when you tackle deep work before 11 AM."
          </p>
        </div>
      )}

      {/* Active User Captain box */}
      {profile && (
        <div className="pt-4 border-t border-white/5 flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
            {getUserInitials()}
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-white truncate">{profile.displayName}</span>
              <span className="block text-[10px] text-slate-500 font-medium font-mono truncate">UID: {profile.uid.slice(0, 8)}</span>
            </div>
          )}
          <button 
            onClick={logOut}
            className="p-2 hover:text-red-400 text-slate-500 hover:bg-white/5 rounded-lg transition-colors shrink-0"
            title="Sign Out Account"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
