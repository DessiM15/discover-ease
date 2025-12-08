"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileSearch,
  FileText,
  FolderOpen,
  DollarSign,
  Calendar,
  Settings,
  Scale,
  Bell,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BillingNavItem } from "./sidebar-billing";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Cases", href: "/cases", icon: Briefcase },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Discovery", href: "/discovery", icon: FileSearch },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Productions", href: "/productions", icon: FolderOpen },
  { name: "Workflows", href: "/workflows", icon: Sparkles },
  {
    name: "Billing",
    href: "/billing",
    icon: DollarSign,
    children: [
      { name: "Overview", href: "/billing" },
      { name: "Time Entries", href: "/billing/time" },
      { name: "Expenses", href: "/billing/expenses" },
      { name: "Invoices", href: "/billing/invoices" },
      { name: "Payments", href: "/billing/payments" },
      { name: "Trust Accounts", href: "/billing/trust" },
    ],
  },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  user?: {
    first_name?: string | null;
    last_name?: string | null;
    firms?: {
      name?: string | null;
    } | null;
  } | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Scale className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">DiscoverEase</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const hasChildren = item.children && item.children.length > 0;

          if (hasChildren) {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const [isExpanded, setIsExpanded] = useState(pathname?.startsWith(item.href + "/"));
            return (
              <div key={item.name}>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={cn(
                    "group w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        "h-5 w-5",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {item.name}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children!.map((child) => {
                      const isChildActive = pathname === child.href || pathname?.startsWith(child.href + "/");
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            "block rounded-lg px-3 py-2 text-sm transition-colors",
                            isChildActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          )}
                        >
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-4 space-y-2">
        {user && (
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Signed in as</p>
            <p className="text-sm font-medium text-foreground">
              {user.first_name} {user.last_name}
            </p>
            {user.firms && (
              <p className="text-xs text-muted-foreground mt-1">{user.firms.name}</p>
            )}
          </div>
        )}
        <Link
          href="/notifications"
          className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3 hover:bg-secondary transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Notifications</p>
            <p className="text-xs text-muted-foreground">3 new</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
