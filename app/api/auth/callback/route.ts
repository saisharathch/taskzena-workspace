import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // "next" lets callers specify where to land after the code exchange
  // e.g. /api/auth/callback?code=xxx&next=/reset-password
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Only allow relative paths to prevent open-redirect attacks
  const safeNext = next.startsWith("/") ? next : "/dashboard";
  return NextResponse.redirect(new URL(safeNext, request.url));
}
