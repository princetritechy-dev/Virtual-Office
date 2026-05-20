import { NextRequest, NextResponse } from "next/server";
import Chargebee from "chargebee";

const chargebee = new Chargebee({
  site: process.env.CHARGEBEE_SITE as string,
  apiKey: process.env.CHARGEBEE_API_KEY as string,
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoice_id")?.trim();
    const type = searchParams.get("type")?.trim();

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, message: "Invoice ID is required." },
        { status: 400 }
      );
    }

    const result = await chargebee.invoice.retrieve(invoiceId);
    const invoice: any = result?.invoice || {};

    console.log(
      "Invoice link response:",
      JSON.stringify(
        {
          id: invoice?.id,
          hosted_invoice_url: invoice?.hosted_invoice_url,
          view_pdf_url: invoice?.view_pdf_url,
          download_pdf_url: invoice?.download_pdf_url,
          pdf_url: invoice?.pdf_url,
        },
        null,
        2
      )
    );

    const viewUrl =
      String(
        invoice?.view_pdf_url ||
          invoice?.hosted_invoice_url ||
          invoice?.download_pdf_url ||
          invoice?.pdf_url ||
          ""
      );

    const downloadUrl =
      String(
        invoice?.download_pdf_url ||
          invoice?.view_pdf_url ||
          invoice?.pdf_url ||
          invoice?.hosted_invoice_url ||
          ""
      );

    const finalUrl = type === "download" ? downloadUrl : viewUrl;

    if (!finalUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "No invoice URL available from Chargebee for this invoice.",
        },
        { status: 404 }
      );
    }

    return NextResponse.redirect(new URL(finalUrl));
  } catch (error: any) {
    console.error("Chargebee invoice link error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch invoice link.",
      },
      { status: 500 }
    );
  }
}