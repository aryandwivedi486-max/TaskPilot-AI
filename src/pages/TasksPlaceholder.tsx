import React, { useState, useMemo } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { Task, TaskPriority } from '../types';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  X, 
  Check, 
  FolderKanban, 
  Sparkles, 
  Inbox,
  AlertCircle
} from 'lucide-react';

interface TasksPlaceholderProps {
  setActiveTab: (tab: string) => void;
}

export const TasksPlaceholder: React.FC<TasksPlaceholderProps> = ({ setActiveTab }) => {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();

  // Search, Filter, and Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'completed' | 'high' | 'today' | 'upcoming'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'deadline' | 'priority' | 'alphabetical'>('newest');

  // Modal controls
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Form Fields State (both for add and edit)
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formDuration, setFormDuration] = useState(60);
  const [formPriority, setFormPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [formCategory, setFormCategory] = useState('Deep Work');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Reset form helper
  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormDeadline('');
    setFormDuration(60);
    setFormPriority(TaskPriority.MEDIUM);
    setFormCategory('Deep Work');
    setFormNotes('');
    setFormError(null);
  };

  // Trigger Add Modal
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Trigger Edit Modal
  const openEditModal = (task: Task) => {
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    // Format deadline for datetime-local input safely
    const d = new Date(task.deadline);
    const offset = d.getTimezoneOffset();
    const localTime = new Date(d.getTime() - offset * 60 * 1000);
    setFormDeadline(localTime.toISOString().slice(0, 16));
    setFormDuration(task.estimatedDuration);
    setFormPriority(task.priority);
    setFormCategory(task.category);
    setFormNotes(task.notes || '');
    setFormError(null);
    setEditingTask(task);
  };

  // Submit Add form
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Task Name is required.');
      return;
    }
    if (!formDeadline) {
      setFormError('Deadline date and time are required.');
      return;
    }
    if (!formDuration || formDuration <= 0) {
      setFormError('A valid estimated duration is required.');
      return;
    }

    try {
      await addTask({
        title: formTitle.trim(),
        description: formDescription.trim(),
        deadline: new Date(formDeadline).toISOString(),
        estimatedDuration: Number(formDuration),
        priority: formPriority,
        category: formCategory.trim() || 'General',
        notes: formNotes.trim(),
        completed: false
      });
      setShowAddModal(false);
      resetForm();
      // Navigate back to Dashboard immediately on save
      setActiveTab('dashboard');
    } catch (err: any) {
      setFormError(err.message || 'Failed to save task.');
    }
  };

  // Submit Edit form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!formTitle.trim()) {
      setFormError('Task Name is required.');
      return;
    }
    if (!formDeadline) {
      setFormError('Deadline date and time are required.');
      return;
    }
    if (!formDuration || formDuration <= 0) {
      setFormError('A valid estimated duration is required.');
      return;
    }

    try {
      await updateTask(editingTask.id, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        deadline: new Date(formDeadline).toISOString(),
        estimatedDuration: Number(formDuration),
        priority: formPriority,
        category: formCategory.trim() || 'General',
        notes: formNotes.trim()
      });
      setEditingTask(null);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save task changes.');
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deletingTaskId) return;
    try {
      await deleteTask(deletingTaskId);
      setDeletingTaskId(null);
    } catch (e) {
      console.error('[TaskPilot AI] Failed to delete task:', e);
    }
  };

  // Filter & Sort core business logic
  const processedTasks = useMemo(() => {
    let list = [...tasks];

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.category.toLowerCase().includes(q) || 
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    // Filter match
    const now = new Date();
    list = list.filter(t => {
      switch (filterType) {
        case 'pending':
          return !t.completed;
        case 'completed':
          return t.completed;
        case 'high':
          return t.priority === TaskPriority.HIGH || t.priority === TaskPriority.CRITICAL;
        case 'today':
          const tDate = new Date(t.deadline);
          return tDate.toDateString() === now.toDateString();
        case 'upcoming':
          const upcomingDate = new Date(t.deadline);
          return upcomingDate > now;
        default:
          return true;
      }
    });

    // Sorting algorithm mapping
    list.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'priority':
          const weight = {
            [TaskPriority.CRITICAL]: 4,
            [TaskPriority.HIGH]: 3,
            [TaskPriority.MEDIUM]: 2,
            [TaskPriority.LOW]: 1,
          };
          return weight[b.priority] - weight[a.priority];
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return list;
  }, [tasks, searchQuery, filterType, sortBy]);

  // Priority Color helper
  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.CRITICAL:
        return { label: '🚨 Critical', color: 'bg-red-500/10 border-red-500/20 text-red-400' };
      case TaskPriority.HIGH:
        return { label: '🔴 High', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' };
      case TaskPriority.MEDIUM:
        return { label: '🟡 Medium', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' };
      case TaskPriority.LOW:
      default:
        return { label: '🟢 Low', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' };
    }
  };

  // Helper date status
  const isOverdue = (deadlineStr: string, completed: boolean) => {
    if (completed) return false;
    return new Date(deadlineStr) < new Date();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-[#4F46E5]" /> Tasks Center
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Maintain high velocity on scheduled project checkpoints.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-3 bg-[#4F46E5] hover:bg-[#6366F1] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/15 cursor-pointer self-stretch sm:self-auto text-center justify-center"
        >
          <Plus className="w-4 h-4 text-white" /> Create New Task
        </button>
      </div>

      {/* Instant Search and Filters bar layout */}
      <div className="bg-[#141417] p-4 rounded-[20px] border border-white/5 space-y-3.5">
        
        {/* Row 1: Search & Sort */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks instantly by name, category, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="flex items-center gap-2.5 bg-[#0A0A0B] border border-white/5 px-3 py-2 rounded-xl">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-[#0A0A0B]">Sort: Newest</option>
              <option value="oldest" className="bg-[#0A0A0B]">Sort: Oldest</option>
              <option value="deadline" className="bg-[#0A0A0B]">Sort: Deadline</option>
              <option value="priority" className="bg-[#0A0A0B]">Sort: Priority</option>
              <option value="alphabetical" className="bg-[#0A0A0B]">Sort: Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Row 2: Filter chips */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider self-center mr-2">Filters:</span>
          {(['all', 'pending', 'completed', 'high', 'today', 'upcoming'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer
                ${filterType === type 
                  ? 'bg-[#4F46E5] text-white' 
                  : 'bg-[#0A0A0B] text-slate-400 hover:text-white border border-white/5'}
              `}
            >
              {type}
            </button>
          ))}
        </div>

      </div>

      {/* Main Grid View of Tasks */}
      {processedTasks.length === 0 ? (
        <div className="bg-[#141417] rounded-[24px] border border-white/5 p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-10">
          <Inbox className="w-14 h-14 text-slate-600 mb-4 animate-bounce" />
          <h3 className="text-lg font-extrabold text-white">No Tasks Available</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-xs leading-relaxed">
            Create your first task and let TaskPilot AI build your personalized productivity plan.
          </p>
          <button
            onClick={openAddModal}
            className="mt-6 px-5 py-2.5 bg-[#4F46E5] hover:bg-[#6366F1] text-white text-xs font-bold rounded-xl transition-all shadow-lg"
          >
            * Create First Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {processedTasks.map((task) => {
            const badge = getPriorityBadge(task.priority);
            const overdue = isOverdue(task.deadline, task.completed);
            
            return (
              <div
                key={task.id}
                className={`
                  p-5 rounded-[20px] bg-[#141417] border transition-all flex flex-col justify-between hover:border-white/10 relative group
                  ${task.completed ? 'opacity-60 border-white/5' : 'border-white/5'}
                  ${overdue ? 'border-red-500/20 bg-red-500/5' : ''}
                `}
              >
                
                {/* Upper Details Row */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    
                    {/* Status check trigger and title */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => updateTask(task.id, { completed: !task.completed })}
                        className={`
                          w-5.5 h-5.5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer
                          ${task.completed 
                            ? 'bg-[#4F46E5] border-[#4F46E5] text-white' 
                            : 'border-white/20 hover:border-indigo-400 text-transparent'}
                        `}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      <div className="min-w-0">
                        <h4 className={`text-sm font-bold truncate leading-snug ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {task.title}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                          Category: <strong className="text-slate-400">{task.category}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Colored Priority Badge */}
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border shrink-0 ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Task Description text snippet */}
                  {task.description && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 pl-8">
                      {task.description}
                    </p>
                  )}

                  {/* Task Notes details (if any) */}
                  {task.notes && (
                    <div className="text-[10px] text-indigo-400/80 bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10 pl-2.5 font-mono">
                      Notes: {task.notes}
                    </div>
                  )}

                </div>

                {/* Lower Action & Stats Row */}
                <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-5">
                  <div className="flex items-center gap-3">
                    
                    {/* Deadline date */}
                    <span className={`text-[10px] font-mono flex items-center gap-1 ${overdue ? 'text-red-400 font-bold animate-pulse' : 'text-slate-500'}`}>
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {new Date(task.deadline).toLocaleDateString()}
                    </span>

                    {/* Est duration */}
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      {task.estimatedDuration}m
                    </span>

                    {/* Overdue alert badge */}
                    {overdue && (
                      <span className="text-[9px] bg-red-500/15 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded uppercase font-bold font-mono">
                        Overdue!
                      </span>
                    )}
                  </div>

                  {/* Edit and Delete Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-1.5 hover:bg-white/5 text-slate-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Edit Fields"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    
                    <button
                      onClick={() => setDeletingTaskId(task.id)}
                      className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                      title="Delete Permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 1. Modal Dialog: CREATE TASK */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131B2E] border border-white/5 rounded-[24px] max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#4F46E5]" /> Create Priority Task
            </h4>

            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Task Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Refactor API module logic"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Description</label>
                <textarea
                  placeholder="Summarize objectives of this task"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-2 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#4F46E5] h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Deadline *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Duration *</label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
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
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Notes</label>
                <input
                  type="text"
                  placeholder="Any secondary details/links..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-white/5 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#4F46E5] hover:bg-[#6366F1] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  ✨ Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Dialog: EDIT TASK */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131B2E] border border-white/5 rounded-[24px] max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setEditingTask(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#4F46E5]" /> Edit Task Block
            </h4>

            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Task Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Refactor API module logic"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Description</label>
                <textarea
                  placeholder="Summarize objectives of this task"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-2 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#4F46E5] h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Deadline *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Duration *</label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
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
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold uppercase mb-1.5">Notes</label>
                <input
                  type="text"
                  placeholder="Any secondary details/links..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="flex-1 py-3 border border-white/5 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#4F46E5] hover:bg-[#6366F1] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal Dialog: DELETE CONFIRMATION */}
      {deletingTaskId && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131B2E] border border-white/5 rounded-[24px] max-w-sm w-full p-6 relative shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 mx-auto mb-4 border border-red-500/15">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <h4 className="text-lg font-bold text-white mb-2">Delete Task?</h4>
            <p className="text-slate-400 text-xs mb-6">
              This action cannot be undone. All recorded progress on this block will be destroyed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingTaskId(null)}
                className="flex-1 py-2.5 border border-white/5 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
