"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SignOutButtonProps = {
  inverted?: boolean;
};

export function SignOutButton({ inverted = false }: SignOutButtonProps) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      className={`button secondary${inverted ? " inverted" : ""}`}
      type="button"
      onClick={handleClick}
      disabled={loading}
      suppressHydrationWarning
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
