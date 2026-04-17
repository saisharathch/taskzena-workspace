"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NotificationBell } from "@/components/features/notifications/NotificationBell";
import { createClient } from "@/lib/supabase/client";

type Props = { userName: string };

const PAGE_META: Record<string, { label: string; title: string }> = {
  "/dashboard": { label: "Overview", title: "Workspace dashboard" },
  "/dashboard/projects": { label: "Projects", title: "Project portfolio" },
  "/dashboard/tasks": { label: "Execution", title: "Task operations" },
  "/dashboard/analytics": { label: "Analytics", title: "Performance insights" },
  "/dashboard/team": { label: "Collaboration", title: "Team workspace" },
  "/dashboard/settings": { label: "Settings", title: "Workspace control center" },
  "/dashboard/reports": { label: "Reports", title: "Delivery reports" },
  "/dashboard/audit": { label: "Audit", title: "Activity audit trail" },
  "/dashboard/kanban": { label: "Board", title: "Kanban workflow" },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate() {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date());
}

export function DashboardTopbar({ userName }: Props) {
  const firstName = userName.split(" ")[0] ?? "User";
  const initials = getInitials(userName);
  const router = useRouter();
  const pathname = usePathname();

  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const lastY = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const pageMeta = useMemo(() => {
    if (pathname in PAGE_META) return PAGE_META[pathname];
    const matched = Object.keys(PAGE_META)
      .sort((left, right) => right.length - left.length)
      .find((route) => pathname === route || pathname.startsWith(`${route}/`));

    return (matched ? PAGE_META[matched] : PAGE_META["/dashboard"]) ?? PAGE_META["/dashboard"];
  }, [pathname]);

  useEffect(() => {
    const THRESHOLD = 64;
    function onScroll() {
      const y = window.scrollY;
      if (y > lastY.current && y > THRESHOLD) setHidden(true);
      else if (y < lastY.current) setHidden(false);
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className={`dash-topbar${hidden ? " dash-topbar--hidden" : ""}`}>
      <div className="dash-topbar-left">
        <div className="dash-topbar-context">
          <div>
            <span className="dash-topbar-label">{pageMeta.label}</span>
            <h2 className="dash-topbar-heading">{pageMeta.title}</h2>
          </div>
          <span className="dash-topbar-date">{formatDate()}</span>
        </div>

        <div className="dash-topbar-search">
          <span className="dash-topbar-search-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <input
            className="dash-topbar-search-input"
            type="search"
            placeholder="Search tasks, projects, teammates..."
            aria-label="Search"
          />
          <span className="dash-topbar-shortcut" aria-hidden="true">
            Ctrl K
          </span>
        </div>
      </div>

      <div className="dash-topbar-right">
        <Link href="/dashboard/tasks" className="dash-topbar-home-link">
          Open tasks
        </Link>

        <div className="dash-topbar-icon-group">
          <NotificationBell />
        </div>

        <div className="dash-user-menu" ref={menuRef}>
          <button
            className="dash-profile-chip"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            suppressHydrationWarning
          >
            <span className="dash-profile-avatar" aria-hidden="true">
              {initials}
            </span>
            <span className="dash-profile-copy">
              <span className="dash-profile-name">{firstName}</span>
              <span className="dash-profile-role">Workspace account</span>
            </span>
            <svg
              className={`dash-user-chevron${menuOpen ? " dash-user-chevron--open" : ""}`}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 4l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {menuOpen && (
            <div className="dash-user-dropdown" role="menu">
              <div className="dash-dropdown-header">
                <span className="dash-dropdown-name">{userName}</span>
                <span className="dash-dropdown-role">Taskzena workspace</span>
              </div>

              <div className="dash-dropdown-divider" />

              <Link
                href="/dashboard/settings"
                className="dash-dropdown-item"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1-.33H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9c.15-.42.15-.88 0-1.3a1.65 1.65 0 0 0-.6-1l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6c.42-.15.88-.15 1.3 0a1.65 1.65 0 0 0 1-.6V4a2 2 0 1 1 4 0v.09c0 .42.21.82.56 1.05.35.23.79.3 1.2.16a1.65 1.65 0 0 0 1-.6l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.3.3-.43.74-.33 1.16.1.42.38.78.75.98.37.2.79.26 1.21.16H21a2 2 0 1 1 0 4h-.09c-.42 0-.82.21-1.05.56-.23.35-.3.79-.16 1.2Z" />
                </svg>
                Settings
              </Link>

              <Link
                href="/"
                className="dash-dropdown-item"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
                Back to site
              </Link>

              <div className="dash-dropdown-divider" />

              <button
                className="dash-dropdown-item dash-dropdown-item--danger"
                role="menuitem"
                onClick={handleSignOut}
                disabled={signingOut}
                suppressHydrationWarning
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16,17 21,12 16,7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
