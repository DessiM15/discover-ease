"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sun, Moon, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Appearance</h1>
          <p className="mt-1 text-muted-foreground">Customize how DiscoverEase looks on your device</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Select your preferred color scheme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:border-primary/50",
                theme === "light" ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <div className="flex h-16 w-full items-center justify-center rounded-md bg-white border border-gray-200">
                <Sun className="h-8 w-8 text-amber-500" />
              </div>
              <span className="text-sm font-medium">Light</span>
              {theme === "light" && (
                <div className="absolute top-2 right-2 rounded-full bg-primary p-1">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:border-primary/50",
                theme === "dark" ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <div className="flex h-16 w-full items-center justify-center rounded-md bg-slate-900 border border-slate-700">
                <Moon className="h-8 w-8 text-slate-300" />
              </div>
              <span className="text-sm font-medium">Dark</span>
              {theme === "dark" && (
                <div className="absolute top-2 right-2 rounded-full bg-primary p-1">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
