import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, LogOut } from "lucide-react";
import { THEMES } from "@/config/themes";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const MENU_ITEMS = [
  { label: "My Profile", href: "/profile/edit", icon: "👤", comingSoon: false },
  { label: "Themes", href: "/profile/themes", icon: "🎨", comingSoon: false },
  { label: "Reminders", href: "/profile/reminders", icon: "🔔", badge: "On", comingSoon: true },
  { label: "Bible Version", href: "/profile/bible-version", icon: "📖", badge: "NIV", comingSoon: true },
  { label: "Privacy", href: "/profile/privacy", icon: "🔒", comingSoon: true },
  { label: "Help & Support", href: "/support", icon: "💬", comingSoon: true },
  { label: "About Bloom", href: "/about", icon: "🌸", comingSoon: true },
];

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, theme, created_at, streak_current, devotionals_completed, subscription_tier")
    .eq("user_id", user.id)
    .single();

  const theme = profile?.theme ?? "cozy";
  const themeConfig = THEMES[theme as keyof typeof THEMES] ?? THEMES.cozy;
  const joinDate = profile?.created_at
    ? format(new Date(profile.created_at), "MMMM yyyy")
    : "Recently";

  return (
    <div className="flex flex-col min-h-screen px-4 pt-10 pb-28 gap-5 animate-fade-in">

      {/* Profile header */}
      <div className="bloom-card flex items-center gap-4">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-md flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${themeConfig.gradient.from}, ${themeConfig.gradient.to})` }}
        >
          🌸
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-lg truncate">{profile?.display_name ?? "Friend"}</p>
          <p className="text-sm text-muted-foreground">
            Blooming since {joinDate}
          </p>
          {profile?.subscription_tier === "premium" && (
            <span className="inline-block mt-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              ✨ Premium
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Streak", value: profile?.streak_current ?? 0, emoji: "🔥" },
          { label: "Completed", value: profile?.devotionals_completed ?? 0, emoji: "📖" },
          { label: "Theme", value: themeConfig.label.split(" ")[0], emoji: themeConfig.emoji },
        ].map(({ label, value, emoji }) => (
          <div key={label} className="bloom-card text-center py-4 space-y-1">
            <p className="text-xl">{emoji}</p>
            <p className="text-base font-bold text-foreground">{value}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="bloom-card p-0 overflow-hidden divide-y divide-border/50">
        {MENU_ITEMS.map(({ label, href, icon, badge, comingSoon }) => (
          comingSoon ? (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-4 opacity-70"
            >
              <span className="text-xl w-7 text-center">{icon}</span>
              <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
              {badge && <span className="text-xs text-muted-foreground mr-1">{badge}</span>}
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Soon</span>
            </div>
          ) : (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-3 px-4 py-4 hover:bg-muted/40 active:bg-muted/60 transition-colors"
            >
              <span className="text-xl w-7 text-center">{icon}</span>
              <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
              {badge && <span className="text-xs text-muted-foreground mr-1">{badge}</span>}
              <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
            </Link>
          )
        ))}
      </div>

      {/* Upgrade CTA (free users) */}
      {profile?.subscription_tier === "free" && (
        <div
          className="rounded-2xl p-5 text-white text-center space-y-2"
          style={{ background: "linear-gradient(135deg, #E6567A 0%, #C4458F 100%)" }}
        >
          <p className="font-bold text-base">Unlock Premium 🌸</p>
          <p className="text-white/80 text-xs leading-relaxed">
            Unlimited AI chat, custom devotional plans, audio devotionals, and more.
          </p>
          <button className="mt-2 bg-white text-rose-500 font-bold text-sm px-6 py-2.5 rounded-xl active:scale-95 transition-transform">
            Upgrade — $5.99/month
          </button>
        </div>
      )}

      {/* Sign out */}
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-border/60 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </form>
    </div>
  );
}
