"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, MessageCircle, User, Flower2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
      {/* Soft shadow gradient above nav */}
      <div className="h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      <div className="bg-white/95 backdrop-blur-md border-t border-gray-100">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-safe">
          {/* Left items */}
          {LEFT_NAV.map(({ href, icon: Icon, label }) => (
            <NavItem key={href} href={href} icon={Icon} label={label} active={isActive(href)} />
          ))}

          {/* Center flower FAB */}
          <Link
            href="/garden"
            className="relative -top-5 flex flex-col items-center"
          >
            <div className={cn(
              "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95",
              isActive("/garden")
                ? "bg-primary shadow-primary/40"
                : "bg-gradient-to-br from-primary to-primary/70 shadow-primary/30"
            )}>
              <Flower2 className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
            <span className={cn(
              "text-[10px] font-medium mt-1",
              isActive("/garden") ? "text-primary" : "text-gray-400"
            )}>
              Garden
            </span>
          </Link>

          {/* Right items */}
          {RIGHT_NAV.map(({ href, icon: Icon, label }) => (
            <NavItem key={href} href={href} icon={Icon} label={label} active={isActive(href)} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavItem({
  href, icon: Icon, label, active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-3 min-w-[56px] transition-colors",
        active ? "text-primary" : "text-gray-400 hover:text-gray-600"
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.8} />
      <span className={cn("text-[10px] font-medium", active && "font-semibold")}>
        {label}
      </span>
    </Link>
  );
}
