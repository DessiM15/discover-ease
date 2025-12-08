// DocuSign Mock Implementation
// This is a mock/simulation for presentation purposes
// Full DocuSign integration will be implemented in a future version

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface DocuSignEnvelope {
  id: string;
  status: "draft" | "sent" | "delivered" | "signed" | "completed" | "declined" | "voided";
  documentName: string;
  recipients: DocuSignRecipient[];
  createdAt: Date;
  sentAt?: Date;
  completedAt?: Date;
}

export interface DocuSignRecipient {
  id: string;
  name: string;
  email: string;
  role: "signer" | "cc" | "viewer";
  status: "pending" | "sent" | "delivered" | "signed" | "declined";
  signedAt?: Date;
  order: number;
}

export interface CreateEnvelopeOptions {
  documentId: string;
  documentName: string;
  recipients: Array<{
    name: string;
    email: string;
    role: "signer" | "cc" | "viewer";
    order?: number;
  }>;
  subject: string;
  message?: string;
  firmId: string;
}

// Mock storage for demo
const mockEnvelopes = new Map<string, DocuSignEnvelope>();

// Check if DocuSign is configured (mock always returns false for now)
export function isDocuSignConfigured(): boolean {
  // Will check for DOCUSIGN_INTEGRATION_KEY in the future
  return false;
}

// Create envelope (mock)
export async function createEnvelope(
  options: CreateEnvelopeOptions
): Promise<{ success: boolean; envelopeId?: string; error?: string }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const envelopeId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const envelope: DocuSignEnvelope = {
    id: envelopeId,
    status: "draft",
    documentName: options.documentName,
    recipients: options.recipients.map((r, index) => ({
      id: `recipient-${index}`,
      name: r.name,
      email: r.email,
      role: r.role,
      status: "pending",
      order: r.order ?? index + 1,
    })),
    createdAt: new Date(),
  };

  mockEnvelopes.set(envelopeId, envelope);

  return {
    success: true,
    envelopeId,
  };
}

// Send envelope (mock)
export async function sendEnvelope(
  envelopeId: string
): Promise<{ success: boolean; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const envelope = mockEnvelopes.get(envelopeId);
  if (!envelope) {
    return { success: false, error: "Envelope not found" };
  }

  envelope.status = "sent";
  envelope.sentAt = new Date();
  envelope.recipients.forEach((r) => {
    if (r.role !== "cc") {
      r.status = "sent";
    }
  });

  return { success: true };
}

// Get envelope status (mock)
export async function getEnvelopeStatus(
  envelopeId: string
): Promise<DocuSignEnvelope | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return mockEnvelopes.get(envelopeId) || null;
}

// Void envelope (mock)
export async function voidEnvelope(
  envelopeId: string,
  voidReason: string
): Promise<{ success: boolean; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const envelope = mockEnvelopes.get(envelopeId);
  if (!envelope) {
    return { success: false, error: "Envelope not found" };
  }

  if (envelope.status === "completed") {
    return { success: false, error: "Cannot void a completed envelope" };
  }

  envelope.status = "voided";

  return { success: true };
}

// Get signing URL (mock)
export async function getSigningUrl(
  envelopeId: string,
  recipientEmail: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const envelope = mockEnvelopes.get(envelopeId);
  if (!envelope) {
    return { success: false, error: "Envelope not found" };
  }

  const recipient = envelope.recipients.find((r) => r.email === recipientEmail);
  if (!recipient) {
    return { success: false, error: "Recipient not found" };
  }

  // Return a mock signing URL
  const mockUrl = `${APP_URL}/sign/${envelopeId}?email=${encodeURIComponent(recipientEmail)}&mock=true`;

  return { success: true, url: mockUrl };
}

// Simulate signing (mock)
export async function simulateSign(
  envelopeId: string,
  recipientEmail: string
): Promise<{ success: boolean; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const envelope = mockEnvelopes.get(envelopeId);
  if (!envelope) {
    return { success: false, error: "Envelope not found" };
  }

  const recipient = envelope.recipients.find((r) => r.email === recipientEmail);
  if (!recipient) {
    return { success: false, error: "Recipient not found" };
  }

  recipient.status = "signed";
  recipient.signedAt = new Date();

  // Check if all signers have signed
  const allSigned = envelope.recipients
    .filter((r) => r.role === "signer")
    .every((r) => r.status === "signed");

  if (allSigned) {
    envelope.status = "completed";
    envelope.completedAt = new Date();
  }

  return { success: true };
}

// DocuSign-like document types
export const documentTypes = {
  retainerAgreement: {
    id: "retainer_agreement",
    name: "Retainer Agreement",
    description: "Standard legal services retainer agreement",
    fields: ["client_name", "attorney_name", "hourly_rate", "retainer_amount"],
  },
  engagementLetter: {
    id: "engagement_letter",
    name: "Engagement Letter",
    description: "Formal engagement letter for legal representation",
    fields: ["client_name", "matter_description", "fee_arrangement"],
  },
  settlementAgreement: {
    id: "settlement_agreement",
    name: "Settlement Agreement",
    description: "Settlement agreement between parties",
    fields: ["plaintiff_name", "defendant_name", "settlement_amount", "terms"],
  },
  powerOfAttorney: {
    id: "power_of_attorney",
    name: "Power of Attorney",
    description: "Limited or general power of attorney",
    fields: ["principal_name", "agent_name", "scope"],
  },
  authorizedRelease: {
    id: "authorized_release",
    name: "Authorization & Release",
    description: "Medical records or information release authorization",
    fields: ["patient_name", "provider_name", "information_type"],
  },
};

// Mock templates for presentation
export const mockTemplates = [
  {
    id: "template-1",
    name: "Client Retainer Agreement",
    description: "Standard retainer agreement for new clients",
    documentType: "retainer_agreement",
    lastModified: new Date("2024-12-01"),
  },
  {
    id: "template-2",
    name: "Medical Records Release",
    description: "HIPAA-compliant medical records authorization",
    documentType: "authorized_release",
    lastModified: new Date("2024-11-15"),
  },
  {
    id: "template-3",
    name: "Settlement Agreement",
    description: "Standard settlement agreement template",
    documentType: "settlement_agreement",
    lastModified: new Date("2024-10-20"),
  },
];

// Get available templates (mock)
export async function getTemplates(): Promise<typeof mockTemplates> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return mockTemplates;
}

// Feature availability for presentation
export const docuSignFeatures = {
  available: false, // Set to true when DocuSign is fully integrated
  comingSoon: true,
  features: [
    "Send documents for electronic signature",
    "Track signature status in real-time",
    "Automated reminders for unsigned documents",
    "Secure, legally-binding signatures",
    "Document templates with merge fields",
    "Bulk send to multiple recipients",
    "Audit trail and compliance reporting",
  ],
  integration: {
    status: "Coming Soon",
    description: "DocuSign integration is planned for a future release. This mock demonstrates the intended functionality.",
  },
};
