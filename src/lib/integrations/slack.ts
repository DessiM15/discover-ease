import { WebClient } from "@slack/web-api";
import { InstallProvider } from "@slack/oauth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Initialize Slack OAuth
function getInstallProvider() {
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  const stateSecret = process.env.SLACK_STATE_SECRET || "discoverease-slack-state";

  if (!clientId || !clientSecret) {
    throw new Error("Slack OAuth credentials not configured");
  }

  return new InstallProvider({
    clientId,
    clientSecret,
    stateSecret,
    installationStore: {
      storeInstallation: async () => {
        // We handle storage in our callback
        return;
      },
      fetchInstallation: async () => {
        throw new Error("Fetching from installation store not implemented");
      },
      deleteInstallation: async () => {
        // We handle deletion in our app
        return;
      },
    },
  });
}

// Generate Slack OAuth URL
export function getSlackAuthUrl(firmId: string): string {
  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) {
    throw new Error("SLACK_CLIENT_ID not configured");
  }

  const scopes = [
    "channels:read",
    "chat:write",
    "chat:write.public",
    "users:read",
    "users:read.email",
    "incoming-webhook",
  ].join(",");

  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes,
    redirect_uri: `${APP_URL}/api/integrations/slack/callback`,
    state: firmId,
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

// Exchange code for tokens
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  teamId: string;
  teamName: string;
  botUserId: string;
  incomingWebhookUrl?: string;
  incomingWebhookChannel?: string;
}> {
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Slack OAuth credentials not configured");
  }

  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${APP_URL}/api/integrations/slack/callback`,
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Slack OAuth failed: ${data.error}`);
  }

  return {
    accessToken: data.access_token,
    teamId: data.team.id,
    teamName: data.team.name,
    botUserId: data.bot_user_id,
    incomingWebhookUrl: data.incoming_webhook?.url,
    incomingWebhookChannel: data.incoming_webhook?.channel,
  };
}

// Create Slack client
function getSlackClient(accessToken: string): WebClient {
  return new WebClient(accessToken);
}

export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
  threadTs?: string;
  unfurlLinks?: boolean;
  unfurlMedia?: boolean;
}

export interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  block_id?: string;
  elements?: Array<Record<string, unknown>>;
  accessory?: Record<string, unknown>;
  fields?: Array<{ type: string; text: string }>;
}

export interface SlackAttachment {
  color?: string;
  fallback?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{ title: string; value: string; short?: boolean }>;
  footer?: string;
  ts?: number;
}

// Send message to Slack
export async function sendSlackMessage(
  accessToken: string,
  message: SlackMessage
): Promise<{ success: boolean; ts?: string; error?: string }> {
  const client = getSlackClient(accessToken);

  try {
    const postMessageArgs = {
      channel: message.channel,
      text: message.text,
      blocks: message.blocks,
      thread_ts: message.threadTs,
      unfurl_links: message.unfurlLinks ?? false,
      unfurl_media: message.unfurlMedia ?? true,
    };
    // Add attachments if present (legacy feature, but still supported)
    if (message.attachments) {
      (postMessageArgs as Record<string, unknown>).attachments = message.attachments;
    }
    const result = await client.chat.postMessage(postMessageArgs);

    return {
      success: result.ok || false,
      ts: result.ts,
    };
  } catch (error) {
    console.error("Slack message error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send message",
    };
  }
}

// Send via webhook (simpler, no bot token needed)
export async function sendSlackWebhook(
  webhookUrl: string,
  message: {
    text: string;
    blocks?: SlackBlock[];
    attachments?: SlackAttachment[];
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Slack webhook error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send webhook",
    };
  }
}

// Get list of channels
export async function getSlackChannels(
  accessToken: string
): Promise<Array<{ id: string; name: string; isPrivate: boolean }>> {
  const client = getSlackClient(accessToken);

  const result = await client.conversations.list({
    types: "public_channel,private_channel",
    limit: 200,
  });

  return (result.channels || []).map((ch) => ({
    id: ch.id || "",
    name: ch.name || "",
    isPrivate: ch.is_private || false,
  }));
}

