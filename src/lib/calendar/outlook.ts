import { Client } from "@microsoft/microsoft-graph-client";

const SCOPES = [
  "offline_access",
  "User.Read",
  "Calendars.ReadWrite",
  "Calendars.ReadWrite.Shared",
];

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Initialize Microsoft OAuth configuration
function getOAuthConfig() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri = `${APP_URL}/api/integrations/outlook/callback`;
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";

  if (!clientId || !clientSecret) {
    throw new Error("Microsoft OAuth credentials not configured");
  }

  return { clientId, clientSecret, redirectUri, tenantId };
}

// Generate authorization URL
export function getOutlookAuthUrl(userId: string, firmId: string): string {
  const config = getOAuthConfig();
  const state = encodeURIComponent(JSON.stringify({ userId, firmId }));

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    redirect_uri: config.redirectUri,
    scope: SCOPES.join(" "),
    response_mode: "query",
    state,
    prompt: "consent",
  });

  return `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
}> {
  const config = getOAuthConfig();

  const response = await fetch(
    `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
        scope: SCOPES.join(" "),
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const tokens = await response.json();

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null,
    expiresIn: tokens.expires_in,
  };
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
}> {
  const config = getOAuthConfig();

  const response = await fetch(
    `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        scope: SCOPES.join(" "),
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const tokens = await response.json();

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || refreshToken,
    expiresIn: tokens.expires_in,
  };
}

// Create Graph client
function getGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

export interface OutlookCalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: Array<{ email: string; name?: string }>;
  reminders?: number[]; // minutes before
  isAllDay?: boolean;
  isOnlineMeeting?: boolean;
}

// Create event in Outlook Calendar
export async function createOutlookEvent(
  accessToken: string,
  event: OutlookCalendarEvent
): Promise<{ outlookEventId: string; teamsLink?: string }> {
  const client = getGraphClient(accessToken);

  const eventData: Record<string, unknown> = {
    subject: event.title,
    body: event.description
      ? { contentType: "HTML", content: event.description }
      : undefined,
    location: event.location ? { displayName: event.location } : undefined,
    start: {
      dateTime: event.startTime.toISOString(),
      timeZone: "UTC",
    },
    end: {
      dateTime: event.endTime.toISOString(),
      timeZone: "UTC",
    },
    isAllDay: event.isAllDay || false,
    isOnlineMeeting: event.isOnlineMeeting || false,
    onlineMeetingProvider: event.isOnlineMeeting ? "teamsForBusiness" : undefined,
    attendees: event.attendees?.map((a) => ({
      emailAddress: { address: a.email, name: a.name },
      type: "required",
    })),
  };

  if (event.reminders && event.reminders.length > 0) {
    eventData.isReminderOn = true;
    eventData.reminderMinutesBeforeStart = event.reminders[0];
  }

  const response = await client.api("/me/events").post(eventData);

  return {
    outlookEventId: response.id,
    teamsLink: response.onlineMeeting?.joinUrl,
  };
}

// Update event in Outlook Calendar
export async function updateOutlookEvent(
  accessToken: string,
  outlookEventId: string,
  event: Partial<OutlookCalendarEvent>
): Promise<void> {
  const client = getGraphClient(accessToken);

  const updateData: Record<string, unknown> = {};

  if (event.title) updateData.subject = event.title;
  if (event.description) {
    updateData.body = { contentType: "HTML", content: event.description };
  }
  if (event.location) {
    updateData.location = { displayName: event.location };
  }
  if (event.startTime) {
    updateData.start = {
      dateTime: event.startTime.toISOString(),
      timeZone: "UTC",
    };
  }
  if (event.endTime) {
    updateData.end = {
      dateTime: event.endTime.toISOString(),
      timeZone: "UTC",
    };
  }
  if (event.isAllDay !== undefined) {
    updateData.isAllDay = event.isAllDay;
  }
  if (event.attendees) {
    updateData.attendees = event.attendees.map((a) => ({
      emailAddress: { address: a.email, name: a.name },
      type: "required",
    }));
  }

  await client.api(`/me/events/${outlookEventId}`).patch(updateData);
}

// Delete event from Outlook Calendar
export async function deleteOutlookEvent(
  accessToken: string,
  outlookEventId: string
): Promise<void> {
  const client = getGraphClient(accessToken);
  await client.api(`/me/events/${outlookEventId}`).delete();
}

// Get events from Outlook Calendar
export async function getOutlookEvents(
  accessToken: string,
  options: {
    startDateTime?: Date;
    endDateTime?: Date;
    maxResults?: number;
  } = {}
): Promise<OutlookCalendarEvent[]> {
  const client = getGraphClient(accessToken);

  let request = client.api("/me/calendarview");

  if (options.startDateTime) {
    request = request.query({
      startDateTime: options.startDateTime.toISOString(),
    });
  }
  if (options.endDateTime) {
    request = request.query({ endDateTime: options.endDateTime.toISOString() });
  }
  if (options.maxResults) {
    request = request.top(options.maxResults);
  }

  const response = await request
    .select("id,subject,body,start,end,location,attendees,isAllDay,onlineMeeting")
    .orderby("start/dateTime")
    .get();

  return (response.value || []).map((item: Record<string, unknown>) => ({
    id: item.id as string,
    title: item.subject as string || "",
    description: (item.body as Record<string, string>)?.content || undefined,
    startTime: new Date((item.start as Record<string, string>)?.dateTime || ""),
    endTime: new Date((item.end as Record<string, string>)?.dateTime || ""),
    location: (item.location as Record<string, string>)?.displayName || undefined,
    isAllDay: item.isAllDay as boolean || false,
    attendees: (item.attendees as Array<Record<string, unknown>>)?.map((a) => ({
      email: (a.emailAddress as Record<string, string>)?.address || "",
      name: (a.emailAddress as Record<string, string>)?.name || undefined,
    })),
  }));
}

// Get calendar list
export async function getOutlookCalendars(
  accessToken: string
): Promise<Array<{ id: string; name: string; isDefault: boolean }>> {
  const client = getGraphClient(accessToken);

  const response = await client
    .api("/me/calendars")
    .select("id,name,isDefaultCalendar")
    .get();

  return (response.value || []).map((item: Record<string, unknown>) => ({
    id: item.id as string,
    name: item.name as string || "",
    isDefault: item.isDefaultCalendar as boolean || false,
  }));
}

// Subscribe to calendar changes (webhook)
export async function subscribeToOutlookCalendar(
  accessToken: string,
  webhookUrl: string,
  expirationMinutes: number = 4320 // Max 3 days
): Promise<{ subscriptionId: string; expirationDateTime: string }> {
  const client = getGraphClient(accessToken);

  const expirationDateTime = new Date(
    Date.now() + expirationMinutes * 60 * 1000
  ).toISOString();

  const response = await client.api("/subscriptions").post({
    changeType: "created,updated,deleted",
    notificationUrl: webhookUrl,
    resource: "/me/events",
    expirationDateTime,
    clientState: `discoverease-${Date.now()}`,
  });

  return {
    subscriptionId: response.id,
    expirationDateTime: response.expirationDateTime,
  };
}

// Renew subscription
export async function renewOutlookSubscription(
  accessToken: string,
  subscriptionId: string,
  expirationMinutes: number = 4320
): Promise<{ expirationDateTime: string }> {
  const client = getGraphClient(accessToken);

  const expirationDateTime = new Date(
    Date.now() + expirationMinutes * 60 * 1000
  ).toISOString();

  const response = await client.api(`/subscriptions/${subscriptionId}`).patch({
    expirationDateTime,
  });

  return {
    expirationDateTime: response.expirationDateTime,
  };
}

// Delete subscription
export async function deleteOutlookSubscription(
  accessToken: string,
  subscriptionId: string
): Promise<void> {
  const client = getGraphClient(accessToken);
  await client.api(`/subscriptions/${subscriptionId}`).delete();
}

// Check for scheduling conflicts
export async function checkOutlookConflicts(
  accessToken: string,
  startTime: Date,
  endTime: Date
): Promise<OutlookCalendarEvent[]> {
  const events = await getOutlookEvents(accessToken, {
    startDateTime: startTime,
    endDateTime: endTime,
  });

  return events.filter((event) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    return eventStart < endTime && eventEnd > startTime;
  });
}

// Get user profile
export async function getOutlookUserProfile(accessToken: string): Promise<{
  id: string;
  email: string;
  displayName: string;
}> {
  const client = getGraphClient(accessToken);

  const response = await client
    .api("/me")
    .select("id,mail,userPrincipalName,displayName")
    .get();

  return {
    id: response.id,
    email: response.mail || response.userPrincipalName,
    displayName: response.displayName,
  };
}
