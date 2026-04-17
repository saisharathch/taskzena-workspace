import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TaskZen | AI Task Management Platform",
  description: "TaskZen — the AI-powered task platform that gives teams instant project health scores, smart search, workload insights, and AI-assisted delivery workflows."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* suppressHydrationWarning here covers direct children of body */}
      <body className="app-root" suppressHydrationWarning>{children}</body>
    </html>
  );
}
