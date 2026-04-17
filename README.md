# Taskzena Workspace

Taskzena Workspace is an AI-powered task management platform built for teams to organize work, track priorities, monitor progress, and improve execution.

It combines task management, workspace collaboration, analytics, and AI-powered workflow support in one platform.

## What this project does

This project helps users:

- create and manage workspaces
- organize projects and tasks
- assign work to team members
- track task status and priority
- monitor delivery and productivity insights
- use AI to summarize tasks and generate subtasks

## Why this project is useful

Many task management tools only help teams store tasks.  
Taskzena Workspace is designed to go further by helping teams understand work progress, improve visibility, and make planning easier.

This project is useful for showing:

- full-stack development skills
- backend API design
- database design
- authentication and authorization
- AI integration in real applications

## Main features

- Workspace-based collaboration
- Project and task management
- Role-based access control
- Priority and status tracking
- Comments and activity logs
- AI task summarization
- AI-generated subtasks
- Dashboard and execution insights

## Tech stack

- Next.js
- TypeScript
- Node.js
- Prisma ORM
- PostgreSQL
- Supabase
- Zod
- OpenAI API

## Project structure

-- User
Represents the signed-in user of the application.

-- Workspace
A workspace is a team area where users can manage projects and tasks.

-- WorkspaceMember
Stores which users belong to a workspace and what role they have.

-- Project
A project is a collection of related tasks inside a workspace.

-- Task
A task is the main work item.  
It can include details like title, description, status, priority, assignee, and due date.

-- Comment
Used for discussions on tasks.

-- ActivityLog
Tracks important actions for visibility and audit purposes.

How the system works

1. A user signs in
2. The user creates or joins a workspace
3. Inside the workspace, projects can be created
4. Tasks are added to projects
5. Team members can update, comment on, and track tasks
6. AI features help summarize tasks and break work into subtasks
7. Dashboards provide visibility into progress and execution

## Local setup

Install dependencies:

```bash
npm install
```

Set up environment variables:

```bash
cp .env.example .env
```

Then open `.env` and fill in your real values for:

```env
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
EMAIL_FROM=
NEXT_PUBLIC_APP_URL=
```

Run the database migration:

```bash
npx prisma migrate dev --name init
```

Start the app:

```bash
npm run dev
```

Security

This project includes:

authenticated access for protected actions
workspace-level permission checks
input validation using Zod
activity logging for important actions
