"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function DashboardClient({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const supabase = createClient();

  // Fetch user data client-side (non-blocking)
  // Server component already verified auth, so user should exist
  const { data: userData } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("users")
        .select("*, firms(name)")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={userData || null} />
      <div className="flex flex-1 flex-col overflow-hidden ml-60">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

