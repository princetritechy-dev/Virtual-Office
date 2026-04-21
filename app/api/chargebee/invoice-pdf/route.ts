import { NextRequest, NextResponse } from "next/server";
import Chargebee from "chargebee";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const chargebee = new Chargebee({
  site: process.env.CHARGEBEE_SITE as string,
  apiKey: process.env.CHARGEBEE_API_KEY as string,
});

function formatDate(timestamp?: number | null) {
  if (!timestamp) return "-";
  return new Date(timestamp * 1000).toLocaleDateString("en-GB");
}

function formatAmount(amount?: number | null, currency = "GBP") {
  const value = (amount || 0) / 100;

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const invoiceId = searchParams.get("invoice_id")?.trim();
    const type = searchParams.get("type")?.trim() || "view";
    const emailFromQuery = searchParams.get("email")?.trim() || "";

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, message: "Invoice ID is required." },
        { status: 400 }
      );
    }

    const result = await chargebee.invoice.retrieve(invoiceId);
    const invoice: any = result?.invoice || {};

    if (!invoice?.id) {
      return NextResponse.json(
        { success: false, message: "Invoice not found." },
        { status: 404 }
      );
    }

    let customerEmail = invoice?.customer_email || emailFromQuery || "";

    if (!customerEmail && invoice?.customer_id) {
      try {
        const customerResult = await chargebee.customer.retrieve(invoice.customer_id);
        const customer: any = customerResult?.customer || {};
        customerEmail = customer?.email || "";
      } catch (err) {
        console.error("Failed to retrieve customer email:", err);
      }
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const navy = rgb(0.09, 0.17, 0.35);
    const teal = rgb(0.0, 0.56, 0.62);
    const lightGray = rgb(0.95, 0.96, 0.98);
    const midGray = rgb(0.45, 0.49, 0.55);
    const dark = rgb(0.15, 0.18, 0.23);

    page.drawRectangle({
      x: 0,
      y: height - 120,
      width,
      height: 120,
      color: navy,
    });

    page.drawText("VIRTUAL", {
      x: 50,
      y: height - 55,
      size: 26,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText("OFFICE ANYWHERE", {
      x: 52,
      y: height - 78,
      size: 12,
      font: fontRegular,
      color: rgb(0.8, 0.95, 0.95),
    });

    page.drawText("INVOICE", {
      x: width - 170,
      y: height - 58,
      size: 28,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(`Invoice ID: ${invoice?.id || "-"}`, {
      x: width - 170,
      y: height - 82,
      size: 11,
      font: fontRegular,
      color: rgb(0.9, 0.93, 0.97),
    });

    page.drawRectangle({
      x: 40,
      y: height - 240,
      width: width - 80,
      height: 90,
      color: lightGray,
      borderColor: rgb(0.87, 0.89, 0.92),
      borderWidth: 1,
    });

    page.drawText("Customer", {
      x: 55,
      y: height - 175,
      size: 11,
      font: fontBold,
      color: teal,
    });

    page.drawText(invoice?.customer_id || "-", {
      x: 55,
      y: height - 195,
      size: 12,
      font: fontRegular,
      color: dark,
    });

    page.drawText("Email", {
      x: 300,
      y: height - 175,
      size: 11,
      font: fontBold,
      color: teal,
    });

    page.drawText(customerEmail || "-", {
      x: 300,
      y: height - 195,
      size: 12,
      font: fontRegular,
      color: dark,
    });

    page.drawText("Invoice Date", {
      x: 55,
      y: height - 220,
      size: 11,
      font: fontBold,
      color: teal,
    });

    page.drawText(formatDate(invoice?.date), {
      x: 140,
      y: height - 220,
      size: 11,
      font: fontRegular,
      color: dark,
    });

    page.drawText("Status", {
      x: 300,
      y: height - 220,
      size: 11,
      font: fontBold,
      color: teal,
    });

    page.drawText(invoice?.status || "-", {
      x: 345,
      y: height - 220,
      size: 11,
      font: fontRegular,
      color: dark,
    });

    const tableTop = height - 320;
    const col1 = 55;
    const col2 = 310;
    const col3 = 470;

    page.drawRectangle({
      x: 40,
      y: tableTop,
      width: width - 80,
      height: 30,
      color: navy,
    });

    page.drawText("Description", {
      x: col1,
      y: tableTop + 10,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText("Qty", {
      x: col2,
      y: tableTop + 10,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText("Amount", {
      x: col3,
      y: tableTop + 10,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    const lines = Array.isArray(invoice?.line_items) ? invoice.line_items : [];
    const safeLines =
      lines.length > 0
        ? lines
        : [
            {
              description: invoice?.subscription_id
                ? `Subscription ${invoice.subscription_id}`
                : "Subscription Charge",
              quantity: 1,
              amount: invoice?.total || 0,
            },
          ];

    let currentY = tableTop - 34;

    safeLines.forEach((item: any, index: number) => {
      page.drawRectangle({
        x: 40,
        y: currentY - 8,
        width: width - 80,
        height: 28,
        color: index % 2 === 0 ? rgb(0.985, 0.988, 0.992) : rgb(1, 1, 1),
        borderColor: rgb(0.9, 0.92, 0.95),
        borderWidth: 0.5,
      });

      page.drawText(item?.description || "Item", {
        x: col1,
        y: currentY,
        size: 10.5,
        font: fontRegular,
        color: dark,
      });

      page.drawText(String(item?.quantity || 1), {
        x: col2,
        y: currentY,
        size: 10.5,
        font: fontRegular,
        color: dark,
      });

      page.drawText(
        formatAmount(
          item?.amount ?? item?.unit_amount ?? invoice?.total,
          invoice?.currency_code || "GBP"
        ),
        {
          x: col3,
          y: currentY,
          size: 10.5,
          font: fontRegular,
          color: dark,
        }
      );

      currentY -= 30;
    });

    const summaryY = currentY - 35;

    page.drawRectangle({
      x: width - 240,
      y: summaryY,
      width: 185,
      height: 95,
      color: lightGray,
      borderColor: rgb(0.87, 0.89, 0.92),
      borderWidth: 1,
    });

    page.drawText("Subtotal", {
      x: width - 225,
      y: summaryY + 65,
      size: 11,
      font: fontRegular,
      color: dark,
    });

    page.drawText(
      formatAmount(invoice?.sub_total ?? invoice?.total, invoice?.currency_code || "GBP"),
      {
        x: width - 120,
        y: summaryY + 65,
        size: 11,
        font: fontRegular,
        color: dark,
      }
    );

    page.drawText("Tax", {
      x: width - 225,
      y: summaryY + 42,
      size: 11,
      font: fontRegular,
      color: dark,
    });

    page.drawText(formatAmount(invoice?.tax || 0, invoice?.currency_code || "GBP"), {
      x: width - 120,
      y: summaryY + 42,
      size: 11,
      font: fontRegular,
      color: dark,
    });

    page.drawText("Total", {
      x: width - 225,
      y: summaryY + 17,
      size: 12,
      font: fontBold,
      color: navy,
    });

    page.drawText(formatAmount(invoice?.total || 0, invoice?.currency_code || "GBP"), {
      x: width - 120,
      y: summaryY + 17,
      size: 12,
      font: fontBold,
      color: navy,
    });

    page.drawLine({
      start: { x: 40, y: 70 },
      end: { x: width - 40, y: 70 },
      thickness: 1,
      color: rgb(0.88, 0.9, 0.93),
    });

    page.drawText("Thank you for your business.", {
      x: 40,
      y: 48,
      size: 11,
      font: fontRegular,
      color: midGray,
    });

    page.drawText("Virtual Office Anywhere", {
      x: width - 170,
      y: 48,
      size: 11,
      font: fontBold,
      color: teal,
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          type === "download"
            ? `attachment; filename="invoice-${invoice.id}.pdf"`
            : `inline; filename="invoice-${invoice.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Invoice PDF error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to generate invoice PDF.",
      },
      { status: 500 }
    );
  }
}