import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/current-user";
import { formatIDR, formatDate } from "@/lib/format";
import { Card, EmptyState, List, Row, Callout } from "@/components/ui";
import { Segmented } from "@/components/segmented";
import { IconArrowDown, IconArrowUp } from "@/components/icons";

export default async function FinancePage({ searchParams }: PageProps<"/finance">) {
  const { type } = await searchParams;
  const ctx = await getSessionContext();
  if (!ctx?.business) return null;
  const business = ctx.business;
  const isStaff = ctx.role === "staff";

  const allTx = await prisma.financialTransaction.findMany({
    where: { businessId: business.id, ...(isStaff ? { type: "EXPENSE" } : {}) },
    include: { incomeCategory: true, expenseCategory: true, paymentMethod: true },
    orderBy: { date: "desc" },
  });

  const totalIncome = allTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpense = allTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const TABS = isStaff
    ? [{ key: "EXPENSE", label: "Uang Keluar", href: "/finance" }]
    : [
        { key: "ALL", label: "Semua", href: "/finance" },
        { key: "INCOME", label: "Uang Masuk", href: "/finance?type=INCOME" },
        { key: "EXPENSE", label: "Uang Keluar", href: "/finance?type=EXPENSE" },
      ];

  const activeTab = isStaff ? "EXPENSE" : type === "EXPENSE" ? "EXPENSE" : type === "INCOME" ? "INCOME" : "ALL";
  const filtered = activeTab === "ALL" ? allTx : allTx.filter((t) => t.type === activeTab);

  const byDay = new Map<string, typeof filtered>();
  for (const t of filtered) {
    const key = t.date.toISOString().slice(0, 10);
    byDay.set(key, [...(byDay.get(key) ?? []), t]);
  }

  return (
    <>
      <header className="mb-5">
        <h1 className="text-[25px] font-bold text-ink">Keuangan</h1>
        <p className="mt-0.5 text-[14px] text-ink-2">
          {isStaff ? "Catat uang keluar usaha" : "Semua uang masuk dan keluar usaha"}
        </p>
      </header>

      {isStaff ? (
        <Card className="mb-4">
          <p className="label">Total Uang Keluar</p>
          <p className="figure mt-1.5 truncate text-[clamp(26px,9vw,34px)] text-clay">{formatIDR(totalExpense)}</p>
        </Card>
      ) : (
        <Card className="mb-4">
          <p className="label">Saldo Kas Usaha</p>
          <p className={`figure mt-1.5 truncate text-[clamp(26px,9vw,34px)] ${balance >= 0 ? "text-ink" : "text-bad"}`}>
            {formatIDR(balance)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3.5 text-[13px]">
            <div className="min-w-0">
              <span className="label block">Total Masuk</span>
              <span className="tnum block truncate font-bold text-teal">{formatIDR(totalIncome)}</span>
            </div>
            <div className="min-w-0">
              <span className="label block">Total Keluar</span>
              <span className="tnum block truncate font-bold text-clay">{formatIDR(totalExpense)}</span>
            </div>
          </div>
        </Card>
      )}

      <div className={`mb-4 grid gap-2.5 ${isStaff ? "grid-cols-1" : "grid-cols-2"}`}>
        {!isStaff && (
          <Link href="/finance/new?type=INCOME" className="btn btn-primary">
            <IconArrowDown className="h-4 w-4" strokeWidth={2.2} />
            Uang Masuk
          </Link>
        )}
        <Link href="/finance/new?type=EXPENSE" className={isStaff ? "btn btn-primary" : "btn btn-secondary"}>
          <IconArrowUp className="h-4 w-4" strokeWidth={2.2} />
          Catat Uang Keluar
        </Link>
      </div>

      {!isStaff && (
        <div className="mb-4">
          <Segmented options={TABS} active={activeTab} />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<IconArrowUp className="h-6 w-6" strokeWidth={1.7} />}
          title="Belum ada catatan"
          body={
            isStaff
              ? "Setiap kali mengeluarkan uang untuk usaha, catat di sini. Sekali sehari juga cukup."
              : "Setiap kali menerima atau mengeluarkan uang untuk usaha, catat di sini. Sekali sehari juga cukup."
          }
          actionLabel="Catat Sekarang"
          actionHref="/finance/new?type=EXPENSE"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {[...byDay.entries()].map(([day, items]) => {
            const net = items.reduce((s, t) => s + (t.type === "INCOME" ? t.amount : -t.amount), 0);
            return (
              <div key={day}>
                <div className="mb-1.5 flex items-baseline justify-between px-1">
                  <span className="text-[12.5px] font-semibold text-ink">{formatDate(items[0].date)}</span>
                  <span className={`tnum text-[11.5px] font-semibold ${net >= 0 ? "text-teal" : "text-clay"}`}>
                    {net >= 0 ? "+" : "−"}
                    {formatIDR(Math.abs(net))}
                  </span>
                </div>
                <List>
                  {items.map((t) => (
                    <Row
                      key={t.id}
                      href={`/finance/${t.id}`}
                      title={t.description || t.incomeCategory?.name || t.expenseCategory?.name || "Transaksi"}
                      meta={`${t.incomeCategory?.name ?? t.expenseCategory?.name ?? "Lainnya"} · ${t.paymentMethod?.name ?? "Tunai"}`}
                      amount={`${t.type === "INCOME" ? "+" : "−"}${formatIDR(t.amount)}`}
                      amountTone={t.type === "INCOME" ? "in" : "out"}
                    />
                  ))}
                </List>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <Callout>
          Catat pengeluaran sekecil apa pun — tanah liat, kayu bakar, ongkos kirim, upah harian. Dari sinilah biaya
          produksi dan harga jual yang pas bisa dihitung.
        </Callout>
      </div>
    </>
  );
}
