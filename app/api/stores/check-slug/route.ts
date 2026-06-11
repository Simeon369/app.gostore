import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidStoreSlug } from "@/lib/store-slug";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug")?.trim().toLowerCase();

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  if (!isValidStoreSlug(slug)) {
    return NextResponse.json({
      slug,
      available: false,
      reason: "invalid",
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("check-slug error:", error);
    return NextResponse.json({ error: "Could not check availability" }, { status: 500 });
  }

  return NextResponse.json({
    slug,
    available: !data,
    reason: data ? "taken" : null,
  });
}
