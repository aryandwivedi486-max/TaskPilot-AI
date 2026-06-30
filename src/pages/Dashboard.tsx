import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import { TaskPriority, Task } from '../types';
import { 
  Plus, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Flame, 
  AlertTriangle, 
  Check, 
  PlusCircle, 
  Calendar, 
  X, 
  Layers,
  TrendingUp,
  Inbox,
  AlertCircle,
  Zap,
  Play,
  Pause,
  Square,
  Target,
  Award
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { profile } = useAuth();
  const { 
    tasks, 
    addTask, 
    updateTask,
    toggleTaskCompletion, 
    optimizeSchedule, 
    aiPlan, 
    loadingAI,
    isPlanOutdated,
    isOnline
  } = useTasks();

  const [optStep, setOptStep] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Focus Session States
  const [activeFocusSession, setActiveFocusSession] = useState<boolean>(false);
  const [focusTimeLeft, setFocusTimeLeft] = useState<number>(0);
  const [focusDurationTotal, setFocusDurationTotal] = useState<number>(0);
  const [focusTimerPaused, setFocusTimerPaused] = useState<boolean>(false);

  // Determine the ONE task the user should work on immediately
  const focusTask = useMemo(() => {
    const pendingTasks = tasks.filter(t => !t.completed);
    if (pendingTasks.length === 0) return null;

    // Use AI priority order if available
    if (aiPlan && aiPlan.priorityOrder && aiPlan.priorityOrder.length > 0) {
      for (const id of aiPlan.priorityOrder) {
        const found = pendingTasks.find(t => t.id === id);
        if (found) return found;
      }
    }

    // Default Fallback: sorted by priority and nearest deadline
    const priorityWeight = {
      [TaskPriority.CRITICAL]: 4,
      [TaskPriority.HIGH]: 3,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.LOW]: 1
    };

    return [...pendingTasks].sort((a, b) => {
      const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    })[0];
  }, [tasks, aiPlan]);

  // Productivity Score Calculation
  const productivityScore = useMemo(() => {
    if (tasks.length === 0) return 0;
    let score = 50; // base score

    const completed = tasks.filter(t => t.completed);
    const pending = tasks.filter(t => !t.completed);
    const highRisk = pending.filter(t => t.priority === TaskPriority.HIGH || t.priority === TaskPriority.CRITICAL);

    score += completed.length * 15;
    score -= pending.length * 4;
    score -= highRisk.length * 8;

    const now = new Date();
    const overdueCount = pending.filter(t => new Date(t.deadline) < now).length;
    score -= overdueCount * 12;

    if (aiPlan) {
      score += 15;
    }

    const rate = completed.length / tasks.length;
    score += Math.round(rate * 25);

    return Math.min(100, Math.max(0, score));
  }, [tasks, aiPlan]);

  // Motivational message based on productivity score
  const scoreFeedback = useMemo(() => {
    if (productivityScore >= 90) {
      return { label: 'Outstanding!', message: "You're ahead of schedule." };
    } else if (productivityScore >= 70) {
      return { label: 'Good progress.', message: 'Complete two more tasks.' };
    } else if (productivityScore > 0) {
      return { label: 'Heavy workload detected.', message: 'Consider optimization.' };
    }
    return { label: 'Awaiting tasks.', message: 'Create your first priority block.' };
  }, [productivityScore]);

  // Timer Ticking Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeFocusSession && !focusTimerPaused) {
      interval = setInterval(() => {
        setFocusTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleFocusComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeFocusSession, focusTimerPaused]);

  const startFocusSession = (task: Task) => {
    const durationInSeconds = (task.estimatedDuration || 25) * 60;
    setFocusDurationTotal(durationInSeconds);
    setFocusTimeLeft(durationInSeconds);
    setFocusTimerPaused(false);
    setActiveFocusSession(true);
  };

  const handleFocusComplete = async () => {
    if (focusTask) {
      try {
        await updateTask(focusTask.id, { completed: true });
      } catch (e) {
        console.error('Failed to mark task completed from Focus Mode:', e);
      }
    }
    setActiveFocusSession(false);
  };

  const formatFocusTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Add Task Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [duration, setDuration] = useState(60);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [category, setCategory] = useState('Deep Work');
  const [notes, setNotes] = useState('');

  // Dynamic Greeting based on Local Time
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserFirstName = () => {
    if (profile?.displayName) {
      return profile.displayName.split(' ')[0];
    }
    return 'Pilot';
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  // Helper Stats
  const totalTasksCount = tasks.length;
  const pendingTasksCount = tasks.filter(t => !t.completed).length;
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const criticalDeadlinesCount = tasks.filter(t => t.priority === TaskPriority.CRITICAL && !t.completed).length;

  // Handle local simulation optimization steps
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loadingAI) {
      setOptStep(0);
      interval = setInterval(() => {
        setOptStep(prev => {
          if (prev < 3) return prev + 1;
          return prev;
        });
      }, 500);
    } else {
      setOptStep(0);
    }
    return () => clearInterval(interval);
  }, [loadingAI]);

  const handleOptimizeClick = async () => {
    if (totalTasksCount === 0) {
      setErrorMsg('Add at least one task before optimizing your schedule!');
      return;
    }
    setErrorMsg(null);
    try {
      await optimizeSchedule();
    } catch (e) {
      setErrorMsg('Unable to optimize your day. Please check parameters and try again.');
    }
  };

  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Task Name is required.');
      return;
    }
    if (!deadline) {
      setErrorMsg('Deadline is required.');
      return;
    }

    setErrorMsg(null);
    try {
      await addTask({
        title: title.trim(),
        description: description.trim(),
        deadline: new Date(deadline).toISOString(),
        estimatedDuration: Number(duration),
        priority,
        category: category.trim() || 'General',
        notes: notes.trim(),
        completed: false
      });

      // Clear fields and modal
      setTitle('');
      setDescription('');
      setDeadline('');
      setDuration(60);
      setPriority(TaskPriority.MEDIUM);
      setCategory('Deep Work');
      setNotes('');
      setShowAddModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to schedule task.');
    }
  };

  const openQuickAdd = () => {
    setTitle('');
    setDescription('');
    // pre-fill a default deadline for convenience (tomorrow same time)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const offset = tomorrow.getTimezoneOffset();
    const localTime = new Date(tomorrow.getTime() - offset * 60 * 1000);
    setDeadline(localTime.toISOString().slice(0, 16));
    setDuration(60);
    setPriority(TaskPriority.MEDIUM);
    setCategory('Deep Work');
    setNotes('');
    setShowAddModal(true);
  };

  // Loading Steps Titles for simulation visualizer
  const loadingSteps = [
    'Reading Tasks...',
    'Analyzing Deadlines...',
    'Calculating Workload...',
    'Generating Recommendations...'
  ];

  // Helper Priority Colors
  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.CRITICAL:
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case TaskPriority.HIGH:
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case TaskPriority.MEDIUM:
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case TaskPriority.LOW:
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <div className="flex-1 space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {getGreeting()}, <span className="text-[#4F46E5]">{getUserFirstName()}</span>.
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-mono uppercase tracking-wider">
            {getFormattedDate()}
          </p>
        </div>

        {/* Quick actions bar */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={openQuickAdd}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            Create Task
          </button>
          
          <button
            onClick={handleOptimizeClick}
            disabled={totalTasksCount === 0 || loadingAI || !isOnline}
            className={`
              flex items-center gap-1.5 px-5 py-2.5 font-extrabold rounded-xl text-xs transition-all cursor-pointer
              ${totalTasksCount === 0 || !isOnline
                ? 'bg-slate-900 border border-white/5 text-slate-500 cursor-not-allowed opacity-55' 
                : 'bg-white hover:bg-slate-200 text-black shadow-lg shadow-white/5'}
            `}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
            {!isOnline ? 'AI Offline' : '✨ Optimize My Day'}
          </button>
        </div>
      </div>

      {/* Outdated Plan Banner notification (WHEN TASKS CHANGE) */}
      {isPlanOutdated && totalTasksCount > 0 && !loadingAI && (
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-[20px] text-xs text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-indigo-500/5 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#4F46E5]/20 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-white">Your AI plan may be outdated.</p>
              <p className="text-slate-400 text-[11px] mt-0.5">Tasks have changed. Recalculate your scheduled slots to stay aligned.</p>
            </div>
          </div>
          <button 
            onClick={handleOptimizeClick}
            className="px-4 py-2 bg-[#4F46E5] hover:bg-[#6366F1] text-white font-bold rounded-lg text-xs transition-all shadow cursor-pointer w-full sm:w-auto text-center"
          >
            ✨ Optimize My Day Again
          </button>
        </div>
      )}

      {/* Dynamic Error Banner */}
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[18px] text-xs text-red-400 flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-slate-500 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dynamic AI Loading state overlay */}
      {loadingAI && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0B]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141417] border border-white/5 rounded-[24px] max-w-md w-full p-8 flex flex-col items-center text-center shadow-2xl space-y-6">
            <div className="w-14 h-14 bg-[#4F46E5]/10 rounded-2xl flex items-center justify-center text-[#4F46E5] animate-spin mb-2">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-lg">Optimizing your day...</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                TaskPilot AI is assembling focus blocks and risk mitigations via Google Gemini.
              </p>
            </div>
            
            <div className="space-y-3.5 w-full max-w-xs text-left">
              {loadingSteps.map((step, idx) => {
                const isCompleted = idx < optStep;
                const isActive = idx === optStep;
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs font-mono">
                    {isCompleted ? (
                      <span className="text-emerald-400 font-extrabold text-sm shrink-0">✓</span>
                    ) : isActive ? (
                      <div className="w-3 h-3 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-800 shrink-0" />
                    )}
                    <span className={isCompleted ? 'text-emerald-400/80 line-through font-medium' : isActive ? 'text-white font-extrabold' : 'text-slate-500'}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM PRODUCTIVITY GRID & FOCUS CONTROLS */}
      {totalTasksCount === 0 ? (
        /* EMPTY TASK LIST STATE conforming exactly to rules */
        <div className="bg-[#141417] rounded-[24px] border border-white/5 p-12 text-center max-w-xl mx-auto my-16 flex flex-col items-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#4F46E5]/5 rounded-full blur-2xl animate-pulse" />
          <div className="w-16 h-16 bg-[#4F46E5]/10 rounded-[20px] flex items-center justify-center text-[#4F46E5] mb-6 border border-indigo-500/10">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">Create your first task to begin planning with AI</h3>
          <p className="text-slate-400 text-xs max-w-sm mt-3 leading-relaxed">
            TaskPilot AI uses Gemini intelligence to automatically schedule your focus blocks, analyze deadline risk levels, and compile actionable coaching recommendations.
          </p>
          
          <button
            onClick={openQuickAdd}
            className="mt-8 px-7 py-3.5 bg-[#4F46E5] hover:bg-[#6366F1] text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-500/15 cursor-pointer flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Create Your First Task
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Widget 1: Productivity Score (Circular Ring & Motivation) */}
            <div className="lg:col-span-5 bg-[#141417] rounded-[24px] border border-white/5 p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#4F46E5]/5 rounded-full blur-2xl group-hover:bg-[#4F46E5]/10 transition-colors" />
              
              {/* Circular Progress Ring */}
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-white/5 fill-transparent"
                    strokeWidth="8"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-[#4F46E5] fill-transparent transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - productivityScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-white tracking-tighter">{productivityScore}</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Score</span>
                </div>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block font-mono">Productivity Coefficient</span>
                <h4 className="text-lg font-extrabold text-white leading-tight">{scoreFeedback.label}</h4>
                <p className="text-xs text-slate-400 leading-normal">{scoreFeedback.message}</p>
                
                <div className="flex items-center gap-1 text-[10px] text-[#4F46E5] font-mono mt-1 justify-center sm:justify-start">
                  <Award className="w-3.5 h-3.5" />
                  <span>Calibrated via active workloads</span>
                </div>
              </div>
            </div>

            {/* Widget 2: Focus Mode (The ONE Task recommendation + Focus Now action) */}
            <div className="lg:col-span-7 bg-[#141417] rounded-[24px] border border-white/5 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#4F46E5]/5 rounded-full blur-2xl group-hover:bg-[#4F46E5]/10 transition-colors" />
              
              <div className="space-y-3.5 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] text-[#4F46E5] font-bold uppercase tracking-widest block font-mono">Coaching Directive</span>
                    <h4 className="text-sm font-extrabold text-white mt-1 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-[#4F46E5]" /> Current Core Target
                    </h4>
                  </div>
                  {focusTask && (
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded uppercase font-bold font-mono">
                      Recommended
                    </span>
                  )}
                </div>

                {focusTask ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center flex-1 py-1">
                    <div className="md:col-span-8 space-y-1">
                      <h5 className="text-sm font-bold text-slate-100 truncate leading-snug">{focusTask.title}</h5>
                      <p className="text-xs text-slate-400 line-clamp-1 leading-normal">{focusTask.description || "Deep focus project checkpoint."}</p>
                      <p className="text-[10px] text-slate-500 font-mono italic leading-relaxed mt-1">
                        Reason: Highest priority pending block with closest deadline.
                      </p>
                    </div>

                    <div className="md:col-span-4 flex flex-col md:items-end gap-1 font-mono text-[10px] text-slate-400 shrink-0">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#4F46E5]" />
                        Est: <strong className="text-white">{focusTask.estimatedDuration} Minutes</strong>
                      </span>
                      <span className="flex items-center gap-1 capitalize">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Priority: <strong className="text-white">{focusTask.priority}</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-slate-500 font-mono italic">No pending tasks found. Set up some tasks to engage Focus mode!</p>
                  </div>
                )}

                <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {focusTask ? "Ready for cognitive deep-work session." : "Timeline clear. All objectives accomplished."}
                  </span>
                  
                  <button
                    disabled={!focusTask}
                    onClick={() => focusTask && startFocusSession(focusTask)}
                    className={`
                      px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg
                      ${focusTask 
                        ? 'bg-[#4F46E5] hover:bg-[#6366F1] text-white shadow-indigo-600/10' 
                        : 'bg-slate-900 text-slate-600 border border-white/5 cursor-not-allowed opacity-50'}
                    `}
                  >
                    <Target className="w-4 h-4 text-white" />
                    🎯 Focus Now
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Bento Dashboards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT COLUMN: Active Timeline Tasks list (col-span-5) */}
          <div className="lg:col-span-5 bg-[#141417] rounded-[20px] border border-white/5 p-6 flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <div>
                <h3 className="font-bold text-white text-base">Active Timeline</h3>
                <p className="text-xs text-slate-500">Scheduled sprint parameters</p>
              </div>
              <button 
                onClick={() => setActiveTab('tasks')}
                className="text-[10px] text-indigo-400 font-bold hover:underline cursor-pointer"
              >
                Manage All
              </button>
            </div>

            {/* List box */}
            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {tasks.map(task => {
                const priorityColor = getPriorityColor(task.priority);
                const isOverdue = !task.completed && new Date(task.deadline) < new Date();
                const details = aiPlan?.taskDetails?.[task.id];
                const hasDetails = !!details;
                const isExpanded = expandedTaskId === task.id;
                
                const riskColor = details?.riskLevel === 'critical' || details?.riskLevel === 'high' 
                  ? 'text-red-400 bg-red-500/10 border-red-500/20' 
                  : details?.riskLevel === 'moderate' 
                    ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' 
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

                return (
                  <div 
                    key={task.id}
                    className={`
                      p-3.5 bg-[#18181C] rounded-xl border transition-all flex flex-col gap-2 hover:border-white/10 cursor-pointer
                      ${task.completed ? 'opacity-50 border-white/5' : 'border-white/5'}
                      ${isOverdue ? 'border-red-500/20 bg-red-500/5' : ''}
                    `}
                    onClick={() => hasDetails && setExpandedTaskId(isExpanded ? null : task.id)}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskCompletion(task.id);
                        }}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                          task.completed 
                            ? 'bg-[#4F46E5] border-[#4F46E5] text-white' 
                            : 'border-white/20 hover:border-indigo-400 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm font-semibold truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {task.title}
                          </p>
                          {details && (
                            <span className="text-[9px] font-extrabold text-indigo-400 bg-[#4F46E5]/15 px-1.5 py-0.5 rounded font-mono shrink-0">
                              Rank #{details.priorityRank}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-[9px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">
                            {task.category}
                          </span>
                          
                          <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-slate-500" /> {task.estimatedDuration}m
                          </span>
                          
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${priorityColor}`}>
                            {task.priority}
                          </span>

                          {details && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${riskColor}`}>
                              Risk: {details.riskLevel.toUpperCase()}
                            </span>
                          )}

                          {isOverdue && (
                            <span className="text-[9px] bg-red-500/15 text-red-400 border border-red-500/20 px-1 py-0.5 rounded font-bold uppercase font-mono">
                              Overdue!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Collapsible details section */}
                    {hasDetails && isExpanded && (
                      <div className="mt-2 pt-2 border-t border-white/5 text-xs text-slate-300 space-y-1.5 bg-black/25 p-3 rounded-lg animate-fade-in">
                        <p className="font-mono text-[10px] text-[#4F46E5] uppercase tracking-wider font-extrabold">Priority Alignment:</p>
                        <p className="text-slate-300 leading-relaxed text-[11px]">{details.priorityReason}</p>
                        <p className="font-mono text-[10px] text-amber-500 uppercase tracking-wider font-extrabold mt-2">Risk Mitigation Advice:</p>
                        <p className="text-slate-300 leading-relaxed text-[11px]">{details.riskReason} {details.riskRecommendation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: AI Plan Companion box (col-span-7) */}
          <div className="lg:col-span-7 bg-[#141417] rounded-[20px] border border-white/5 p-6 relative flex flex-col justify-between min-h-[420px]">
            
            {!aiPlan ? (
              /* FIRST AI STATE conforming exactly to rules (no fake AI data before optimization) */
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/5 animate-pulse">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-white text-base">Personalized Schedule Engine</h4>
                <p className="text-slate-400 text-xs mt-2 max-w-xs leading-relaxed">
                  Tap <strong className="text-white">✨ Optimize My Day</strong> to generate your personalized schedule.
                </p>
                <button
                  onClick={handleOptimizeClick}
                  className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-white animate-spin" />
                  ✨ Optimize My Day
                </button>
              </div>
            ) : (
              /* ACTIVE POST-OPTIMIZATION COMPANION STATE */
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                
                {/* Header Row */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-extrabold text-white text-base flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#4F46E5]" /> AI Optimized Smart Plan
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Engineered focus slots and rest thresholds</p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Risk Level:</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      aiPlan.deadlineRisk === 'high' || aiPlan.deadlineRisk === 'critical'
                        ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {aiPlan.deadlineRisk.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Daily Brief */}
                {/* Daily Brief */}
                <div className="p-4 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest block font-mono">
                      AI Daily Briefing
                    </span>
                    {aiPlan.dailyBrief?.focusWindow && (
                      <span className="text-[9px] text-[#4F46E5] bg-[#4F46E5]/10 px-2 py-0.5 rounded font-mono font-bold">
                        Focus: {aiPlan.dailyBrief.focusWindow}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    {aiPlan.dailyBrief?.summary ? (
                      `"${aiPlan.dailyBrief.summary} ${aiPlan.dailyBrief.message}"`
                    ) : (
                      `"You have ${pendingTasksCount} pending tasks today with a total of ${tasks.reduce((sum, t) => sum + t.estimatedDuration, 0)} minutes scheduled. Maximize output by maintaining focus during your scheduled blocks."`
                    )}
                  </p>
                </div>

                {/* Workload Status & Forecast */}
                {aiPlan.workloadBalance && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Workload Status</span>
                      <span className={`text-xs font-extrabold uppercase mt-1 block ${
                        aiPlan.workloadBalance.status === 'overloaded' ? 'text-red-400' :
                        aiPlan.workloadBalance.status === 'busy' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        ● {aiPlan.workloadBalance.status}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">{aiPlan.workloadBalance.explanation}</p>
                    </div>
                    
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Focus Capacity</span>
                      <span className="text-xs font-bold text-indigo-400 uppercase mt-1 block">
                        {aiPlan.dailyBrief?.estimatedWorkload || "Calculated Load"}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">Sprint blocks prioritized based on deadline stress coefficients.</p>
                    </div>
                  </div>
                )}

                {/* Priority Scheduled Slots */}
                <div className="space-y-2.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Today's Smart Schedule</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[180px] overflow-y-auto pr-1">
                    {aiPlan.todaySchedule && aiPlan.todaySchedule.length > 0 ? (
                      aiPlan.todaySchedule.map((slot, idx) => {
                        const isTask = !!slot.taskId;
                        return (
                          <div 
                            key={idx} 
                            className={`
                              rounded-xl p-3.5 border flex flex-col justify-between min-h-24 shadow-lg transition-all hover:border-white/10
                              ${idx === 0 
                                ? 'bg-indigo-950/40 border-indigo-500/25 shadow-indigo-500/5' 
                                : 'bg-slate-900/40 border-white/5 shadow-indigo-950/10'}
                            `}
                          >
                            <span className={`text-[9px] uppercase font-bold font-mono tracking-wider ${idx === 0 ? 'text-indigo-400' : 'text-slate-400'}`}>
                              {idx === 0 ? '🔥 Core Focus' : isTask ? `⚡ Sprint Block` : `☕ Activity Block`}
                            </span>
                            <h5 className="font-bold text-white text-xs truncate mt-1">{slot.taskTitle}</h5>
                            <span className={`text-[10px] font-mono flex items-center gap-1 mt-2.5 ${idx === 0 ? 'text-indigo-300/80' : 'text-slate-400'}`}>
                              <Clock className="w-3 h-3 shrink-0" /> {slot.startTime} - {slot.endTime} ({slot.duration}m)
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-500 font-mono">No slots scheduled.</p>
                    )}
                  </div>
                </div>

                {/* Recommendations List */}
                <div className="space-y-2.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Actionable Coaching Recommendations</span>
                  <div className="space-y-2">
                    {aiPlan.recommendations && aiPlan.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-normal">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Extra parameters footer */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-white/5 pt-3">
                  <span className="flex items-center gap-1.5 font-mono text-[10px]">
                    <Layers className="w-3.5 h-3.5 text-[#4F46E5]" />
                    Load: <strong className="text-slate-300 font-bold capitalize">{aiPlan.workloadBalance?.status || 'Dynamic Balance'}</strong>
                  </span>
                  <span className="font-mono text-[10px]">
                    Last Optimized: <strong className="text-slate-300 font-bold">{new Date(aiPlan.lastOptimizedAt).toLocaleTimeString()}</strong>
                  </span>
                </div>

              </div>
            )}

          </div>

        </div>
      </>
    )}

      {/* REUSABLE INLINE ADD TASK MODAL (PREMIUM & BEAUTIFUL) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131B2E] border border-white/5 rounded-[24px] max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#4F46E5]" /> Create Priority Task
            </h4>

            <form onSubmit={handleAddTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Task Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Refactor API module logic"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Description</label>
                <textarea
                  placeholder="Summarize objectives of this task"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-2 px-4 text-sm text-white placeholder-slate-600 focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Deadline *</label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Duration *</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value={TaskPriority.LOW}>🟢 Low</option>
                    <option value={TaskPriority.MEDIUM}>🟡 Medium</option>
                    <option value={TaskPriority.HIGH}>🔴 High</option>
                    <option value={TaskPriority.CRITICAL}>🚨 Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Work, Personal"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Notes</label>
                <input
                  type="text"
                  placeholder="Any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#4F46E5] hover:bg-[#6366F1] text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                ✨ Save Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. IMMERSIVE DISTRACTION-FREE FOCUS MODE OVERLAY */}
      {activeFocusSession && focusTask && (
        <div className="fixed inset-0 z-55 bg-[#070708] flex flex-col items-center justify-center p-6 animate-fade-in text-center select-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.08),transparent)] pointer-events-none" />
          
          <div className="max-w-md w-full space-y-8 relative z-10 flex flex-col items-center">
            
            {/* Header branding */}
            <div className="space-y-1">
              <div className="w-10 h-10 bg-[#4F46E5]/15 rounded-xl flex items-center justify-center text-[#4F46E5] mx-auto animate-pulse">
                <Target className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#4F46E5] font-bold mt-2">Active Focus Flight</h4>
              <p className="text-[10px] text-slate-500 font-mono">Telemetry sync in progress</p>
            </div>

            {/* Core Task Card */}
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white tracking-tight leading-snug">{focusTask.title}</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">{focusTask.description || "Tackling planned sprint parameter."}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] text-slate-400 font-mono">
                <span>Category:</span>
                <strong className="text-[#4F46E5]">{focusTask.category}</strong>
              </div>
            </div>

            {/* Giant Countdown circle with glowing borders */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#4F46E5]/5 rounded-full blur-xl animate-pulse" />
              
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="112"
                  className="stroke-white/5 fill-transparent"
                  strokeWidth="6"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="112"
                  className="stroke-[#4F46E5] fill-transparent transition-all duration-1000 ease-linear"
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 112}
                  strokeDashoffset={2 * Math.PI * 112 * (1 - focusTimeLeft / focusDurationTotal)}
                  strokeLinecap="round"
                />
              </svg>

              <div className="flex flex-col items-center justify-center space-y-1">
                <span className="text-5xl font-extrabold text-white tracking-tighter font-mono">{formatFocusTime(focusTimeLeft)}</span>
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Remaining</span>
              </div>
            </div>

            {/* Coach Quote/Tip */}
            <p className="text-xs text-slate-400 leading-relaxed italic max-w-xs">
              "Maintain flow. Put devices on silent. Your highest-priority work demands absolute deep focus."
            </p>

            {/* Dynamic Interactive Controls */}
            <div className="flex items-center gap-4.5">
              
              {/* Pause/Resume */}
              <button
                onClick={() => setFocusTimerPaused(!focusTimerPaused)}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center border transition-all cursor-pointer
                  ${focusTimerPaused 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                    : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'}
                `}
                title={focusTimerPaused ? 'Resume Focus Timer' : 'Pause Focus Timer'}
              >
                {focusTimerPaused ? <Play className="w-5 h-5 fill-emerald-400" /> : <Pause className="w-5 h-5" />}
              </button>

              {/* Mark Complete */}
              <button
                onClick={handleFocusComplete}
                className="px-6 py-3.5 bg-[#4F46E5] hover:bg-[#6366F1] text-white font-extrabold rounded-2xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
                title="Mark Task Completed & Exit"
              >
                <CheckCircle className="w-4 h-4 text-white" />
                Complete Task
              </button>

              {/* Terminate focus session */}
              <button
                onClick={() => setActiveFocusSession(false)}
                className="w-12 h-12 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-full flex items-center justify-center transition-all cursor-pointer"
                title="Abandon Focus Flight"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
