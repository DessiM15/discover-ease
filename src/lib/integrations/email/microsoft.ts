/**
 * Microsoft Graph API Integration
 * Handles OAuth, email sync, and calendar integration for Microsoft 365/Outlook
 */

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const MICROSOFT_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";

// Scopes for email and calendar access
const SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "Mail.Read",
  "Mail.ReadWrite",
  "Calendars.ReadWrite",
  "User.Read",
];

import { createHmac, randomBytes } from "crypto";

// Sign state for OAuth security
function signState(data: object): string {
  const secret = MICROSOFT_CLIENT_SECRET || "fallback-key";
  const payload = JSON.stringify(data);
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Date.now();
  const message = `${payload}|${nonce}|${timestamp}`;
  const signature = createHmac("sha256", secret).update(message).digest("hex");
  return Buffer.from(`${message}|${signature}`).toString("base64url");
}

// Verify OAuth state
export function verifyMicrosoftState(encodedState: string): { userId: string; firmId?: string; type: "user" | "firm" } | null {
  try {
    const secret = MICROSOFT_CLIENT_SECRET || "fallback-key";
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

// Generate OAuth URL for Microsoft
export function getMicrosoftAuthUrl(userId: string, firmId?: string, type: "user" | "firm" = "user"): string {
  if (!MICROSOFT_CLIENT_ID) {
    throw new Error("Microsoft OAuth credentials not configured");
  }

  const redirectUri = `${APP_URL}/api/integrations/microsoft/callback`;
  const state = signState({ userId, firmId, type });

  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
    prompt: "consent",
  });

  return `${MICROSOFT_AUTH_URL}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeMicrosoftCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
}> {
  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
    throw new Error("Microsoft OAuth credentials not configured");
  }

  const redirectUri = `${APP_URL}/api/integrations/microsoft/callback`;

  const response = await fetch(MICROSOFT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Microsoft token exchange failed: ${error}`);
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
export async function refreshMicrosoftToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
    throw new Error("Microsoft OAuth credentials not configured");
  }

  const response = await fetch(MICROSOFT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Microsoft token refresh failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresIn: data.expires_in,
  };
}

// Make authenticated Graph API request
async function graphRequest<T>(
  accessToken: string,
  endpoint: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: object
): Promise<T> {
  const response = await fetch(`${GRAPH_API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Graph API error: ${error}`);
  }

  return response.json();
}

// ============= User Profile =============

export interface MicrosoftUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

export async function getMicrosoftUser(accessToken: string): Promise<MicrosoftUser> {
  return graphRequest<MicrosoftUser>(accessToken, "/me");
}

// ============= Email Operations =============

export interface MicrosoftEmail {
  id: string;
  subject: string;
  bodyPreview: string;
  body?: { content: string; contentType: string };
  from: { emailAddress: { name: string; address: string } };
  toRecipients: Array<{ emailAddress: { name: string; address: string } }>;
  ccRecipients?: Array<{ emailAddress: { name: string; address: string } }>;
  receivedDateTime: string;
  isRead: boolean;
  hasAttachments: boolean;
  importance: string;
  conversationId: string;
}

export interface EmailListResponse {
  value: MicrosoftEmail[];
  "@odata.nextLink"?: string;
}

export async function getEmails(
  accessToken: string,
  options?: {
    folder?: string;
    top?: number;
    skip?: number;
    filter?: string;
    search?: string;
  }
): Promise<EmailListResponse> {
  const folder = options?.folder || "inbox";
  const params = new URLSearchParams();

  if (options?.top) params.append("$top", options.top.toString());
  if (options?.skip) params.append("$skip", options.skip.toString());
  if (options?.filter) params.append("$filter", options.filter);
  if (options?.search) params.append("$search", `"${options.search}"`);

  params.append("$select", "id,subject,bodyPreview,from,toRecipients,receivedDateTime,isRead,hasAttachments,importance,conversationId");
  params.append("$orderby", "receivedDateTime desc");

  const endpoint = `/me/mailFolders/${folder}/messages?${params.toString()}`;
  return graphRequest<EmailListResponse>(accessToken, endpoint);
}

