"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreateWorkspaceForm } from "@/components/forms/CreateWorkspaceForm";

type WorkspaceSummary = {
  id: string;
  name: string;
  role: string;
  memberCount: number;
  projectCount: number;
  openTasks: number;
  completedTasks: number;
  completion: number;
  latestActivity: string;
};

type Props = {
  profile: {
    fullName: string | null;
    email: string | null;
    role: string;
  };
  workspaces: WorkspaceSummary[];
};

type Feedback = {
  tone: "success" | "error";
  message: string;
};

type PreferenceKey = "notifications" | "aiInsights";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function SettingsControlCenter({ profile, workspaces }: Props) {
  const router = useRouter();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaces[0]?.id ?? "");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [preferences, setPreferences] = useState({
    notifications: true,
    aiInsights: true,
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [profileName, setProfileName] = useState(profile.fullName ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [dangerLoading, setDangerLoading] = useState<"leave" | "delete" | null>(null);

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? workspaces[0] ?? null,
    [selectedWorkspaceId, workspaces],
  );

  const displayName = profile.fullName ?? profile.email ?? "Taskzena user";
  const avatarText = initials(displayName);

  function updatePreference(key: PreferenceKey) {
    setPreferences((current) => {
      const next = { ...current, [key]: !current[key] };
      setFeedback({
        tone: "success",
        message: `${key === "notifications" ? "Notifications" : "AI insights"} preference updated.`,
      });
      return next;
    });
  }

  async function saveProfile() {
    if (!profileName.trim()) return;
    setProfileSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: profileName.trim() }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to update profile.");
      }

      setProfileOpen(false);
      setFeedback({ tone: "success", message: "Profile updated successfully." });
      router.refresh();
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Failed to update profile.",
      });
    } finally {
      setProfileSaving(false);
    }
  }

  async function leaveWorkspace() {
    if (!selectedWorkspace) return;
    if (!window.confirm(`Leave ${selectedWorkspace.name}? You will lose access to its tasks and members.`)) {
      return;
    }
    setDangerLoading("leave");
    setFeedback(null);

    try {
      const response = await fetch(`/api/workspaces/${selectedWorkspace.id}/leave`, {
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to leave workspace.");
      }

      setFeedback({ tone: "success", message: `You left ${selectedWorkspace.name}.` });
      router.refresh();
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Failed to leave workspace.",
      });
    } finally {
      setDangerLoading(null);
    }
  }

  async function deleteWorkspace() {
    if (!selectedWorkspace) return;
    if (!window.confirm(`Delete ${selectedWorkspace.name}? This permanently removes its projects and tasks.`)) {
      return;
    }
    setDangerLoading("delete");
    setFeedback(null);

    try {
      const response = await fetch(`/api/workspaces/${selectedWorkspace.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to delete workspace.");
      }

      setFeedback({ tone: "success", message: `${selectedWorkspace.name} was deleted.` });
      router.refresh();
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Failed to delete workspace.",
      });
    } finally {
      setDangerLoading(null);
    }
  }

  return (
    <div className="settings-control">
      <section className="settings-hero">
        <div className="settings-hero-copy">
          <span className="badge accent">Settings</span>
          <h1 className="dash-page-title">Your workspace control center</h1>
          <p className="dash-page-subtitle">
            Manage your profile, workspace structure, preferences, and account-level actions from
            one focused place.
          </p>
        </div>

        <div className="settings-hero-actions">
          <button className="button" onClick={() => setWorkspaceOpen(true)} type="button">
            Create Workspace
          </button>
          <button className="button secondary" onClick={() => setProfileOpen(true)} type="button">
            Edit Profile
          </button>
        </div>
      </section>

      {feedback ? (
        <div className={`settings-feedback settings-feedback--${feedback.tone}`}>
          <span>{feedback.message}</span>
        </div>
      ) : null}

      <section className="settings-category">
        <div className="settings-category-head">
          <span className="dash-section-kicker">Profile</span>
          <h2 className="dash-section-title">Identity and account status</h2>
        </div>

        <div className="settings-profile-grid">
          <article className="settings-profile-card">
            <div className="settings-profile-head">
              <div className="settings-profile-avatar" aria-hidden="true">
                {avatarText}
              </div>
              <div className="settings-profile-copy">
                <h3 className="settings-card-title">{displayName}</h3>
                <p className="settings-card-copy">{profile.email ?? "No email available"}</p>
              </div>
              <span className="pill accent">{profile.role}</span>
            </div>
            <div className="settings-profile-actions">
              <button className="button secondary" onClick={() => setProfileOpen(true)} type="button">
                Edit Profile
              </button>
            </div>
          </article>

          <article className="settings-card">
            <span className="dash-section-kicker">Preferences</span>
            <h3 className="settings-card-title">Daily working defaults</h3>
            <div className="settings-toggle-list">
              <button
                className="settings-toggle-row"
                onClick={() => updatePreference("notifications")}
                type="button"
              >
                <div>
                  <strong>Notifications</strong>
                  <p className="settings-card-copy">Stay updated on team changes and assigned work.</p>
                </div>
                <span className={`settings-toggle${preferences.notifications ? " settings-toggle--on" : ""}`}>
                  <span className="settings-toggle-knob" />
                </span>
              </button>

              <button
                className="settings-toggle-row"
                onClick={() => updatePreference("aiInsights")}
                type="button"
              >
                <div>
                  <strong>AI insights</strong>
                  <p className="settings-card-copy">Keep smart recommendations visible across the dashboard.</p>
                </div>
                <span className={`settings-toggle${preferences.aiInsights ? " settings-toggle--on" : ""}`}>
                  <span className="settings-toggle-knob" />
                </span>
              </button>
            </div>
          </article>
        </div>
      </section>

      <section className="settings-category">
        <div className="settings-category-head">
          <span className="dash-section-kicker">Workspace Management</span>
          <h2 className="dash-section-title">Choose where to make changes</h2>
        </div>

        {workspaces.length === 0 ? (
          <div className="settings-empty-card">
            <h3 className="settings-card-title">No workspaces yet</h3>
            <p className="settings-card-copy">
              Create your first workspace to organize projects, invite teammates, and unlock team
              management controls.
            </p>
            <button className="button" onClick={() => setWorkspaceOpen(true)} type="button">
              Create Workspace
            </button>
          </div>
        ) : (
          <div className="settings-workspace-layout">
            <div className="settings-workspace-grid">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  className={`settings-workspace-card${selectedWorkspaceId === workspace.id ? " settings-workspace-card--active" : ""}`}
                  onClick={() => setSelectedWorkspaceId(workspace.id)}
                  type="button"
                >
                  <div className="settings-workspace-top">
                    <div>
                      <strong>{workspace.name}</strong>
                      <p>{workspace.memberCount} members · {workspace.projectCount} projects</p>
                    </div>
                    <span className="pill">{workspace.role}</span>
                  </div>
                  <div className="settings-workspace-metrics">
                    <span>Open: {workspace.openTasks}</span>
                    <span>Done: {workspace.completedTasks}</span>
                    <span>{workspace.completion}% complete</span>
                  </div>
                  <span className="settings-workspace-activity">{workspace.latestActivity}</span>
                </button>
              ))}
            </div>

            {selectedWorkspace ? (
              <article className="settings-workspace-feature">
                <span className="dash-section-kicker">Selected workspace</span>
                <h3 className="settings-card-title">{selectedWorkspace.name}</h3>
                <p className="settings-card-copy">
                  View members, invites, and workspace-specific access controls in the dedicated
                  workspace settings view.
                </p>
                <div className="settings-feature-stats">
                  <div className="settings-feature-stat">
                    <strong>{selectedWorkspace.memberCount}</strong>
                    <span>Members</span>
                  </div>
                  <div className="settings-feature-stat">
                    <strong>{selectedWorkspace.projectCount}</strong>
                    <span>Projects</span>
                  </div>
                  <div className="settings-feature-stat">
                    <strong>{selectedWorkspace.completion}%</strong>
                    <span>Completion</span>
                  </div>
                </div>
                <div className="settings-feature-actions">
                  <Link className="button" href={`/dashboard/settings/${selectedWorkspace.id}`}>
                    Open Workspace Settings
                  </Link>
                </div>
              </article>
            ) : null}
          </div>
        )}
      </section>

      <section className="settings-category">
        <div className="settings-category-head">
          <span className="dash-section-kicker">Danger Zone</span>
          <h2 className="dash-section-title">Sensitive workspace actions</h2>
        </div>

        <div className="settings-danger-grid">
          <article className="settings-danger-card">
            <div>
              <h3 className="settings-card-title">Leave workspace</h3>
              <p className="settings-card-copy">
                Remove yourself from the selected workspace if you no longer need access.
              </p>
            </div>
            <button
              className="button secondary"
              onClick={leaveWorkspace}
              disabled={!selectedWorkspace || dangerLoading !== null || selectedWorkspace.role === "OWNER"}
              type="button"
            >
              {dangerLoading === "leave" ? "Leaving..." : "Leave Workspace"}
            </button>
          </article>

          <article className="settings-danger-card settings-danger-card--critical">
            <div>
              <h3 className="settings-card-title">Delete workspace</h3>
              <p className="settings-card-copy">
                Permanently remove the selected workspace and all associated projects and tasks.
              </p>
            </div>
            <button
              className="button secondary settings-danger-button"
              onClick={deleteWorkspace}
              disabled={!selectedWorkspace || dangerLoading !== null || selectedWorkspace.role !== "OWNER"}
              type="button"
            >
              {dangerLoading === "delete" ? "Deleting..." : "Delete Workspace"}
            </button>
          </article>
        </div>
      </section>

      {profileOpen ? (
        <div className="settings-modal-backdrop" onClick={() => setProfileOpen(false)} role="presentation">
          <div className="settings-modal-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="settings-modal-head">
              <div>
                <span className="badge accent">Profile</span>
                <h3 className="settings-card-title">Edit profile</h3>
              </div>
              <button className="button secondary" onClick={() => setProfileOpen(false)} type="button">
                Close
              </button>
            </div>

            <div className="stack">
              <label className="field">
                <span className="field-label">Full name</span>
                <input
                  className="input"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Email</span>
                <input className="input" value={profile.email ?? ""} disabled readOnly />
              </label>
              <button className="button" onClick={saveProfile} disabled={profileSaving || !profileName.trim()} type="button">
                {profileSaving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {workspaceOpen ? (
        <div className="settings-modal-backdrop" onClick={() => setWorkspaceOpen(false)} role="presentation">
          <div className="settings-modal-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="settings-modal-head">
              <div>
                <span className="badge accent">Workspace</span>
                <h3 className="settings-card-title">Create workspace</h3>
              </div>
              <button className="button secondary" onClick={() => setWorkspaceOpen(false)} type="button">
                Close
              </button>
            </div>

            <CreateWorkspaceForm
              onSuccess={(workspaceName) => {
                setWorkspaceOpen(false);
                setFeedback({ tone: "success", message: `${workspaceName} created successfully.` });
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
