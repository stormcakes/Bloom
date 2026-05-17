import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { DebugPanel } from "@/components/debug/DebugPanel";
import type { BloomTheme } from "@/types";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("theme, onboarding_completed")
    .eq("user_id", user.id)
    .single();

  if (profile && !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const theme = (profile?.theme ?? "cozy") as BloomTheme;

  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen bloom-gradient">
        <main className="mx-auto max-w-lg min-h-screen pb-24 pt-safe">
          {children}
        </main>
        <BottomNav />
        {process.env.NODE_ENV === "development" && <DebugPanel />}
      </div>
    </ThemeProvider>
  );
}
