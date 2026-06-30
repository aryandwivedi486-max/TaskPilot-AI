import React, { useState } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { TaskPriority, Task } from '../types';
import { 
  Sparkles, 
  Compass, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  TrendingUp, 
  Layers, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  Zap,
  Coffee,
  HelpCircle
} from 'lucide-react';

export const AIInsightsPlaceholder: React.FC = () => {
  const { aiPlan, tasks, optimizeSchedule, loadingAI } = useTasks();
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(null);

  const handleOptimizeClick = async () => {
    try {
      await optimizeSchedule();
    } catch (e) {
      console.error(e);
    }
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const totalFocusMinutes = pendingTasks.reduce((sum, t) => sum + t.estimatedDuration, 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  // If there's no active AI Plan, show a gorgeous standby prompt
  if (!aiPlan) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-400 mx-auto mb-6 border border-indigo-500/10 animate-pulse">
          <Sparkles className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">AI Coach Insights Standby</h2>
        <p className="text-slate-400 text-sm mt-3 max-w-lg mx-auto leading-relaxed">
          TaskPilot AI is ready to compile your cognitive workloads, rank your priorities, and design a personalized focus agenda.
        </p>
        
        <button
          onClick={handleOptimizeClick}
          disabled={tasks.length === 0 || loadingAI}
          className={`
            mt-8 px-8 py-4 font-extrabold rounded-2xl text-xs flex items-center gap-2.5 mx-auto transition-all cursor-pointer shadow-lg
            ${tasks.length === 0 
              ? 'bg-slate-900 border border-white/5 text-slate-500 cursor-not-allowed opacity-50' 
              : 'bg-[#4F46E5] hover:bg-[#6366F1] text-white shadow-indigo-600/10'}
          `}
        >
          <Sparkles className="w-4 h-4 text-white" />
          ✨ Optimize My Day
        </button>
        {tasks.length === 0 && (
          <p className="text-[11px] text-slate-500 mt-4 font-mono">Create at least one task to activate coaching telemetry.</p>
        )}
      </div>
    );
  }

  // Helper to resolve tasks in sorted order according to aiPlan.priorityOrder
  const sortedPendingTasks = [...pendingTasks].sort((a, b) => {
    const aIndex = aiPlan.priorityOrder?.indexOf(a.id) ?? -1;
    const bIndex = aiPlan.priorityOrder?.indexOf(b.id) ?? -1;
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    // Fallback: Priority
    const priorityWeight = {
      [TaskPriority.CRITICAL]: 4,
      [TaskPriority.HIGH]: 3,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.LOW]: 1
    };
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-24">
      
      {/* Header Banner */}
      <div className="pb-5 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">AI Coach Insights</h2>
          <p className="text-slate-400 text-sm mt-1">Deep cognitive analysis, priority rankings, and custom scheduling mitigations.</p>
        </div>
        <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full font-mono">
          Last Calibrated: {new Date(aiPlan.lastOptimizedAt).toLocaleTimeString()}
        </span>
      </div>

      {/* SECTION 1: AI Daily Brief */}
      <div className="bg-[#141417] rounded-[24px] border border-white/5 p-6 md:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4F46E5]/5 rounded-full blur-3xl pointer-events-none" />
        
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 font-mono flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> 1. AI Daily Brief
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-white/5">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Today's Workload</span>
            <p className="text-lg font-extrabold text-white capitalize flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              {aiPlan.workloadBalance?.status || 'Balanced'}
            </p>
            <p className="text-xs text-slate-400 leading-normal">
              {aiPlan.workloadBalance?.explanation || "Your cognitive workload is within optimal parameters."}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Estimated Focus Hours</span>
            <p className="text-lg font-extrabold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              {totalFocusHours} Hours
            </p>
            <p className="text-xs text-slate-400 leading-normal">
              Aggregated focus allocation for {pendingTasks.length} pending sprints.
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Best Focus Window</span>
            <p className="text-lg font-extrabold text-[#4F46E5] flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              {aiPlan.dailyBrief?.focusWindow || '09:00 AM - 12:00 PM'}
            </p>
            <p className="text-xs text-slate-400 leading-normal">
              Highest productivity and mental sharpness index.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5">
          <span className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest font-mono block mb-1">Coach Message</span>
          <p className="text-sm font-medium text-slate-200 leading-relaxed italic">
            "{aiPlan.dailyBrief?.message || "Keep momentum high. Focus on completing critical elements early in the session."}"
          </p>
        </div>
      </div>

      {/* SECTION 2: Priority Ranking */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 font-mono flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> 2. Priority Ranking
        </h3>
        
        {sortedPendingTasks.length === 0 ? (
          <div className="p-8 text-center bg-[#141417] border border-white/5 rounded-[20px] text-slate-500 text-xs italic">
            No pending tasks. Celebrate! All priorities finished.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {sortedPendingTasks.map((task, idx) => {
              const details = aiPlan.taskDetails?.[task.id];
              const displayPriority = idx + 1;
              return (
                <div key={task.id} className="bg-[#141417] rounded-[20px] border border-white/5 p-5 flex flex-col md:flex-row justify-between gap-4 shadow-md hover:border-white/10 transition-colors">
                  <div className="flex gap-4 items-start">
                    <span className="w-8 h-8 bg-[#4F46E5]/10 border border-[#4F46E5]/20 text-[#4F46E5] rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0">
                      #{displayPriority}
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-white leading-snug">{task.title}</h4>
                      <p className="text-xs text-slate-400 leading-normal">{task.description || "Active core target parameter."}</p>
                      <p className="text-xs text-slate-500 pt-1 leading-relaxed">
                        <strong className="text-indigo-400 font-medium">Coach Justification:</strong> {details?.priorityReason || `Critical focal weight sorted for ${task.priority} priority.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col justify-between md:justify-center items-end shrink-0 gap-1 md:text-right font-mono text-[10px] text-slate-400 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{task.estimatedDuration} mins</span>
                    </span>
                    <span className="flex items-center gap-1.5 md:mt-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>{new Date(task.deadline).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: Smart Timeline */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 font-mono flex items-center gap-2">
          <Clock className="w-4 h-4" /> 3. Smart Timeline
        </h3>

        {aiPlan.todaySchedule && aiPlan.todaySchedule.length > 0 ? (
          <div className="bg-[#141417] rounded-[24px] border border-white/5 p-6 md:p-8 space-y-6 relative">
            <div className="absolute top-8 bottom-8 left-6 md:left-8 w-0.5 border-l-2 border-dashed border-white/5" />
            
            {aiPlan.todaySchedule.map((block, idx) => (
              <div key={idx} className="relative pl-10 md:pl-12 flex flex-col md:flex-row md:items-center justify-between gap-3 group">
                <div className="absolute left-4 md:left-6 -translate-x-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-[#4F46E5] ring-4 ring-indigo-500/10 z-10 group-hover:scale-110 transition-transform" />
                
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[#4F46E5] font-extrabold">{block.startTime} - {block.endTime}</span>
                  <h4 className="text-sm font-extrabold text-white leading-snug">{block.taskTitle}</h4>
                </div>

                <span className="text-[10px] bg-white/5 border border-white/5 text-slate-400 font-mono px-2.5 py-1 rounded-lg shrink-0 self-start md:self-auto">
                  {block.duration} Mins
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#141417] border border-white/5 rounded-[20px] text-slate-500 text-xs italic">
            No schedule blocks logged. Click Optimize to populate timeline.
          </div>
        )}
      </div>

      {/* SECTION 4: Deadline Risk Dashboard */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 font-mono flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> 4. Deadline Risk Dashboard
        </h3>

        {pendingTasks.length === 0 ? (
          <div className="p-8 text-center bg-[#141417] border border-white/5 rounded-[20px] text-slate-500 text-xs italic">
            No active risks. Excellent.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTasks.map(task => {
              const details = aiPlan.taskDetails?.[task.id];
              const riskLevel = details?.riskLevel || 'low';
              const isExpanded = expandedRiskId === task.id;

              const badgeColor = 
                riskLevel === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                riskLevel === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                riskLevel === 'moderate' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

              return (
                <div key={task.id} className="bg-[#141417] rounded-[20px] border border-white/5 overflow-hidden transition-all duration-300">
                  <div 
                    onClick={() => setExpandedRiskId(isExpanded ? null : task.id)}
                    className="p-5 flex justify-between items-center gap-4 cursor-pointer hover:bg-white/[0.01]"
                  >
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-white truncate max-w-xs sm:max-w-md">{task.title}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">Deadline: {new Date(task.deadline).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] uppercase font-bold px-2.5 py-1 rounded-full border font-mono ${badgeColor}`}>
                        {riskLevel} Risk
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-5 bg-black/20 border-t border-white/5 space-y-3 text-xs leading-relaxed">
                      <div>
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block font-mono">Risk Assessment Reason</span>
                        <p className="text-slate-300 mt-1">{details?.riskReason || "No custom danger coefficients identified for this block."}</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block font-mono">AI Coach Proactive Action Recommendation</span>
                        <p className="text-slate-300 mt-1">{details?.riskRecommendation || "Complete this item within its scheduled slot to secure deadline parameters."}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 5: AI Recommendations */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 font-mono flex items-center gap-2">
          <Compass className="w-4 h-4" /> 5. AI Recommendations
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {aiPlan.recommendations.map((rec, idx) => (
            <div key={idx} className="bg-[#141417] p-5 rounded-[20px] border border-white/5 flex gap-4 items-start shadow-md">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[#4F46E5] shrink-0">
                <Coffee className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest font-mono">Mitigation Directives</span>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">{rec}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
