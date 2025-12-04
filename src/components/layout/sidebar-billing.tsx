"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface BillingNavItemProps {
  href: string;
  children: { name: string; href: string }[];
  isActive: boolean;
}

export function BillingNavItem({ href, children, isActive }: BillingNavItemProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(pathname?.startsWith(href + "/"));

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "group w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-amber-500/10 text-amber-500"
            : "text-slate-400 hover:bg-slate-900 hover:text-white"
        )}
      >
        <div className="flex items-center gap-3">
          <DollarSign
            className={cn(
              "h-5 w-5",
              isActive ? "text-amber-500" : "text-slate-400 group-hover:text-white"
            )}
          />
          Billing
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      {isExpanded && (
        <div className="ml-8 mt-1 space-y-1">
          {children.map((child) => {
            const isChildActive = pathname === child.href || pathname?.startsWith(child.href + "/");
            return (
              <Link
                key={child.name}
                href={child.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                  isChildActive
                    ? "bg-amber-500/10 text-amber-500"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
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

