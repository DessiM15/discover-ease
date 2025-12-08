import { google, calendar_v3 } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Initialize OAuth2 client
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${APP_URL}/api/integrations/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Generate authorization URL
export function getGoogleAuthUrl(userId: string, firmId: string): string {
  const oauth2Client = getOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: JSON.stringify({ userId, firmId }),
  });
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiryDate: number | null;
}> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  return {
    accessToken: tokens.access_token || "",
    refreshToken: tokens.refresh_token || null,
    expiryDate: tokens.expiry_date || null,
  };
}

// Create calendar client with tokens
function getCalendarClient(accessToken: string, refreshToken?: string | null) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiryDate: number | null;
}> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    accessToken: credentials.access_token || "",
    expiryDate: credentials.expiry_date || null,
  };
}

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: Array<{ email: string; name?: string }>;
  reminders?: number[]; // minutes before
  isAllDay?: boolean;
  videoConference?: boolean;
}

// Create event in Google Calendar
export async function createGoogleEvent(
  accessToken: string,
  refreshToken: string | null,
  event: CalendarEvent,
  calendarId: string = "primary"
): Promise<{ googleEventId: string; meetLink?: string }> {
  const calendar = getCalendarClient(accessToken, refreshToken);

  const eventData: calendar_v3.Schema$Event = {
    summary: event.title,
    description: event.description,
    location: event.location,
    start: event.isAllDay
      ? { date: event.startTime.toISOString().split("T")[0] }
      : { dateTime: event.startTime.toISOString() },
    end: event.isAllDay
      ? { date: event.endTime.toISOString().split("T")[0] }
      : { dateTime: event.endTime.toISOString() },
    attendees: event.attendees?.map((a) => ({
      email: a.email,
      displayName: a.name,
    })),
    reminders: event.reminders
      ? {
          useDefault: false,
          overrides: event.reminders.map((minutes) => ({
            method: "popup",
            minutes,
          })),
        }
      : { useDefault: true },
  };

  // Add Google Meet if video conference requested
  if (event.videoConference) {
    eventData.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const response = await calendar.events.insert({
    calendarId,
    requestBody: eventData,
    conferenceDataVersion: event.videoConference ? 1 : 0,
    sendUpdates: "all",
  });

  return {
    googleEventId: response.data.id || "",
    meetLink: response.data.conferenceData?.entryPoints?.[0]?.uri ?? undefined,
  };
}

// Update event in Google Calendar
export async function updateGoogleEvent(
  accessToken: string,
  refreshToken: string | null,
  googleEventId: string,
  event: Partial<CalendarEvent>,
  calendarId: string = "primary"
): Promise<void> {
  const calendar = getCalendarClient(accessToken, refreshToken);

  const updateData: calendar_v3.Schema$Event = {};

  if (event.title) updateData.summary = event.title;
  if (event.description) updateData.description = event.description;
  if (event.location) updateData.location = event.location;
  if (event.startTime) {
    updateData.start = event.isAllDay
      ? { date: event.startTime.toISOString().split("T")[0] }
      : { dateTime: event.startTime.toISOString() };
  }
  if (event.endTime) {
    updateData.end = event.isAllDay
      ? { date: event.endTime.toISOString().split("T")[0] }
      : { dateTime: event.endTime.toISOString() };
  }
  if (event.attendees) {
    updateData.attendees = event.attendees.map((a) => ({
      email: a.email,
      displayName: a.name,
    }));
  }

  await calendar.events.patch({
    calendarId,
    eventId: googleEventId,
    requestBody: updateData,
    sendUpdates: "all",
  });
}

// Delete event from Google Calendar
export async function deleteGoogleEvent(
  accessToken: string,
  refreshToken: string | null,
  googleEventId: string,
  calendarId: string = "primary"
): Promise<void> {
  const calendar = getCalendarClient(accessToken, refreshToken);

  await calendar.events.delete({
    calendarId,
    eventId: googleEventId,
    sendUpdates: "all",
  });
}

// Get events from Google Calendar
export async function getGoogleEvents(
  accessToken: string,
  refreshToken: string | null,
  options: {
    calendarId?: string;
    timeMin?: Date;
    timeMax?: Date;
    maxResults?: number;
  } = {}
): Promise<CalendarEvent[]> {
  const calendar = getCalendarClient(accessToken, refreshToken);

  const response = await calendar.events.list({
    calendarId: options.calendarId || "primary",
    timeMin: options.timeMin?.toISOString(),
    timeMax: options.timeMax?.toISOString(),
    maxResults: options.maxResults || 100,
    singleEvents: true,
    orderBy: "startTime",
  });

  return (response.data.items || []).map((item) => ({
    id: item.id || undefined,
    title: item.summary || "",
    description: item.description || undefined,
    startTime: new Date(item.start?.dateTime || item.start?.date || ""),
    endTime: new Date(item.end?.dateTime || item.end?.date || ""),
    location: item.location || undefined,
    isAllDay: !!item.start?.date,
    attendees: item.attendees?.map((a) => ({
      email: a.email || "",
      name: a.displayName || undefined,
    })),
  }));
}

// Watch for changes (set up webhook)
export async function watchGoogleCalendar(
  accessToken: string,
  refreshToken: string | null,
  webhookUrl: string,
  calendarId: string = "primary"
): Promise<{ channelId: string; resourceId: string; expiration: number }> {
  const calendar = getCalendarClient(accessToken, refreshToken);

  const channelId = `calendar-watch-${Date.now()}`;

  const response = await calendar.events.watch({
    calendarId,
    requestBody: {
      id: channelId,
      type: "web_hook",
      address: webhookUrl,
    },
  });

  return {
    channelId: response.data.id || channelId,
    resourceId: response.data.resourceId || "",
    expiration: Number(response.data.expiration) || 0,
  };
}

// Stop watching calendar
export async function stopWatchingGoogleCalendar(
  accessToken: string,
  refreshToken: string | null,
  channelId: string,
  resourceId: string
): Promise<void> {
  const calendar = getCalendarClient(accessToken, refreshToken);

  await calendar.channels.stop({
    requestBody: {
      id: channelId,
      resourceId,
    },
  });
}

// Get calendar list
export async function getGoogleCalendars(
  accessToken: string,
  refreshToken: string | null
): Promise<Array<{ id: string; name: string; primary: boolean }>> {
  const calendar = getCalendarClient(accessToken, refreshToken);

  const response = await calendar.calendarList.list();

  return (response.data.items || []).map((item) => ({
    id: item.id || "",
    name: item.summary || "",
    primary: item.primary || false,
  }));
}

// Check for scheduling conflicts
export async function checkGoogleConflicts(
  accessToken: string,
  refreshToken: string | null,
  startTime: Date,
  endTime: Date,
  calendarId: string = "primary"
): Promise<CalendarEvent[]> {
  const events = await getGoogleEvents(accessToken, refreshToken, {
    calendarId,
    timeMin: startTime,
    timeMax: endTime,
  });

  return events.filter((event) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    return eventStart < endTime && eventEnd > startTime;
  });
}
