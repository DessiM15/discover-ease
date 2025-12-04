import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user details from database
  const { data: userData } = await supabase
    .from("users")
    .select("*, firms(name)")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar user={userData} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

