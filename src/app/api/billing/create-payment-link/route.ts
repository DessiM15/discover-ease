import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, amount, description } = await request.json();

    if (!invoiceId || !amount) {
      return NextResponse.json(
        { error: "Invoice ID and amount are required" },
        { status: 400 }
      );
    }

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: description || `Invoice ${invoiceId}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoiceId: invoiceId,
      },
    });

    return NextResponse.json({ paymentUrl: paymentLink.url });
  } catch (error: any) {
    console.error("Error creating payment link:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment link" },
      { status: 500 }
    );
  }
}

