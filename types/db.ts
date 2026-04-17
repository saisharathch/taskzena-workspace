// DB model types — mirroring Prisma schema for use in the frontend

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
export type AIJobStatus = 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED';
export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_COMMENTED'
  | 'TASK_DUE_SOON'
  | 'TASK_OVERDUE'
  | 'TASK_STATUS_CHANGED'
  | 'MEMBER_JOINED'
  | 'INVITE_ACCEPTED'
  | 'AI_JOB_DONE';

export interface DbUser {
  id: string;
  authUserId: string;
  email: string;
  fullName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbWorkspace {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbWorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: Date;
}

export interface DbProject {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbTask {
  id: string;
  projectId: string;
  assigneeId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbComment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbWorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  status: InviteStatus;
  invitedById: string | null;
  expiresAt: Date;
  createdAt: Date;
}

export interface DbAIJob {
  id: string;
  userId: string;
  taskId: string | null;
  taskTitle: string;
  taskDesc: string | null;
  status: AIJobStatus;
  result: unknown | null;
  errorMsg: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read: boolean;
  linkHref: string | null;
  taskId: string | null;
  workspaceId: string | null;
  createdAt: Date;
}

export interface DbActivityLog {
  id: string;
  workspaceId: string;
  taskId: string | null;
  actorId: string | null;
  action: string;
  metadata: unknown | null;
  createdAt: Date;
}
