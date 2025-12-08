import { createClient } from "@/lib/supabase/server";
import * as googleCalendar from "./google";
import * as outlookCalendar from "./outlook";

export interface CalendarIntegration {
  id: string;
  userId: string;
  provider: "google" | "outlook";
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  calendarId: string;
  isEnabled: boolean;
}

export interface SyncEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  isAllDay?: boolean;
  attendees?: Array<{ email: string; name?: string }>;
  googleEventId?: string;
  outlookEventId?: string;
}

export interface ConflictInfo {
  newEvent: SyncEvent;
  existingEvents: SyncEvent[];
  provider: "google" | "outlook" | "internal";
}

// Check for conflicts across all calendars
export async function checkConflicts(
  userId: string,
  startTime: Date,
  endTime: Date,
  excludeEventId?: string
): Promise<ConflictInfo[]> {
  const supabase = await createClient();
  const conflicts: ConflictInfo[] = [];

  // Get user's calendar integrations
  const { data: integrations } = await supabase
    .from("calendar_integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("is_enabled", true);

  // Check internal calendar events
  const { data: internalEvents } = await supabase
    .from("events")
    .select("*")
    .gte("start_date", startTime.toISOString())
    .lte("end_date", endTime.toISOString())
    .neq("id", excludeEventId || "");

  if (internalEvents && internalEvents.length > 0) {
    conflicts.push({
      newEvent: { id: "", title: "", startTime, endTime },
      existingEvents: internalEvents.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        startTime: new Date(e.start_date),
        endTime: new Date(e.end_date),
        location: e.location,
        isAllDay: e.all_day,
      })),
      provider: "internal",
    });
  }

  // Check Google Calendar
  if (integrations) {
    for (const integration of integrations) {
      if (integration.provider === "google") {
        try {
          const googleConflicts = await googleCalendar.checkGoogleConflicts(
            integration.access_token,
            integration.refresh_token,
            startTime,
            endTime,
            integration.calendar_id
          );

          if (googleConflicts.length > 0) {
            conflicts.push({
              newEvent: { id: "", title: "", startTime, endTime },
              existingEvents: googleConflicts.map((e) => ({
                id: e.id || "",
                title: e.title,
                description: e.description,
                startTime: e.startTime,
                endTime: e.endTime,
                location: e.location,
                isAllDay: e.isAllDay,
                googleEventId: e.id,
              })),
              provider: "google",
            });
          }
        } catch (error) {
          console.error("Error checking Google conflicts:", error);
        }
      }

      if (integration.provider === "outlook") {
        try {
          const outlookConflicts = await outlookCalendar.checkOutlookConflicts(
            integration.access_token,
            startTime,
            endTime
          );

          if (outlookConflicts.length > 0) {
            conflicts.push({
              newEvent: { id: "", title: "", startTime, endTime },
              existingEvents: outlookConflicts.map((e) => ({
                id: e.id || "",
                title: e.title,
                description: e.description,
                startTime: e.startTime,
                endTime: e.endTime,
                location: e.location,
                isAllDay: e.isAllDay,
                outlookEventId: e.id,
              })),
              provider: "outlook",
            });
          }
        } catch (error) {
          console.error("Error checking Outlook conflicts:", error);
        }
      }
    }
  }

  return conflicts;
}

// Sync event to external calendars
export async function syncEventToExternalCalendars(
  eventId: string,
  action: "create" | "update" | "delete"
): Promise<void> {
  const supabase = await createClient();

  // Get the event
  const { data: event } = await supabase
    .from("events")
    .select("*, users!created_by_id(*)")
    .eq("id", eventId)
    .single();

  if (!event) return;

  // Get user's enabled calendar integrations
  const { data: integrations } = await supabase
    .from("calendar_integrations")
    .select("*")
    .eq("user_id", event.created_by_id)
    .eq("is_enabled", true);

  if (!integrations) return;

  for (const integration of integrations) {
    try {
      if (integration.provider === "google") {
        await syncToGoogle(event, integration, action, supabase);
      } else if (integration.provider === "outlook") {
        await syncToOutlook(event, integration, action, supabase);
      }
    } catch (error) {
      console.error(`Error syncing to ${integration.provider}:`, error);
    }
  }
}

