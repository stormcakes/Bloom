import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("scripture_memory_cards")
    .select("*")
    .eq("user_id", user.id)
    .lte("next_review_at", now)
    .order("next_review_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { verse_reference, verse_text } = body;

  if (!verse_reference?.trim() || !verse_text?.trim()) {
    return NextResponse.json(
      { error: "verse_reference and verse_text are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("scripture_memory_cards")
    .insert({
      user_id: user.id,
      verse_reference: verse_reference.trim(),
      verse_text: verse_text.trim(),
      next_review_at: new Date().toISOString(),
      interval_days: 1,
      repetitions: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
