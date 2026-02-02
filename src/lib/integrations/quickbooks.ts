/**
 * QuickBooks Online Integration
 * Handles OAuth, invoice sync, and financial data integration
 */

import { createHmac, randomBytes } from "crypto";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const QB_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID;
const QB_CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET;
const QB_ENVIRONMENT = process.env.QUICKBOOKS_ENVIRONMENT || "sandbox"; // "sandbox" or "production"

const QB_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QB_API_BASE = QB_ENVIRONMENT === "production"
  ? "https://quickbooks.api.intuit.com"
  : "https://sandbox-quickbooks.api.intuit.com";

const SCOPES = [
  "com.intuit.quickbooks.accounting",
  "openid",
  "profile",
  "email",
];

// Get the signing key for state parameter (use QB_CLIENT_SECRET as base)
function getStateSigningKey(): string {
  return QB_CLIENT_SECRET || "fallback-key-for-development";
}

// Sign state data with HMAC to prevent tampering
function signState(data: object): string {
  const payload = JSON.stringify(data);
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Date.now();
  const message = `${payload}|${nonce}|${timestamp}`;
  const signature = createHmac("sha256", getStateSigningKey())
    .update(message)
    .digest("hex");
  return Buffer.from(`${message}|${signature}`).toString("base64url");
}

// Verify and decode signed state
export function verifyState(encodedState: string): { userId: string; firmId: string } | null {
  try {
    const decoded = Buffer.from(encodedState, "base64url").toString("utf8");
    const parts = decoded.split("|");
    if (parts.length !== 4) return null;

    const [payload, nonce, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);

    // Check state is not older than 10 minutes
    const maxAge = 10 * 60 * 1000; // 10 minutes
    if (Date.now() - timestamp > maxAge) {
      console.error("OAuth state expired");
      return null;
    }

    // Verify signature
    const message = `${payload}|${nonce}|${timestampStr}`;
    const expectedSignature = createHmac("sha256", getStateSigningKey())
      .update(message)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("OAuth state signature mismatch");
      return null;
    }

    const data = JSON.parse(payload);
    if (!data.userId || !data.firmId) return null;

    return { userId: data.userId, firmId: data.firmId };
  } catch (error) {
    console.error("Failed to verify OAuth state:", error);
    return null;
  }
}

// Escape special characters for QuickBooks QL queries
// QuickBooks QL uses single quotes for strings, so we need to escape them
function escapeQBQL(value: string): string {
  if (!value) return "";
  // QuickBooks QL escapes single quotes by doubling them
  // Also remove any potentially dangerous characters
  return value
    .replace(/'/g, "''") // Escape single quotes
    .replace(/[\x00-\x1f\x7f]/g, ""); // Remove control characters
}

// Validate that a value looks like a QuickBooks ID (numeric string)
function isValidQBId(value: string): boolean {
  return /^\d+$/.test(value);
}

// Validate date format (YYYY-MM-DD)
function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
}

