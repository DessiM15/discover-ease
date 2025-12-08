import { Client } from "@microsoft/microsoft-graph-client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const SCOPES = [
  "offline_access",
  "User.Read",
  "Team.ReadBasic.All",
  "Channel.ReadBasic.All",
  "ChannelMessage.Send",
  "Chat.ReadWrite",
];

// Generate Teams OAuth URL
export function getTeamsAuthUrl(firmId: string): string {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";

  if (!clientId) {
    throw new Error("MICROSOFT_CLIENT_ID not configured");
  }

  const state = encodeURIComponent(JSON.stringify({ firmId, app: "teams" }));
  const redirectUri = `${APP_URL}/api/integrations/teams/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SCOPES.join(" "),
    response_mode: "query",
    state,
    prompt: "consent",
  });

  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

// Exchange code for tokens
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
}> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
  const redirectUri = `${APP_URL}/api/integrations/teams/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("Microsoft OAuth credentials not configured");
  }

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
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
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";

  if (!clientId || !clientSecret) {
    throw new Error("Microsoft OAuth credentials not configured");
  }

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
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

// Get user's teams
export async function getTeams(
  accessToken: string
): Promise<Array<{ id: string; displayName: string; description?: string }>> {
  const client = getGraphClient(accessToken);

  const response = await client
    .api("/me/joinedTeams")
    .select("id,displayName,description")
    .get();

  return (response.value || []).map((team: Record<string, string>) => ({
    id: team.id,
    displayName: team.displayName,
    description: team.description,
  }));
}

// Get team channels
export async function getTeamChannels(
  accessToken: string,
  teamId: string
): Promise<Array<{ id: string; displayName: string; description?: string }>> {
  const client = getGraphClient(accessToken);

  const response = await client
    .api(`/teams/${teamId}/channels`)
    .select("id,displayName,description")
    .get();

  return (response.value || []).map((channel: Record<string, string>) => ({
    id: channel.id,
    displayName: channel.displayName,
    description: channel.description,
  }));
}

export interface TeamsMessage {
  teamId: string;
  channelId: string;
  content: string;
  contentType?: "text" | "html";
  importance?: "normal" | "high" | "urgent";
  mentions?: Array<{ userId: string; displayName: string }>;
}

export interface AdaptiveCard {
  type: "AdaptiveCard";
  version: string;
  body: AdaptiveCardElement[];
  actions?: AdaptiveCardAction[];
}

export interface AdaptiveCardElement {
  type: string;
  text?: string;
  size?: string;
  weight?: string;
  color?: string;
  wrap?: boolean;
  columns?: AdaptiveCardElement[];
  items?: AdaptiveCardElement[];
  width?: string;
  facts?: Array<{ title: string; value: string }>;
}

export interface AdaptiveCardAction {
  type: string;
  title: string;
  url?: string;
  data?: Record<string, unknown>;
}

// Send message to Teams channel
export async function sendTeamsMessage(
  accessToken: string,
  message: TeamsMessage
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = getGraphClient(accessToken);

  try {
    let body: Record<string, unknown> = {
      body: {
        contentType: message.contentType || "text",
        content: message.content,
      },
    };

    if (message.importance) {
      body.importance = message.importance;
    }

    if (message.mentions && message.mentions.length > 0) {
      const mentionedContent = message.mentions
        .map((m, i) => `<at id="${i}">${m.displayName}</at>`)
        .join(" ");

      body = {
        body: {
          contentType: "html",
          content: `${mentionedContent} ${message.content}`,
        },
        mentions: message.mentions.map((m, i) => ({
          id: i,
          mentionText: m.displayName,
          mentioned: {
            user: {
              id: m.userId,
              displayName: m.displayName,
              userIdentityType: "aadUser",
            },
          },
        })),
      };
    }

    const response = await client
      .api(`/teams/${message.teamId}/channels/${message.channelId}/messages`)
      .post(body);

    return {
      success: true,
      messageId: response.id,
    };
  } catch (error) {
    console.error("Teams message error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send message",
    };
  }
}

// Send Adaptive Card to Teams channel
export async function sendTeamsCard(
  accessToken: string,
  teamId: string,
  channelId: string,
  card: AdaptiveCard
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = getGraphClient(accessToken);

  try {
    const response = await client
      .api(`/teams/${teamId}/channels/${channelId}/messages`)
      .post({
        body: {
          contentType: "html",
          content: `<attachment id="card"></attachment>`,
        },
        attachments: [
          {
            id: "card",
            contentType: "application/vnd.microsoft.card.adaptive",
            content: JSON.stringify(card),
          },
        ],
      });

    return {
      success: true,
      messageId: response.id,
    };
  } catch (error) {
    console.error("Teams card error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send card",
    };
  }
}