// Get list of users
export async function getSlackUsers(
  accessToken: string
): Promise<Array<{ id: string; name: string; email?: string; isBot: boolean }>> {
  const client = getSlackClient(accessToken);

  const result = await client.users.list({ limit: 200 });

  return (result.members || [])
    .filter((u) => !u.deleted)
    .map((u) => ({
      id: u.id || "",
      name: u.real_name || u.name || "",
      email: u.profile?.email,
      isBot: u.is_bot || false,
    }));
}

// Slack message templates
export const slackTemplates = {
  // New case notification
  newCase: (data: {
    caseName: string;
    caseNumber: string;
    caseType: string;
    assignedTo: string;
    viewUrl: string;
  }): SlackMessage => ({
    channel: "", // Set when sending
    text: `New case created: ${data.caseName}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "New Case Created", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Case Name:*\n${data.caseName}` },
          { type: "mrkdwn", text: `*Case Number:*\n${data.caseNumber}` },
          { type: "mrkdwn", text: `*Type:*\n${data.caseType}` },
          { type: "mrkdwn", text: `*Assigned To:*\n${data.assignedTo}` },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View Case", emoji: true },
            url: data.viewUrl,
            style: "primary",
          },
        ],
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
  }): SlackMessage => ({
    channel: "",
    text: `Deadline reminder: ${data.title}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: data.daysRemaining <= 1 ? "⚠️ Urgent Deadline" : "📅 Deadline Reminder",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${data.title}*\nCase: ${data.caseName}\nDue: ${data.dueDate} (${data.daysRemaining === 0 ? "Today!" : data.daysRemaining === 1 ? "Tomorrow!" : `${data.daysRemaining} days`})`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View Details", emoji: true },
            url: data.viewUrl,
            style: data.daysRemaining <= 1 ? "danger" : "primary",
          },
        ],
      },
    ],
  }),

  // Payment received
  paymentReceived: (data: {
    amount: string;
    invoiceNumber: string;
    clientName: string;
    caseName?: string;
  }): SlackMessage => ({
    channel: "",
    text: `Payment received: ${data.amount}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "💰 Payment Received", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Amount:*\n${data.amount}` },
          { type: "mrkdwn", text: `*Invoice:*\n${data.invoiceNumber}` },
          { type: "mrkdwn", text: `*Client:*\n${data.clientName}` },
          ...(data.caseName
            ? [{ type: "mrkdwn", text: `*Case:*\n${data.caseName}` }]
            : []),
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
  }): SlackMessage => ({
    channel: "",
    text: `New document uploaded: ${data.documentName}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "📄 New Document", emoji: true },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${data.documentName}*\nCase: ${data.caseName}\nUploaded by: ${data.uploadedBy}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View Document", emoji: true },
            url: data.viewUrl,
          },
        ],
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
  }): SlackMessage => ({
    channel: "",
    text: `Task assigned: ${data.taskTitle}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "📋 Task Assigned", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Task:*\n${data.taskTitle}` },
          { type: "mrkdwn", text: `*Case:*\n${data.caseName}` },
          { type: "mrkdwn", text: `*Assigned To:*\n${data.assignedTo}` },
          ...(data.dueDate
            ? [{ type: "mrkdwn", text: `*Due:*\n${data.dueDate}` }]
            : []),
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View Task", emoji: true },
            url: data.viewUrl,
          },
        ],
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
  }): SlackMessage => ({
    channel: "",
    text: `Discovery deadline: ${data.requestTitle}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "⚖️ Discovery Deadline", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Request:*\n${data.requestTitle}` },
          { type: "mrkdwn", text: `*Type:*\n${data.requestType}` },
          { type: "mrkdwn", text: `*Case:*\n${data.caseName}` },
          { type: "mrkdwn", text: `*Due:*\n${data.dueDate}` },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View Request", emoji: true },
            url: data.viewUrl,
            style: "primary",
          },
        ],
      },
    ],
  }),
};

// Check if Slack is configured
export function isSlackConfigured(): boolean {
  return !!(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET);
}
