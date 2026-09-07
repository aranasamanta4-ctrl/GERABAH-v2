import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSessionContext } from "@/lib/current-user";
import { resolveRange } from "@/lib/date-range";
import { paymentStatusLabel } from "@/lib/labels";
import { buildFinancialReportPdf, type CatAmount } from "@/lib/reports-pdf";

const byCat = (map: Map<string, number>): CatAmount[] =>
  [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, amount]) => ({ name, amount }));

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return new Response("Belum login.", { status: 401 });
  const ctx = await getSessionContext();
  if (!ctx?.business) return new Response("Business tidak ditemukan.", { status: 404 });
  if (ctx.role !== "owner") return new Response("Hanya owner yang bisa mengunduh laporan.", { status: 403 });
  const business = ctx.business;

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "month";
  const download = searchParams.get("download") === "1";
  const { from, to, label } = resolveRange(period);

  const [txs, opening, sales, orders, unpaidSales, products, owner] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: { businessId: business.id, date: { gte: from, lte: to } },
      include: { incomeCategory: true, expenseCategory: true },
    }),
    prisma.financialTransaction.findMany({
      where: { businessId: business.id, date: { lt: from } },
      select: { type: true, amount: true },
    }),
    prisma.sale.findMany({
      where: { businessId: business.id, date: { gte: from, lte: to } },
      include: { channel: true },
    }),
    prisma.order.findMany({
      where: { businessId: business.id, remainingPayment: { gt: 0 }, status: { not: "Cancelled" } },
      include: { customer: true },
      orderBy: [{ dueDate: "asc" }, { date: "desc" }],
    }),
    prisma.sale.findMany({
      where: { businessId: business.id, outstandingBalance: { gt: 0 } },
      include: { customer: true },
      orderBy: { date: "desc" },
    }),
    prisma.product.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
    prisma.user.findUnique({ where: { id: business.ownerId } }),
  ]);

  const openingBalance = opening.reduce((s, t) => s + (t.type === "INCOME" ? t.amount : -t.amount), 0);

  const incomeMap = new Map<string, number>();
  const expenseMap = new Map<string, number>();
  for (const t of txs) {
    const m = t.type === "INCOME" ? incomeMap : expenseMap;
    const k = (t.type === "INCOME" ? t.incomeCategory?.name : t.expenseCategory?.name) ?? "Lainnya";
    m.set(k, (m.get(k) ?? 0) + t.amount);
  }
  const totalIncome = [...incomeMap.values()].reduce((a, b) => a + b, 0);
  const totalExpense = [...expenseMap.values()].reduce((a, b) => a + b, 0);
  const netProfit = totalIncome - totalExpense;

  const salesGross = sales.reduce((s, x) => s + x.subtotal, 0);
  const salesDiscount = sales.reduce((s, x) => s + x.discount, 0);
  const salesNet = sales.reduce((s, x) => s + x.total, 0);
  const channelMap = new Map<string, number>();
  for (const s of sales) channelMap.set(s.channel?.name ?? "Tanpa tempat", (channelMap.get(s.channel?.name ?? "Tanpa tempat") ?? 0) + s.total);

  const receivables = [
    ...orders.map((o) => ({
      customer: o.customer?.name ?? "Tanpa nama",
      due: o.dueDate,
      amount: o.remainingPayment,
      status: paymentStatusLabel(o.paymentStatus),
      kind: "Pesanan",
    })),
    ...unpaidSales.map((s) => ({
      customer: s.customer?.name ?? "Tanpa nama",
      due: null as Date | null,
      amount: s.outstandingBalance,
      status: paymentStatusLabel(s.paymentStatus),
      kind: "Penjualan",
    })),
  ];
  const totalReceivable = receivables.reduce((s, r) => s + r.amount, 0);

  const inventory = products.map((p) => ({
    name: p.name,
    stock: p.stock,
    price: p.sellingPrice,
    value: p.stock * p.sellingPrice,
  }));
  const totalInventoryValue = inventory.reduce((s, p) => s + p.value, 0);

  const bytes = await buildFinancialReportPdf({
    businessName: business.name,
    location: business.location,
    ownerName: owner?.name ?? null,
    periodLabel: label,
    printedAt: new Date(),
    incomeByCat: byCat(incomeMap),
    expenseByCat: byCat(expenseMap),
    totalIncome,
    totalExpense,
    netProfit,
    openingBalance,
    closingBalance: openingBalance + netProfit,
    salesCount: sales.length,
    salesGross,
    salesDiscount,
    salesNet,
    salesByChannel: byCat(channelMap),
    receivables,
    totalReceivable,
    inventory,
    totalInventoryValue,
  });

  const filename = `Laporan-Keuangan-${period}.pdf`;
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
