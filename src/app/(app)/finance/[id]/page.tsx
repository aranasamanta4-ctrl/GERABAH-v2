import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { deleteFinancialTransaction } from "@/lib/actions/finance";
import { formatIDR, formatDateLong } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, Callout } from "@/components/ui";
import { ActionButton } from "@/components/action-button";
import { IconTrash } from "@/components/icons";

export default async function FinanceDetailPage({ params }: PageProps<"/finance/[id]">) {
  const { id } = await params;
  const business = await getCurrentBusiness();
  if (!business) return null;

  const tx = await prisma.financialTransaction.findFirst({
    where: { id, businessId: business.id },
    include: { incomeCategory: true, expenseCategory: true, paymentMethod: true },
  });
  if (!tx) notFound();

  const isIncome = tx.type === "INCOME";
  const rows: [string, string][] = [
    ["Jenis", isIncome ? "Uang Masuk" : "Uang Keluar"],
    ["Kategori", tx.incomeCategory?.name ?? tx.expenseCategory?.name ?? "Lainnya"],
    ["Tanggal", formatDateLong(tx.date)],
    ["Metode", tx.paymentMethod?.name ?? "Tunai"],
  ];
  if (tx.notes) rows.push(["Catatan", tx.notes]);

  return (
    <>
      <PageHeader title="Detail Catatan" back="/finance" />

      <Card className="mb-4">
        <p className="label">{isIncome ? "Uang Masuk" : "Uang Keluar"}</p>
        <p className={`figure mt-1.5 text-[30px] ${isIncome ? "text-teal" : "text-clay"}`}>
          {isIncome ? "+" : "−"}
          {formatIDR(tx.amount)}
        </p>
        {tx.description && <p className="mt-1 text-[14px] text-ink-2">{tx.description}</p>}
      </Card>

      <Card className="mb-4">
        <dl className="flex flex-col divide-y divide-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
              <dt className="text-[13px] text-ink-3">{k}</dt>
              <dd className="text-right text-[13.5px] font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {tx.relatedSaleId ? (
        <Callout>Catatan ini otomatis dibuat dari sebuah penjualan, jadi tidak bisa dihapus dari sini.</Callout>
      ) : (
        <ActionButton
          action={deleteFinancialTransaction}
          hidden={{ id: tx.id }}
          confirm="Hapus catatan ini? Tidak bisa dikembalikan."
          className="btn btn-danger w-full"
          pendingLabel="Menghapus…"
        >
          <IconTrash className="h-4 w-4" strokeWidth={2} />
          Hapus Catatan
        </ActionButton>
      )}
    </>
  );
}
