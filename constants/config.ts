// App-wide configuration constants

export const APP_NAME = 'TaskZena';
export const APP_DESCRIPTION = 'AI-powered task management platform for modern teams';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// AI model configuration
export const AI_MODELS = {
  DEFAULT: 'gpt-4.1-mini',
  ANALYSIS: 'gpt-4.1-mini',
  INSIGHTS: 'gpt-4.1-mini',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  TASKS_PAGE_SIZE: 50,
  ACTIVITY_PAGE_SIZE: 30,
  NOTIFICATIONS_LIMIT: 50,
} as const;

// Task status display labels
export const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  DONE: 'Done',
} as const;

// Task priority display labels
export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
} as const;

// Workspace role display labels
export const WORKSPACE_ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
} as const;

// Invite expiry duration in days
export const INVITE_EXPIRY_DAYS = 7;

// Realtime channel names
export const REALTIME_CHANNELS = {
  TASKS: 'relay-tasks-realtime',
  NOTIFICATIONS: 'relay-notifications',
} as const;

// Health score thresholds
export const HEALTH_SCORE = {
  HEALTHY_MIN: 75,
  AT_RISK_MIN: 45,
} as const;
