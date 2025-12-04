"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Building2,
  Users,
  CreditCard,
  Plug,
  Bell,
  Database,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const settingsNav = [
  { href: "/settings", label: "Overview", icon: SettingsIcon },
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/firm", label: "Firm", icon: Building2, adminOnly: true },
  { href: "/settings/team", label: "Team", icon: Users, adminOnly: true },
  { href: "/settings/billing", label: "Billing & Subscription", icon: CreditCard },
  { href: "/settings/integrations", label: "Integrations", icon: Plug },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/data", label: "Data & Privacy", icon: Database },
];

export function SettingsNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0">
      <nav className="space-y-1">
        {settingsNav.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const isActive = pathname === item.href || (item.href !== "/settings" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-900 text-amber-500"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

