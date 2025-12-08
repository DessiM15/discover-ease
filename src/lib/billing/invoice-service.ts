import { createClient } from "@/lib/supabase/server";
import { sendEmail, emailTemplates } from "@/lib/email/sendgrid";
import { createInvoicePaymentLink, createInvoicePaymentSession } from "@/lib/stripe/payments";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  firmId: string;
  caseId?: string;
  contactId?: string;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  balance: number;
  terms?: string;
  notes?: string;
  status: string;
  firm?: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  contact?: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  case?: {
    name: string;
    caseNumber: string;
  };
  timeEntries?: Array<{
    id: string;
    date: string;
    description: string;
    hours: number;
    rate: number;
    amount: number;
    userName?: string;
  }>;
  expenses?: Array<{
    id: string;
    date: string;
    description: string;
    category?: string;
    amount: number;
  }>;
}

// Get full invoice data
export async function getInvoiceData(invoiceId: string): Promise<InvoiceData | null> {
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select(`
      *,
      firms(name, email, phone, address, city, state, zip_code),
      contacts(first_name, last_name, company_name, email, address, city, state, zip_code),
      cases(name, case_number)
    `)
    .eq("id", invoiceId)
    .single();

  if (!invoice) return null;

  // Get time entries for this invoice
  const { data: timeEntries } = await supabase
    .from("time_entries")
    .select("*, users(first_name, last_name)")
    .eq("invoice_id", invoiceId);

  // Get expenses for this invoice
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("invoice_id", invoiceId);

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    firmId: invoice.firm_id,
    caseId: invoice.case_id,
    contactId: invoice.contact_id,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    subtotal: Number(invoice.subtotal),
    tax: Number(invoice.tax || 0),
    discount: Number(invoice.discount || 0),
    total: Number(invoice.total),
    balance: Number(invoice.balance),
    terms: invoice.terms,
    notes: invoice.notes,
    status: invoice.status,
    firm: invoice.firms
      ? {
          name: invoice.firms.name,
          email: invoice.firms.email,
          phone: invoice.firms.phone,
          address: invoice.firms.address,
          city: invoice.firms.city,
          state: invoice.firms.state,
          zipCode: invoice.firms.zip_code,
        }
      : undefined,
    contact: invoice.contacts
      ? {
          firstName: invoice.contacts.first_name,
          lastName: invoice.contacts.last_name,
          companyName: invoice.contacts.company_name,
          email: invoice.contacts.email,
          address: invoice.contacts.address,
          city: invoice.contacts.city,
          state: invoice.contacts.state,
          zipCode: invoice.contacts.zip_code,
        }
      : undefined,
    case: invoice.cases
      ? {
          name: invoice.cases.name,
          caseNumber: invoice.cases.case_number,
        }
      : undefined,
    timeEntries: (timeEntries || []).map((te) => ({
      id: te.id,
      date: te.date,
      description: te.description,
      hours: Number(te.hours),
      rate: Number(te.rate),
      amount: Number(te.amount),
      userName: te.users
        ? `${te.users.first_name} ${te.users.last_name}`
        : undefined,
    })),
    expenses: (expenses || []).map((e) => ({
      id: e.id,
      date: e.date,
      description: e.description,
      category: e.category,
      amount: Number(e.amount),
    })),
  };
}

