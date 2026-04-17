// API request/response types based on existing route handlers

import type { TaskStatus, TaskPriority, WorkspaceRole } from './db';

// ── Generic wrapper ──────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export interface CreateTaskRequest {
  projectId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export interface TaskResponse {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Projects ─────────────────────────────────────────────────────────────────

export interface CreateProjectRequest {
  workspaceId: string;
  name: string;
  description?: string;
}

export interface ProjectResponse {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Workspaces ───────────────────────────────────────────────────────────────

export interface CreateWorkspaceRequest {
  name: string;
  slug: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  slug?: string;
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

// ── Members ───────────────────────────────────────────────────────────────────

export interface MemberResponse {
  id: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface UpdateMemberRoleRequest {
  role: WorkspaceRole;
}

// ── Invites ──────────────────────────────────────────────────────────────────

export interface InviteMemberRequest {
  email: string;
  role?: WorkspaceRole;
}

export interface InviteResponse {
  id: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  expiresAt: string;
  createdAt: string;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  linkHref: string | null;
  createdAt: string;
}

export interface NotificationsListResponse {
  notifications: NotificationResponse[];
  unreadCount: number;
}

// ── AI ───────────────────────────────────────────────────────────────────────

export interface AnalyzeTaskRequest {
  taskTitle: string;
  taskDescription?: string;
}

export interface SummarizeTaskRequest {
  taskTitle: string;
  taskDescription?: string;
}

export interface GenerateSubtasksRequest {
  taskTitle: string;
  taskDescription?: string;
}

export interface ParseTasksRequest {
  input: string;
}

export interface ParsedTask {
  title: string;
  description: string;
  priority: TaskPriority;
}

export interface AIJobResponse {
  id: string;
  taskTitle: string;
  status: string;
  result: unknown | null;
  errorMsg: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Profile ───────────────────────────────────────────────────────────────────

export interface UpdateProfileRequest {
  fullName: string;
}

// ── Comments ──────────────────────────────────────────────────────────────────

export interface CreateCommentRequest {
  taskId: string;
  body: string;
}

export interface CommentResponse {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