// Generate OAuth authorization URL
export function getQuickBooksAuthUrl(userId: string, firmId: string): string {
  if (!QB_CLIENT_ID) {
    throw new Error("QuickBooks OAuth credentials not configured");
  }

  const redirectUri = `${APP_URL}/api/integrations/quickbooks/callback`;
  const state = signState({ userId, firmId });

  const params = new URLSearchParams({
    client_id: QB_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
  });

  return `${QB_AUTH_URL}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  realmId: string;
}> {
  if (!QB_CLIENT_ID || !QB_CLIENT_SECRET) {
    throw new Error("QuickBooks OAuth credentials not configured");
  }

  const redirectUri = `${APP_URL}/api/integrations/quickbooks/callback`;
  const auth = Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QuickBooks token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    realmId: data.realmId || "",
  };
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  if (!QB_CLIENT_ID || !QB_CLIENT_SECRET) {
    throw new Error("QuickBooks OAuth credentials not configured");
  }

  const auth = Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QuickBooks token refresh failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

// Make authenticated API request
async function qbRequest<T>(
  accessToken: string,
  realmId: string,
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: object
): Promise<T> {
  const url = `${QB_API_BASE}/v3/company/${realmId}/${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QuickBooks API error: ${error}`);
  }

  return response.json();
}

// ============= Customer Operations =============

export interface QBCustomer {
  Id?: string;
  DisplayName: string;
  CompanyName?: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  BillAddr?: {
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
}

export async function getCustomers(
  accessToken: string,
  realmId: string
): Promise<QBCustomer[]> {
  const response = await qbRequest<{ QueryResponse: { Customer?: QBCustomer[] } }>(
    accessToken,
    realmId,
    "query?query=SELECT * FROM Customer MAXRESULTS 1000"
  );
  return response.QueryResponse.Customer || [];
}

export async function createCustomer(
  accessToken: string,
  realmId: string,
  customer: Omit<QBCustomer, "Id">
): Promise<QBCustomer> {
  const response = await qbRequest<{ Customer: QBCustomer }>(
    accessToken,
    realmId,
    "customer",
    "POST",
    customer
  );
  return response.Customer;
}

export async function findOrCreateCustomer(
  accessToken: string,
  realmId: string,
  email: string,
  displayName: string,
  companyName?: string
): Promise<QBCustomer> {
  // Properly escape email for QBQL query
  const escapedEmail = escapeQBQL(email);
  const query = `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${escapedEmail}' MAXRESULTS 1`;
  const response = await qbRequest<{ QueryResponse: { Customer?: QBCustomer[] } }>(
    accessToken,
    realmId,
    `query?query=${encodeURIComponent(query)}`
  );

  if (response.QueryResponse.Customer && response.QueryResponse.Customer.length > 0) {
    return response.QueryResponse.Customer[0];
  }

  // Create new customer if not found
  return createCustomer(accessToken, realmId, {
    DisplayName: displayName,
    CompanyName: companyName,
    PrimaryEmailAddr: { Address: email },
  });
}

// ============= Invoice Operations =============

export interface QBInvoiceLine {
  Amount: number;
  Description?: string;
  DetailType: "SalesItemLineDetail";
  SalesItemLineDetail: {
    ItemRef?: { value: string; name: string };
    Qty?: number;
    UnitPrice?: number;
  };
}

export interface QBInvoice {
  Id?: string;
  DocNumber?: string;
  CustomerRef: { value: string; name?: string };
  Line: QBInvoiceLine[];
  DueDate?: string;
  TxnDate?: string;
  TotalAmt?: number;
  Balance?: number;
  EmailStatus?: string;
  BillEmail?: { Address: string };
  CustomField?: Array<{ DefinitionId: string; StringValue: string }>;
  PrivateNote?: string;
}

export async function getInvoices(
  accessToken: string,
  realmId: string,
  options?: {
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<QBInvoice[]> {
  let query = "SELECT * FROM Invoice";
  const conditions: string[] = [];

  if (options?.customerId) {
    // Validate customerId is a valid QuickBooks ID (numeric)
    if (!isValidQBId(options.customerId)) {
      throw new Error("Invalid customer ID format");
    }
    conditions.push(`CustomerRef = '${options.customerId}'`);
  }
  if (options?.startDate) {
    // Validate date format
    if (!isValidDate(options.startDate)) {
      throw new Error("Invalid start date format (expected YYYY-MM-DD)");
    }
    conditions.push(`TxnDate >= '${options.startDate}'`);
  }
  if (options?.endDate) {
    // Validate date format
    if (!isValidDate(options.endDate)) {
      throw new Error("Invalid end date format (expected YYYY-MM-DD)");
    }
    conditions.push(`TxnDate <= '${options.endDate}'`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += " MAXRESULTS 1000";

  const response = await qbRequest<{ QueryResponse: { Invoice?: QBInvoice[] } }>(
    accessToken,
    realmId,
    `query?query=${encodeURIComponent(query)}`
  );
  return response.QueryResponse.Invoice || [];
}

export async function createInvoice(
  accessToken: string,
  realmId: string,
  invoice: Omit<QBInvoice, "Id">
): Promise<QBInvoice> {
  const response = await qbRequest<{ Invoice: QBInvoice }>(
    accessToken,
    realmId,
    "invoice",
    "POST",
    invoice
  );
  return response.Invoice;
}

export async function sendInvoiceEmail(
  accessToken: string,
  realmId: string,
  invoiceId: string,
  email?: string
): Promise<void> {
  // Validate invoice ID
  if (!isValidQBId(invoiceId)) {
    throw new Error("Invalid invoice ID format");
  }

  const endpoint = email
    ? `invoice/${invoiceId}/send?sendTo=${encodeURIComponent(email)}`
    : `invoice/${invoiceId}/send`;

  await qbRequest(accessToken, realmId, endpoint, "POST");
}

// ============= Payment Operations =============

export interface QBPayment {
  Id?: string;
  CustomerRef: { value: string; name?: string };
  TotalAmt: number;
  TxnDate?: string;
  PaymentMethodRef?: { value: string; name?: string };
  Line?: Array<{
    Amount: number;
    LinkedTxn: Array<{ TxnId: string; TxnType: "Invoice" }>;
  }>;
}

export async function recordPayment(
  accessToken: string,
  realmId: string,
  payment: Omit<QBPayment, "Id">
): Promise<QBPayment> {
  const response = await qbRequest<{ Payment: QBPayment }>(
    accessToken,
    realmId,
    "payment",
    "POST",
    payment
  );
  return response.Payment;
}

export async function getPayments(
  accessToken: string,
  realmId: string,
  options?: {
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<QBPayment[]> {
  let query = "SELECT * FROM Payment";
  const conditions: string[] = [];

  if (options?.customerId) {
    // Validate customerId is a valid QuickBooks ID (numeric)
    if (!isValidQBId(options.customerId)) {
      throw new Error("Invalid customer ID format");
    }
    conditions.push(`CustomerRef = '${options.customerId}'`);
  }
  if (options?.startDate) {
    // Validate date format
    if (!isValidDate(options.startDate)) {
      throw new Error("Invalid start date format (expected YYYY-MM-DD)");
    }
    conditions.push(`TxnDate >= '${options.startDate}'`);
  }
  if (options?.endDate) {
    // Validate date format
    if (!isValidDate(options.endDate)) {
      throw new Error("Invalid end date format (expected YYYY-MM-DD)");
    }
    conditions.push(`TxnDate <= '${options.endDate}'`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += " MAXRESULTS 1000";

  const response = await qbRequest<{ QueryResponse: { Payment?: QBPayment[] } }>(
    accessToken,
    realmId,
    `query?query=${encodeURIComponent(query)}`
  );
  return response.QueryResponse.Payment || [];
}

// ============= Account Operations =============

export interface QBAccount {
  Id: string;
  Name: string;
  AccountType: string;
  AccountSubType?: string;
  CurrentBalance?: number;
}

export async function getAccounts(
  accessToken: string,
  realmId: string
): Promise<QBAccount[]> {
  const response = await qbRequest<{ QueryResponse: { Account?: QBAccount[] } }>(
    accessToken,
    realmId,
    "query?query=SELECT * FROM Account MAXRESULTS 1000"
  );
  return response.QueryResponse.Account || [];
}

// ============= Service/Item Operations =============

export interface QBItem {
  Id?: string;
  Name: string;
  Description?: string;
  UnitPrice?: number;
  Type: "Service" | "Inventory" | "NonInventory";
  IncomeAccountRef?: { value: string; name?: string };
}

export async function getItems(
  accessToken: string,
  realmId: string
): Promise<QBItem[]> {
  const response = await qbRequest<{ QueryResponse: { Item?: QBItem[] } }>(
    accessToken,
    realmId,
    "query?query=SELECT * FROM Item WHERE Type = 'Service' MAXRESULTS 1000"
  );
  return response.QueryResponse.Item || [];
}

export async function createServiceItem(
  accessToken: string,
  realmId: string,
  item: Omit<QBItem, "Id" | "Type">
): Promise<QBItem> {
  const response = await qbRequest<{ Item: QBItem }>(
    accessToken,
    realmId,
    "item",
    "POST",
    { ...item, Type: "Service" }
  );
  return response.Item;
}

// ============= Company Info =============

export interface QBCompanyInfo {
  CompanyName: string;
  LegalName?: string;
  CompanyAddr?: {
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
  PrimaryPhone?: { FreeFormNumber: string };
  Email?: { Address: string };
  FiscalYearStartMonth?: string;
}

export async function getCompanyInfo(
  accessToken: string,
  realmId: string
): Promise<QBCompanyInfo> {
  const response = await qbRequest<{ CompanyInfo: QBCompanyInfo }>(
    accessToken,
    realmId,
    `companyinfo/${realmId}`
  );
  return response.CompanyInfo;
}

// ============= Sync Helpers =============

/**
 * Sync a DiscoverEase invoice to QuickBooks
 */
export async function syncInvoiceToQuickBooks(
  accessToken: string,
  realmId: string,
  invoiceData: {
    clientEmail: string;
    clientName: string;
    companyName?: string;
    lineItems: Array<{
      description: string;
      amount: number;
      quantity?: number;
      rate?: number;
    }>;
    dueDate?: string;
    invoiceNumber?: string;
    notes?: string;
  }
): Promise<{ qbInvoiceId: string; qbCustomerId: string }> {
  // Find or create customer
  const customer = await findOrCreateCustomer(
    accessToken,
    realmId,
    invoiceData.clientEmail,
    invoiceData.clientName,
    invoiceData.companyName
  );

  // Create invoice lines
  const lines: QBInvoiceLine[] = invoiceData.lineItems.map((item) => ({
    Amount: item.amount,
    Description: item.description,
    DetailType: "SalesItemLineDetail" as const,
    SalesItemLineDetail: {
      Qty: item.quantity || 1,
      UnitPrice: item.rate || item.amount,
    },
  }));

  // Create the invoice
  const invoice = await createInvoice(accessToken, realmId, {
    CustomerRef: { value: customer.Id!, name: customer.DisplayName },
    Line: lines,
    DueDate: invoiceData.dueDate,
    BillEmail: { Address: invoiceData.clientEmail },
    PrivateNote: invoiceData.notes,
  });

  return {
    qbInvoiceId: invoice.Id!,
    qbCustomerId: customer.Id!,
  };
}

/**
 * Record a payment in QuickBooks
 */
export async function syncPaymentToQuickBooks(
  accessToken: string,
  realmId: string,
  paymentData: {
    qbCustomerId: string;
    qbInvoiceId?: string;
    amount: number;
    date?: string;
    paymentMethod?: string;
  }
): Promise<{ qbPaymentId: string }> {
  // Validate IDs
  if (!isValidQBId(paymentData.qbCustomerId)) {
    throw new Error("Invalid QuickBooks customer ID format");
  }
  if (paymentData.qbInvoiceId && !isValidQBId(paymentData.qbInvoiceId)) {
    throw new Error("Invalid QuickBooks invoice ID format");
  }

  const payment: Omit<QBPayment, "Id"> = {
    CustomerRef: { value: paymentData.qbCustomerId },
    TotalAmt: paymentData.amount,
    TxnDate: paymentData.date || new Date().toISOString().split("T")[0],
  };

  if (paymentData.qbInvoiceId) {
    payment.Line = [
      {
        Amount: paymentData.amount,
        LinkedTxn: [{ TxnId: paymentData.qbInvoiceId, TxnType: "Invoice" }],
      },
    ];
  }

  const result = await recordPayment(accessToken, realmId, payment);

  return { qbPaymentId: result.Id! };
}
