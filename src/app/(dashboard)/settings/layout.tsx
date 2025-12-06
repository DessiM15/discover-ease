import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsNav } from "@/components/settings/settings-nav";

export const dynamic = 'force-dynamic';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    // Get user details
    let isAdmin = false;
    try {
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      isAdmin = userData?.role === "owner" || userData?.role === "admin";
    } catch (error) {
      console.error("Failed to fetch user role:", error);
    }

    return (
      <div className="flex gap-6">
        <SettingsNav isAdmin={isAdmin} />
        <div className="flex-1">{children}</div>
      </div>
    );
  } catch (error: any) {
    // Check if it's a Next.js redirect error - if so, re-throw it
    if (error && typeof error === 'object' && 'digest' in error && 
        typeof error.digest === 'string' &&
        error.digest.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    
    // For other errors, log and redirect
    console.error("Settings layout error:", error);
    redirect("/login");
  }
}

