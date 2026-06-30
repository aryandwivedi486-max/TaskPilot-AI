import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, AIPlan, AnalyticsSnapshot, TaskPriority, OperationType } from '../types';
import { useAuth } from './AuthContext';
import { db, isPlaceholderMode } from '../firebase/config';
import { handleFirestoreError } from '../firebase/errorHandler';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface TaskContextType {
  tasks: Task[];
  aiPlan: AIPlan | null;
  analytics: AnalyticsSnapshot | null;
  loadingTasks: boolean;
  loadingAI: boolean;
  isPlanOutdated: boolean;
  isOnline: boolean;
  lastSyncTime: string | null;
  setIsPlanOutdated: (val: boolean) => void;
  addTask: (taskData: Omit<Task, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (taskId: string, updatedFields: Partial<Task>) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  optimizeSchedule: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [aiPlan, setAiPlan] = useState<AIPlan | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(true);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [isPlanOutdated, setIsPlanOutdated] = useState<boolean>(false);

  // Network Detection State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(new Date().toLocaleTimeString());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setLastSyncTime(new Date().toLocaleTimeString());
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 1. Sync tasks & states when user is authenticated
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setAiPlan(null);
      setAnalytics(null);
      setIsPlanOutdated(false);
      setLoadingTasks(false);
      return;
    }

    setLoadingTasks(true);

    // Restore Outdated Plan status from localStorage (it applies to both modes)
    const savedOutdated = localStorage.getItem(`taskpilot_plan_outdated_${user.uid}`);
    if (savedOutdated) {
      setIsPlanOutdated(savedOutdated === 'true');
    }

    // Restore AI plan from localStorage (quick dashboard state restore)
    const savedPlan = localStorage.getItem(`taskpilot_ai_plan_${user.uid}`);
    if (savedPlan) {
      try {
        setAiPlan(JSON.parse(savedPlan));
      } catch (e) {
        console.error('[TaskPilot AI] Failed to restore saved AI Plan:', e);
      }
    }

    // Initialize/Sync tasks
    if (isPlaceholderMode || !db) {
      // Premium Sandbox local storage simulation mode
      const localTasksStr = localStorage.getItem(`taskpilot_tasks_${user.uid}`);
      if (localTasksStr) {
        try {
          setTasks(JSON.parse(localTasksStr));
        } catch (e) {
          console.error('[TaskPilot AI] Failed to parse local tasks:', e);
          setTasks([]);
        }
      } else {
        setTasks([]);
      }
      setLoadingTasks(false);
      return;
    }

    // Real Firebase listener
    let unsubscribe: () => void;
    try {
      const q = query(collection(db, 'tasks'), where('ownerId', '==', user.uid));
      
      unsubscribe = onSnapshot(q, (snapshot: any) => {
        const loadedTasks: Task[] = [];
        snapshot.forEach((docSnap: any) => {
          loadedTasks.push({
            id: docSnap.id,
            ...docSnap.data()
          } as Task);
        });
        
        // Sort by createdAt descending client-side safely
        loadedTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTasks(loadedTasks);
        setLoadingTasks(false);
      }, (error: any) => {
        console.error('[TaskPilot AI] Firestore snapshot failure:', error);
        setLoadingTasks(false);
      });
    } catch (e) {
      console.error('[TaskPilot AI] Error binding real Firestore collection:', e);
      setLoadingTasks(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Save tasks helper for sandbox simulation mode
  const saveLocalTasks = (updatedTasks: Task[]) => {
    if (!user) return;
    localStorage.setItem(`taskpilot_tasks_${user.uid}`, JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
  };

  const markPlanOutdated = () => {
    if (!user) return;
    setIsPlanOutdated(true);
    localStorage.setItem(`taskpilot_plan_outdated_${user.uid}`, 'true');
  };

  // 2. CREATE Task
  const addTask = async (taskData: Omit<Task, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    setLoadingTasks(true);
    const newTask: Omit<Task, 'id'> = {
      ...taskData,
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isPlaceholderMode || !db) {
      // Sandbox mode
      const fullTask: Task = {
        id: `task_${Date.now()}`,
        ...newTask
      };
      const updated = [fullTask, ...tasks];
      saveLocalTasks(updated);
      markPlanOutdated();
      setLoadingTasks(false);
      return;
    }

    // Cloud Firestore mode
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'tasks'), newTask);
      markPlanOutdated();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  // 3. EDIT/UPDATE Task
  const updateTask = async (taskId: string, updatedFields: Partial<Task>) => {
    if (!user) return;
    const patch = {
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    if (isPlaceholderMode || !db) {
      // Sandbox mode
      const updated = tasks.map(t => t.id === taskId ? { ...t, ...patch } : t);
      saveLocalTasks(updated);
      markPlanOutdated();
      return;
    }

    // Cloud Firestore mode
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'tasks', taskId), patch);
      markPlanOutdated();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  // 4. MARK COMPLETE / TOGGLE Task
  const toggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    await updateTask(taskId, { completed: !task.completed });
  };

  // 5. DELETE Task
  const deleteTask = async (taskId: string) => {
    if (!user) return;

    if (isPlaceholderMode || !db) {
      // Sandbox mode
      const updated = tasks.filter(t => t.id !== taskId);
      saveLocalTasks(updated);
      markPlanOutdated();
      return;
    }

    // Cloud Firestore mode
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'tasks', taskId));
      markPlanOutdated();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  // 6. AI OPTIMIZATION schedule generator
  const optimizeSchedule = async () => {
    if (!user || tasks.length === 0) return;
    setLoadingAI(true);
    
    // Simulate real delay steps to let visualizer animate elegantly
    await new Promise(resolve => setTimeout(resolve, 4000));

    try {
      // Try hitting server route if online
      const response = await fetch('/api/gemini/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, tasks })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiPlan(data);
        localStorage.setItem(`taskpilot_ai_plan_${user.uid}`, JSON.stringify(data));
        setIsPlanOutdated(false);
        localStorage.setItem(`taskpilot_plan_outdated_${user.uid}`, 'false');
        return;
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to analyze schedule from Gemini server.');
      }
    } catch (e: any) {
      console.warn('[TaskPilot AI] Backend optimize request on standby or unavailable. Error:', e.message);
      
      // Elegant and compliant local AI Plan Generator fallback
      const simulatedPlan: AIPlan = {
        id: user.uid,
        ownerId: user.uid,
        priorityOrder: tasks.map(t => t.id),
        todaySchedule: tasks.slice(0, 3).map((t, idx) => ({
          taskId: t.id,
          taskTitle: t.title,
          startTime: idx === 0 ? '09:00' : idx === 1 ? '11:00' : '14:00',
          endTime: idx === 0 ? '10:30' : idx === 1 ? '12:00' : '15:30',
          duration: t.estimatedDuration
        })),
        deadlineRisk: tasks.some(t => t.priority === TaskPriority.CRITICAL || t.priority === TaskPriority.HIGH) ? 'high' : 'low',
        recommendations: [
          `Ensure you tackle "${tasks[0]?.title || 'deep focus workload'}" early in the morning when mental energy peaks.`,
          'Keep estimated task durations under 90 minutes to prevent high workload stress levels.',
          'Inject a 5-minute cognitive break for every 30 minutes of continuous dashboard tasks.'
        ],
        lastOptimizedAt: new Date().toISOString()
      };

      setAiPlan(simulatedPlan);
      localStorage.setItem(`taskpilot_ai_plan_${user.uid}`, JSON.stringify(simulatedPlan));
      setIsPlanOutdated(false);
      localStorage.setItem(`taskpilot_plan_outdated_${user.uid}`, 'false');
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        aiPlan,
        analytics,
        loadingTasks,
        loadingAI,
        isPlanOutdated,
        isOnline,
        lastSyncTime,
        setIsPlanOutdated,
        addTask,
        updateTask,
        toggleTaskCompletion,
        deleteTask,
        optimizeSchedule,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
