import React, { useState } from 'react';
import { Calendar, ShieldAlert, Zap, ArrowRight, Sparkles } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Plan Smarter',
      description: 'Organize your work with AI-powered planning and intelligent task prioritization designed for fast-paced schedules.',
      icon: <Calendar className="w-14 h-14 text-[#4F46E5]" />,
      badge: 'Step 1: Planning'
    },
    {
      title: 'Beat Deadlines',
      description: 'Predict deadline risks before they become problems. Receive proactive alerts when your workflow gets crowded.',
      icon: <ShieldAlert className="w-14 h-14 text-amber-500" />,
      badge: 'Step 2: Risk Forecast'
    },
    {
      title: 'Take Action',
      description: 'Generate custom AI-powered schedules and direct focus blocks so you complete high priority work with clarity.',
      icon: <Zap className="w-14 h-14 text-[#0EA5E9]" />,
      badge: 'Step 3: Execution'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    localStorage.setItem('taskpilot_onboarding_completed', 'true');
    onComplete();
  };

  const activeStep = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-[#0B0F19] z-40 flex flex-col justify-between p-6 sm:p-12 font-sans">
      {/* Top action header */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold tracking-tight text-white">TaskPilot AI</span>
          <span className="text-[10px] bg-slate-900 border border-white/5 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            v1.0
          </span>
        </div>
        
        {currentStep < steps.length - 1 && (
          <button
            onClick={handleFinish}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors py-2 px-3 hover:bg-white/5 rounded-xl"
          >
            Skip
          </button>
        )}
      </div>

      {/* Screen Slide Canvas */}
      <div className="max-w-xl w-full mx-auto flex flex-col items-center text-center my-auto py-8">
        {/* Animated illustration container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 blur-3xl bg-indigo-500/10 rounded-full"></div>
          <div className="relative bg-[#131B2E] p-8 rounded-[24px] border border-white/5 shadow-2xl flex items-center justify-center w-28 h-28 transform hover:scale-105 transition-transform">
            {activeStep.icon}
          </div>
        </div>

        {/* Text information */}
        <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest mb-3.5 block font-mono">
          {activeStep.badge}
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4 transition-all">
          {activeStep.title}
        </h2>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-sm">
          {activeStep.description}
        </p>

        {/* Progress indicators dots */}
        <div className="flex gap-2.5 mt-10">
          {steps.map((_, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                idx === currentStep ? 'w-8 bg-[#4F46E5]' : 'w-2 bg-slate-800 hover:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Interactive Bottom Control Bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between border-t border-white/5 pt-6">
        <span className="text-xs text-slate-500 font-medium">
          Screen {currentStep + 1} of 3
        </span>

        <button
          onClick={handleNext}
          className="px-6 py-3 bg-[#4F46E5] hover:bg-[#6366F1] text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-500/15 flex items-center gap-2 group transition-all"
        >
          {currentStep === steps.length - 1 ? (
            <>
              Get Started <Sparkles className="w-4 h-4 text-indigo-200" />
            </>
          ) : (
            <>
              Next Step <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
