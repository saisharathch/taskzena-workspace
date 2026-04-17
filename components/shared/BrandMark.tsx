"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type BrandMarkProps = {
  href?: ComponentProps<typeof Link>["href"] | null;
  inverted?: boolean;
};

function TaskzenaLogoIcon() {
  return (
    <svg
      className="brand-icon-svg"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3.2" opacity="0.2" />
      <path
        d="M20 4C13.373 4 8 9.373 8 16v8c0 6.627 5.373 12 12 12 4.533 0 8.48-2.514 10.533-6.228"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 20.4 18.3 24.7 27 16"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className="brand-icon-accent" cx="30.5" cy="29.5" r="2.75" fill="currentColor" />
    </svg>
  );
}

export function BrandMark({ href = "/", inverted = false }: BrandMarkProps) {
  const content = (
    <span className={`brand-mark${inverted ? " inverted" : ""}`}>
      <span className="brand-icon" aria-hidden="true">
        <TaskzenaLogoIcon />
      </span>
      <span className="brand-copy">
        <span className="brand-name">Taskzena</span>
        <span className="brand-tag">AI task management platform</span>
      </span>
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="brand-link" aria-label="Taskzena home">
      {content}
    </Link>
  );
}
