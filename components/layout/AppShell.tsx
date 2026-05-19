import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { AmbientBackground } from "@/components/AmbientBackground";
import { PageTransitionWrapper } from "@/components/PageTransitionWrapper";
import type { BloomTheme } from "@/types";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("theme, onboarding_completed, life_season")
    .eq("user_id", user.id)
    .single();

  // Only redirect brand-new users: onboarding explicitly false AND no life_season chosen yet.
  // This prevents existing users (whose onboarding_completed may be false due to DB defaults
  // or DebugPanel resets) from being trapped in the onboarding loop.
  if (profile && profile.onboarding_completed === false && profile.life_season === null) {
    redirect("/onboarding");
  }

  const theme = (profile?.theme ?? "cozy") as BloomTheme;

  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen bloom-gradient relative">
        <AmbientBackground />
        <main className="relative z-10 mx-auto max-w-lg min-h-screen pb-24 pt-safe">
          <PageTransitionWrapper>
            {children}
          </PageTransitionWrapper>
        </main>
        <BottomNav />
        {process.env.NODE_ENV === "development" && <DebugPanel />}
      </div>
    </ThemeProvider>
  );
}
