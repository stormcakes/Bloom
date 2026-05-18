import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all prayer requests with author display_name via join
  const { data: prayers, error } = await supabase
    .from("prayer_requests")
    .select(
      `id, content, is_anonymous, prayer_count, created_at, user_id,
       user_profiles!prayer_requests_user_id_fkey(display_name)`
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch which prayers the current user has already prayed for
  const { data: myInteractions } = await supabase
    .from("prayer_interactions")
    .select("prayer_id")
    .eq("user_id", user.id);

  const prayedSet = new Set((myInteractions ?? []).map((i) => i.prayer_id));

  const result = (prayers ?? []).map((p) => {
    const profile = Array.isArray(p.user_profiles)
      ? p.user_profiles[0]
      : p.user_profiles;
    return {
      id: p.id,
      content: p.content,
      is_anonymous: p.is_anonymous,
      prayer_count: p.prayer_count,
      created_at: p.created_at,
      display_name: p.is_anonymous ? null : (profile?.display_name ?? null),
      has_prayed: prayedSet.has(p.id),
      is_own: p.user_id === user.id,
    };
  });

  return NextResponse.json({ data: result });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { content, is_anonymous } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }
  if (content.trim().length > 300) {
    return NextResponse.json({ error: "Content must be 300 characters or fewer" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("prayer_requests")
    .insert({
      user_id: user.id,
      content: content.trim(),
      is_anonymous: is_anonymous ?? true,
      prayer_count: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
