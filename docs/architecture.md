# TaskZena Architecture

## Overview
Multi-tenant task management SaaS built with Next.js 15 App Router.

## Tech Stack
- Frontend: Next.js 15, React 19, TypeScript
- Database: PostgreSQL (Supabase) + Prisma ORM
- Auth: Supabase Auth + SSR
- AI: OpenAI API (gpt-4.1-mini)
- Email: Resend (production) / console log (development)
- Validation: Zod

## Directory Structure
- `app/` — Next.js pages and API route handlers only
- `components/` — Reusable UI components organized by type
  - `ui/` — Primitive/design system components
  - `layout/` — Dashboard layout components (Header, Sidebar, Topbar, PageIntro)
  - `forms/` — Form components (CreateTask, CreateProject, CreateWorkspace, InviteMember)
  - `features/` — Domain-specific components
    - `tasks/` — TaskTable, KanbanBoard
    - `projects/` — ProjectPortfolioTable, ProjectDetailsGrid, ProjectInsightsWidget, ProjectsPageHeader
    - `ai/` — AIInsightsPanel, SmartInsightsPanel, TaskAiPanel, NaturalLanguageTaskCreator
    - `analytics/` — StatsGrid, HealthScoreCard, TaskChartsSection, ActivityWeeklySummarySection, WorkloadUrgentSection
    - `notifications/` — NotificationBell
    - `team/` — TeamManagementPanel
  - `shared/` — Cross-cutting shared components (AuthForm, BrandMark, SignOutButton, RecentActivity, SettingsControlCenter)
- `hooks/` — Custom React hooks (useRealtimeTasks)
- `types/` — TypeScript type definitions (api.ts, db.ts)
- `constants/` — App-wide constants (routes.ts, config.ts)
- `lib/` — Server utilities and integrations
  - `ai/` — OpenAI integration
  - `email/` — Email service (Resend)
  - `auth/` — Session management
  - `db/` — Prisma client
  - `supabase/` — Supabase clients (server + client)
  - `services/` — Business logic services (dashboard data aggregation)
  - `validation/` — Zod schemas
  - `http.ts` — HTTP response helpers
  - `rate-limit.ts` — Rate limiting middleware
- `prisma/` — Database schema and migrations
- `tests/` — Test suites (unit, integration, e2e)
- `docs/` — Project documentation

## Authentication Flow
1. User authenticates via Supabase Auth (email/password)
2. Auth callback syncs session to PostgreSQL via `getOrCreateAppUser()`
3. Session validated server-side via `requireAppUser()` in each protected page
4. Workspace access controlled via RBAC membership checks (OWNER / ADMIN / MEMBER)

## Multi-tenancy
All data is scoped to workspaces. The `WorkspaceMember` table enforces access control.
Every API route verifies workspace membership before returning data.

## Realtime
Task updates and notification counts use Supabase Realtime channels listening to
`postgres_changes` on the `Task` and `Notification` tables.

## AI Features
- Task analysis: refines title, generates summary, subtasks, priority, and blockers
- Project insights: risk level, at-risk tasks, workload warnings, recommendations
- Natural language task creation: parses free-text into structured tasks
- Task summarize / subtask generation: quick AI calls from the task detail view
