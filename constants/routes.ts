// Application route constants — use these instead of hard-coded path strings

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  DASHBOARD: '/dashboard',
  TASKS: '/dashboard/tasks',
  PROJECTS: '/dashboard/projects',
  KANBAN: '/dashboard/kanban',
  ANALYTICS: '/dashboard/analytics',
  ACTIVITY: '/dashboard/activity',
  AUDIT: '/dashboard/audit',
  REPORTS: '/dashboard/reports',
  TEAM: '/dashboard/team',
  SETTINGS: '/dashboard/settings',
  SETTINGS_WORKSPACE: (workspaceId: string) => `/dashboard/settings/${workspaceId}` as const,

  INVITE: (token: string) => `/invite/${token}` as const,

  API: {
    TASKS: '/api/tasks',
    TASK: (taskId: string) => `/api/tasks/${taskId}` as const,
    PROJECTS: '/api/projects',
    WORKSPACES: '/api/workspaces',
    WORKSPACE: (workspaceId: string) => `/api/workspaces/${workspaceId}` as const,
    WORKSPACE_MEMBERS: (workspaceId: string) => `/api/workspaces/${workspaceId}/members` as const,
    WORKSPACE_MEMBER: (workspaceId: string, memberId: string) => `/api/workspaces/${workspaceId}/members/${memberId}` as const,
    WORKSPACE_INVITES: (workspaceId: string) => `/api/workspaces/${workspaceId}/invites` as const,
    WORKSPACE_LEAVE: (workspaceId: string) => `/api/workspaces/${workspaceId}/leave` as const,
    NOTIFICATIONS: '/api/notifications',
    NOTIFICATION: (notificationId: string) => `/api/notifications/${notificationId}` as const,
    INVITE_TOKEN: (token: string) => `/api/invites/${token}` as const,
    PROFILE: '/api/profile',
    COMMENTS: '/api/comments',

    AI_ANALYZE: '/api/ai/analyze',
    AI_SUMMARIZE: '/api/ai/summarize',
    AI_INSIGHTS: '/api/ai/insights',
    AI_PARSE_TASKS: '/api/ai/parse-tasks',
    AI_SUBTASKS: '/api/ai/subtasks',
    AI_JOBS: '/api/ai/jobs',
    AI_JOB: (jobId: string) => `/api/ai/jobs/${jobId}` as const,

    AUTH_CALLBACK: '/api/auth/callback',
  },
} as const;
