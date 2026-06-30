import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isPlaceholderMode } from '../firebase/config';
import { 
  User, 
  LogOut, 
  ShieldCheck, 
  Mail, 
  Calendar, 
  Settings, 
  Bell, 
  Moon, 
  Eye, 
  Award, 
  ShieldAlert,
  Info
} from 'lucide-react';

export const ProfilePlaceholder: React.FC = () => {
  const { profile, logOut } = useAuth();

  // Settings States
  const [darkTheme, setDarkTheme] = useState<boolean>(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [rememberSession, setRememberSession] = useState<boolean>(true);

  const getUserInitials = () => {
    if (profile?.displayName) {
      return profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'TP';
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-24">
      
      {/* Header section */}
      <div className="pb-5 border-b border-white/5">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Pilot Configuration</h2>
        <p className="text-slate-400 text-sm mt-1">Manage local settings, application preferences, and view event credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Main profile details card & About section (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main user avatar info */}
          <div className="bg-[#141417] rounded-[24px] border border-white/5 p-6 flex flex-col items-center text-center shadow-xl">
            <div className="relative">
              <div className="w-24 h-24 bg-indigo-950 border-2 border-indigo-500/30 rounded-full flex items-center justify-center text-3xl font-extrabold text-indigo-400 shadow-lg shadow-indigo-500/15">
                {getUserInitials()}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-[#141417] rounded-full animate-pulse" />
            </div>
            
            <h3 className="font-extrabold text-white text-lg mt-4 leading-snug">{profile?.displayName || 'Task Pilot'}</h3>
            <span className="text-xs text-slate-500 font-mono mt-1">UID: {profile?.uid || 'N/A'}</span>

            <div className="w-full border-t border-white/5 my-5"></div>

            <button
              onClick={logOut}
              className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <LogOut className="w-4 h-4" /> Sign Out Account
            </button>
          </div>

          {/* About Section (Google Vibe2Ship Hackathon details) */}
          <div className="bg-[#141417] rounded-[24px] border border-white/5 p-6 space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#4F46E5]/5 rounded-full blur-2xl" />
            
            <h4 className="text-xs font-mono uppercase tracking-widest text-[#4F46E5] font-extrabold flex items-center gap-1.5">
              <Award className="w-4 h-4" /> About TaskPilot AI
            </h4>

            <div className="space-y-3 pt-2">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Platform Version</span>
                <p className="text-xs text-white font-semibold">TaskPilot AI v1.0.0 Stable</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Target Hackathon</span>
                <p className="text-xs text-indigo-400 font-extrabold">Google Vibe2Ship Hackathon 🚀</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Development Vision</span>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  A high-performance productivity companion designed to proactively solve the cognitive workload crisis using Google Gemini intelligence.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive preference toggles (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main system switches */}
          <div className="bg-[#141417] rounded-[24px] border border-white/5 p-6 md:p-8 space-y-6 shadow-xl">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2 pb-4 border-b border-white/5">
              <Settings className="w-5 h-5 text-indigo-400" /> Platform Preferences
            </h3>

            <div className="space-y-6 pt-2">
              
              {/* Toggle 1: Theme control */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-slate-400" /> Professional Dark Theme
                  </h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Force deep-black and slate design palettes across all dashboards.
                  </p>
                </div>
                
                <button
                  onClick={() => setDarkTheme(!darkTheme)}
                  className={`
                    w-12 h-6.5 rounded-full p-1 transition-all duration-300 relative cursor-pointer
                    ${darkTheme ? 'bg-[#4F46E5]' : 'bg-slate-800'}
                  `}
                >
                  <span className={`
                    block w-4.5 h-4.5 rounded-full bg-white transition-all duration-300 absolute top-1
                    ${darkTheme ? 'left-6.5' : 'left-1'}
                  `} />
                </button>
              </div>

              {/* Toggle 2: Audio / Push notifications */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-slate-400" /> Flow Notifications
                  </h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Trigger push messages and focus alarms when priority limits are reached.
                  </p>
                </div>

                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`
                    w-12 h-6.5 rounded-full p-1 transition-all duration-300 relative cursor-pointer
                    ${notificationsEnabled ? 'bg-[#4F46E5]' : 'bg-slate-800'}
                  `}
                >
                  <span className={`
                    block w-4.5 h-4.5 rounded-full bg-white transition-all duration-300 absolute top-1
                    ${notificationsEnabled ? 'left-6.5' : 'left-1'}
                  `} />
                </button>
              </div>

              {/* Toggle 3: Remember session */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-slate-400" /> Keep Remembered Session
                  </h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Saves credentials locally inside sandboxed caches for instant login response.
                  </p>
                </div>

                <button
                  onClick={() => setRememberSession(!rememberSession)}
                  className={`
                    w-12 h-6.5 rounded-full p-1 transition-all duration-300 relative cursor-pointer
                    ${rememberSession ? 'bg-[#4F46E5]' : 'bg-slate-800'}
                  `}
                >
                  <span className={`
                    block w-4.5 h-4.5 rounded-full bg-white transition-all duration-300 absolute top-1
                    ${rememberSession ? 'left-6.5' : 'left-1'}
                  `} />
                </button>
              </div>

            </div>
          </div>

          {/* Account credentials info panel */}
          <div className="bg-[#141417] rounded-[24px] border border-white/5 p-6 md:p-8 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2 pb-2 border-b border-white/5">
              <ShieldCheck className="w-5 h-5 text-indigo-400" /> Credentials Verification
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-300">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Contact Email: <strong>{profile?.displayName ? `${profile.displayName.toLowerCase().replace(/ /g, '')}@vibe2ship.com` : 'pilot@vibe2ship.com'}</strong></span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-300">
                <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Enrolled Date: <strong>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</strong></span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Security Shield: <strong>{isPlaceholderMode ? 'Simulated Sandbox Session' : 'Active Google Cloud IDP'}</strong></span>
              </div>
            </div>
          </div>

          {/* Sandbox alert if in placeholder mode */}
          {isPlaceholderMode && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/15 rounded-2xl flex items-start gap-3.5">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-extrabold text-amber-500 text-xs uppercase tracking-wider font-mono">Sandbox Local Sync Active</h5>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Platform is operating in local sandboxed cache configuration. This completely secures your API keys and coordinates transactions without hitting remote Firestore daily writing caps.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
