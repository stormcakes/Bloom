import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Difficulty = "hard" | "okay" | "easy";

const INTERVAL_MAP: Record<Difficulty, number> = {
  hard: 1,
  okay: 3,
  easy: 7,
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const difficulty: Difficulty = body.difficulty;

  if (!["hard", "okay", "easy"].includes(difficulty)) {
    return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
  }

  const intervalDays = INTERVAL_MAP[difficulty];
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + intervalDays);

  // Fetch current card to increment repetitions
  const { data: card, error: fetchError } = await supabase
    .from("scripture_memory_cards")
    .select("repetitions")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("scripture_memory_cards")
    .update({
      next_review_at: nextReview.toISOString(),
      interval_days: intervalDays,
      repetitions: (card.repetitions ?? 0) + 1,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
