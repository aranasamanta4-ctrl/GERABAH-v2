import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { resolveRange } from "@/lib/date-range";
import { formatIDR } from "@/lib/format";
import { Card, Callout } from "@/components/ui";
import { Segmented } from "@/components/segmented";
import { IconDownload } from "@/components/icons";

const PERIODS = [
  { key: "week", label: "Mingguan", href: "/reports?period=week" },
  { key: "month", label: "Bulanan", href: "/reports?period=month" },
  { key: "year", label: "Tahunan", href: "/reports?period=year" },
];

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const { period } = await searchParams;
  const active = period === "week" ? "week" : period === "year" ? "year" : "month";
  const business = await getCurrentBusiness();
  if (!business) return null;

  const { from, to, label } = resolveRange(active);

  const [txs, opening] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: { businessId: business.id, date: { gte: from, lte: to } },
      include: { incomeCategory: true, expenseCategory: true },
    }),
    prisma.financialTransaction.findMany({
      where: { businessId: business.id, date: { lt: from } },
      select: { type: true, amount: true },
    }),
  ]);

  const openingBalance = opening.reduce((s, t) => s + (t.type === "INCOME" ? t.amount : -t.amount), 0);

  const incomeByCat = new Map<string, number>();
  const expenseByCat = new Map<string, number>();
  for (const t of txs) {
    if (t.type === "INCOME") {
      const k = t.incomeCategory?.name ?? "Lainnya";
      incomeByCat.set(k, (incomeByCat.get(k) ?? 0) + t.amount);
    } else {
      const k = t.expenseCategory?.name ?? "Lainnya";
      expenseByCat.set(k, (expenseByCat.get(k) ?? 0) + t.amount);
    }
  }

  const totalIncome = [...incomeByCat.values()].reduce((a, b) => a + b, 0);
  const totalExpense = [...expenseByCat.values()].reduce((a, b) => a + b, 0);
  const netProfit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
  const closingBalance = openingBalance + netProfit;

  const catRows = (map: Map<string, number>) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, amt]) => (
        <div key={name} className="flex justify-between py-2 text-[13.5px]">
          <span className="text-ink-2">{name}</span>
          <span className="tnum font-medium text-ink">{formatIDR(amt)}</span>
        </div>
      ));

  return (
    <>
      <header className="mb-5">
        <h1 className="text-[24px] font-bold text-ink">Laporan</h1>
        <p className="mt-0.5 text-[13.5px] text-ink-2">{label} · dalam bahasa sehari-hari</p>
      </header>

      <div className="mb-4">
        <Segmented options={PERIODS} active={active} />
      </div>

      {txs.length === 0 ? (
        <Callout>Belum ada transaksi pada periode ini. Catat dulu uang masuk dan keluar di menu Keuangan.</Callout>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Laba Rugi */}
          <section>
            <p className="label mb-2">Laba Rugi Sederhana</p>
            <Card>
              <p className="text-[13px] font-semibold text-ink">Uang masuk (pendapatan)</p>
              <div className="mt-1 divide-y divide-line">
                {catRows(incomeByCat)}
              </div>
              <div className="mt-1 flex justify-between border-t-2 border-line pt-2 text-[13.5px] font-bold">
                <span>Jumlah pendapatan</span>
                <span className="tnum text-teal">{formatIDR(totalIncome)}</span>
              </div>

              <p className="mt-4 text-[13px] font-semibold text-ink">Uang keluar (pengeluaran)</p>
              <div className="mt-1 divide-y divide-line">
                {catRows(expenseByCat)}
              </div>
              <div className="mt-1 flex justify-between border-t-2 border-line pt-2 text-[13.5px] font-bold">
                <span>Jumlah pengeluaran</span>
                <span className="tnum text-clay">{formatIDR(totalExpense)}</span>
              </div>

              <div className="mt-4 rounded-[var(--radius-md)] bg-ink px-4 py-3 text-canvas">
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] font-medium text-canvas/80">
                    {netProfit >= 0 ? "Laba bersih" : "Rugi bersih"}
                  </span>
                  <span className="figure text-[22px]">{formatIDR(netProfit)}</span>
                </div>
                <p className="mt-0.5 text-right text-[11.5px] text-canvas/60">Margin {margin.toFixed(0)}%</p>
              </div>
            </Card>
          </section>

          {/* Arus Kas */}
          <section>
            <p className="label mb-2">Arus Kas Sederhana</p>
            <Card>
              <dl className="flex flex-col divide-y divide-line text-[13.5px]">
                <div className="flex justify-between py-2 first:pt-0">
                  <dt className="text-ink-2">Saldo awal periode</dt>
                  <dd className="tnum font-medium text-ink">{formatIDR(openingBalance)}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-ink-2">Kas masuk</dt>
                  <dd className="tnum font-medium text-teal">+{formatIDR(totalIncome)}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-ink-2">Kas keluar</dt>
                  <dd className="tnum font-medium text-clay">−{formatIDR(totalExpense)}</dd>
                </div>
                <div className="flex justify-between py-2 last:pb-0 text-[14px] font-bold">
                  <dt>Saldo akhir periode</dt>
                  <dd className={`tnum ${closingBalance >= 0 ? "text-ink" : "text-bad"}`}>{formatIDR(closingBalance)}</dd>
                </div>
              </dl>
            </Card>
          </section>

          <a href={`/api/reports/export?period=${active}`} className="btn btn-secondary w-full">
            <IconDownload className="h-[18px] w-[18px]" strokeWidth={2} />
            Unduh Rincian Penjualan (CSV)
          </a>
        </div>
      )}

      <div className="mt-6">
        <Callout>
          &quot;Laba bersih&quot; adalah uang yang benar-benar jadi milikmu setelah semua pengeluaran. Kalau angkanya
          merah, harga jual atau biaya produksi perlu ditinjau.
        </Callout>
      </div>
    </>
  );
}
