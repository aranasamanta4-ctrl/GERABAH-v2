import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/actions/_helpers";
import { createAsset, deleteAsset, createFixedCost, toggleFixedCostActive, deleteFixedCost } from "@/lib/actions/assets";
import { formatIDR, formatDate } from "@/lib/format";
import { fixedCostPeriodLabel, ASSET_CATEGORIES } from "@/lib/labels";
import { todayISO } from "@/lib/date-range";
import { PageHeader } from "@/components/page-header";
import { Card, List, Row, Badge, EmptyState } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/form";
import { ActionButton } from "@/components/action-button";
import { IconLayers, IconTrash } from "@/components/icons";

export default async function AssetsPage() {
  const business = await requireOwner();

  const [assets, fixedCosts, fixedCostCategories] = await Promise.all([
    prisma.asset.findMany({ where: { businessId: business.id }, orderBy: { createdAt: "desc" } }),
    prisma.fixedCost.findMany({ where: { businessId: business.id }, include: { category: true }, orderBy: { createdAt: "desc" } }),
    prisma.fixedCostCategory.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
  ]);

  const totalAssetValue = assets.reduce((s, a) => s + a.purchaseValue, 0);
  const monthlyFixedCost = fixedCosts
    .filter((f) => f.active)
    .reduce((s, f) => s + (f.period === "monthly" ? f.amount : f.period === "yearly" ? f.amount / 12 : 0), 0);

  return (
    <>
      <PageHeader title="Aset & Biaya Tetap" back="/more" />
      <p className="text-help mb-5">
        Dihitung di awal, sebelum operasional jalan: daftar aset usaha dan biaya yang tetap keluar tiap bulan/tahun
        (termasuk langganan software/alat, dihitung sebagai biaya pemeliharaan).
      </p>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <Card>
          <p className="label">Total Nilai Aset</p>
          <p className="figure mt-1 text-[19px] text-ink">{formatIDR(totalAssetValue)}</p>
        </Card>
        <Card>
          <p className="label">Biaya Tetap / Bulan</p>
          <p className="figure mt-1 text-[19px] text-ink">{formatIDR(monthlyFixedCost)}</p>
        </Card>
      </div>

      {/* ── Aset ── */}
      <p className="label mb-2">Daftar Aset</p>
      {assets.length > 0 ? (
        <List className="mb-3">
          {assets.map((a) => (
            <Row
              key={a.id}
              title={a.name}
              meta={`${a.category}${a.purchaseDate ? ` · ${formatDate(a.purchaseDate)}` : ""}`}
              amount={formatIDR(a.purchaseValue)}
              trailing={
                <ActionButton
                  action={deleteAsset}
                  hidden={{ id: a.id }}
                  confirm={`Hapus aset ${a.name}?`}
                  className="inline-flex items-center rounded-full p-2 text-bad active:bg-bad-soft"
                  pendingLabel="…"
                >
                  <IconTrash className="h-4 w-4" strokeWidth={2} />
                </ActionButton>
              }
              chevron={false}
            />
          ))}
        </List>
      ) : (
        <div className="mb-3">
          <EmptyState icon={<IconLayers className="h-6 w-6" strokeWidth={1.7} />} title="Belum ada aset" body="Catat alat produksi, kendaraan, atau perlengkapan usaha lainnya." />
        </div>
      )}

      <ActionForm action={createAsset} footer={<SubmitButton>Tambah Aset</SubmitButton>}>
        <Card>
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Nama aset</span>
              <input name="name" required className="field" placeholder="mis. Tungku Pembakaran" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Kategori</span>
              <input name="category" list="assetcat" defaultValue="Lainnya" className="field" />
              <datalist id="assetcat">
                {ASSET_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Nilai / harga beli</span>
              <input name="purchaseValue" inputMode="numeric" required className="field tnum" placeholder="0" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Tanggal beli (opsional)</span>
              <input name="purchaseDate" type="date" defaultValue={todayISO()} className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Catatan (opsional)</span>
              <input name="note" className="field" />
            </label>
          </div>
        </Card>
      </ActionForm>

      {/* ── Biaya Tetap & Langganan ── */}
      <p className="label mb-2 mt-7">Biaya Tetap &amp; Langganan</p>
      {fixedCosts.length > 0 ? (
        <List className="mb-3">
          {fixedCosts.map((f) => (
            <Row
              key={f.id}
              title={f.name}
              meta={`${f.category?.name ?? "Tanpa kategori"} · ${fixedCostPeriodLabel(f.period)}${f.endDate ? ` · s/d ${formatDate(f.endDate)}` : ""}`}
              amount={formatIDR(f.amount)}
              trailing={
                <div className="flex items-center gap-1">
                  {!f.active && <Badge tone="neutral">Nonaktif</Badge>}
                  <ActionButton action={toggleFixedCostActive} hidden={{ id: f.id }} className="rounded-full px-2 py-1 text-[12px] font-medium text-ink-2 active:bg-surface-2" pendingLabel="…">
                    {f.active ? "Nonaktifkan" : "Aktifkan"}
                  </ActionButton>
                  <ActionButton
                    action={deleteFixedCost}
                    hidden={{ id: f.id }}
                    confirm={`Hapus biaya tetap ${f.name}?`}
                    className="inline-flex items-center rounded-full p-2 text-bad active:bg-bad-soft"
                    pendingLabel="…"
                  >
                    <IconTrash className="h-4 w-4" strokeWidth={2} />
                  </ActionButton>
                </div>
              }
              chevron={false}
            />
          ))}
        </List>
      ) : (
        <div className="mb-3">
          <EmptyState icon={<IconLayers className="h-6 w-6" strokeWidth={1.7} />} title="Belum ada biaya tetap" body="Catat gaji/tenaga kerja bulanan, sewa tempat, listrik, atau langganan software di sini." />
        </div>
      )}

      <ActionForm action={createFixedCost} footer={<SubmitButton>Tambah Biaya Tetap</SubmitButton>}>
        <Card>
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Nama biaya</span>
              <input name="name" required className="field" placeholder="mis. Tenaga kerja, Sewa tempat, Canva Pro" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Kategori</span>
              <input name="category" list="fixedcostcat" className="field" placeholder="mis. Tenaga Kerja, Langganan / Software" />
              <datalist id="fixedcostcat">
                {fixedCostCategories.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
                <option value="Langganan / Software" />
                <option value="Tenaga Kerja" />
              </datalist>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Jumlah</span>
              <input name="amount" inputMode="numeric" required className="field tnum" placeholder="0" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Periode</span>
              <select name="period" defaultValue="monthly" className="field">
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
                <option value="one_time">Sekali Bayar</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Mulai berlaku</span>
              <input name="startDate" type="date" defaultValue={todayISO()} className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Lama langganan (bulan, opsional)</span>
              <input name="durationMonths" type="number" inputMode="numeric" min={0} className="field tnum" placeholder="Isi kalau ini langganan, mis. 12" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Catatan (opsional)</span>
              <input name="note" className="field" />
            </label>
          </div>
        </Card>
      </ActionForm>
    </>
  );
}