async function syncToGoogle(
  event: Record<string, unknown>,
  integration: Record<string, unknown>,
  action: "create" | "update" | "delete",
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  const calendarEvent: googleCalendar.CalendarEvent = {
    title: event.title as string,
    description: event.description as string | undefined,
    startTime: new Date(event.start_date as string),
    endTime: new Date(event.end_date as string),
    location: event.location as string | undefined,
    isAllDay: event.all_day as boolean,
  };

  if (action === "create") {
    const { googleEventId } = await googleCalendar.createGoogleEvent(
      integration.access_token as string,
      integration.refresh_token as string | null,
      calendarEvent,
      integration.calendar_id as string
    );

    // Update event with Google ID
    await supabase
      .from("events")
      .update({ google_event_id: googleEventId })
      .eq("id", event.id as string);
  } else if (action === "update" && event.google_event_id) {
    await googleCalendar.updateGoogleEvent(
      integration.access_token as string,
      integration.refresh_token as string | null,
      event.google_event_id as string,
      calendarEvent,
      integration.calendar_id as string
    );
  } else if (action === "delete" && event.google_event_id) {
    await googleCalendar.deleteGoogleEvent(
      integration.access_token as string,
      integration.refresh_token as string | null,
      event.google_event_id as string,
      integration.calendar_id as string
    );
  }
}

async function syncToOutlook(
  event: Record<string, unknown>,
  integration: Record<string, unknown>,
  action: "create" | "update" | "delete",
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  const calendarEvent: outlookCalendar.OutlookCalendarEvent = {
    title: event.title as string,
    description: event.description as string | undefined,
    startTime: new Date(event.start_date as string),
    endTime: new Date(event.end_date as string),
    location: event.location as string | undefined,
    isAllDay: event.all_day as boolean,
  };

  if (action === "create") {
    const { outlookEventId } = await outlookCalendar.createOutlookEvent(
      integration.access_token as string,
      calendarEvent
    );

    // Update event with Outlook ID
    await supabase
      .from("events")
      .update({ outlook_event_id: outlookEventId })
      .eq("id", event.id as string);
  } else if (action === "update" && event.outlook_event_id) {
    await outlookCalendar.updateOutlookEvent(
      integration.access_token as string,
      event.outlook_event_id as string,
      calendarEvent
    );
  } else if (action === "delete" && event.outlook_event_id) {
    await outlookCalendar.deleteOutlookEvent(
      integration.access_token as string,
      event.outlook_event_id as string
    );
  }
}

