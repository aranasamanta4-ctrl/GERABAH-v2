import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSessionContext } from "@/lib/current-user";
import { resolveRange } from "@/lib/date-range";
import { paymentStatusLabel } from "@/lib/labels";
import { buildXlsxBuffer } from "@/lib/xlsx-export";

type ExportRow = {
  date: Date;
  customer: string;
  product: string;
  quantity: number;
  total: number;
  channel: string;
  status: string;
};

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Belum login." }, { status: 401 });
  const ctx = await getSessionContext();
  if (!ctx?.business) return NextResponse.json({ error: "Business tidak ditemukan." }, { status: 404 });
  if (ctx.role !== "owner") return NextResponse.json({ error: "Hanya owner." }, { status: 403 });
  const business = ctx.business;

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("period") ?? "month";
  const { from, to } = resolveRange(periodParam, searchParams.get("from") ?? undefined, searchParams.get("to") ?? undefined);

  const sales = await prisma.sale.findMany({
    where: { businessId: business.id, date: { gte: from, lte: to } },
    include: { items: { include: { product: true } }, customer: true, channel: true },
    orderBy: { date: "asc" },
  });

  const rows: ExportRow[] = sales.flatMap((s) =>
    s.items.map((i) => ({
      date: s.date,
      customer: s.customer?.name ?? "Tanpa nama",
      product: i.product.name,
      quantity: i.quantity,
      total: s.total,
      channel: s.channel?.name ?? "-",
      status: paymentStatusLabel(s.paymentStatus),
    }))
  );

  const buffer = await buildXlsxBuffer(rows, [
    { header: "Tanggal", get: (r) => r.date, width: 14 },
    { header: "Pelanggan", get: (r) => r.customer, width: 22 },
    { header: "Produk", get: (r) => r.product, width: 24 },
    { header: "Jumlah", get: (r) => r.quantity, width: 10 },
    { header: "Total", get: (r) => r.total, width: 16 },
    { header: "Channel", get: (r) => r.channel, width: 16 },
    { header: "Status Pembayaran", get: (r) => r.status, width: 18 },
  ]);

  const filenameSuffix =
    periodParam === "custom"
      ? `${searchParams.get("from") ?? ""}_${searchParams.get("to") ?? ""}`
      : periodParam;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="gerabah-laporan-${filenameSuffix}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
