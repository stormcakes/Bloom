import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — fetch plan info + user's active plan record for a given slug
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    // Return all active user plans with plan data
    const { data: userPlans, error } = await supabase
      .from("user_reading_plans")
      .select("*, reading_plans(*)")
      .eq("user_id", user.id)
      .is("completed_at", null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: userPlans ?? [] });
  }

  // Fetch plan by slug
  const { data: plan, error: planError } = await supabase
    .from("reading_plans")
    .select("*")
    .eq("slug", slug)
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Fetch user's record for this plan
  const { data: userPlan } = await supabase
    .from("user_reading_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("plan_id", plan.id)
    .maybeSingle();

  return NextResponse.json({ plan, userPlan: userPlan ?? null });
}

// POST — start a plan (or return existing record if already joined)
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { plan_id } = body;

  if (!plan_id) {
    return NextResponse.json({ error: "plan_id is required" }, { status: 400 });
  }

  // Upsert — do nothing if already exists (user_id + plan_id is UNIQUE)
  const { data: userPlan, error } = await supabase
    .from("user_reading_plans")
    .upsert(
      {
        user_id: user.id,
        plan_id,
        current_day: 1,
        started_at: new Date().toISOString(),
      },
      { onConflict: "user_id,plan_id", ignoreDuplicates: true }
    )
    .select()
    .maybeSingle();

  // If ignoreDuplicates kicked in, fetch the existing record
  if (!userPlan) {
    const { data: existing } = await supabase
      .from("user_reading_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("plan_id", plan_id)
      .single();

    return NextResponse.json({ userPlan: existing });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ userPlan });
}
