import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Quick auth check - redirect if not authenticated
  let supabase;
  try {
    supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }
  } catch (error) {
    console.error("Dashboard layout error:", error);
    redirect("/login");
  }

  // Render with client component for user data (non-blocking)
  return (
    <DashboardClient>
      {children}
    </DashboardClient>
  );
}

