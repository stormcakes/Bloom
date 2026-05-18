/*
 * Run in Supabase SQL editor before using this feature:
 *
 * ALTER TABLE user_profiles
 *   ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
 *   ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0,
 *   ADD COLUMN IF NOT EXISTS reward_months INTEGER DEFAULT 0,
 *   ADD COLUMN IF NOT EXISTS referred_by TEXT,
 *   ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ;
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/referral — returns current user's referral info
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("referral_code, referral_count, reward_months")
    .eq("user_id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      code: profile.referral_code ?? null,
      referral_count: profile.referral_count ?? 0,
      reward_months: profile.reward_months ?? 0,
    },
  });
}

// POST /api/referral — apply a referral code for the current user
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const code = (body.code ?? "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Referral code is required" }, { status: 400 });
  }

  // Check if current user already used a referral code
  const { data: currentProfile } = await supabase
    .from("user_profiles")
    .select("referral_code, referred_by, reward_months")
    .eq("user_id", user.id)
    .single();

  if (currentProfile?.referred_by) {
    return NextResponse.json(
      { error: "You have already used a referral code" },
      { status: 400 }
    );
  }

  // Prevent using own code
  if (currentProfile?.referral_code === code) {
    return NextResponse.json(
      { error: "You cannot use your own referral code" },
      { status: 400 }
    );
  }

  // Find the referrer
  const { data: referrer } = await supabase
    .from("user_profiles")
    .select("user_id, referral_count, reward_months, premium_until")
    .eq("referral_code", code)
    .single();

  if (!referrer) {
    return NextResponse.json({ error: "Referral code not found" }, { status: 404 });
  }

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Give current user 30 days premium + mark referred_by
  const { error: newUserError } = await supabase
    .from("user_profiles")
    .update({
      subscription_tier: "premium",
      premium_until: thirtyDaysFromNow,
      reward_months: (currentProfile?.reward_months ?? 0) + 1,
      referred_by: code,
    })
    .eq("user_id", user.id);

  if (newUserError) {
    return NextResponse.json({ error: "Failed to apply referral" }, { status: 500 });
  }

  // Give referrer 30 days premium + increment referral_count + reward_months
  const referrerPremiumUntil = referrer.premium_until
    ? new Date(Math.max(new Date(referrer.premium_until).getTime(), now.getTime()) + 30 * 24 * 60 * 60 * 1000).toISOString()
    : thirtyDaysFromNow;

  const { error: referrerError } = await supabase
    .from("user_profiles")
    .update({
      subscription_tier: "premium",
      premium_until: referrerPremiumUntil,
      reward_months: (referrer.reward_months ?? 0) + 1,
      referral_count: (referrer.referral_count ?? 0) + 1,
    })
    .eq("user_id", referrer.user_id);

  if (referrerError) {
    console.error("Failed to reward referrer:", referrerError);
  }

  return NextResponse.json({ success: true });
}