// Sync from external calendar to internal
export async function syncFromExternalCalendar(
  integrationId: string,
  externalEventId: string,
  action: "create" | "update" | "delete"
): Promise<void> {
  const supabase = await createClient();

  const { data: integration } = await supabase
    .from("calendar_integrations")
    .select("*")
    .eq("id", integrationId)
    .single();

  if (!integration) return;

  if (action === "delete") {
    // Delete from internal calendar
    if (integration.provider === "google") {
      await supabase
        .from("events")
        .delete()
        .eq("google_event_id", externalEventId);
    } else {
      await supabase
        .from("events")
        .delete()
        .eq("outlook_event_id", externalEventId);
    }
    return;
  }

  // Get event details from external calendar
  let externalEvent: SyncEvent | null = null;

  if (integration.provider === "google") {
    const events = await googleCalendar.getGoogleEvents(
      integration.access_token,
      integration.refresh_token
    );
    const event = events.find((e) => e.id === externalEventId);
    if (event) {
      externalEvent = {
        id: event.id || "",
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        isAllDay: event.isAllDay,
        googleEventId: event.id,
      };
    }
  } else if (integration.provider === "outlook") {
    const events = await outlookCalendar.getOutlookEvents(
      integration.access_token
    );
    const event = events.find((e) => e.id === externalEventId);
    if (event) {
      externalEvent = {
        id: event.id || "",
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        isAllDay: event.isAllDay,
        outlookEventId: event.id,
      };
    }
  }

  if (!externalEvent) return;

  // Get user info
  const { data: user } = await supabase
    .from("users")
    .select("firm_id")
    .eq("id", integration.user_id)
    .single();

  if (!user) return;

  const eventData = {
    firm_id: user.firm_id,
    title: externalEvent.title,
    description: externalEvent.description,
    start_date: externalEvent.startTime.toISOString(),
    end_date: externalEvent.endTime.toISOString(),
    location: externalEvent.location,
    all_day: externalEvent.isAllDay,
    type: "meeting",
    created_by_id: integration.user_id,
    google_event_id: externalEvent.googleEventId,
    outlook_event_id: externalEvent.outlookEventId,
  };

  if (action === "create") {
    await supabase.from("events").insert(eventData);
  } else if (action === "update") {
    if (integration.provider === "google") {
      await supabase
        .from("events")
        .update(eventData)
        .eq("google_event_id", externalEventId);
    } else {
      await supabase
        .from("events")
        .update(eventData)
        .eq("outlook_event_id", externalEventId);
    }
  }
}

// Refresh token if needed
export async function ensureValidToken(
  integrationId: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data: integration } = await supabase
    .from("calendar_integrations")
    .select("*")
    .eq("id", integrationId)
    .single();

  if (!integration) return null;

  // Check if token is expired
  const expiresAt = integration.expires_at
    ? new Date(integration.expires_at)
    : null;
  const isExpired = expiresAt && expiresAt < new Date();

  if (!isExpired) {
    return integration.access_token;
  }

  // Refresh the token
  if (!integration.refresh_token) {
    return null;
  }

  try {
    let newTokens;

    if (integration.provider === "google") {
      newTokens = await googleCalendar.refreshAccessToken(
        integration.refresh_token
      );
    } else {
      newTokens = await outlookCalendar.refreshAccessToken(
        integration.refresh_token
      );
    }

    // Calculate expiration - Google returns expiryDate (timestamp), Outlook returns expiresIn (seconds)
    const expiresAt = "expiryDate" in newTokens && newTokens.expiryDate
      ? new Date(newTokens.expiryDate).toISOString()
      : new Date(Date.now() + (("expiresIn" in newTokens ? newTokens.expiresIn : 3600) || 3600) * 1000).toISOString();

    // Update stored tokens
    await supabase
      .from("calendar_integrations")
      .update({
        access_token: newTokens.accessToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", integrationId);

    return newTokens.accessToken;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

// Share calendar with another user
export async function shareCalendarWithUser(
  ownerUserId: string,
  targetUserId: string,
  permissions: "read" | "write"
): Promise<void> {
  const supabase = await createClient();

  await supabase.from("calendar_shares").insert({
    owner_user_id: ownerUserId,
    shared_with_user_id: targetUserId,
    permissions,
  });
}

// Get shared calendars
export async function getSharedCalendars(
  userId: string
): Promise<Array<{ ownerId: string; ownerName: string; permissions: string }>> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("calendar_shares")
    .select("owner_user_id, permissions, users!owner_user_id(first_name, last_name)")
    .eq("shared_with_user_id", userId);

  return (data || []).map((share) => {
    const users = share.users && typeof share.users === "object" && !Array.isArray(share.users)
      ? share.users as { first_name?: string; last_name?: string }
      : null;
    return {
      ownerId: share.owner_user_id,
      ownerName: users ? `${users.first_name || ""} ${users.last_name || ""}`.trim() : "",
      permissions: share.permissions,
    };
  });
}
