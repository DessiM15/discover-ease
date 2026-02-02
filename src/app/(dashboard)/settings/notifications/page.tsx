"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function NotificationsSettingsPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [emailPrefs, setEmailPrefs] = useState({
    new_case_assigned: true,
    task_assigned: true,
    deadline_reminders: true,
    deadline_reminder_timing: "1",
    invoice_paid: true,
    new_client_message: true,
    discovery_due_dates: true,
  });

  const [inAppPrefs, setInAppPrefs] = useState({
    new_case_assigned: true,
    task_assigned: true,
    deadline_reminders: true,
    invoice_paid: true,
    new_client_message: true,
    discovery_due_dates: true,
  });

  // TODO: Load preferences from database
  // const { data: preferences } = useQuery({...});

  const handleSave = async () => {
    try {
      // TODO: Save preferences to database
      toast.success("Notification preferences saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save preferences");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
        <p className="mt-1 text-muted-foreground">Configure your notification preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Choose which events trigger email notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_new_case">New Case Assigned</Label>
              <p className="text-sm text-muted-foreground">Get notified when a new case is assigned to you</p>
            </div>
            <Switch
              id="email_new_case"
              checked={emailPrefs.new_case_assigned}
              onCheckedChange={(checked) =>
                setEmailPrefs({ ...emailPrefs, new_case_assigned: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_task_assigned">Task Assigned</Label>
              <p className="text-sm text-muted-foreground">Get notified when a task is assigned to you</p>
            </div>
            <Switch
              id="email_task_assigned"
              checked={emailPrefs.task_assigned}
              onCheckedChange={(checked) =>
                setEmailPrefs({ ...emailPrefs, task_assigned: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_deadline_reminders">Deadline Reminders</Label>
              <p className="text-sm text-muted-foreground">Get reminded about upcoming deadlines</p>
            </div>
            <Switch
              id="email_deadline_reminders"
              checked={emailPrefs.deadline_reminders}
              onCheckedChange={(checked) =>
                setEmailPrefs({ ...emailPrefs, deadline_reminders: checked })
              }
            />
          </div>

          {emailPrefs.deadline_reminders && (
            <div>
              <Label htmlFor="deadline_timing">Reminder Timing</Label>
              <Select
                value={emailPrefs.deadline_reminder_timing}
                onValueChange={(value) =>
                  setEmailPrefs({ ...emailPrefs, deadline_reminder_timing: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day before</SelectItem>
                  <SelectItem value="3">3 days before</SelectItem>
                  <SelectItem value="7">1 week before</SelectItem>
                  <SelectItem value="14">2 weeks before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_invoice_paid">Invoice Paid</Label>
              <p className="text-sm text-muted-foreground">Get notified when an invoice is paid</p>
            </div>
            <Switch
              id="email_invoice_paid"
              checked={emailPrefs.invoice_paid}
              onCheckedChange={(checked) =>
                setEmailPrefs({ ...emailPrefs, invoice_paid: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_client_message">New Client Message</Label>
              <p className="text-sm text-muted-foreground">Get notified when a client sends a message</p>
            </div>
            <Switch
              id="email_client_message"
              checked={emailPrefs.new_client_message}
              onCheckedChange={(checked) =>
                setEmailPrefs({ ...emailPrefs, new_client_message: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_discovery_due">Discovery Due Dates</Label>
              <p className="text-sm text-muted-foreground">Get notified about discovery deadlines</p>
            </div>
            <Switch
              id="email_discovery_due"
              checked={emailPrefs.discovery_due_dates}
              onCheckedChange={(checked) =>
                setEmailPrefs({ ...emailPrefs, discovery_due_dates: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>In-App Notifications</CardTitle>
          <CardDescription>Choose which events show in-app notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="app_new_case">New Case Assigned</Label>
            </div>
            <Switch
              id="app_new_case"
              checked={inAppPrefs.new_case_assigned}
              onCheckedChange={(checked) =>
                setInAppPrefs({ ...inAppPrefs, new_case_assigned: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="app_task_assigned">Task Assigned</Label>
            </div>
            <Switch
              id="app_task_assigned"
              checked={inAppPrefs.task_assigned}
              onCheckedChange={(checked) =>
                setInAppPrefs({ ...inAppPrefs, task_assigned: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="app_deadline_reminders">Deadline Reminders</Label>
            </div>
            <Switch
              id="app_deadline_reminders"
              checked={inAppPrefs.deadline_reminders}
              onCheckedChange={(checked) =>
                setInAppPrefs({ ...inAppPrefs, deadline_reminders: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="app_invoice_paid">Invoice Paid</Label>
            </div>
            <Switch
              id="app_invoice_paid"
              checked={inAppPrefs.invoice_paid}
              onCheckedChange={(checked) =>
                setInAppPrefs({ ...inAppPrefs, invoice_paid: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="app_client_message">New Client Message</Label>
            </div>
            <Switch
              id="app_client_message"
              checked={inAppPrefs.new_client_message}
              onCheckedChange={(checked) =>
                setInAppPrefs({ ...inAppPrefs, new_client_message: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="app_discovery_due">Discovery Due Dates</Label>
            </div>
            <Switch
              id="app_discovery_due"
              checked={inAppPrefs.discovery_due_dates}
              onCheckedChange={(checked) =>
                setInAppPrefs({ ...inAppPrefs, discovery_due_dates: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Preferences</Button>
      </div>
    </div>
  );
}










