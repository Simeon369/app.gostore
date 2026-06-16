import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getPlatformSettings } from "@/lib/platform-settings";
import { normalizeInviteCode } from "@/lib/invite-codes";

type SignupPayload = {
  email?: string;
  password?: string;
  inviteCode?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as SignupPayload;
  const email = body.email?.trim().toLowerCase() || "";
  const password = body.password || "";
  const inviteCode = normalizeInviteCode(body.inviteCode || "");

  if (!email || !password || !inviteCode) {
    return NextResponse.json({ error: "Email, password and invite code are required." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const settings = await getPlatformSettings();
  if (!settings.signup_enabled) {
    return NextResponse.json({ error: "Signups are currently closed." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: invite, error: inviteError } = await admin
    .from("invite_codes")
    .select("id")
    .eq("code", inviteCode)
    .eq("is_active", true)
    .is("used_at", null)
    .maybeSingle();

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Invalid or expired invite code." }, { status: 400 });
  }

  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !createdUser.user) {
    return NextResponse.json({ error: createError?.message || "Could not create account." }, { status: 400 });
  }

  const { data: consumed, error: consumeError } = await admin
    .from("invite_codes")
    .update({
      used_by: createdUser.user.id,
      used_at: new Date().toISOString(),
      is_active: false,
    })
    .eq("id", invite.id)
    .eq("is_active", true)
    .is("used_at", null)
    .select("id")
    .maybeSingle();

  if (consumeError || !consumed) {
    await admin.auth.admin.deleteUser(createdUser.user.id);
    return NextResponse.json({ error: "Invite code is no longer available. Please request a new one." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
