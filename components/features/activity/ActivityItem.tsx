"use client";

import type { ActivityFeedItem } from "@/lib/activity";

type Props = {
  item: ActivityFeedItem;
};

function timeLabel(value: Date | string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function relativeLabel(value: Date | string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

function Icon({ iconKey }: { iconKey: string }) {
  switch (iconKey) {
    case "task-create":
      return <path d="M12 5v14M5 12h14" />;
    case "task-move":
      return <path d="M4 12h10m0 0-4-4m4 4-4 4M20 5v14" />;
    case "task-update":
      return <path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />;
    case "task-delete":
      return <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />;
    case "comment":
      return <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />;
    case "project":
      return <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />;
    case "workspace":
      return <path d="M3 4h18v16H3zm6 0v16m6-16v16M3 10h18" />;
    case "member-invite":
      return <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20-8v6m3-3h-6M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />;
    case "member-join":
      return <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m11-11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm8 4-3 3-2-2" />;
    case "member-remove":
      return <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m11-11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm5 2-6 6m0-6 6 6" />;
    case "member-role":
      return <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z" />;
    default:
      return <path d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />;
  }
}

export function ActivityItem({ item }: Props) {
  return (
    <article className="activity-item">
      <div className="activity-item-track">
        <span className={`activity-item-icon activity-item-icon--${item.eventType}`} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <Icon iconKey={item.iconKey} />
          </svg>
        </span>
      </div>

      <div className="activity-item-body">
        <div className="activity-item-top">
          <div>
            <p className="activity-item-title">{item.title}</p>
            <p className="activity-item-description">{item.description}</p>
          </div>
          <div className="activity-item-meta">
            <span className="activity-item-time" title={timeLabel(item.createdAt)}>
              {relativeLabel(item.createdAt)}
            </span>
            <span className="activity-item-stamp">{timeLabel(item.createdAt)}</span>
          </div>
        </div>

        <div className="activity-item-tags">
          <span className="badge">{item.entityType}</span>
          {item.entityName ? <span className="badge accent">{item.entityName}</span> : null}
        </div>
      </div>
    </article>
  );
}
