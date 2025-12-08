import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendInvoice } from "@/lib/billing/invoice-service";

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, includePaymentLink, sendCopy, customMessage } =
      await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this invoice
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's firm
    const { data: dbUser } = await supabase
      .from("users")
      .select("firm_id")
      .eq("id", user.id)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check invoice belongs to user's firm
    const { data: invoice } = await supabase
      .from("invoices")
      .select("firm_id")
      .eq("id", invoiceId)
      .eq("firm_id", dbUser.firm_id)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Send the invoice
    const result = await sendInvoice(invoiceId, {
      includePaymentLink: includePaymentLink ?? true,
      sendCopy: sendCopy ?? false,
      customMessage,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      paymentUrl: result.paymentUrl,
    });
  } catch (error) {
    console.error("Error sending invoice:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send invoice" },
      { status: 500 }
    );
  }
}
