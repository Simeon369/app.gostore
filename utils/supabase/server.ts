import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      // Return an array of { name, value } objects. If Next.js provides a getAll method, use it; otherwise return []
      getAll: () => {
        const all = (cookieStore as any).getAll?.() ?? [];
        return all.map((c: any) => ({ name: c.name ?? "", value: c.value }));
      },
      // Supabase may try to set auth cookies, but we don't need them in the admin context.
      // Provide a no‑op implementation to satisfy the type checker.
      setAll: () => {},
    },
  });
}
