"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-users";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Plus, Mail, Edit, Trash2, UserPlus } from "lucide-react";

const ROLES = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "attorney", label: "Attorney" },
  { value: "paralegal", label: "Paralegal" },
  { value: "secretary", label: "Secretary" },
  { value: "billing", label: "Billing" },
];

export default function TeamSettingsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data: userData } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("users")
        .select("role, firm_id")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const router = useRouter();
  const isAdmin = userData?.role === "owner" || userData?.role === "admin";
  const firmId = userData?.firm_id;

  useEffect(() => {
    if (userData && !isAdmin) {
      router.push("/settings");
    }
  }, [userData, isAdmin, router]);

  if (!isAdmin || !firmId) {
    return null;
  }

  const { data: users = [] } = useUsers(firmId);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleInvite = async (data: any) => {
    try {
      // Create user in database
      await createUser.mutateAsync({
        firmId: firmId,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        role: data.role,
        billingRate: data.billing_rate || null,
        isActive: true,
      });

      // TODO: Send invite email via SendGrid
      toast.success("User invited successfully");
      setIsInviteOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to invite user");
    }
  };

  const handleUpdateUser = async (userId: string, data: any) => {
    try {
      await updateUser.mutateAsync({
        id: userId,
        role: data.role,
        billingRate: data.billing_rate || null,
        isActive: data.is_active,
      });
      toast.success("User updated successfully");
      setEditingUser(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user?")) return;

    try {
      await deleteUser.mutateAsync(userId);
      toast.success("User removed successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
          <p className="mt-1 text-muted-foreground">Manage team members and permissions</p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>All users in your firm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((u: any) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                    {u.first_name?.[0]}{u.last_name?.[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {u.first_name} {u.last_name}
                      </p>
                      <Badge variant="outline">{ROLES.find((r) => r.value === u.role)?.label}</Badge>
                      {!u.is_active && <Badge variant="destructive">Inactive</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    {u.billing_rate && (
                      <p className="text-xs text-muted-foreground">${u.billing_rate}/hr</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingUser(u)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {u.id !== user?.id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <InviteUserModal
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        onInvite={handleInvite}
      />

      {editingUser && (
        <EditUserModal
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          user={editingUser}
          onUpdate={handleUpdateUser}
        />
      )}
    </div>
  );
}

function InviteUserModal({
  open,
  onOpenChange,
  onInvite,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "attorney",
    billing_rate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInvite(formData);
    setFormData({
      email: "",
      first_name: "",
      last_name: "",
      role: "attorney",
      billing_rate: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>Send an invitation to a new team member</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
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
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
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
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Mail className="mr-2 h-4 w-4" />
              Send Invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserModal({
  open,
  onOpenChange,
  user,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onUpdate: (userId: string, data: any) => void;
}) {
  const [formData, setFormData] = useState({
    role: user.role,
    billing_rate: user.billing_rate || "",
    is_active: user.is_active,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(user.id, formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user role and settings</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

