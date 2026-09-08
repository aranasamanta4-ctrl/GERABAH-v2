import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/current-user";
import { resolveRange, previousRange, daysFromNow, cashflowBuckets } from "@/lib/date-range";
import { formatIDR, formatIDRCompact, formatDate } from "@/lib/format";
import { orderStatusLabel } from "@/lib/labels";
import { Card, SectionTitle, Stat, List, Row, EmptyState, Callout, Badge } from "@/components/ui";
import { CashflowChart } from "@/components/cashflow-chart";
import { Segmented } from "@/components/segmented";
import { IconSpark, IconArrowDown, IconArrowUp } from "@/components/icons";

const RANGES = [
  { key: "today", label: "Hari Ini" },
  { key: "week", label: "7 Hari" },
  { key: "month", label: "Bulan Ini" },
  { key: "year", label: "Tahun Ini" },
];

function pctChange(cur: number, prev: number) {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return ((cur - prev) / prev) * 100;
}

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const { range } = await searchParams;
  const activeRange = typeof range === "string" ? range : "month";
  const ctx = await getSessionContext();
  if (!ctx?.business) return null;
  const business = ctx.business;
  const isStaff = ctx.role === "staff";

  const { from, to, label } = resolveRange(activeRange);
  const prev = previousRange(from, to);
  const { buckets, windowLabel } = cashflowBuckets(activeRange);
  const chartFrom = buckets[0].start;

  const [sales, txs, prevTxs, chartTxs, orders, products, staffActivity] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId: business.id, date: { gte: from, lte: to } },
      include: { items: { include: { product: true } }, channel: true },
    }),
    prisma.financialTransaction.findMany({
      where: { businessId: business.id, date: { gte: from, lte: to } },
      orderBy: { date: "desc" },
      include: { incomeCategory: true, expenseCategory: true },
    }),
    prisma.financialTransaction.findMany({
      where: { businessId: business.id, date: { gte: prev.from, lte: prev.to } },
    }),
    prisma.financialTransaction.findMany({
      where: { businessId: business.id, date: { gte: chartFrom, lte: to } },
      select: { type: true, amount: true, date: true },
    }),
    prisma.order.findMany({
      where: { businessId: business.id },
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.product.findMany({ where: { businessId: business.id } }),
    prisma.activityLog.findMany({
      where: { businessId: business.id, role: "staff" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const income = txs.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const prevIncome = prevTxs.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const profit = income - expense;

  const chartData = buckets.map((b) => {
    const inB = chartTxs.filter((t) => t.date >= b.start && t.date < b.end);
    return {
      label: b.label,
      fullLabel: b.fullLabel,
      income: inB.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0),
      expense: inB.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0),
    };
  });
  const chartHasData = chartData.some((b) => b.income > 0 || b.expense > 0);

  const outstandingOrders = orders.filter((o) => o.remainingPayment > 0 && o.status !== "Cancelled");
  const outstandingAmount = outstandingOrders.reduce((s, o) => s + o.remainingPayment, 0);
  const lowStock = products.filter((p) => p.status !== "inactive" && p.stock <= p.minStock);
  const activeOrders = orders.filter((o) => o.status !== "Completed" && o.status !== "Cancelled");

  const productTotals = new Map<string, { units: number; revenue: number }>();
  for (const s of sales)
    for (const it of s.items) {
      const e = productTotals.get(it.product.name) ?? { units: 0, revenue: 0 };
      e.units += it.quantity;
      e.revenue += it.lineTotal;
      productTotals.set(it.product.name, e);
    }
  const topProducts = [...productTotals.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 4);

  const dueSoon = orders.filter(
    (o) => o.dueDate && o.status !== "Completed" && o.status !== "Cancelled" && o.dueDate <= daysFromNow(3)
  );

  const insights: string[] = [];
  if (!isStaff && prevIncome > 0) {
    const d = pctChange(income, prevIncome);
    insights.push(`Uang masuk ${d >= 0 ? "naik" : "turun"} ${Math.abs(d).toFixed(0)}% dari periode sebelumnya.`);
  }
  if (!isStaff && profit < 0) insights.push("Pengeluaran lebih besar dari pemasukan periode ini. Cek biaya produksi.");
  if (topProducts.length > 0) insights.push(`${topProducts[0][0]} paling banyak menghasilkan uang periode ini.`);
  if (outstandingOrders.length > 0)
    insights.push(`${outstandingOrders.length} pesanan belum lunas, total ${formatIDR(outstandingAmount)}.`);
  if (lowStock.length > 0) insights.push(`Stok menipis: ${lowStock.map((p) => p.name).join(", ")}.`);

  const hasData = sales.length > 0 || txs.length > 0 || orders.length > 0;

  // ── Beranda staf: harga & stok produk, tanpa angka keuangan ──
  if (isStaff) {
    const catalog = products
      .filter((p) => p.status !== "inactive")
      .sort((a, b) => a.name.localeCompare(b.name));
    return (
      <>
        <header className="mb-5">
          <p className="label">Beranda</p>
          <h1 className="mt-1 text-[25px] font-bold text-ink">{business.name}</h1>
        </header>

        <div className="grid grid-cols-3 gap-2.5">
          <Stat label="Pesanan Aktif" value={String(activeOrders.length)} href="/orders" />
          <Stat
            label="Belum Lunas"
            value={formatIDRCompact(outstandingAmount)}
            tone={outstandingAmount > 0 ? "out" : "ink"}
            href="/receivables"
          />
          <Stat
            label="Stok Menipis"
            value={String(lowStock.length)}
            sub="produk"
            tone={lowStock.length > 0 ? "warn" : "ink"}
            href="/products"
          />
        </div>

        {dueSoon.length > 0 && (
          <>
            <SectionTitle>Segera Jatuh Tempo</SectionTitle>
            <List>
              {dueSoon.slice(0, 4).map((o) => (
                <Row
                  key={o.id}
                  href={`/orders/${o.id}`}
                  title={o.customer?.name ?? "Tanpa nama"}
                  meta={`${o.items.map((i) => i.product.name).join(", ")} · ${o.dueDate ? formatDate(o.dueDate) : "-"}`}
                  amount={formatIDRCompact(o.remainingPayment)}
                  amountTone="out"
                  trailing={<Badge tone="warn">{orderStatusLabel(o.status)}</Badge>}
                  chevron={false}
                />
              ))}
            </List>
          </>
        )}

        <SectionTitle
          action={
            <Link href="/products" className="text-[12.5px] font-semibold text-clay">
              Kelola
            </Link>
          }
        >
          Harga &amp; Stok Produk
        </SectionTitle>
        {catalog.length === 0 ? (
          <EmptyState
            icon={<IconSpark className="h-6 w-6" strokeWidth={1.7} />}
            title="Belum ada produk"
            body="Tambahkan produk beserta harga jual dan stoknya."
            actionLabel="Tambah Produk"
            actionHref="/products/new"
          />
        ) : (
          <List>
            {catalog.map((p) => (
              <Row
                key={p.id}
                href={`/products/${p.id}`}
                title={p.name}
                amount={formatIDR(p.sellingPrice)}
                amountSub={`stok ${p.stock}`}
                trailing={p.stock <= p.minStock ? <Badge tone="warn">menipis</Badge> : undefined}
              />
            ))}
          </List>
        )}

        <div className="mt-6">
          <Callout>
            Angka di sini adalah harga jual dan stok terkini. Kalau stok atau harga berubah, minta owner
            memperbaruinya di menu Produk.
          </Callout>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="mb-5">
        <p className="label">{label}</p>
        <h1 className="mt-1 text-[25px] font-bold text-ink">{business.name}</h1>
      </header>

      <div className="mb-4">
        <Segmented
          active={activeRange}
          options={RANGES.map((r) => ({ ...r, href: `/dashboard?range=${r.key}` }))}
        />
      </div>

      {!hasData ? (
        <EmptyState
          icon={<IconSpark className="h-6 w-6" strokeWidth={1.7} />}
          title="Mulai dari satu catatan"
          body="Catat uang yang masuk dan keluar hari ini. Setelah beberapa catatan, untung rugi usaha akan terlihat sendiri di sini."
          actionLabel="Catat Uang Masuk"
          actionHref="/finance/new?type=INCOME"
        />
      ) : (
        <>
          <Card className="mb-3">
            <p className="label">{profit >= 0 ? "Untung" : "Rugi"} {label.toLowerCase()}</p>
            <p className={`figure mt-1.5 truncate text-[clamp(30px,10vw,40px)] ${profit >= 0 ? "text-ink" : "text-bad"}`}>
              {formatIDR(profit)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-soft text-teal">
                  <IconArrowDown className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <span className="min-w-0">
                  <span className="label block">Masuk</span>
                  <span className="tnum block truncate text-[14.5px] font-bold text-teal">{formatIDR(income)}</span>
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clay-soft text-clay">
                  <IconArrowUp className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <span className="min-w-0">
                  <span className="label block">Keluar</span>
                  <span className="tnum block truncate text-[14.5px] font-bold text-clay">{formatIDR(expense)}</span>
                </span>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-2.5">
            <Stat label="Pesanan Aktif" value={String(activeOrders.length)} href="/orders" />
            <Stat
              label="Belum Lunas"
              value={formatIDRCompact(outstandingAmount)}
              tone={outstandingAmount > 0 ? "out" : "ink"}
              href="/receivables"
            />
            <Stat
              label="Stok Menipis"
              value={String(lowStock.length)}
              sub="produk"
              tone={lowStock.length > 0 ? "warn" : "ink"}
              href="/products"
            />
          </div>

          {chartHasData && (
            <div className="mt-3">
              <CashflowChart buckets={chartData} windowLabel={windowLabel} />
            </div>
          )}

          {dueSoon.length > 0 && (
            <>
              <SectionTitle>Segera Jatuh Tempo</SectionTitle>
              <List>
                {dueSoon.slice(0, 4).map((o) => (
                  <Row
                    key={o.id}
                    href={`/orders/${o.id}`}
                    title={o.customer?.name ?? "Tanpa nama"}
                    meta={`${o.items.map((i) => i.product.name).join(", ")} · ${o.dueDate ? formatDate(o.dueDate) : "-"}`}
                    amount={formatIDRCompact(o.remainingPayment)}
                    amountTone="out"
                    trailing={<Badge tone="warn">{orderStatusLabel(o.status)}</Badge>}
                    chevron={false}
                  />
                ))}
              </List>
            </>
          )}

          {topProducts.length > 0 && (
            <>
              <SectionTitle action={<Link href="/products" className="text-[12.5px] font-semibold text-clay">Semua</Link>}>
                Produk Terlaris
              </SectionTitle>
              <List>
                {topProducts.map(([name, d]) => (
                  <Row key={name} title={name} meta={`${d.units} unit terjual`} amount={formatIDR(d.revenue)} chevron={false} />
                ))}
              </List>
            </>
          )}

          {txs.length > 0 && (
            <>
              <SectionTitle action={<Link href="/finance" className="text-[12.5px] font-semibold text-clay">Semua</Link>}>
                Catatan Terakhir
              </SectionTitle>
              <List>
                {txs.slice(0, 5).map((t) => (
                  <Row
                    key={t.id}
                    title={t.description || t.incomeCategory?.name || t.expenseCategory?.name || "Transaksi"}
                    meta={`${formatDate(t.date)} · ${t.incomeCategory?.name ?? t.expenseCategory?.name ?? "Lainnya"}`}
                    amount={`${t.type === "INCOME" ? "+" : "−"}${formatIDR(t.amount)}`}
                    amountTone={t.type === "INCOME" ? "in" : "out"}
                    chevron={false}
                  />
                ))}
              </List>
            </>
          )}

          {staffActivity.length > 0 && (
            <>
              <SectionTitle
                action={
                  <Link href="/activity" className="text-[12.5px] font-semibold text-clay">
                    Semua
                  </Link>
                }
              >
                Aktivitas Staf Terakhir
              </SectionTitle>
              <List>
                {staffActivity.map((l) => (
                  <Row
                    key={l.id}
                    title={l.summary}
                    meta={`${formatDate(l.createdAt)} · ${l.userName}`}
                    chevron={false}
                  />
                ))}
              </List>
            </>
          )}

          {insights.length > 0 && (
            <>
              <SectionTitle>Yang Perlu Diperhatikan</SectionTitle>
              <Card>
                <ul className="flex flex-col gap-2.5">
                  {insights.map((text, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
                      {text}
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}

          <div className="mt-6">
            <Callout>
              Pisahkan uang usaha dari uang pribadi. Kalau ambil uang usaha untuk keperluan rumah, catat sebagai uang
              keluar supaya untung rugi tetap terbaca benar.
            </Callout>
          </div>
        </>
      )}
    </>
  );
}
