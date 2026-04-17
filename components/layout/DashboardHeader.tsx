import Link from "next/link";
import { BrandMark } from "@/components/shared/BrandMark";
import { SignOutButton } from "@/components/shared/SignOutButton";
import { NotificationBell } from "@/components/features/notifications/NotificationBell";
import type { DashboardStats } from "@/lib/services/dashboard";

type Props = {
  userName: string;
  stats: DashboardStats;
  focusMessage: string;
};

export function DashboardHeader({ userName, stats, focusMessage }: Props) {
  const firstName = userName.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const riskLevel =
    stats.overdue > 0 ? "danger" : stats.dueSoon > 0 ? "warning" : "ok";

  return (
    <section className="db-header">
      <div className="container">
        {/* ── Top nav bar ── */}
        <nav className="db-topbar">
          <BrandMark href="/" />
          <div className="db-topbar-actions">
            <Link href="/dashboard/kanban"  className="button secondary">Kanban</Link>
            <Link href="/dashboard/reports" className="button secondary">Reports</Link>
            <Link href="/dashboard/audit"   className="button secondary">Audit log</Link>
            <Link href="/"                  className="button secondary">← Landing</Link>
            <NotificationBell />
            <SignOutButton />
          </div>
        </nav>

        {/* ── Hero row ── */}
        <div className="db-hero-row">
          {/* Left — greeting + pulse */}
          <div className="db-hero-left">
            <p className="db-greeting-label">{greeting}</p>
            <h1 className="db-greeting-name">{firstName}</h1>
            <p className="db-greeting-sub">
              {stats.activeTasks} active task{stats.activeTasks !== 1 ? "s" : ""} across {stats.workspaces} workspace{stats.workspaces !== 1 ? "s" : ""}
            </p>

            {/* Focus banner */}
            <div className={`db-focus-banner db-focus-${riskLevel}`}>
              <span className="db-focus-dot" />
              <span>{focusMessage}</span>
            </div>
          </div>

          {/* Right — quick stat chips */}
          <div className="db-pulse-chips">
            <div className="db-chip">
              <span className="db-chip-value">{stats.completionRate}%</span>
              <span className="db-chip-label">Completion</span>
            </div>
            <div className={`db-chip ${stats.overdue ? "db-chip-danger" : ""}`}>
              <span className="db-chip-value">{stats.overdue}</span>
              <span className="db-chip-label">Overdue</span>
            </div>
            <div className={`db-chip ${stats.dueSoon ? "db-chip-warn" : ""}`}>
              <span className="db-chip-value">{stats.dueSoon}</span>
              <span className="db-chip-label">Due soon</span>
            </div>
            <div className={`db-chip ${stats.urgent ? "db-chip-warn" : ""}`}>
              <span className="db-chip-value">{stats.urgent}</span>
              <span className="db-chip-label">High priority</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
