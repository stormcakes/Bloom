"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, MessageCircle, User, Flower2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

async function tapHaptic() {
  if (typeof window === "undefined") return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* web fallback — no haptics */ }
}

const LEFT_NAV = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/plans", icon: Calendar, label: "Plans" },
];

const RIGHT_NAV = [
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      <div className="bg-background/95 backdrop-blur-md border-t border-border/40">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-safe">
          {LEFT_NAV.map(({ href, icon: Icon, label }) => (
            <NavItem key={href} href={href} icon={Icon} label={label} active={isActive(href)} onTap={tapHaptic} />
          ))}

          {/* Center flower FAB with spring bounce */}
          <Link href="/garden" onClick={tapHaptic}>
            <motion.div
              className="relative -top-5 flex flex-col items-center"
              whileTap={{ scale: 0.78, rotate: 12, y: -4 }}
              transition={{ type: "spring", stiffness: 700, damping: 10 }}
            >
              <div className={cn(
                "w-14 h-14 rounded-full shadow-lg flex items-center justify-center",
                isActive("/garden")
                  ? "bg-primary shadow-primary/40"
                  : "bg-gradient-to-br from-primary to-primary/70 shadow-primary/30"
              )}>
                <Flower2 className="h-6 w-6 text-white" strokeWidth={2} />
              </div>
              <span className={cn(
                "text-[10px] font-medium mt-1",
                isActive("/garden") ? "text-primary" : "text-muted-foreground"
              )}>
                Garden
              </span>
            </motion.div>
          </Link>

          {RIGHT_NAV.map(({ href, icon: Icon, label }) => (
            <NavItem key={href} href={href} icon={Icon} label={label} active={isActive(href)} onTap={tapHaptic} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavItem({
  href, icon: Icon, label, active, onTap,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onTap: () => void;
}) {
  return (
    <Link href={href} onClick={onTap}>
      <motion.div
        whileTap={{ scale: 0.72, rotate: -8, y: -2 }}
        transition={{ type: "spring", stiffness: 700, damping: 10 }}
        className={cn(
          "relative flex flex-col items-center gap-1 px-4 py-3 min-w-[56px]",
          active ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {/* Sliding active dot */}
        {active && (
          <motion.div
            layoutId="nav-dot"
            className="absolute top-1.5 w-1 h-1 rounded-full bg-primary"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}

        {/* Icon with scale pop on active */}
        <motion.div
          animate={active ? { scale: [1, 1.25, 1] } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 12 }}
        >
          <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.8} />
        </motion.div>

        <span className={cn("text-[10px] font-medium", active && "font-semibold")}>
          {label}
        </span>
      </motion.div>
    </Link>
  );
}
