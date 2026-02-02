/**
 * Google API Integration
 * Handles OAuth, Gmail sync, and Google Calendar integration
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";
const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

// Scopes for Gmail and Calendar access
const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

import { createHmac, randomBytes } from "crypto";

// Sign state for OAuth security
function signState(data: object): string {
  const secret = GOOGLE_CLIENT_SECRET || "fallback-key";
  const payload = JSON.stringify(data);
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Date.now();
  const message = `${payload}|${nonce}|${timestamp}`;
  const signature = createHmac("sha256", secret).update(message).digest("hex");
  return Buffer.from(`${message}|${signature}`).toString("base64url");
}

// Verify OAuth state
export function verifyGoogleState(encodedState: string): { userId: string; firmId?: string; type: "user" | "firm" } | null {
  try {
    const secret = GOOGLE_CLIENT_SECRET || "fallback-key";
    const decoded = Buffer.from(encodedState, "base64url").toString("utf8");
    const parts = decoded.split("|");
    if (parts.length !== 4) return null;

    const [payload, nonce, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);

    // Check expiration (10 minutes)
    if (Date.now() - timestamp > 10 * 60 * 1000) return null;

    // Verify signature
    const message = `${payload}|${nonce}|${timestampStr}`;
    const expectedSignature = createHmac("sha256", secret).update(message).digest("hex");
    if (signature !== expectedSignature) return null;

    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// Generate OAuth URL for Google
export function getGoogleAuthUrl(userId: string, firmId?: string, type: "user" | "firm" = "user"): string {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Google OAuth credentials not configured");
  }

  const redirectUri = `${APP_URL}/api/integrations/google/callback`;
  const state = signState({ userId, firmId, type });

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
    access_type: "offline",
    prompt: "consent",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeGoogleCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
}> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials not configured");
  }

  const redirectUri = `${APP_URL}/api/integrations/google/callback`;

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    scope: data.scope,
  };
}

// Refresh access token
export async function refreshGoogleToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token refresh failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

// ============= User Profile =============

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export async function getGoogleUser(accessToken: string): Promise<GoogleUser> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get Google user info");
  }

  return response.json();
}

// ============= Gmail Operations =============

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string };
    }>;
  };
  internalDate: string;
}

export interface GmailListResponse {
  messages: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate: number;
}

export async function getGmailMessages(
  accessToken: string,
  options?: {
    maxResults?: number;
    pageToken?: string;
    q?: string; // Gmail search query
    labelIds?: string[];
  }
): Promise<GmailListResponse> {
  const params = new URLSearchParams();

  if (options?.maxResults) params.append("maxResults", options.maxResults.toString());
  if (options?.pageToken) params.append("pageToken", options.pageToken);
  if (options?.q) params.append("q", options.q);
  if (options?.labelIds) {
    options.labelIds.forEach((id) => params.append("labelIds", id));
  }

  const response = await fetch(`${GMAIL_API_BASE}/users/me/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail API error: ${error}`);
  }

  return response.json();
}

export async function getGmailMessage(accessToken: string, messageId: string): Promise<GmailMessage> {
  const response = await fetch(`${GMAIL_API_BASE}/users/me/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail API error: ${error}`);
  }

  return response.json();
}

export async function modifyGmailMessage(
  accessToken: string,
  messageId: string,
  modifications: {
    addLabelIds?: string[];
    removeLabelIds?: string[];
  }
): Promise<GmailMessage> {
  const response = await fetch(`${GMAIL_API_BASE}/users/me/messages/${messageId}/modify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(modifications),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail API error: ${error}`);
  }

  return response.json();
}

// Helper to parse email headers
export function parseGmailHeaders(headers: Array<{ name: string; value: string }>): {
  subject: string;
  from: string;
  to: string;
  date: string;
  cc?: string;
} {
  const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  return {
    subject: getHeader("Subject"),
    from: getHeader("From"),
    to: getHeader("To"),
    date: getHeader("Date"),
    cc: getHeader("Cc") || undefined,
  };
}

// Helper to decode base64url encoded body
export function decodeGmailBody(data: string): string {
  return Buffer.from(data, "base64url").toString("utf8");
}

// ============= Google Calendar Operations =============

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
  organizer?: { email: string; displayName?: string };
  htmlLink?: string;
  status: string;
}

export interface CalendarEventsResponse {
  items: GoogleCalendarEvent[];
  nextPageToken?: string;
}

export async function getGoogleCalendarEvents(
  accessToken: string,
  options?: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    pageToken?: string;
  }
): Promise<CalendarEventsResponse> {
  const calendarId = options?.calendarId || "primary";
  const params = new URLSearchParams();

  if (options?.timeMin) params.append("timeMin", options.timeMin);
  if (options?.timeMax) params.append("timeMax", options.timeMax);
  if (options?.maxResults) params.append("maxResults", options.maxResults.toString());
  if (options?.pageToken) params.append("pageToken", options.pageToken);

  params.append("singleEvents", "true");
  params.append("orderBy", "startTime");

  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Calendar API error: ${error}`);
  }

  return response.json();
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string; timeZone?: string };
    end: { dateTime?: string; date?: string; timeZone?: string };
    attendees?: Array<{ email: string }>;
  },
  calendarId: string = "primary"
): Promise<GoogleCalendarEvent> {
  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Calendar API error: ${error}`);
  }

  return response.json();
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  updates: Partial<{
    summary: string;
    description: string;
    location: string;
    start: { dateTime?: string; date?: string; timeZone?: string };
    end: { dateTime?: string; date?: string; timeZone?: string };
  }>,
  calendarId: string = "primary"
): Promise<GoogleCalendarEvent> {
  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Calendar API error: ${error}`);
  }

  return response.json();
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId: string = "primary"
): Promise<void> {
  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Google Calendar API error: ${error}`);
  }
}

// ============= Sync Helpers =============

/**
 * Sync a case deadline to Google Calendar
 */
export async function syncDeadlineToGoogleCalendar(
  accessToken: string,
  deadline: {
    title: string;
    description?: string;
    dueDate: string;
    caseNumber?: string;
    location?: string;
  }
): Promise<GoogleCalendarEvent> {
  const summary = deadline.caseNumber
    ? `[${deadline.caseNumber}] ${deadline.title}`
    : deadline.title;

  return createGoogleCalendarEvent(accessToken, {
    summary,
    description: deadline.description,
    location: deadline.location,
    start: { date: deadline.dueDate.split("T")[0] },
    end: { date: deadline.dueDate.split("T")[0] },
  });
}