// Generate invoice HTML for PDF/email
export function generateInvoiceHtml(invoice: InvoiceData): string {
  const clientName = invoice.contact
    ? invoice.contact.companyName ||
      `${invoice.contact.firstName || ""} ${invoice.contact.lastName || ""}`.trim()
    : "Client";

  const clientAddress = invoice.contact
    ? [
        invoice.contact.address,
        [invoice.contact.city, invoice.contact.state, invoice.contact.zipCode]
          .filter(Boolean)
          .join(", "),
      ]
        .filter(Boolean)
        .join("<br>")
    : "";

  const firmAddress = invoice.firm
    ? [
        invoice.firm.address,
        [invoice.firm.city, invoice.firm.state, invoice.firm.zipCode]
          .filter(Boolean)
          .join(", "),
      ]
        .filter(Boolean)
        .join("<br>")
    : "";

  const timeEntriesHtml = invoice.timeEntries?.length
    ? `
      <h3 style="margin-top: 30px; margin-bottom: 15px; color: #333;">Time Entries</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Date</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Description</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Attorney</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Hours</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Rate</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.timeEntries
            .map(
              (te) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(te.date).toLocaleDateString()}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${te.description}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${te.userName || "-"}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${te.hours.toFixed(2)}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${te.rate.toFixed(2)}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${te.amount.toFixed(2)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `
    : "";

  const expensesHtml = invoice.expenses?.length
    ? `
      <h3 style="margin-top: 30px; margin-bottom: 15px; color: #333;">Expenses</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Date</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Description</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Category</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.expenses
            .map(
              (e) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(e.date).toLocaleDateString()}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${e.description}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${e.category || "-"}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${e.amount.toFixed(2)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div>
            <h1 style="color: #f59e0b; margin: 0;">INVOICE</h1>
            <p style="color: #666; margin-top: 5px;">#${invoice.invoiceNumber}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; color: #333;">${invoice.firm?.name || "Law Firm"}</h2>
            <p style="color: #666; margin: 5px 0;">${firmAddress}</p>
            ${invoice.firm?.phone ? `<p style="color: #666; margin: 0;">${invoice.firm.phone}</p>` : ""}
            ${invoice.firm?.email ? `<p style="color: #666; margin: 0;">${invoice.firm.email}</p>` : ""}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h3 style="margin: 0 0 10px 0; color: #666;">Bill To:</h3>
            <p style="margin: 0; font-weight: bold;">${clientName}</p>
            <p style="margin: 5px 0; color: #666;">${clientAddress}</p>
            ${invoice.contact?.email ? `<p style="margin: 0; color: #666;">${invoice.contact.email}</p>` : ""}
          </div>
          <div style="text-align: right;">
            <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
            ${invoice.dueDate ? `<p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>` : ""}
            ${invoice.case ? `<p><strong>Case:</strong> ${invoice.case.name} (${invoice.case.caseNumber})</p>` : ""}
          </div>
        </div>

        ${timeEntriesHtml}
        ${expensesHtml}

        <div style="margin-top: 30px; border-top: 2px solid #333; padding-top: 20px;">
          <table style="width: 300px; margin-left: auto;">
            <tr>
              <td style="padding: 8px 0;">Subtotal:</td>
              <td style="padding: 8px 0; text-align: right;">$${invoice.subtotal.toFixed(2)}</td>
            </tr>
            ${
              invoice.discount > 0
                ? `
            <tr>
              <td style="padding: 8px 0;">Discount:</td>
              <td style="padding: 8px 0; text-align: right; color: #22c55e;">-$${invoice.discount.toFixed(2)}</td>
            </tr>
            `
                : ""
            }
            ${
              invoice.tax > 0
                ? `
            <tr>
              <td style="padding: 8px 0;">Tax:</td>
              <td style="padding: 8px 0; text-align: right;">$${invoice.tax.toFixed(2)}</td>
            </tr>
            `
                : ""
            }
            <tr style="font-size: 18px; font-weight: bold;">
              <td style="padding: 12px 0; border-top: 2px solid #ddd;">Total:</td>
              <td style="padding: 12px 0; border-top: 2px solid #ddd; text-align: right;">$${invoice.total.toFixed(2)}</td>
            </tr>
            <tr style="font-size: 18px; font-weight: bold; color: #f59e0b;">
              <td style="padding: 8px 0;">Amount Due:</td>
              <td style="padding: 8px 0; text-align: right;">$${invoice.balance.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        ${
          invoice.terms
            ? `
        <div style="margin-top: 30px;">
          <h3 style="margin-bottom: 10px; color: #666;">Terms</h3>
          <p style="color: #666;">${invoice.terms}</p>
        </div>
        `
            : ""
        }

        ${
          invoice.notes
            ? `
        <div style="margin-top: 20px;">
          <h3 style="margin-bottom: 10px; color: #666;">Notes</h3>
          <p style="color: #666;">${invoice.notes}</p>
        </div>
        `
            : ""
        }
      </body>
    </html>
  `;
}

