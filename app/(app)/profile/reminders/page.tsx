"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Bell, BellOff } from "lucide-react";

// Capacitor local notifications — only available in native app
async function getNotificationsPlugin() {
  if (typeof window === "undefined") return null;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    return LocalNotifications;
  } catch {
    return null;
  }
}

export default function RemindersPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("08:00");
  const [saved, setSaved] = useState(false);
  const [permissionState, setPermissionState] = useState<"granted" | "denied" | "prompt" | "unavailable">("unavailable");

  useEffect(() => {
    const storedEnabled = localStorage.getItem("bloom_notif_enabled");
    const storedTime = localStorage.getItem("bloom_notif_time");
    if (storedEnabled === "true") setEnabled(true);
    if (storedTime) setTime(storedTime);
    checkPermission();
  }, []);

  async function checkPermission() {
    const plugin = await getNotificationsPlugin();
    if (!plugin) { setPermissionState("unavailable"); return; }
    try {
      const { display } = await plugin.checkPermissions();
      setPermissionState(display as "granted" | "denied" | "prompt");
    } catch {
      setPermissionState("unavailable");
    }
  }

  async function requestAndSchedule(enabledVal: boolean, timeVal: string) {
    const plugin = await getNotificationsPlugin();
    if (!plugin) {
      // Web fallback — just save preference
      localStorage.setItem("bloom_notif_enabled", String(enabledVal));
      localStorage.setItem("bloom_notif_time", timeVal);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }

    if (enabledVal) {
      let { display } = await plugin.checkPermissions();
      if (display === "prompt") {
        const result = await plugin.requestPermissions();
        display = result.display;
      }
      if (display !== "granted") {
        setPermissionState("denied");
        return;
      }
      setPermissionState("granted");

      // Cancel existing, then schedule daily
      await plugin.cancel({ notifications: [{ id: 1001 }] });

      const [hours, minutes] = timeVal.split(":").map(Number);
      const now = new Date();
      const next = new Date();
      next.setHours(hours, minutes, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);

      await plugin.schedule({
        notifications: [{
          id: 1001,
          title: "Your devotional is ready 🌸",
          body: "Take a moment with God today. Open Bloom.",
          schedule: { at: next, repeats: true, every: "day" },
          sound: "default",
          smallIcon: "ic_stat_bloom",
        }],
      });
    } else {
      const p = await getNotificationsPlugin();
      await p?.cancel({ notifications: [{ id: 1001 }] });
    }

    localStorage.setItem("bloom_notif_enabled", String(enabledVal));
    localStorage.setItem("bloom_notif_time", timeVal);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    await requestAndSchedule(next, time);
  }

  async function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTime(e.target.value);
    if (enabled) await requestAndSchedule(true, e.target.value);
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-6 pb-32 gap-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Reminders</h1>
      </div>

      {/* Main toggle */}
      <div className="bloom-card flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          {enabled ? <Bell className="h-6 w-6 text-primary" /> : <BellOff className="h-6 w-6 text-muted-foreground" />}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">Daily devotional reminder</p>
          <p className="text-sm text-muted-foreground">Get a gentle nudge to spend time with God</p>
        </div>
        <button
          onClick={handleToggle}
          className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted-foreground/30"}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Time picker */}
      {enabled && (
        <div className="bloom-card space-y-3">
          <p className="text-sm font-semibold text-foreground">Reminder time</p>
          <input
            type="time"
            value={time}
            onChange={handleTimeChange}
            className="w-full bg-muted/50 rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p className="text-xs text-muted-foreground">You&apos;ll receive a notification daily at this time.</p>
        </div>
      )}

      {/* Permission denied warning */}
      {permissionState === "denied" && (
        <div className="bloom-card bg-amber-50 border-amber-200 space-y-2">
          <p className="text-sm font-semibold text-amber-800">Notifications blocked</p>
          <p className="text-xs text-amber-700">
            Go to your device Settings → Bloom → Notifications and enable them, then come back here.
          </p>
        </div>
      )}

      {/* Web fallback note */}
      {permissionState === "unavailable" && (
        <div className="bloom-card space-y-2">
          <p className="text-sm font-semibold text-foreground">Push notifications</p>
          <p className="text-xs text-muted-foreground">
            Daily reminders are available in the Bloom iOS app. Your preference is saved and will activate when you open the app on your phone.
          </p>
        </div>
      )}

      {/* Sample notification preview */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Preview</p>
        <div className="bloom-card flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 text-xl">
            🌸
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Your devotional is ready 🌸</p>
            <p className="text-xs text-muted-foreground">Take a moment with God today. Open Bloom.</p>
            <p className="text-xs text-muted-foreground mt-1">Bloom · {time}</p>
          </div>
        </div>
      </div>

      {saved && (
        <p className="text-center text-sm text-green-600 font-medium">✓ Reminder saved!</p>
      )}
    </div>
  );
}
