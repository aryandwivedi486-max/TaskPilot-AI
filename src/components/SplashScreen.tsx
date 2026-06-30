import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in
    const animTimer = setTimeout(() => setVisible(true), 100);
    
    // Complete splash screen after 2.2 seconds total
    const finishTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300); // Wait for fade-out transition
    }, 2200);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 bg-[#0B0F19] z-50 flex flex-col items-center justify-center transition-all duration-300 ease-out ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <div className="flex flex-col items-center text-center px-6">
        {/* Animated App Icon Wrapper */}
        <div className="bg-[#4F46E5] p-5 rounded-[22px] shadow-2xl shadow-indigo-500/30 flex items-center justify-center mb-6 animate-pulse">
          <Send className="w-12 h-12 text-white transform -rotate-12" />
        </div>
        
        {/* Branding Typography */}
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
          TaskPilot AI
        </h1>
        <p className="text-sm font-medium text-slate-400 tracking-wider uppercase font-mono">
          Plan Smarter. Finish Faster.
        </p>
      </div>

      {/* Decorative clean footer credit */}
      <div className="absolute bottom-10 text-[10px] text-slate-600 tracking-widest font-semibold uppercase">
        Google Vibe2Ship Hackathon
      </div>
    </div>
  );
};
