"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, ArrowLeft } from "lucide-react";
import { useCreateUser } from "@/hooks/use-users";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

type UserRole = "owner" | "attorney" | "paralegal" | "secretary" | "admin" | "billing";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "attorney", label: "Attorney" },
  { value: "paralegal", label: "Paralegal" },
  { value: "secretary", label: "Secretary" },
  { value: "billing", label: "Billing" },
];

export default function InviteUserPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const createUser = useCreateUser();

  const { data: userData } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("users")
        .select("firm_id")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const firmId = userData?.firm_id;

  const [formData, setFormData] = useState<{
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    billing_rate: string;
  }>({
    email: "",
    first_name: "",
    last_name: "",
    role: "attorney",
    billing_rate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmId) {
      toast.error("Firm ID not found");
      return;
    }

    try {
      await createUser.mutateAsync({
        firmId: firmId,
        email: formData.email,
        firstName: formData.first_name,
        lastName: formData.last_name,
        role: formData.role,
        billingRate: formData.billing_rate || null,
        isActive: true,
      });

      // TODO: Send invite email via SendGrid
      toast.success("User invited successfully");
      router.push("/settings/team");
    } catch (error: any) {
      toast.error(error.message || "Failed to invite user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings/team">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invite User</h1>
          <p className="mt-1 text-muted-foreground">Send an invitation to a new team member</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="billing_rate">Billing Rate</Label>
            <Input
              id="billing_rate"
              type="number"
              step="0.01"
              value={formData.billing_rate}
              onChange={(e) => setFormData({ ...formData, billing_rate: e.target.value })}
              placeholder="0.00"
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/settings/team">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createUser.isPending}>
            <Mail className="mr-2 h-4 w-4" />
            {createUser.isPending ? "Sending..." : "Send Invite"}
          </Button>
        </div>
      </form>
    </div>
  );
}










