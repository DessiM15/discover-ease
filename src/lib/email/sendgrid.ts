import sgMail from "@sendgrid/mail";

// Initialize SendGrid
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@discoverease.com";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "DiscoverEase";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition?: "attachment" | "inline";
  }>;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  sendAt?: number; // Unix timestamp for scheduled sending
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  if (!apiKey) {
    console.error("SENDGRID_API_KEY is not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const msg = {
      to: options.to,
      from: {
        email: FROM_EMAIL,
        name: APP_NAME,
      },
      subject: options.subject,
      text: options.text || "",
      html: options.html || options.text || "",
    } as sgMail.MailDataRequired;

    if (options.templateId) {
      msg.templateId = options.templateId;
      if (options.dynamicTemplateData) {
        msg.dynamicTemplateData = options.dynamicTemplateData;
      }
    }

    if (options.attachments) {
      msg.attachments = options.attachments;
    }

    if (options.replyTo) {
      msg.replyTo = options.replyTo;
    }

    if (options.cc) {
      msg.cc = options.cc;
    }

    if (options.bcc) {
      msg.bcc = options.bcc;
    }

    if (options.sendAt) {
      msg.sendAt = options.sendAt;
    }

    const [response] = await sgMail.send(msg);

    return {
      success: true,
      messageId: response.headers["x-message-id"],
    };
  } catch (error) {
    console.error("SendGrid error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

// Email template generators
export const emailTemplates = {
  // Team invite email
  teamInvite: (data: {
    inviterName: string;
    firmName: string;
    inviteUrl: string;
    role: string;
  }) => ({
    subject: `You've been invited to join ${data.firmName} on ${APP_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f59e0b; }
            .logo { font-size: 24px; font-weight: bold; color: #f59e0b; }
            .content { padding: 30px 0; }
            .button { display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">${APP_NAME}</div>
            </div>
            <div class="content">
              <h2>You're Invited!</h2>
              <p>${data.inviterName} has invited you to join <strong>${data.firmName}</strong> on ${APP_NAME} as a <strong>${data.role}</strong>.</p>
              <p>${APP_NAME} is a comprehensive legal practice management platform that helps law firms manage cases, documents, billing, and more.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${data.inviteUrl}" class="button">Accept Invitation</a>
              </p>
              <p style="font-size: 14px; color: #666;">This invitation link will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
You're Invited to ${APP_NAME}!

${data.inviterName} has invited you to join ${data.firmName} on ${APP_NAME} as a ${data.role}.

Accept your invitation: ${data.inviteUrl}

This invitation link will expire in 7 days.

---
${APP_NAME}
    `,
  }),

  // Invoice email
  invoice: (data: {
    clientName: string;
    firmName: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    paymentUrl: string;
    caseName?: string;
  }) => ({
    subject: `Invoice ${data.invoiceNumber} from ${data.firmName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f59e0b; }
            .logo { font-size: 24px; font-weight: bold; color: #f59e0b; }
            .content { padding: 30px 0; }
            .invoice-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .amount { font-size: 32px; font-weight: bold; color: #f59e0b; }
            .button { display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">${data.firmName}</div>
            </div>
            <div class="content">
              <p>Dear ${data.clientName},</p>
              <p>Please find below the details for Invoice ${data.invoiceNumber}${data.caseName ? ` regarding ${data.caseName}` : ""}.</p>

              <div class="invoice-box">
                <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
                <p><strong>Amount Due:</strong></p>
                <p class="amount">${data.amount}</p>
                <p><strong>Due Date:</strong> ${data.dueDate}</p>
              </div>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${data.paymentUrl}" class="button">Pay Now</a>
              </p>

              <p style="font-size: 14px; color: #666;">If you have any questions about this invoice, please don't hesitate to contact us.</p>
            </div>
            <div class="footer">
              <p>Powered by ${APP_NAME}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Dear ${data.clientName},

Please find below the details for Invoice ${data.invoiceNumber}${data.caseName ? ` regarding ${data.caseName}` : ""}.

Invoice Number: ${data.invoiceNumber}
Amount Due: ${data.amount}
Due Date: ${data.dueDate}

Pay online: ${data.paymentUrl}

If you have any questions about this invoice, please don't hesitate to contact us.

---
${data.firmName}
Powered by ${APP_NAME}
    `,
  }),

  // Payment confirmation
  paymentConfirmation: (data: {
    clientName: string;
    firmName: string;
    invoiceNumber: string;
    amount: string;
    paymentDate: string;
    paymentMethod: string;
    remainingBalance?: string;
  }) => ({
    subject: `Payment Received - Invoice ${data.invoiceNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #22c55e; }
            .logo { font-size: 24px; font-weight: bold; color: #22c55e; }
            .content { padding: 30px 0; }
            .success-box { background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .checkmark { font-size: 48px; color: #22c55e; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">${data.firmName}</div>
            </div>
            <div class="content">
              <div class="success-box">
                <div class="checkmark">✓</div>
                <h2 style="color: #22c55e;">Payment Received</h2>
              </div>

              <p>Dear ${data.clientName},</p>
              <p>Thank you for your payment. This email confirms that we have received your payment.</p>

              <table style="width: 100%; margin: 20px 0;">
                <tr><td><strong>Invoice Number:</strong></td><td>${data.invoiceNumber}</td></tr>
                <tr><td><strong>Amount Paid:</strong></td><td>${data.amount}</td></tr>
                <tr><td><strong>Payment Date:</strong></td><td>${data.paymentDate}</td></tr>
                <tr><td><strong>Payment Method:</strong></td><td>${data.paymentMethod}</td></tr>
                ${data.remainingBalance ? `<tr><td><strong>Remaining Balance:</strong></td><td>${data.remainingBalance}</td></tr>` : ""}
              </table>

              <p>If you have any questions, please don't hesitate to contact us.</p>
            </div>
            <div class="footer">
              <p>Powered by ${APP_NAME}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Payment Received

Dear ${data.clientName},

Thank you for your payment. This email confirms that we have received your payment.

Invoice Number: ${data.invoiceNumber}
Amount Paid: ${data.amount}
Payment Date: ${data.paymentDate}
Payment Method: ${data.paymentMethod}
${data.remainingBalance ? `Remaining Balance: ${data.remainingBalance}` : ""}

If you have any questions, please don't hesitate to contact us.

---
${data.firmName}
Powered by ${APP_NAME}
    `,
  }),

  // Deadline reminder
  deadlineReminder: (data: {
    recipientName: string;
    deadlineTitle: string;
    deadlineDate: string;
    caseName: string;
    caseNumber: string;
    daysUntil: number;
    viewUrl: string;
  }) => ({
    subject: `Deadline Reminder: ${data.deadlineTitle} - ${data.caseName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f59e0b; }
            .logo { font-size: 24px; font-weight: bold; color: #f59e0b; }
            .content { padding: 30px 0; }
            .warning-box { background: ${data.daysUntil <= 1 ? "#fef2f2" : data.daysUntil <= 3 ? "#fffbeb" : "#f8f9fa"}; border: 1px solid ${data.daysUntil <= 1 ? "#ef4444" : data.daysUntil <= 3 ? "#f59e0b" : "#e5e7eb"}; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .deadline-date { font-size: 24px; font-weight: bold; color: ${data.daysUntil <= 1 ? "#ef4444" : data.daysUntil <= 3 ? "#f59e0b" : "#333"}; }
            .button { display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">${APP_NAME}</div>
            </div>
            <div class="content">
              <h2>Deadline Reminder</h2>
              <p>Hi ${data.recipientName},</p>
              <p>This is a reminder about an upcoming deadline.</p>

              <div class="warning-box">
                <p><strong>${data.deadlineTitle}</strong></p>
                <p class="deadline-date">${data.deadlineDate}</p>
                <p>${data.daysUntil === 0 ? "Due today!" : data.daysUntil === 1 ? "Due tomorrow!" : `Due in ${data.daysUntil} days`}</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
                <p><strong>Case:</strong> ${data.caseName}</p>
                <p><strong>Case Number:</strong> ${data.caseNumber}</p>
              </div>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${data.viewUrl}" class="button">View Details</a>
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Deadline Reminder

Hi ${data.recipientName},

This is a reminder about an upcoming deadline.

${data.deadlineTitle}
Due: ${data.deadlineDate}
${data.daysUntil === 0 ? "Due today!" : data.daysUntil === 1 ? "Due tomorrow!" : `Due in ${data.daysUntil} days`}

Case: ${data.caseName}
Case Number: ${data.caseNumber}

View details: ${data.viewUrl}

---
${APP_NAME}
    `,
  }),

  // Discovery sharing link
  discoveryShareLink: (data: {
    recipientName: string;
    senderName: string;
    firmName: string;
    caseName: string;
    requestTitle: string;
    dueDate: string;
    uploadUrl: string;
    instructions?: string;
  }) => ({
    subject: `Document Request: ${data.requestTitle} - ${data.caseName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f59e0b; }
            .logo { font-size: 24px; font-weight: bold; color: #f59e0b; }
            .content { padding: 30px 0; }
            .info-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">${data.firmName}</div>
            </div>
            <div class="content">
              <h2>Document Request</h2>
              <p>Dear ${data.recipientName},</p>
              <p>${data.senderName} from ${data.firmName} has requested documents related to the following matter:</p>

              <div class="info-box">
                <p><strong>Case:</strong> ${data.caseName}</p>
                <p><strong>Request:</strong> ${data.requestTitle}</p>
                <p><strong>Response Due:</strong> ${data.dueDate}</p>
                ${data.instructions ? `<hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;"><p><strong>Instructions:</strong></p><p>${data.instructions}</p>` : ""}
              </div>

              <p>Please use the secure link below to upload the requested documents:</p>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${data.uploadUrl}" class="button">Upload Documents</a>
              </p>

              <p style="font-size: 14px; color: #666;">This link is secure and will expire after the due date. If you have any questions, please contact ${data.senderName} directly.</p>
            </div>
            <div class="footer">
              <p>Powered by ${APP_NAME}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Document Request

Dear ${data.recipientName},

${data.senderName} from ${data.firmName} has requested documents related to the following matter:

Case: ${data.caseName}
Request: ${data.requestTitle}
Response Due: ${data.dueDate}
${data.instructions ? `\nInstructions:\n${data.instructions}` : ""}

Please use the secure link below to upload the requested documents:
${data.uploadUrl}

This link is secure and will expire after the due date.

---
${data.firmName}
Powered by ${APP_NAME}
    `,
  }),

  // Password reset
  passwordReset: (data: {
    userName: string;
    resetUrl: string;
  }) => ({
    subject: `Reset your ${APP_NAME} password`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f59e0b; }
            .logo { font-size: 24px; font-weight: bold; color: #f59e0b; }
            .content { padding: 30px 0; }
            .button { display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">${APP_NAME}</div>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>Hi ${data.userName},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${data.resetUrl}" class="button">Reset Password</a>
              </p>

              <p style="font-size: 14px; color: #666;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Reset Your Password

Hi ${data.userName},

We received a request to reset your password. Use the link below to create a new password:

${data.resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.

---
${APP_NAME}
    `,
  }),

  // Master password notification
  masterPasswordUsed: (data: {
    firmName: string;
    usedBy: string;
    usedAt: string;
    ipAddress: string;
    affectedUser: string;
  }) => ({
    subject: `[Security Alert] Master Password Used - ${data.firmName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #ef4444; }
            .logo { font-size: 24px; font-weight: bold; color: #ef4444; }
            .content { padding: 30px 0; }
            .alert-box { background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Security Alert</div>
            </div>
            <div class="content">
              <h2>Master Password Used</h2>
              <p>This is a security notification that the master password was used at your firm.</p>

              <div class="alert-box">
                <p><strong>Used by:</strong> ${data.usedBy}</p>
                <p><strong>Time:</strong> ${data.usedAt}</p>
                <p><strong>IP Address:</strong> ${data.ipAddress}</p>
                <p><strong>Affected Account:</strong> ${data.affectedUser}</p>
              </div>

              <p>If this access was not authorized, please contact your firm administrator immediately and consider changing your master password.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
SECURITY ALERT: Master Password Used

This is a security notification that the master password was used at your firm.

Used by: ${data.usedBy}
Time: ${data.usedAt}
IP Address: ${data.ipAddress}
Affected Account: ${data.affectedUser}

If this access was not authorized, please contact your firm administrator immediately.

---
${APP_NAME}
    `,
  }),

  // Workflow notification
  workflowNotification: (data: {
    recipientName: string;
    workflowName: string;
    triggerEvent: string;
    caseName: string;
    actionRequired: string;
    viewUrl: string;
  }) => ({
    subject: `[Workflow] ${data.workflowName}: ${data.actionRequired}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #8b5cf6; }
            .logo { font-size: 24px; font-weight: bold; color: #8b5cf6; }
            .content { padding: 30px 0; }
            .workflow-box { background: #f5f3ff; border: 1px solid #8b5cf6; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Workflow Notification</div>
            </div>
            <div class="content">
              <p>Hi ${data.recipientName},</p>
              <p>A workflow has been triggered and requires your attention.</p>

              <div class="workflow-box">
                <p><strong>Workflow:</strong> ${data.workflowName}</p>
                <p><strong>Trigger:</strong> ${data.triggerEvent}</p>
                <p><strong>Case:</strong> ${data.caseName}</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
                <p><strong>Action Required:</strong></p>
                <p>${data.actionRequired}</p>
              </div>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${data.viewUrl}" class="button">Take Action</a>
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Workflow Notification

Hi ${data.recipientName},

A workflow has been triggered and requires your attention.

Workflow: ${data.workflowName}
Trigger: ${data.triggerEvent}
Case: ${data.caseName}

Action Required:
${data.actionRequired}

Take action: ${data.viewUrl}

---
${APP_NAME}
    `,
  }),
};

// Helper function to send templated emails
export async function sendTemplatedEmail(
  to: string | string[],
  template: { subject: string; html: string; text: string },
  options?: Partial<EmailOptions>
): Promise<SendResult> {
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    ...options,
  });
}
