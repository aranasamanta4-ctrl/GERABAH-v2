import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { invoiceNumber } from "@/lib/format";
import { paymentStatusLabel } from "@/lib/labels";
import { invoicePdfResponse } from "@/lib/invoice-response";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await getCurrentBusiness();
  if (!business) return new Response("Belum login.", { status: 401 });

  const sale = await prisma.sale.findFirst({
    where: { id, businessId: business.id },
    include: {
      customer: true,
      channel: true,
      paymentMethod: true,
      items: { include: { product: true } },
    },
  });
  if (!sale) return new Response("Penjualan tidak ditemukan.", { status: 404 });

  const owner = await prisma.user.findUnique({ where: { id: business.ownerId } });
  const download = new URL(request.url).searchParams.get("download") === "1";

  return invoicePdfResponse(
    {
      kind: "Invoice",
      number: invoiceNumber("INV", sale.id, sale.date),
      date: sale.date,
      business: {
        name: business.name,
        location: business.location,
        ownerName: owner?.name ?? null,
        phone: owner?.phone ?? null,
      },
      customer: {
        name: sale.customer?.name ?? "Pelanggan umum",
        phone: sale.customer?.phone,
        address: sale.customer?.address,
      },
      items: sale.items.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
      })),
      subtotal: sale.subtotal,
      discount: sale.discount,
      total: sale.total,
      paid: sale.amountPaid,
      outstanding: sale.outstandingBalance,
      statusLabel: paymentStatusLabel(sale.paymentStatus),
      paidInFull: sale.outstandingBalance <= 0,
      paymentMethod: sale.paymentMethod?.name,
      channel: sale.channel?.name,
      notes: sale.notes,
    },
    download
  );
}
