/**
 * TaskPilot AI
 * Core Domain TypeScript Types
 */

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export type TaskCategory = 'Work' | 'Study' | 'Personal' | 'Finance' | 'Health' | 'Other';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO date string
  estimatedDuration: number; // in minutes
  priority: TaskPriority;
  category: string;
  notes?: string;
  completed: boolean;
  ownerId: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface TimedBlock {
  taskId: string;
  taskTitle: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  duration: number; // in minutes
}

export interface AIPlan {
  id: string; // ownerId
  ownerId: string;
  priorityOrder: string[]; // array of Task IDs
  todaySchedule: TimedBlock[];
  deadlineRisk: 'low' | 'moderate' | 'high' | 'critical';
  recommendations: string[];
  lastOptimizedAt: string; // ISO date string
  
  // Extra AI insights
  dailyBrief?: {
    summary: string;
    estimatedWorkload: string;
    focusWindow: string;
    message: string;
  };
  taskDetails?: {
    [taskId: string]: {
      priorityRank: number;
      priorityReason: string;
      riskLevel: 'low' | 'moderate' | 'high' | 'critical';
      riskReason: string;
      riskRecommendation: string;
    };
  };
  workloadBalance?: {
    status: 'balanced' | 'busy' | 'overloaded';
    explanation: string;
  };
}

export interface AnalyticsSnapshot {
  id: string; // ownerId
  ownerId: string;
  tasksCompleted: number;
  focusMinutes: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveAt: string; // ISO date string
}

/**
 * Firestore Error Handling Types
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
