"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/shared/BrandMark";

type NavItem = {
  label: string;
  href: `/dashboard${string}`;
  exact?: boolean;
  icon: ReactElement;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    exact: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5" />
      </svg>
    ),
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2 4a1 1 0 0 1 1-1h3.586a1 1 0 0 1 .707.293L8 4H13a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Tasks",
    href: "/dashboard/tasks",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="13" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="m12 12 .7.7 1.3-1.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2 12 5.5 8 8 10l3-5 3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Team",
    href: "/dashboard/team",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="5" cy="5" r="2.25" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="11.2" cy="6.2" r="1.8" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2.5 12.8c.7-2 2.2-3 4.5-3s3.8 1 4.5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M10.2 12.3c.35-1.15 1.2-1.85 2.55-2.05" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 1.8v1.6M8 12.6v1.6M14.2 8h-1.6M3.4 8H1.8M12.4 3.6l-1.1 1.1M4.7 11.3l-1.1 1.1M12.4 12.4l-1.1-1.1M4.7 4.7 3.6 3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
];

type Props = {
  userName: string;
};

export function DashboardSidebar({ userName }: Props) {
  const pathname = usePathname();

  function isActive(item: { href: `/dashboard${string}`; exact?: boolean }) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  const firstName = userName.split(" ")[0];
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="dash-sidebar">
      <div className="dash-sidebar-brand">
        <div className="dash-sidebar-brand-lockup">
          <span className="dash-sidebar-kicker">Command Center</span>
          <BrandMark href="/dashboard" />
        </div>
      </div>

      <nav className="dash-nav" aria-label="Dashboard navigation">
        <p className="dash-nav-section-label">Navigate</p>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href as never}
            className={`dash-nav-link${isActive(item) ? " active" : ""}`}
          >
            <span className="dash-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="dash-sidebar-note">
        <div className="dash-sidebar-note-head">
          <span className="dash-sidebar-note-label">Workspace health</span>
          <span className="dash-sidebar-note-badge">Live</span>
        </div>
        <p className="dash-sidebar-note-title">Keep delivery focused</p>
        <p className="dash-sidebar-note-copy">
          Use tasks, analytics, and team views together to keep priorities aligned and work moving.
        </p>
        <Link href="/dashboard/tasks" className="dash-sidebar-note-link">
          Open task workflow
        </Link>
      </div>

      <div className="dash-sidebar-footer">
        <div className="dash-sidebar-footer-copy">
          <span className="dash-user-avatar" aria-hidden>
            {initials}
          </span>
          <div className="dash-sidebar-user-meta">
            <span className="dash-user-name">{firstName}</span>
            <span className="dash-user-role">Taskzena workspace</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
