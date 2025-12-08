"use client";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { useUser, useUpdateUser } from "@/hooks/use-users";
import { toast } from "sonner";
import Link from "next/link";

const ROLES = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "attorney", label: "Attorney" },
  { value: "paralegal", label: "Paralegal" },
  { value: "secretary", label: "Secretary" },
  { value: "billing", label: "Billing" },
];

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);
  
  const { data: user, isLoading } = useUser(id);
  const updateUser = useUpdateUser();

  const [formData, setFormData] = useState({
    role: "",
    billing_rate: "",
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        role: user.role,
        billing_rate: user.billingRate || "",
        is_active: user.isActive,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser.mutateAsync({
        id: id,
        role: formData.role,
        billingRate: formData.billing_rate || null,
        isActive: formData.is_active,
      });
      toast.success("User updated successfully");
      router.push("/settings/team");
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center text-muted-foreground">User not found</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings/team">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit User</h1>
          <p className="mt-1 text-muted-foreground">Update user role and settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <Label htmlFor="role">Role *</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value })}
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

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/settings/team">Cancel</Link>
          </Button>
          <Button type="submit" disabled={updateUser.isPending}>
            {updateUser.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

