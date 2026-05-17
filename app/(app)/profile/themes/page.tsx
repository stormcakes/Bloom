"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { THEMES } from "@/config/themes";
import type { BloomTheme } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ThemesPage() {
  const router = useRouter();
  const [current, setCurrent] = useState<BloomTheme>("soft_feminine");
  const [saving, setSaving] = useState<BloomTheme | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_profiles")
        .select("theme")
        .single();
      if (data?.theme) setCurrent(data.theme as BloomTheme);
    }
    load();
  }, []);

  async function selectTheme(theme: BloomTheme) {
    if (theme === current) return;
    setSaving(theme);
    const supabase = createClient();
    await supabase.from("user_profiles").update({ theme }).eq(
      "user_id",
      (await supabase.auth.getUser()).data.user?.id ?? ""
    );
    setCurrent(theme);
    setSaving(null);
    // Apply immediately
    document.documentElement.setAttribute("data-theme", theme);
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-10 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/profile"
          className="w-9 h-9 rounded-full bg-card border border-border/60 flex items-center justify-center shadow-sm"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Choose Your Vibe</h1>
      </div>

      <p className="text-sm text-muted-foreground mb-5">
        Your theme changes how Bloom looks and feels. You can switch anytime.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {Object.values(THEMES).map((theme) => {
          const isActive = current === theme.id;
          const isSaving = saving === theme.id;

          return (
            <button
              key={theme.id}
              onClick={() => selectTheme(theme.id)}
              className={cn(
                "rounded-2xl overflow-hidden border-2 transition-all active:scale-[0.97] text-left",
                isActive ? "border-primary shadow-md" : "border-transparent"
              )}
            >
              {/* Gradient swatch */}
              <div
                className="w-full h-24 flex items-center justify-center relative"
                style={{
                  background: `linear-gradient(135deg, ${theme.gradient.from}, ${theme.gradient.to})`,
                }}
              >
                <span className="text-3xl drop-shadow-sm">
                  {theme.emoji}
                </span>
                {isActive && !isSaving && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                    <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} />
                  </div>
                )}
                {isSaving && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="bg-white px-3 py-2">
                <p className="text-xs font-semibold text-gray-700">{theme.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{theme.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Theme change takes full effect on your next page load.
      </p>
    </div>
  );
}
