import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Building2,
  Users,
  CreditCard,
  Plug,
  Bell,
  Database,
  ArrowRight,
  Palette,
} from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = userData?.role === "owner" || userData?.role === "admin";

  const settingsSections = [
    {
      href: "/settings/profile",
      title: "Profile",
      description: "Manage your personal information and preferences",
      icon: User,
    },
    {
      href: "/settings/firm",
      title: "Firm Settings",
      description: "Configure firm details, address, and billing defaults",
      icon: Building2,
      adminOnly: true,
    },
    {
      href: "/settings/team",
      title: "Team Management",
      description: "Manage team members, roles, and permissions",
      icon: Users,
      adminOnly: true,
    },
    {
      href: "/settings/billing",
      title: "Billing & Subscription",
      description: "Manage your subscription plan and payment methods",
      icon: CreditCard,
    },
    {
      href: "/settings/integrations",
      title: "Integrations",
      description: "Connect with external services and tools",
      icon: Plug,
    },
    {
      href: "/settings/notifications",
      title: "Notifications",
      description: "Configure email and in-app notification preferences",
      icon: Bell,
    },
    {
      href: "/settings/data",
      title: "Data & Privacy",
      description: "Export data and manage privacy settings",
      icon: Database,
    },
    {
      href: "/settings/appearance",
      title: "Appearance",
      description: "Customize theme and display preferences",
      icon: Palette,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account and firm settings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => {
          if (section.adminOnly && !isAdmin) return null;
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-foreground">{section.title}</CardTitle>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
