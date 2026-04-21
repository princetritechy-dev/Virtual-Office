import { NextRequest, NextResponse } from "next/server";
import Chargebee from "chargebee";

const chargebee = new Chargebee({
  site: process.env.CHARGEBEE_SITE as string,
  apiKey: process.env.CHARGEBEE_API_KEY as string,
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }

    // Find all customers matching this email
    const customerResult = await chargebee.customer.list({
      limit: 100,
      email: { is: email },
    });

    const customerList = Array.isArray(customerResult?.list)
      ? customerResult.list
      : [];

    if (customerList.length === 0) {
      return NextResponse.json({ success: true, invoices: [] });
    }

    // Aggregate invoices across all matching customers
    const allInvoices: any[] = [];

    for (const customerEntry of customerList) {
      const customer = customerEntry?.customer;
      const customerId = customer?.id;

      if (!customerId) continue;

      const invoiceResult = await chargebee.invoice.list({
        limit: 100,
        customer_id: { is: customerId },
        "sort_by[asc]": "date",
      });

      const invoiceList = Array.isArray(invoiceResult?.list)
        ? invoiceResult.list
        : [];

      for (const entry of invoiceList) {
        const inv = entry?.invoice || {};

        // Extract line item descriptions
        const lineItems = Array.isArray(inv?.line_items)
          ? inv.line_items.map((li: any) => ({
              description: li.description || "",
              amount: li.amount || 0,
              quantity: li.quantity || 1,
            }))
          : [];

        const description =
          lineItems.length > 0
            ? lineItems.map((li: any) => li.description).filter(Boolean).join(", ")
            : inv?.subscription_id
              ? `Subscription ${inv.subscription_id}`
              : "Invoice charge";

        allInvoices.push({
          id: inv.id || "",
          subscription_id: inv.subscription_id || "",
          customer_id: inv.customer_id || customerId,
          customer_email: customer?.email || email,
          status: inv.status || "unknown",
          amount_due: inv.amount_due || inv.total || 0,
          amount_paid: inv.amount_paid || 0,
          total: inv.total || 0,
          sub_total: inv.sub_total || 0,
          tax: inv.tax || 0,
          credits_applied: inv.credits_applied || 0,
          currency_code: inv.currency_code || "GBP",
          date: inv.date || null,
          due_date: inv.due_date || null,
          paid_at: inv.paid_at || null,
          dunning_status: inv.dunning_status || null,
          description,
          line_items: lineItems,
        });
      }
    }

    // Sort newest first
    allInvoices.sort((a, b) => (b.date || 0) - (a.date || 0));

    return NextResponse.json({ success: true, invoices: allInvoices });
  } catch (error: any) {
    console.error("Chargebee invoices fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch invoices.",
      },
      { status: 500 }
    );
  }
}
