# API Reference

## Base URL
All API routes are under `/api/`

## Authentication
All endpoints require a valid Supabase session cookie (set automatically by the browser
after login). Server-side validation uses `requireAppUser()` which redirects to `/login`
if no session is present.

## Response Format
All endpoints return JSON with this shape:
```json
{ "success": true, "data": { ... } }
// or on error:
{ "success": false, "error": "Error message" }
```

---

## Endpoints

### Tasks
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tasks` | List tasks for the current user's workspaces |
| `POST` | `/api/tasks` | Create a task |
| `PATCH` | `/api/tasks/[taskId]` | Update a task (status, title, priority, etc.) |
| `DELETE` | `/api/tasks/[taskId]` | Delete a task |

**POST /api/tasks body:**
```json
{
  "projectId": "string",
  "title": "string",
  "description": "string (optional)",
  "priority": "LOW | MEDIUM | HIGH | URGENT",
  "status": "TODO | IN_PROGRESS | BLOCKED | DONE",
  "assigneeId": "string | null",
  "dueDate": "ISO8601 string | null"
}
```

---

### Projects
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/projects` | List projects for the current user |
| `POST` | `/api/projects` | Create a project |

---

### Workspaces
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/workspaces` | List user's workspaces |
| `POST` | `/api/workspaces` | Create a workspace |
| `PATCH` | `/api/workspaces/[workspaceId]` | Update workspace name/slug |
| `DELETE` | `/api/workspaces/[workspaceId]` | Delete workspace (owner only) |
| `GET` | `/api/workspaces/[workspaceId]/members` | List members and pending invites |
| `PATCH` | `/api/workspaces/[workspaceId]/members/[memberId]` | Update member role |
| `DELETE` | `/api/workspaces/[workspaceId]/members/[memberId]` | Remove a member |
| `POST` | `/api/workspaces/[workspaceId]/invites` | Invite a member by email |
| `POST` | `/api/workspaces/[workspaceId]/leave` | Leave a workspace |

---

### Invites
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/invites/[token]` | Get invite details by token |
| `POST` | `/api/invites/[token]` | Accept an invite |

---

### Notifications
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notifications` | List notifications for current user |
| `PATCH` | `/api/notifications` | Mark all notifications as read |
| `PATCH` | `/api/notifications/[notificationId]` | Mark single notification as read |

---

### AI
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/ai/analyze` | Full task analysis (title, summary, subtasks, priority, blockers) |
| `POST` | `/api/ai/summarize` | Summarize a task in 3 bullet points |
| `POST` | `/api/ai/subtasks` | Generate 5 implementation subtasks |
| `POST` | `/api/ai/insights` | Get project-wide AI risk insights |
| `POST` | `/api/ai/parse-tasks` | Parse natural language into structured tasks |
| `GET` | `/api/ai/jobs` | List AI jobs for current user |
| `GET` | `/api/ai/jobs/[jobId]` | Get status and result of a specific AI job |

**POST /api/ai/analyze body:**
```json
{
  "taskTitle": "string",
  "taskDescription": "string (optional)"
}
```

---

### Profile
| Method | Path | Description |
|--------|------|-------------|
| `PATCH` | `/api/profile` | Update the current user's full name |

---

### Comments
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/comments` | Add a comment to a task |

---

### Auth
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/auth/callback` | Supabase OAuth/email confirmation callback |