export async function getEmail(accessToken: string, messageId: string): Promise<MicrosoftEmail> {
  return graphRequest<MicrosoftEmail>(accessToken, `/me/messages/${messageId}?$select=id,subject,body,bodyPreview,from,toRecipients,ccRecipients,receivedDateTime,isRead,hasAttachments,importance,conversationId`);
}

export async function markEmailRead(accessToken: string, messageId: string, isRead: boolean): Promise<void> {
  await graphRequest(accessToken, `/me/messages/${messageId}`, "PATCH", { isRead });
}

// ============= Calendar Operations =============

export interface MicrosoftEvent {
  id: string;
  subject: string;
  body?: { content: string; contentType: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  attendees?: Array<{
    emailAddress: { name: string; address: string };
    status: { response: string };
  }>;
  isAllDay: boolean;
  isCancelled: boolean;
  organizer?: { emailAddress: { name: string; address: string } };
  webLink?: string;
}

export interface CalendarListResponse {
  value: MicrosoftEvent[];
  "@odata.nextLink"?: string;
}

export async function getCalendarEvents(
  accessToken: string,
  options?: {
    startDateTime?: string;
    endDateTime?: string;
    top?: number;
  }
): Promise<CalendarListResponse> {
  const params = new URLSearchParams();

  if (options?.startDateTime && options?.endDateTime) {
    params.append("startDateTime", options.startDateTime);
    params.append("endDateTime", options.endDateTime);
  }
  if (options?.top) params.append("$top", options.top.toString());

  params.append("$select", "id,subject,start,end,location,attendees,isAllDay,isCancelled,organizer,webLink");
  params.append("$orderby", "start/dateTime");

  const endpoint = `/me/calendarView?${params.toString()}`;
  return graphRequest<CalendarListResponse>(accessToken, endpoint);
}

export async function createCalendarEvent(
  accessToken: string,
  event: {
    subject: string;
    body?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    location?: string;
    attendees?: Array<{ email: string; name?: string }>;
    isAllDay?: boolean;
  }
): Promise<MicrosoftEvent> {
  const eventData: Record<string, unknown> = {
    subject: event.subject,
    start: event.start,
    end: event.end,
    isAllDay: event.isAllDay || false,
  };

  if (event.body) {
    eventData.body = { content: event.body, contentType: "text" };
  }
  if (event.location) {
    eventData.location = { displayName: event.location };
  }
  if (event.attendees) {
    eventData.attendees = event.attendees.map((a) => ({
      emailAddress: { address: a.email, name: a.name || a.email },
      type: "required",
    }));
  }

  return graphRequest<MicrosoftEvent>(accessToken, "/me/events", "POST", eventData);
}

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  updates: Partial<{
    subject: string;
    body: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    location: string;
  }>
): Promise<MicrosoftEvent> {
  const eventData: Record<string, unknown> = {};

  if (updates.subject) eventData.subject = updates.subject;
  if (updates.body) eventData.body = { content: updates.body, contentType: "text" };
  if (updates.start) eventData.start = updates.start;
  if (updates.end) eventData.end = updates.end;
  if (updates.location) eventData.location = { displayName: updates.location };

  return graphRequest<MicrosoftEvent>(accessToken, `/me/events/${eventId}`, "PATCH", eventData);
}

export async function deleteCalendarEvent(accessToken: string, eventId: string): Promise<void> {
  await graphRequest(accessToken, `/me/events/${eventId}`, "DELETE");
}

// ============= Sync Helpers =============

/**
 * Sync a case deadline to Microsoft Calendar
 */
export async function syncDeadlineToCalendar(
  accessToken: string,
  deadline: {
    title: string;
    description?: string;
    dueDate: string;
    caseNumber?: string;
    location?: string;
  }
): Promise<MicrosoftEvent> {
  const subject = deadline.caseNumber
    ? `[${deadline.caseNumber}] ${deadline.title}`
    : deadline.title;

  return createCalendarEvent(accessToken, {
    subject,
    body: deadline.description,
    start: { dateTime: deadline.dueDate, timeZone: "UTC" },
    end: { dateTime: deadline.dueDate, timeZone: "UTC" },
    location: deadline.location,
    isAllDay: true,
  });
}
