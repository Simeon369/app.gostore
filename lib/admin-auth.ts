import type { SupabaseClient, User } from "@supabase/supabase-js";

export function isSuperAdminEmail(email: string | undefined | null): boolean {
  const allowed = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  if (!allowed || !email) return false;
  return email.toLowerCase() === allowed;
}

export async function verifySuperAdmin(
  supabase: SupabaseClient,
): Promise<{ user: User } | { error: string; status: number }> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "Unauthorized", status: 401 };
  }

  if (!isSuperAdminEmail(user.email)) {
    return { error: "Forbidden", status: 403 };
  }

  return { user };
}
