import { prisma } from "@/lib/db/prisma";

// ── Types ────────────────────────────────────────────────────────────────────

export type DashboardUser = {
  id: string;
  email: string | null;
  fullName: string | null;
};

export type DashboardTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignee: { id: string; fullName: string | null; email: string | null } | null;
  comments: Array<{ id: string }>;
  project: {
    id: string;
    name: string;
    workspace: { id: string; name: string };
  };
};

export type DashboardWorkspace = {
  id: string;
  name: string;
  projectCount: number;
  openTasks: number;
  completedTasks: number;
  completion: number;
  latestActivity: string;
};

export type DashboardActivity = {
  id: string;
  action: string;
  createdAt: Date;
  actor: { fullName: string | null; email: string | null } | null;
  task: { title: string } | null;
};

export type DashboardStats = {
  workspaces: number;
  projects: number;
  activeTasks: number;
  completedTasks: number;
  completedThisWeek: number;
  dueSoon: number;
  overdue: number;
  urgent: number;
  completionRate: number;
  teamMembers: number;
};

export type MemberOption = {
  id: string;
  fullName: string | null;
  email: string | null;
};

export type ProjectOption = {
  id: string;
  name: string;
  workspaceName: string;
  workspaceId: string;
};

export type ProjectHealth = "on-track" | "at-risk" | "off-track";

export type DashboardProject = {
  id: string;
  name: string;
  workspaceName: string;
  health: ProjectHealth;
  todo: number;
  inProgress: number;
  blocked: number;
  done: number;
  total: number;
  completion: number;  // 0–100
  priority: string;    // dominant open-task priority
  overdue: number;
};

export type DashboardData = {
  tasks: DashboardTask[];
  workspaces: DashboardWorkspace[];
  projects: DashboardProject[];
  recentActivity: DashboardActivity[];
  stats: DashboardStats;
  projectOptions: ProjectOption[];
  membersByWorkspace: Record<string, MemberOption[]>;
  focusMessage: string;
};

// ── Queries ──────────────────────────────────────────────────────────────────

