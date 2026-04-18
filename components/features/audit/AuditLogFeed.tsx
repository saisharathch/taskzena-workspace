"use client";

import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/client/api";

type AuditLog = {
  id: string;
  action: string;
  createdAt: string | Date;
  actor: { fullName: string | null; email: string | null } | null;
  task: { title: string } | null;
  workspace: { name: string };
};

type Props = {
  initialLogs: AuditLog[];
  initialNextCursor: string | null;
  workspace: string;
  action: string;
  actionLabels: Record<string, string>;
};

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function AuditLogFeed({
  initialLogs,
  initialNextCursor,
  workspace,
  action,
  actionLabels,
}: Props) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLogs(initialLogs);
    setNextCursor(initialNextCursor);
    setError("");
  }, [initialLogs, initialNextCursor, workspace, action]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    setError("");

    try {
      const params = new URLSearchParams({ limit: "30", cursor: nextCursor });
      if (workspace) params.set("workspace", workspace);
      if (action) params.set("action", action);

      const response = await fetch(`/api/activity?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { data?: AuditLog[]; nextCursor?: string | null };
        error?: string;
        message?: string;
      };

      if (!response.ok || !payload.success) {
        setError(getApiErrorMessage(response, payload, "We could not load more activity right now."));
        return;
      }

      setLogs((current) => {
        const existingIds = new Set(current.map((log) => log.id));
        const merged = [...current];

        for (const log of payload.data?.data ?? []) {
          if (existingIds.has(log.id)) continue;
          existingIds.add(log.id);
          merged.push(log);
        }

        return merged;
      });
      setNextCursor(payload.data?.nextCursor ?? null);
    } catch {
      setError("We could not load more activity right now.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section className="db-section">
      <div className="table-wrap">
        <table className="table audit-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Task</th>
              <th>Workspace</th>
            </tr>
          </thead>
          <tbody>
            {logs.length ? (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="table-subtitle">{dateFmt.format(new Date(log.createdAt))}</td>
                  <td>
                    <span className="badge">{actionLabels[log.action] ?? log.action}</span>
                  </td>
                  <td>{log.actor?.fullName ?? log.actor?.email ?? <span className="table-subtitle">System</span>}</td>
                  <td>{log.task?.title ?? <span className="table-subtitle">-</span>}</td>
                  <td className="table-subtitle" title={log.workspace.name}>
                    {log.workspace.name}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="table-empty" colSpan={5}>
                  No activity found matching these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(nextCursor || error) && (
        <div className="activity-pagination">
          <span className="activity-page-info">{logs.length} loaded</span>
          {nextCursor ? (
            <button className="button secondary" type="button" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading more..." : "Load more"}
            </button>
          ) : null}
          {error ? <span className="notice error">{error}</span> : null}
        </div>
      )}
    </section>
  );
}
