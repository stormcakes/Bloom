"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { THEMES } from "@/config/themes";
import type { BloomTheme, SubscriptionTier } from "@/types";
import { cn } from "@/lib/utils";

type ActionStatus = "idle" | "loading" | "done" | "error";

export function DebugPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Record<string, ActionStatus>>({});

  async function run(key: string, fn: () => Promise<void>) {
    setStatus((s) => ({ ...s, [key]: "loading" }));
    try {
      await fn();
      setStatus((s) => ({ ...s, [key]: "done" }));
      setTimeout(() => setStatus((s) => ({ ...s, [key]: "idle" })), 1500);
      router.refresh();
    } catch (e) {
      console.error(e);
      setStatus((s) => ({ ...s, [key]: "error" }));
    }
  }

  function label(key: string, text: string) {
    const s = status[key];
    if (s === "loading") return <Loader2 className="h-3 w-3 animate-spin inline mr-1" />;
    if (s === "done") return "✓ " + text;
    if (s === "error") return "✗ Failed";
    return text;
  }

  async function getUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not logged in");
    return { supabase, userId: user.id };
  }

  const actions = [
    {
      group: "Onboarding",
      items: [
        {
          key: "reset_onboarding",
          label: "Reset Onboarding",
          color: "text-amber-600 bg-amber-50 border-amber-200",
          fn: async () => {
            const { supabase, userId } = await getUser();
            await supabase.from("user_profiles").update({ onboarding_completed: false }).eq("user_id", userId);
            router.push("/onboarding");
          },
        },
        {
          key: "complete_onboarding",
          label: "Mark Onboarding Complete",
          color: "text-green-600 bg-green-50 border-green-200",
          fn: async () => {
            const { supabase, userId } = await getUser();
            await supabase.from("user_profiles").update({ onboarding_completed: true }).eq("user_id", userId);
          },
        },
      ],
    },
    {
      group: "Subscription",
      items: (["free", "premium", "family"] as SubscriptionTier[]).map((tier) => ({
        key: `tier_${tier}`,
        label: `Set ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
        color: tier === "premium"
          ? "text-purple-600 bg-purple-50 border-purple-200"
          : tier === "family"
          ? "text-blue-600 bg-blue-50 border-blue-200"
          : "text-gray-600 bg-gray-50 border-gray-200",
        fn: async () => {
          const { supabase, userId } = await getUser();
          await supabase.from("user_profiles").update({ subscription_tier: tier }).eq("user_id", userId);
        },
      })),
    },
    {
      group: "Garden & Streak",
      items: [
        {
          key: "reset_streak",
          label: "Reset Streak to 0",
          color: "text-red-600 bg-red-50 border-red-200",
          fn: async () => {
            const { supabase, userId } = await getUser();
            await supabase.from("user_profiles").update({ streak_current: 0, last_active_date: null }).eq("user_id", userId);
          },
        },
        {
          key: "set_streak_7",
          label: "Set Streak to 7",
          color: "text-orange-600 bg-orange-50 border-orange-200",
          fn: async () => {
            const { supabase, userId } = await getUser();
            await supabase.from("user_profiles").update({ streak_current: 7, streak_longest: 7 }).eq("user_id", userId);
          },
        },
        {
          key: "set_streak_30",
          label: "Set Streak to 30",
          color: "text-orange-600 bg-orange-50 border-orange-200",
          fn: async () => {
            const { supabase, userId } = await getUser();
            await supabase.from("user_profiles").update({ streak_current: 30, streak_longest: 30, devotionals_completed: 30 }).eq("user_id", userId);
          },
        },
        {
          key: "reset_garden",
          label: "Reset Garden to Seed",
          color: "text-green-600 bg-green-50 border-green-200",
          fn: async () => {
            const { supabase, userId } = await getUser();
            await supabase.from("user_profiles").update({ garden_stage: "seed", devotionals_completed: 0 }).eq("user_id", userId);
          },
        },
        {
          key: "garden_full_bloom",
          label: "Set Garden to Full Bloom",
          color: "text-pink-600 bg-pink-50 border-pink-200",
          fn: async () => {
            const { supabase, userId } = await getUser();
            await supabase.from("user_profiles").update({ garden_stage: "full_bloom", devotionals_completed: 50 }).eq("user_id", userId);
          },
        },
      ],
    },
    {
      group: "Devotionals",
      items: [
        {
          key: "delete_today",
          label: "Delete Today's Devotional",
          color: "text-red-600 bg-red-50 border-red-200",
          fn: async () => {
            const { supabase, userId } = await getUser();
            const today = new Date().toISOString().split("T")[0];
            await supabase.from("devotionals").delete().eq("user_id", userId).eq("date", today);
          },
        },
        {
          key: "complete_today",
          label: "Mark Today Complete",
          color: "text-green-600 bg-green-50 border-green-200",
          fn: async () => {
            const { supabase, userId } = await getUser();
            const today = new Date().toISOString().split("T")[0];
            await supabase.from("devotionals").update({ is_completed: true, completed_at: new Date().toISOString() }).eq("user_id", userId).eq("date", today);
          },
        },
        {
          key: "delete_all_devotionals",
          label: "Delete All Devotionals",
          color: "text-red-700 bg-red-50 border-red-300",
          fn: async () => {
            const { supabase, userId } = await getUser();
            await supabase.from("devotionals").delete().eq("user_id", userId);
            await supabase.from("user_profiles").update({ devotionals_completed: 0, streak_current: 0, garden_stage: "seed" }).eq("user_id", userId);
          },
        },
      ],
    },
    {
      group: "Journal",
      items: [
        {
          key: "clear_journal",
          label: "Clear All Journal Entries",
          color: "text-red-600 bg-red-50 border-red-200",
          fn: async () => {
            const { supabase, userId } = await getUser();
            await supabase.from("journal_entries").delete().eq("user_id", userId);
          },
        },
      ],
    },
  ];

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-3 z-[100] w-10 h-10 rounded-full bg-gray-900 text-white text-xs font-bold shadow-lg flex items-center justify-center border-2 border-yellow-400 hover:bg-gray-800 active:scale-95 transition-all"
        title="Debug Panel"
      >
        🛠
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-[99] flex items-end justify-center pointer-events-none">
          <div
            className="pointer-events-auto w-full max-w-lg bg-gray-950 text-white rounded-t-3xl shadow-2xl border-t border-yellow-400/40 max-h-[80vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-950 flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 text-sm">🛠</span>
                <span className="font-bold text-sm text-yellow-400">Debug Panel</span>
                <span className="text-[10px] bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium">DEV ONLY</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Theme switcher */}
            <div className="px-5 py-4 border-b border-gray-800">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Theme</p>
              <div className="flex flex-wrap gap-2">
                {Object.values(THEMES).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => run(`theme_${t.id}`, async () => {
                      const { supabase, userId } = await getUser();
                      await supabase.from("user_profiles").update({ theme: t.id }).eq("user_id", userId);
                      document.documentElement.setAttribute("data-theme", t.id);
                    })}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-xs font-medium transition-all active:scale-95",
                      status[`theme_${t.id}`] === "done"
                        ? "bg-yellow-400 text-gray-900 border-yellow-400"
                        : "bg-gray-800 text-gray-300 border-gray-700 hover:border-yellow-400/50"
                    )}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action groups */}
            <div className="px-5 py-4 space-y-5 pb-10">
              {actions.map(({ group, items }) => (
                <div key={group}>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">{group}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => run(item.key, item.fn)}
                        disabled={status[item.key] === "loading"}
                        className="px-3 py-1.5 rounded-xl border text-xs font-medium bg-gray-800 text-gray-300 border-gray-700 hover:border-yellow-400/50 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1"
                      >
                        {status[item.key] === "loading" && <Loader2 className="h-3 w-3 animate-spin" />}
                        {status[item.key] === "done" ? "✓ " : ""}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
