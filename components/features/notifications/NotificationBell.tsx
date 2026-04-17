"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  linkHref: string | null;
  createdAt: string;
};

const TYPE_ICON: Record<string, string> = {
  TASK_ASSIGNED:      "👤",
  TASK_COMMENTED:     "💬",
  TASK_DUE_SOON:      "⏰",
  TASK_OVERDUE:       "🔴",
  TASK_STATUS_CHANGED:"🔄",
  MEMBER_JOINED:      "🎉",
  INVITE_ACCEPTED:    "✅",
  AI_JOB_DONE:        "✦",
};

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread]               = useState(0);
  const [open, setOpen]                   = useState(false);
  const [loading, setLoading]             = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res  = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnread(data.data.unreadCount);
      }
    } catch { /* silent */ }
  }, []);

  // Initial fetch
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Realtime subscription — refresh on Notification table changes
  useEffect(() => {
    const supabase = createClient();
    const channel  = supabase
      .channel("relay-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "Notification" }, fetchNotifications)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function markAllRead() {
    setLoading(true);
    await fetch("/api/notifications", { method: "PATCH" });
    await fetchNotifications();
    setLoading(false);
  }

  async function markOneRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnread((c) => Math.max(0, c - 1));
  }

  return (
    <div className="notif-wrap" ref={panelRef}>
      {/* Bell button */}
      <button
        className="notif-bell"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        suppressHydrationWarning
      >
        🔔
        {unread > 0 && (
          <span className="notif-badge">{unread > 99 ? "99+" : unread}</span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <span className="notif-panel-title">Notifications</span>
            {unread > 0 && (
              <button
                className="text-link"
                style={{ fontSize: "0.8rem" }}
                onClick={markAllRead}
                disabled={loading}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <p className="helper-text">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item${n.read ? "" : " notif-item-unread"}`}
                  onClick={() => { if (!n.read) markOneRead(n.id); }}
                >
                  <span className="notif-icon">{TYPE_ICON[n.type] ?? "📌"}</span>
                  <div className="notif-content">
                    <p className="notif-title">{n.title}</p>
                    {n.body && <p className="notif-body">{n.body}</p>}
                    <p className="notif-time">{relativeTime(n.createdAt)}</p>
                  </div>
                  {n.linkHref && (
                    // Use <a> — linkHref is a runtime string, not a typed static route
                    <a
                      href={n.linkHref}
                      className="notif-arrow"
                      onClick={(e) => e.stopPropagation()}
                    >
                      →
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
