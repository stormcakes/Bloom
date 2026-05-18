import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function generateCode(displayName: string): string {
  const letters = (displayName ?? "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, "X");

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return letters + random;
}

// POST /api/referral/generate — creates a referral code if one doesn't exist
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("referral_code, display_name")
    .eq("user_id", user.id)
    .single();

  // Already has a code — return it
  if (profile?.referral_code) {
    return NextResponse.json({ code: profile.referral_code });
  }

  // Generate a unique code (retry up to 5 times on collision)
  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateCode(profile?.display_name ?? "");

    const { error } = await supabase
      .from("user_profiles")
      .update({ referral_code: code })
      .eq("user_id", user.id)
      .is("referral_code", null);

    if (!error) break;

    // On unique constraint violation, loop and try another code
    code = "";
  }

  if (!code) {
    return NextResponse.json({ error: "Failed to generate referral code" }, { status: 500 });
  }

  return NextResponse.json({ code });
}
