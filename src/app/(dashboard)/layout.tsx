import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect("/login");
    }

    // Get user details from database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*, firms(name)")
      .eq("id", user.id)
      .single();

    // If user data fetch fails, still render but without user data
    // This prevents the entire app from crashing
    if (userError) {
      console.error("Failed to fetch user data:", userError);
    }

    return (
      <div className="flex h-screen bg-background">
        <Sidebar user={userData || null} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-background p-6">
            {children}
          </main>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Dashboard layout error:", error);
    // If there's a critical error, redirect to login
    redirect("/login");
  }
}