async function fetchMemberships(userId: string) {
  return prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          projects: true,
          activities: {
            include: { actor: true, task: true },
            orderBy: { createdAt: "desc" },
            take: 25,
          },
          memberships: {
            include: { user: { select: { id: true, fullName: true, email: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

async function fetchTasks(workspaceIds: string[]): Promise<DashboardTask[]> {
  if (!workspaceIds.length) return [];

  return prisma.task.findMany({
    where: {
      project: {
        workspaceId: { in: workspaceIds },
      },
    },
    include: {
      project: { include: { workspace: true } },
      assignee: true,
      comments: { select: { id: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    take: 50,
  }) as Promise<DashboardTask[]>;
}

// ── Calculations ─────────────────────────────────────────────────────────────

function calcStats(
  tasks: DashboardTask[],
  workspaceCount: number,
  projectCount: number,
  teamMembers: number,
): DashboardStats {
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const completed = tasks.filter((t) => t.status === "DONE").length;
  const active = tasks.filter((t) => t.status !== "DONE").length;
  const completedThisWeek = tasks.filter(
    (t) => t.status === "DONE" && t.updatedAt.getTime() >= oneWeekAgo
  ).length;
  const dueSoon = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const ms = t.dueDate.getTime() - now;
    return ms >= 0 && ms <= 72 * 60 * 60 * 1000;
  }).length;
  const overdue = tasks.filter(
    (t) => t.dueDate && t.dueDate.getTime() < now && t.status !== "DONE"
  ).length;
  const urgent = tasks.filter(
    (t) => ["HIGH", "URGENT"].includes(t.priority) && t.status !== "DONE"
  ).length;

  return {
    workspaces: workspaceCount,
    projects: projectCount,
    activeTasks: active,
    completedTasks: completed,
    completedThisWeek,
    dueSoon,
    overdue,
    urgent,
    completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    teamMembers,
  };
}

function buildWorkspaceSummaries(
  memberships: Awaited<ReturnType<typeof fetchMemberships>>,
  tasks: DashboardTask[]
): DashboardWorkspace[] {
  return memberships.map((m) => {
    const wTasks = tasks.filter((t) => t.project.workspace.id === m.workspace.id);
    const done = wTasks.filter((t) => t.status === "DONE").length;
    const lastActivity = m.workspace.activities[0]?.createdAt;

    return {
      id: m.workspace.id,
      name: m.workspace.name,
      projectCount: m.workspace.projects.length,
      openTasks: wTasks.filter((t) => t.status !== "DONE").length,
      completedTasks: done,
      completion: wTasks.length ? Math.round((done / wTasks.length) * 100) : 0,
      latestActivity: lastActivity
        ? new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }).format(lastActivity)
        : "No recent activity",
    };
  });
}

function buildProjectStats(
  tasks: DashboardTask[],
  projectOptions: ProjectOption[],
): DashboardProject[] {
  const now = Date.now();
  const PRIORITY_ORDER = ["URGENT", "HIGH", "MEDIUM", "LOW"];

  return projectOptions.map((p) => {
    const pts = tasks.filter((t) => t.project.id === p.id);
    const todo       = pts.filter((t) => t.status === "TODO").length;
    const inProgress = pts.filter((t) => t.status === "IN_PROGRESS").length;
    const blocked    = pts.filter((t) => t.status === "BLOCKED").length;
    const done       = pts.filter((t) => t.status === "DONE").length;
    const total      = pts.length;
    const overdue    = pts.filter(
      (t) => t.dueDate && t.dueDate.getTime() < now && t.status !== "DONE"
    ).length;
    const completion = total ? Math.round((done / total) * 100) : 0;

    // Dominant priority among open tasks
    const openPriorities = pts
      .filter((t) => t.status !== "DONE")
      .map((t) => t.priority);
    const priority =
      PRIORITY_ORDER.find((pr) => openPriorities.includes(pr)) ?? "MEDIUM";

    // Health logic
    let health: ProjectHealth = "on-track";
    if (overdue > 0 || blocked > 0) health = "off-track";
    else if (
      openPriorities.some((pr) => pr === "URGENT" || pr === "HIGH") ||
      completion < 25 && total > 2
    ) health = "at-risk";

    return { id: p.id, name: p.name, workspaceName: p.workspaceName, health, todo, inProgress, blocked, done, total, completion, priority, overdue };
  });
}

function buildFocusMessage(stats: DashboardStats, hasTasks: boolean): string {
  if (stats.overdue > 0) {
    return `${stats.overdue} task${stats.overdue === 1 ? " is" : "s are"} overdue — needs immediate follow-up.`;
  }
  if (stats.dueSoon > 0) {
    return `${stats.dueSoon} task${stats.dueSoon === 1 ? " is" : "s are"} due within 72 hours.`;
  }
  if (hasTasks) {
    return "No immediate risk signals. Good moment to scope the next batch of work.";
  }
  return "Create your first workspace, project, and task to populate the dashboard.";
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const memberships = await fetchMemberships(userId);
  const workspaceIds = memberships.map((m) => m.workspaceId);
  const tasks = await fetchTasks(workspaceIds);

  const projectCount = memberships.reduce((n, m) => n + m.workspace.projects.length, 0);
  const uniqueMembers = new Set(
    memberships.flatMap((m) => m.workspace.memberships.map((wm) => wm.userId))
  ).size;
  const stats = calcStats(tasks, memberships.length, projectCount, uniqueMembers);

  const recentActivity: DashboardActivity[] = memberships
    .flatMap((m) => m.workspace.activities)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 25);

  const projectOptions: ProjectOption[] = memberships.flatMap((m) =>
    m.workspace.projects.map((p) => ({
      id: p.id,
      name: p.name,
      workspaceName: m.workspace.name,
      workspaceId: m.workspaceId,
    }))
  );

  const membersByWorkspace: Record<string, MemberOption[]> = {};
  for (const m of memberships) {
    membersByWorkspace[m.workspaceId] = m.workspace.memberships.map((wm) => ({
      id: wm.user.id,
      fullName: wm.user.fullName,
      email: wm.user.email,
    }));
  }

  return {
    tasks,
    workspaces: buildWorkspaceSummaries(memberships, tasks),
    projects: buildProjectStats(tasks, projectOptions),
    recentActivity,
    stats,
    projectOptions,
    membersByWorkspace,
    focusMessage: buildFocusMessage(stats, tasks.length > 0),
  };
}
