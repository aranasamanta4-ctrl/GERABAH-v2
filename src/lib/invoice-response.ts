import { buildInvoicePdf, type InvoiceData } from "@/lib/invoice-pdf";

export async function invoicePdfResponse(data: InvoiceData, download: boolean) {
  const bytes = await buildInvoicePdf(data);
  const filename = `${data.kind.replace(/\s+/g, "-")}-${data.number.replace(/\//g, "-")}.pdf`;

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      // inline lets the phone open it in its PDF viewer, where sharing to WhatsApp is one tap
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
