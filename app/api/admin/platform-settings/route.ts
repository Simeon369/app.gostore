import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifySuperAdmin } from "@/lib/admin-auth";
import { getPlatformSettings, updatePlatformSettings } from "@/lib/platform-settings";

export async function GET() {
  const supabase = await createClient();
  const auth = await verifySuperAdmin(supabase);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const settings = await getPlatformSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const auth = await verifySuperAdmin(supabase);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const updates: {
    signup_enabled?: boolean;
    maintenance_mode?: boolean;
  } = {};

  if (typeof body.signup_enabled === "boolean") {
    updates.signup_enabled = body.signup_enabled;
  }
  if (typeof body.maintenance_mode === "boolean") {
    updates.maintenance_mode = body.maintenance_mode;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid settings provided" }, { status: 400 });
  }

  const result = await updatePlatformSettings(updates, auth.user.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.settings);
}
