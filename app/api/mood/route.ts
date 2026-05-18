import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const query = supabase
    .from("mood_checkins")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (date) query.eq("date", date).single();

  const { data } = await (date
    ? supabase.from("mood_checkins").select("*").eq("user_id", user.id).eq("date", date).maybeSingle()
    : supabase.from("mood_checkins").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30));

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mood, note, date } = await request.json();
  if (!mood) return NextResponse.json({ error: "mood required" }, { status: 400 });

  const { data, error } = await supabase
    .from("mood_checkins")
    .upsert({ user_id: user.id, mood, note, date }, { onConflict: "user_id,date" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
