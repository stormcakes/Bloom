import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: prayerId } = await params;

  // Check if the user already prayed for this request
  const { data: existing } = await supabase
    .from("prayer_interactions")
    .select("id")
    .eq("prayer_id", prayerId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Toggle off — remove interaction and decrement count
    await supabase
      .from("prayer_interactions")
      .delete()
      .eq("prayer_id", prayerId)
      .eq("user_id", user.id);

    await supabase.rpc("decrement_prayer_count", { prayer_id: prayerId });

    return NextResponse.json({ has_prayed: false });
  } else {
    // Toggle on — add interaction and increment count
    await supabase
      .from("prayer_interactions")
      .insert({ prayer_id: prayerId, user_id: user.id });

    await supabase.rpc("increment_prayer_count", { prayer_id: prayerId });

    return NextResponse.json({ has_prayed: true });
  }
}
