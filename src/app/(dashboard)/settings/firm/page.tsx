"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FirmSettingsPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const { data: userData } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("users")
        .select("*, firms(*)")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const router = useRouter();
  const isAdmin = userData?.role === "owner" || userData?.role === "admin";
  const firm = userData?.firms;

  useEffect(() => {
    if (userData && !isAdmin) {
      router.push("/settings");
    }
  }, [userData, isAdmin, router]);

  if (!isAdmin || !firm) {
    return null;
  }

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    timezone: "America/New_York",
    default_billing_rate: "",
    payment_terms: "30",
    invoice_footer: "",
    late_fee_percentage: "",
  });

  useEffect(() => {
    if (firm) {
      setFormData({
        name: firm.name || "",
        email: firm.email || "",
        phone: firm.phone || "",
        address: firm.address || "",
        city: firm.city || "",
        state: firm.state || "",
        zip_code: firm.zip_code || "",
        timezone: firm.timezone || "America/New_York",
        default_billing_rate: firm.default_billing_rate || "",
        payment_terms: (firm.settings as any)?.payment_terms || "30",
        invoice_footer: (firm.settings as any)?.invoice_footer || "",
        late_fee_percentage: (firm.settings as any)?.late_fee_percentage || "",
      });
    }
  }, [firm]);

  const updateFirm = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("firms")
        .update({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zip_code: data.zip_code || null,
          timezone: data.timezone,
          default_billing_rate: data.default_billing_rate || null,
          settings: {
            payment_terms: data.payment_terms,
            invoice_footer: data.invoice_footer,
            late_fee_percentage: data.late_fee_percentage || null,
          },
        })
        .eq("id", firm?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Firm settings updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update firm settings");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firm) return;
    await updateFirm.mutateAsync(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Firm Settings</h1>
        <p className="mt-1 text-slate-400">Manage firm information and billing defaults</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Firm Information</CardTitle>
          <CardDescription>Update your firm's basic information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Firm Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="timezone">Default Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({ ...formData, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="default_billing_rate">Default Billing Rate</Label>
              <Input
                id="default_billing_rate"
                type="number"
                step="0.01"
                value={formData.default_billing_rate}
                onChange={(e) => setFormData({ ...formData, default_billing_rate: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <Button type="submit" disabled={updateFirm.isPending}>
              {updateFirm.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Settings</CardTitle>
          <CardDescription>Configure default invoice settings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="payment_terms">Default Payment Terms</Label>
              <Select
                value={formData.payment_terms}
                onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">Net 15</SelectItem>
                  <SelectItem value="30">Net 30</SelectItem>
                  <SelectItem value="45">Net 45</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="invoice_footer">Invoice Footer Text</Label>
              <Textarea
                id="invoice_footer"
                value={formData.invoice_footer}
                onChange={(e) => setFormData({ ...formData, invoice_footer: e.target.value })}
                rows={3}
                placeholder="Thank you for your business..."
              />
            </div>

            <div>
              <Label htmlFor="late_fee_percentage">Late Fee Percentage</Label>
              <Input
                id="late_fee_percentage"
                type="number"
                step="0.01"
                value={formData.late_fee_percentage}
                onChange={(e) => setFormData({ ...formData, late_fee_percentage: e.target.value })}
                placeholder="1.5"
              />
            </div>

            <Button type="submit" disabled={updateFirm.isPending}>
              {updateFirm.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

