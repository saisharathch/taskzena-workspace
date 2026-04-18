"use client";

import Link from "next/link";
import type { ActivityFeedItem } from "@/lib/activity";
import { ActivityItem } from "@/components/features/activity/ActivityItem";

type Props = {
  items: ActivityFeedItem[];
  loading?: boolean;
  loadingMore?: boolean;
  error?: string;
  hasMore?: boolean;
  onRetry?: () => void;
  onLoadMore?: () => void;
};

function ActivitySkeleton() {
  return (
    <div className="activity-item activity-item--skeleton" aria-hidden="true">
      <div className="activity-item-track">
        <span className="activity-item-icon" />
      </div>
      <div className="activity-item-body">
        <div className="activity-skeleton-line activity-skeleton-line--title" />
        <div className="activity-skeleton-line" />
        <div className="activity-skeleton-line activity-skeleton-line--short" />
      </div>
    </div>
  );
}

export function ActivityFeed({
  items,
  loading = false,
  loadingMore = false,
  error = "",
  hasMore = false,
  onRetry,
  onLoadMore,
}: Props) {
  if (loading) {
    return (
      <section className="activity-feed-card">
        <div className="activity-feed-list">
          {Array.from({ length: 5 }).map((_, index) => (
            <ActivitySkeleton key={index} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="activity-feed-card">
        <div className="team-soft-error">
          <div>
            <strong className="team-soft-error-title">Activity is temporarily unavailable</strong>
            <p className="team-soft-error-copy">{error}</p>
          </div>
          {onRetry ? (
            <button className="button secondary" type="button" onClick={onRetry}>
              Retry
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="activity-feed-card activity-feed-card--empty">
        <span className="badge accent">No activity yet</span>
        <h2 className="section-title">This workspace is still quiet</h2>
        <p className="helper-text">
          Create a project, update a task, or invite a teammate to start building an audit trail.
        </p>
        <div className="button-row">
          <Link href="/dashboard/projects" className="button">
            Create project
          </Link>
          <Link href="/dashboard/tasks" className="button secondary">
            Open tasks
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="activity-feed-card">
      <div className="activity-feed-list">
        {items.map((item) => (
          <ActivityItem key={item.id} item={item} />
        ))}
      </div>

      {(hasMore || loadingMore) && onLoadMore ? (
        <div className="activity-feed-actions">
          <button className="button secondary" type="button" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading more..." : "Load more activity"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