// Send message via incoming webhook
export async function sendTeamsWebhook(
  webhookUrl: string,
  card: AdaptiveCard
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "message",
        attachments: [
          {
            contentType: "application/vnd.microsoft.card.adaptive",
            content: card,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Teams webhook error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send webhook",
    };
  }
}

// Teams Adaptive Card templates
export const teamsTemplates = {
  // New case notification
  newCase: (data: {
    caseName: string;
    caseNumber: string;
    caseType: string;
    assignedTo: string;
    viewUrl: string;
  }): AdaptiveCard => ({
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: "New Case Created",
        size: "Large",
        weight: "Bolder",
        color: "Accent",
      },
      {
        type: "FactSet",
        facts: [
          { title: "Case Name", value: data.caseName },
          { title: "Case Number", value: data.caseNumber },
          { title: "Type", value: data.caseType },
          { title: "Assigned To", value: data.assignedTo },
        ],
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "View Case",
        url: data.viewUrl,
      },
    ],
  }),

  // Deadline reminder
  deadlineReminder: (data: {
    title: string;
    caseName: string;
    dueDate: string;
    daysRemaining: number;
    viewUrl: string;
  }): AdaptiveCard => ({
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: data.daysRemaining <= 1 ? "⚠️ Urgent Deadline" : "📅 Deadline Reminder",
        size: "Large",
        weight: "Bolder",
        color: data.daysRemaining <= 1 ? "Attention" : "Accent",
      },
      {
        type: "TextBlock",
        text: data.title,
        weight: "Bolder",
        wrap: true,
      },
      {
        type: "FactSet",
        facts: [
          { title: "Case", value: data.caseName },
          { title: "Due Date", value: data.dueDate },
          {
            title: "Time Remaining",
            value:
              data.daysRemaining === 0
                ? "Due Today!"
                : data.daysRemaining === 1
                  ? "Due Tomorrow!"
                  : `${data.daysRemaining} days`,
          },
        ],
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "View Details",
        url: data.viewUrl,
      },
    ],
  }),

  // Payment received
  paymentReceived: (data: {
    amount: string;
    invoiceNumber: string;
    clientName: string;
    caseName?: string;
  }): AdaptiveCard => ({
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: "💰 Payment Received",
        size: "Large",
        weight: "Bolder",
        color: "Good",
      },
      {
        type: "FactSet",
        facts: [
          { title: "Amount", value: data.amount },
          { title: "Invoice", value: data.invoiceNumber },
          { title: "Client", value: data.clientName },
          ...(data.caseName ? [{ title: "Case", value: data.caseName }] : []),
        ],
      },
    ],
  }),

  // Document uploaded
  documentUploaded: (data: {
    documentName: string;
    caseName: string;
    uploadedBy: string;
    viewUrl: string;
  }): AdaptiveCard => ({
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: "📄 New Document Uploaded",
        size: "Large",
        weight: "Bolder",
      },
      {
        type: "FactSet",
        facts: [
          { title: "Document", value: data.documentName },
          { title: "Case", value: data.caseName },
          { title: "Uploaded By", value: data.uploadedBy },
        ],
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "View Document",
        url: data.viewUrl,
      },
    ],
  }),

  // Task assigned
  taskAssigned: (data: {
    taskTitle: string;
    caseName: string;
    assignedTo: string;
    dueDate?: string;
    viewUrl: string;
  }): AdaptiveCard => ({
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: "📋 Task Assigned",
        size: "Large",
        weight: "Bolder",
      },
      {
        type: "FactSet",
        facts: [
          { title: "Task", value: data.taskTitle },
          { title: "Case", value: data.caseName },
          { title: "Assigned To", value: data.assignedTo },
          ...(data.dueDate ? [{ title: "Due Date", value: data.dueDate }] : []),
        ],
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "View Task",
        url: data.viewUrl,
      },
    ],
  }),

  // Discovery deadline
  discoveryDeadline: (data: {
    requestTitle: string;
    caseName: string;
    dueDate: string;
    requestType: string;
    viewUrl: string;
  }): AdaptiveCard => ({
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: "⚖️ Discovery Deadline",
        size: "Large",
        weight: "Bolder",
        color: "Accent",
      },
      {
        type: "FactSet",
        facts: [
          { title: "Request", value: data.requestTitle },
          { title: "Type", value: data.requestType },
          { title: "Case", value: data.caseName },
          { title: "Due Date", value: data.dueDate },
        ],
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "View Request",
        url: data.viewUrl,
      },
    ],
  }),
};

// Check if Teams is configured
export function isTeamsConfigured(): boolean {
  return !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
}
