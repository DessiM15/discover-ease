"use client";

import { useState, useEffect } from "react";
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
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  // Initialize expanded state based on pathname after mount to avoid hydration issues
  useEffect(() => {
    setMounted(true);
    if (pathname) {
      const initialExpanded: Record<string, boolean> = {};
      navigation.forEach((item) => {
        if (item.children && pathname.startsWith(item.href + "/")) {
          initialExpanded[item.href] = true;
        }
      });
      setExpandedItems(initialExpanded);
    }
  }, [pathname]);

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col z-50">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent">
            <Scale className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">DiscoverEase</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = mounted && pathname ? (pathname === item.href || pathname.startsWith(item.href + "/")) : false;
          const hasChildren = item.children && item.children.length > 0;

          if (hasChildren) {
            const isExpanded = mounted && expandedItems[item.href] !== false && (expandedItems[item.href] || (pathname && pathname.startsWith(item.href + "/")));
            return (
              <div key={item.name}>
                <button
                  onClick={() => setExpandedItems((prev) => ({ ...prev, [item.href]: !prev[item.href] }))}
                  className={cn(
                    "group w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mx-1",
                    isActive
                      ? "bg-sidebar-accent/10 text-sidebar-accent border-r-2 border-sidebar-accent"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-border/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        "h-5 w-5",
                        isActive ? "text-sidebar-accent" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
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
                      const isChildActive = mounted && pathname ? (pathname === child.href || pathname.startsWith(child.href + "/")) : false;
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            "block rounded-lg px-3 py-2 text-sm transition-colors mx-1",
                            isChildActive
                              ? "bg-sidebar-accent/10 text-sidebar-accent"
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-border/50"
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
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mx-1",
                isActive
                  ? "bg-sidebar-accent/10 text-sidebar-accent border-r-2 border-sidebar-accent"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-border/50"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-sidebar-accent" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-4 space-y-2">
        {user && (
          <div className="rounded-lg bg-sidebar-border/30 p-3">
            <p className="text-xs text-sidebar-foreground/60 mb-1">Signed in as</p>
            <p className="text-sm font-medium text-sidebar-foreground">
              {user.first_name} {user.last_name}
            </p>
            {user.firms && (
              <p className="text-xs text-sidebar-foreground/60 mt-1">{user.firms.name}</p>
            )}
          </div>
        )}
        <Link
          href="/notifications"
          className="flex items-center gap-3 rounded-lg bg-sidebar-border/30 p-3 hover:bg-sidebar-border/50 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent/20 text-sidebar-accent">
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">Notifications</p>
            <p className="text-xs text-sidebar-foreground/60">3 new</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}

