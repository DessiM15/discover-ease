"use client";

import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserMenu } from "@/components/layout/user-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm px-6">
      {/* Search */}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search cases, contacts, documents..."
            className="pl-10 bg-slate-900/50 border-slate-800"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500" />
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}

