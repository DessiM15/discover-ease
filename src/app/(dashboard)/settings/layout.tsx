import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsNav } from "@/components/settings/settings-nav";

export default async function SettingsLayout({
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

  // Get user details
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = userData?.role === "owner" || userData?.role === "admin";

  return (
    <div className="flex gap-6">
      <SettingsNav isAdmin={isAdmin} />
      <div className="flex-1">{children}</div>
    </div>
  );
}

