import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/utils/supabase/admin";

function createPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, key);
}

export type PlatformSettings = {
  signup_enabled: boolean;
  maintenance_mode: boolean;
  updated_at?: string;
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  signup_enabled: false,
  maintenance_mode: false,
};

export function getMarketingWaitlistUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_MARKETING_URL?.replace(/\/$/, "") ||
    "https://home-gostore.vercel.app";
  return `${base}/join`;
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    // Public read via anon key + RLS (no service role required on edge/server)
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("signup_enabled, maintenance_mode, updated_at")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      if (error && error.code !== "PGRST116" && error.code !== "42P01") {
        console.error("getPlatformSettings error:", error);
      }
      return DEFAULT_PLATFORM_SETTINGS;
    }

    return {
      signup_enabled: Boolean(data.signup_enabled),
      maintenance_mode: Boolean(data.maintenance_mode),
      updated_at: data.updated_at,
    };
  } catch (err) {
    console.error("getPlatformSettings:", err);
    return DEFAULT_PLATFORM_SETTINGS;
  }
}

export async function updatePlatformSettings(
  updates: Partial<Pick<PlatformSettings, "signup_enabled" | "maintenance_mode">>,
  updatedBy: string,
): Promise<{ settings: PlatformSettings } | { error: string }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("platform_settings")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      })
      .eq("id", 1)
      .select("signup_enabled, maintenance_mode, updated_at")
      .single();

    if (error || !data) {
      return { error: error?.message || "Failed to update settings" };
    }

    return {
      settings: {
        signup_enabled: Boolean(data.signup_enabled),
        maintenance_mode: Boolean(data.maintenance_mode),
        updated_at: data.updated_at,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update settings";
    return { error: message };
  }
}
