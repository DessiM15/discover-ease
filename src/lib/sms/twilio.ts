import Twilio from "twilio";

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: Twilio.Twilio | null = null;

function getClient(): Twilio.Twilio | null {
  if (!accountSid || !authToken) {
    console.warn("Twilio credentials not configured. SMS functionality disabled.");
    return null;
  }

  if (!twilioClient) {
    twilioClient = Twilio(accountSid, authToken);
  }

  return twilioClient;
}

export interface SmsOptions {
  to: string;
  body: string;
  mediaUrl?: string[];
  statusCallback?: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSms(options: SmsOptions): Promise<SmsResult> {
  const client = getClient();

  if (!client) {
    return { success: false, error: "SMS service not configured" };
  }

  if (!fromNumber) {
    return { success: false, error: "TWILIO_PHONE_NUMBER not configured" };
  }

  try {
    const message = await client.messages.create({
      to: options.to,
      from: fromNumber,
      body: options.body,
      mediaUrl: options.mediaUrl,
      statusCallback: options.statusCallback,
    });

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error) {
    console.error("Twilio error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    };
  }
}

// SMS template generators
export const smsTemplates = {
  // Appointment reminder
  appointmentReminder: (data: {
    clientName: string;
    appointmentType: string;
    date: string;
    time: string;
    location?: string;
    firmName: string;
  }) => ({
    body: `Hi ${data.clientName}, this is a reminder about your ${data.appointmentType} on ${data.date} at ${data.time}${data.location ? ` at ${data.location}` : ""}. - ${data.firmName}`,
  }),

  // Deadline reminder
  deadlineReminder: (data: {
    recipientName: string;
    deadlineTitle: string;
    dueDate: string;
    caseName: string;
  }) => ({
    body: `Deadline Alert: "${data.deadlineTitle}" for ${data.caseName} is due on ${data.dueDate}. Please review. - DiscoverEase`,
  }),

  // Payment received
  paymentReceived: (data: {
    clientName: string;
    amount: string;
    invoiceNumber: string;
    firmName: string;
  }) => ({
    body: `Hi ${data.clientName}, we've received your payment of ${data.amount} for Invoice ${data.invoiceNumber}. Thank you! - ${data.firmName}`,
  }),

  // Invoice sent
  invoiceSent: (data: {
    clientName: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    paymentUrl: string;
  }) => ({
    body: `Hi ${data.clientName}, Invoice ${data.invoiceNumber} for ${data.amount} has been sent. Due: ${data.dueDate}. Pay online: ${data.paymentUrl}`,
  }),

  // Document ready
  documentReady: (data: {
    clientName: string;
    documentName: string;
    portalUrl: string;
    firmName: string;
  }) => ({
    body: `Hi ${data.clientName}, "${data.documentName}" is ready for your review. Access it in your portal: ${data.portalUrl} - ${data.firmName}`,
  }),

  // Case update
  caseUpdate: (data: {
    clientName: string;
    caseName: string;
    updateMessage: string;
    firmName: string;
  }) => ({
    body: `Hi ${data.clientName}, update on ${data.caseName}: ${data.updateMessage} - ${data.firmName}`,
  }),

  // Two-factor authentication
  twoFactorCode: (data: {
    code: string;
  }) => ({
    body: `Your DiscoverEase verification code is: ${data.code}. This code expires in 10 minutes. Do not share this code.`,
  }),

  // Client booking confirmation
  bookingConfirmation: (data: {
    clientName: string;
    appointmentType: string;
    date: string;
    time: string;
    attorneyName: string;
    firmName: string;
  }) => ({
    body: `Hi ${data.clientName}, your ${data.appointmentType} with ${data.attorneyName} is confirmed for ${data.date} at ${data.time}. - ${data.firmName}`,
  }),
};

// Helper function to format phone numbers for Twilio (E.164 format)
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // If it's a 10-digit US number, add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If it already has country code
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // If it already has the + prefix
  if (phone.startsWith("+")) {
    return phone;
  }

  // Default: assume it needs +1
  return `+1${digits}`;
}

// Helper function to send templated SMS
export async function sendTemplatedSms(
  to: string,
  template: { body: string },
  options?: Partial<SmsOptions>
): Promise<SmsResult> {
  return sendSms({
    to: formatPhoneNumber(to),
    body: template.body,
    ...options,
  });
}

// Check if SMS is configured
export function isSmsConfigured(): boolean {
  return !!(accountSid && authToken && fromNumber);
}
