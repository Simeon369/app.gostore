import { NextResponse } from "next/server";
import { getPlatformSettings } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getPlatformSettings();
  return NextResponse.json({
    signup_enabled: settings.signup_enabled,
    maintenance_mode: settings.maintenance_mode,
  });
}
