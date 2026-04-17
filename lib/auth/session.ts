import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

async function getOrCreateAppUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  try {
    return await prisma.user.upsert({
      where: { authUserId: user.id },
      update: {
        email: user.email ?? `${user.id}@placeholder.local`,
        fullName: user.user_metadata?.full_name ?? null
      },
      create: {
        authUserId: user.id,
        email: user.email ?? `${user.id}@placeholder.local`,
        fullName: user.user_metadata?.full_name ?? null
      }
    });
  } catch (error) {
    // Two requests can still collide during first sign-in in some deployments.
    // If that happens, read the existing row and continue.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return prisma.user.findUnique({
        where: { authUserId: user.id }
      });
    }

    throw error;
  }
}

/** For Server Components / Server Actions — redirects to /login if unauthenticated */
export async function requireAppUser() {
  const user = await getOrCreateAppUser();
  if (!user) redirect("/login");
  return user;
}

/** For Route Handlers — returns null instead of redirecting so callers can return a 401 */
export async function getApiUser() {
  return getOrCreateAppUser();
}
