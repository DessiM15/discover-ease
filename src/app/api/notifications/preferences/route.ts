import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface NotificationPreferences {
  // Email notifications
  emailEnabled: boolean;
  emailDigest: "instant" | "daily" | "weekly" | "never";

  // SMS notifications
  smsEnabled: boolean;

  // In-app notification types
  caseUpdates: boolean;
  deadlineReminders: boolean;
  documentUploads: boolean;
  paymentNotifications: boolean;
  taskAssignments: boolean;
  teamActivity: boolean;
  discoveryUpdates: boolean;
  workflowNotifications: boolean;

  // Deadline reminder timing (days before)
  deadlineReminderDays: number[];

  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailEnabled: true,
  emailDigest: "instant",
  smsEnabled: false,
  caseUpdates: true,
  deadlineReminders: true,
  documentUploads: true,
  paymentNotifications: true,
  taskAssignments: true,
  teamActivity: true,
  discoveryUpdates: true,
  workflowNotifications: true,
  deadlineReminderDays: [7, 3, 1],
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
};

// Get notification preferences
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's preferences
    const { data: dbUser } = await supabase
      .from("users")
      .select("notification_preferences")
      .eq("id", user.id)
      .single();

    // Merge with defaults (in case new preferences were added)
    const preferences: NotificationPreferences = {
      ...DEFAULT_PREFERENCES,
      ...(dbUser?.notification_preferences as Partial<NotificationPreferences> || {}),
    };

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get preferences" },
      { status: 500 }
    );
  }
}

// Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const preferences = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate preferences
    const validatedPreferences: NotificationPreferences = {
      emailEnabled: Boolean(preferences.emailEnabled ?? DEFAULT_PREFERENCES.emailEnabled),
      emailDigest: ["instant", "daily", "weekly", "never"].includes(preferences.emailDigest)
        ? preferences.emailDigest
        : DEFAULT_PREFERENCES.emailDigest,
      smsEnabled: Boolean(preferences.smsEnabled ?? DEFAULT_PREFERENCES.smsEnabled),
      caseUpdates: Boolean(preferences.caseUpdates ?? DEFAULT_PREFERENCES.caseUpdates),
      deadlineReminders: Boolean(preferences.deadlineReminders ?? DEFAULT_PREFERENCES.deadlineReminders),
      documentUploads: Boolean(preferences.documentUploads ?? DEFAULT_PREFERENCES.documentUploads),
      paymentNotifications: Boolean(preferences.paymentNotifications ?? DEFAULT_PREFERENCES.paymentNotifications),
      taskAssignments: Boolean(preferences.taskAssignments ?? DEFAULT_PREFERENCES.taskAssignments),
      teamActivity: Boolean(preferences.teamActivity ?? DEFAULT_PREFERENCES.teamActivity),
      discoveryUpdates: Boolean(preferences.discoveryUpdates ?? DEFAULT_PREFERENCES.discoveryUpdates),
      workflowNotifications: Boolean(preferences.workflowNotifications ?? DEFAULT_PREFERENCES.workflowNotifications),
      deadlineReminderDays: Array.isArray(preferences.deadlineReminderDays)
        ? preferences.deadlineReminderDays.filter((d: number) => typeof d === "number" && d > 0)
        : DEFAULT_PREFERENCES.deadlineReminderDays,
      quietHoursEnabled: Boolean(preferences.quietHoursEnabled ?? DEFAULT_PREFERENCES.quietHoursEnabled),
      quietHoursStart: typeof preferences.quietHoursStart === "string"
        ? preferences.quietHoursStart
        : DEFAULT_PREFERENCES.quietHoursStart,
      quietHoursEnd: typeof preferences.quietHoursEnd === "string"
        ? preferences.quietHoursEnd
        : DEFAULT_PREFERENCES.quietHoursEnd,
    };

    // Update user's preferences
    const { error } = await supabase
      .from("users")
      .update({
        notification_preferences: validatedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      preferences: validatedPreferences,
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update preferences" },
      { status: 500 }
    );
  }
}

// Reset to defaults
export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reset to defaults
    const { error } = await supabase
      .from("users")
      .update({
        notification_preferences: DEFAULT_PREFERENCES,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      preferences: DEFAULT_PREFERENCES,
    });
  } catch (error) {
    console.error("Error resetting notification preferences:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset preferences" },
      { status: 500 }
    );
  }
}