// Send invoice to client
export async function sendInvoice(
  invoiceId: string,
  options: {
    includePaymentLink?: boolean;
    sendCopy?: boolean;
    customMessage?: string;
  } = {}
): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
  const supabase = await createClient();
  const invoice = await getInvoiceData(invoiceId);

  if (!invoice) {
    return { success: false, error: "Invoice not found" };
  }

  if (!invoice.contact?.email) {
    return { success: false, error: "Client email not found" };
  }

  // Generate payment link if requested
  let paymentUrl: string | undefined;
  if (options.includePaymentLink && invoice.balance > 0) {
    try {
      const { url } = await createInvoicePaymentLink({
        invoiceId: invoice.id,
        firmId: invoice.firmId,
        amount: invoice.balance,
        invoiceNumber: invoice.invoiceNumber,
        caseName: invoice.case?.name,
      });
      paymentUrl = url;

      // Update invoice with payment link
      await supabase
        .from("invoices")
        .update({ payment_link: paymentUrl })
        .eq("id", invoiceId);
    } catch (error) {
      console.error("Error creating payment link:", error);
    }
  }

  // Build email content
  const clientName =
    invoice.contact.companyName ||
    `${invoice.contact.firstName || ""} ${invoice.contact.lastName || ""}`.trim() ||
    "Client";

  const emailTemplate = emailTemplates.invoice({
    clientName,
    firmName: invoice.firm?.name || "Your Law Firm",
    invoiceNumber: invoice.invoiceNumber,
    amount: `$${invoice.balance.toFixed(2)}`,
    dueDate: invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString()
      : "Upon Receipt",
    paymentUrl: paymentUrl || `${APP_URL}/pay/${invoiceId}`,
    caseName: invoice.case?.name,
  });

  // Add custom message if provided
  let htmlContent = emailTemplate.html;
  if (options.customMessage) {
    htmlContent = htmlContent.replace(
      "</div>\n            <div class=\"content\">",
      `</div>\n            <div class="content"><p style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">${options.customMessage}</p>`
    );
  }

  // Send to client
  const result = await sendEmail({
    to: invoice.contact.email,
    subject: emailTemplate.subject,
    html: htmlContent,
    text: emailTemplate.text,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Send copy to firm if requested
  if (options.sendCopy && invoice.firm?.email) {
    await sendEmail({
      to: invoice.firm.email,
      subject: `[Copy] ${emailTemplate.subject}`,
      html: htmlContent,
      text: emailTemplate.text,
    });
  }

  // Update invoice status
  await supabase
    .from("invoices")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  return { success: true, paymentUrl };
}

// Record payment on invoice
export async function recordPayment(
  invoiceId: string,
  payment: {
    amount: number;
    method: string;
    reference?: string;
    notes?: string;
    receivedDate?: string;
  }
): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  const supabase = await createClient();

  // Get invoice
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (!invoice) {
    return { success: false, error: "Invoice not found" };
  }

  const currentAmountPaid = Number(invoice.amount_paid || 0);
  const newAmountPaid = currentAmountPaid + payment.amount;
  const newBalance = Number(invoice.total) - newAmountPaid;
  const isPaidInFull = newBalance <= 0;

  // Create payment record
  const { data: paymentRecord, error: paymentError } = await supabase
    .from("payments")
    .insert({
      firm_id: invoice.firm_id,
      invoice_id: invoiceId,
      contact_id: invoice.contact_id,
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
      notes: payment.notes,
      received_date: payment.receivedDate || new Date().toISOString(),
    })
    .select()
    .single();

  if (paymentError) {
    return { success: false, error: paymentError.message };
  }

  // Update invoice
  await supabase
    .from("invoices")
    .update({
      status: isPaidInFull ? "paid" : "partial",
      amount_paid: newAmountPaid,
      balance: Math.max(0, newBalance),
      paid_at: isPaidInFull ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  return { success: true, paymentId: paymentRecord.id };
}

// Get invoice stats for a firm
export async function getInvoiceStats(firmId: string): Promise<{
  totalOutstanding: number;
  totalOverdue: number;
  totalPaidThisMonth: number;
  averageDaysToPayment: number;
}> {
  const supabase = await createClient();

  // Outstanding balance
  const { data: outstanding } = await supabase
    .from("invoices")
    .select("balance")
    .eq("firm_id", firmId)
    .in("status", ["sent", "partial", "overdue"]);

  const totalOutstanding = (outstanding || []).reduce(
    (sum, inv) => sum + Number(inv.balance || 0),
    0
  );

  // Overdue balance
  const { data: overdue } = await supabase
    .from("invoices")
    .select("balance")
    .eq("firm_id", firmId)
    .eq("status", "overdue");

  const totalOverdue = (overdue || []).reduce(
    (sum, inv) => sum + Number(inv.balance || 0),
    0
  );

  // Paid this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: paidThisMonth } = await supabase
    .from("payments")
    .select("amount")
    .eq("firm_id", firmId)
    .gte("received_date", startOfMonth.toISOString());

  const totalPaidThisMonth = (paidThisMonth || []).reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  // Average days to payment (last 90 days)
  const { data: paidInvoices } = await supabase
    .from("invoices")
    .select("sent_at, paid_at")
    .eq("firm_id", firmId)
    .eq("status", "paid")
    .not("sent_at", "is", null)
    .not("paid_at", "is", null)
    .gte("paid_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  let averageDaysToPayment = 0;
  if (paidInvoices && paidInvoices.length > 0) {
    const totalDays = paidInvoices.reduce((sum, inv) => {
      const sentDate = new Date(inv.sent_at!);
      const paidDate = new Date(inv.paid_at!);
      return sum + Math.ceil((paidDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    averageDaysToPayment = Math.round(totalDays / paidInvoices.length);
  }

  return {
    totalOutstanding,
    totalOverdue,
    totalPaidThisMonth,
    averageDaysToPayment,
  };
}
