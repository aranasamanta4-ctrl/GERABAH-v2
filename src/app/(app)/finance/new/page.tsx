import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { createFinancialTransaction } from "@/lib/actions/finance";
import { todayISO } from "@/lib/date-range";
import { PageHeader } from "@/components/page-header";
import { Card, Callout } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/form";
import { MoneyInput } from "@/components/money-input";

export default async function NewFinancePage({ searchParams }: PageProps<"/finance/new">) {
  const { type } = await searchParams;
  const business = await getCurrentBusiness();
  if (!business) return null;

  const isIncome = type === "INCOME";
  const txType = isIncome ? "INCOME" : "EXPENSE";

  const [incomeCategories, expenseCategories, paymentMethods] = await Promise.all([
    prisma.incomeCategory.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
    prisma.expenseCategory.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
    prisma.paymentMethod.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
  ]);
  const categories = isIncome ? incomeCategories : expenseCategories;

  return (
    <>
      <PageHeader
        title={isIncome ? "Catat Uang Masuk" : "Catat Uang Keluar"}
        subtitle={isIncome ? "Uang yang diterima usaha" : "Uang yang dikeluarkan usaha"}
        back="/finance"
      />

      <ActionForm
        action={createFinancialTransaction}
        hidden={{ type: txType }}
        footer={<SubmitButton>Simpan</SubmitButton>}
      >
        <Card>
          <span className="mb-2 block text-[13px] font-medium text-ink-2">Jumlah</span>
          <MoneyInput name="amount" required autoFocus big tone={isIncome ? "in" : "out"} />
        </Card>

        <Card>
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Untuk apa</span>
              <input
                name="description"
                className="field"
                placeholder={isIncome ? "mis. Penjualan kendi ke Bu Ani" : "mis. Beli tanah liat 2 karung"}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Kategori</span>
              <input name="category" list="cat-opts" className="field" placeholder="Pilih atau ketik baru" />
              <datalist id="cat-opts">
                {categories.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Tanggal</span>
                <input name="date" type="date" defaultValue={todayISO()} className="field" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Bayar pakai</span>
                <input name="paymentMethod" list="pay-opts" className="field" placeholder="Tunai" />
                <datalist id="pay-opts">
                  {paymentMethods.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Catatan tambahan (opsional)</span>
              <textarea name="notes" rows={2} className="field" />
            </label>
          </div>
        </Card>
      </ActionForm>

      <div className="mt-5">
        <Callout>
          {isIncome
            ? "Catat hanya uang yang benar-benar diterima. Kalau pembeli masih berhutang, catat lewat menu Penjualan atau Pesanan supaya piutangnya terpantau."
            : "Termasuk pengeluaran kecil: bensin antar barang, tali, plastik, upah harian. Semakin lengkap, semakin akurat untung ruginya."}
        </Callout>
      </div>
    </>
  );
}
