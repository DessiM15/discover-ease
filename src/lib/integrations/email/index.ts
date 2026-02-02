/**
 * Email/Calendar Integrations Module
 * Exports all email and calendar integration utilities
 */

export * from "./microsoft";
export * from "./google";

// Provider types
export type EmailProvider = "microsoft" | "google" | "nylas";
export type IntegrationType = "user" | "firm";

// Common interfaces for normalized data
export interface NormalizedEmail {
  id: string;
  provider: EmailProvider;
  subject: string;
  snippet: string;
  body?: string;
  from: { name: string; email: string };
  to: Array<{ name: string; email: string }>;
  cc?: Array<{ name: string; email: string }>;
  date: Date;
  isRead: boolean;
  hasAttachments: boolean;
  threadId?: string;
}

export interface NormalizedCalendarEvent {
  id: string;
  provider: EmailProvider;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
  attendees?: Array<{ name: string; email: string; status: string }>;
  organizer?: { name: string; email: string };
  link?: string;
}

// Integration status
export interface IntegrationStatus {
  provider: EmailProvider;
  type: IntegrationType;
  isConnected: boolean;
  email?: string;
  lastSynced?: Date;
  error?: string;
}

// Future providers placeholder
export const COMING_SOON_PROVIDERS = [
  {
    id: "nylas",
    name: "Nylas",
    description: "Connect 250+ email providers with a single integration",
    features: ["Yahoo Mail", "iCloud", "IMAP/SMTP", "And more..."],
    status: "coming_soon" as const,
  },
  {
    id: "cronofy",
    name: "Cronofy",
    description: "Advanced calendar scheduling and availability",
    features: ["Smart scheduling", "Availability finder", "Meeting polls"],
    status: "coming_soon" as const,
  },
];
