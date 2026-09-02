import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCurrentBusiness } from "@/lib/current-user";
import { resolveRange } from "@/lib/date-range";
import { paymentStatusLabel } from "@/lib/labels";

function csvEscape(value: string | number) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Belum login." }, { status: 401 });
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "Business tidak ditemukan." }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("period") ?? "month";
  const { from, to } = resolveRange(periodParam);

  const sales = await prisma.sale.findMany({
    where: { businessId: business.id, date: { gte: from, lte: to } },
    include: { items: { include: { product: true } }, customer: true, channel: true },
    orderBy: { date: "asc" },
  });

  const rows = [
    ["Tanggal", "Pelanggan", "Produk", "Jumlah", "Total", "Channel", "Status Pembayaran"],
    ...sales.flatMap((s) =>
      s.items.map((i) => [
        s.date.toISOString().slice(0, 10),
        s.customer?.name ?? "Tanpa nama",
        i.product.name,
        String(i.quantity),
        String(s.total),
        s.channel?.name ?? "-",
        paymentStatusLabel(s.paymentStatus),
      ])
    ),
  ];

  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gerabah-report-${periodParam}.csv"`,
    },
  });
}
