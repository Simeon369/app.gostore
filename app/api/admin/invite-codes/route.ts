import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { verifySuperAdmin } from "@/lib/admin-auth";
import { generateInviteCode } from "@/lib/invite-codes";

export async function GET() {
  const supabase = await createClient();
  const auth = await verifySuperAdmin(supabase);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invite_codes")
    .select("id, code, is_active, created_at, used_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Failed to load invite codes" }, { status: 500 });
  }

  return NextResponse.json({ codes: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const auth = await verifySuperAdmin(supabase);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const countRaw = Number(body?.count ?? 1);
  const count = Number.isFinite(countRaw) ? Math.min(Math.max(Math.floor(countRaw), 1), 20) : 1;

  const admin = createAdminClient();
  const rows: { code: string; created_by: string }[] = [];
  const seenCodes = new Set<string>();

  while (rows.length < count) {
    const code = generateInviteCode();
    if (seenCodes.has(code)) continue;
    seenCodes.add(code);
    rows.push({ code, created_by: auth.user.id });
  }

  const { data, error } = await admin
    .from("invite_codes")
    .insert(rows)
    .select("id, code, is_active, created_at, used_at");

  if (error) {
    return NextResponse.json({ error: "Failed to generate invite codes" }, { status: 500 });
  }

  return NextResponse.json({ codes: data ?? [] }, { status: 201 });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const auth = await verifySuperAdmin(supabase);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : "";
  const isActive = typeof body?.is_active === "boolean" ? body.is_active : null;

  if (!id || isActive === null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invite_codes")
    .update({ is_active: isActive })
    .eq("id", id)
    .is("used_at", null)
    .select("id, code, is_active, created_at, used_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update invite code" }, { status: 500 });
  }

  return NextResponse.json(data);
}
