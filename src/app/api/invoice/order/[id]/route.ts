import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { invoiceNumber } from "@/lib/format";
import { paymentStatusLabel } from "@/lib/labels";
import { invoicePdfResponse } from "@/lib/invoice-response";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await getCurrentBusiness();
  if (!business) return new Response("Belum login.", { status: 401 });

  const order = await prisma.order.findFirst({
    where: { id, businessId: business.id },
    include: {
      customer: true,
      channel: true,
      items: { include: { product: true } },
    },
  });
  if (!order) return new Response("Pesanan tidak ditemukan.", { status: 404 });

  const owner = await prisma.user.findUnique({ where: { id: business.ownerId } });
  const download = new URL(request.url).searchParams.get("download") === "1";

  const items = order.items.map((i) => ({
    name: i.product.name,
    quantity: i.quantity,
    unitPrice: i.price,
    lineTotal: i.quantity * i.price - i.discount,
  }));
  const subtotal = order.items.reduce((s, i) => s + i.quantity * i.price, 0);
  const discount = order.items.reduce((s, i) => s + i.discount, 0);

  return invoicePdfResponse(
    {
      kind: "Nota Pesanan",
      number: invoiceNumber("ORD", order.id, order.date),
      date: order.date,
      dueDate: order.dueDate,
      business: {
        name: business.name,
        location: business.location,
        ownerName: owner?.name ?? null,
        phone: owner?.phone ?? null,
      },
      customer: {
        name: order.customer?.name ?? "Pelanggan umum",
        phone: order.customer?.phone,
        address: order.customer?.address,
      },
      items,
      subtotal,
      discount,
      total: order.total,
      paid: order.downPayment,
      outstanding: order.remainingPayment,
      statusLabel: paymentStatusLabel(order.paymentStatus),
      paidInFull: order.remainingPayment <= 0,
      channel: order.channel?.name,
      notes: order.notes,
    },
    download
  );
}
