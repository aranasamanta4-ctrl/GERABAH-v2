"use client";

import { useState } from "react";
import Link from "next/link";
import { formatIDR } from "@/lib/format";
import { Card, Callout } from "./ui";
import { ActionForm, SubmitButton } from "./form";
import { PhotoInput } from "./photo-input";
import { MaterialsEditor, type MaterialRow } from "./materials-editor";
import type { FormState } from "@/lib/actions/_helpers";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

type Initial = {
  id?: string;
  name?: string;
  category?: string | null;
  description?: string | null;
  material?: string | null;
  sellingPrice?: number;
  stock?: number;
  minStock?: number;
  photoUrl?: string | null;
  costs?: { packagingCost: number; otherCost: number; otherCostCategory: string };
  materials?: MaterialRow[];
};

export function ProductForm({
  action,
  categories,
  otherCostCategories,
  initial = {},
  submitLabel,
  isStaff = false,
  pendingChange,
}: {
  action: Action;
  categories: string[];
  otherCostCategories: string[];
  initial?: Initial;
  submitLabel: string;
  /** Staf yang mengubah harga jual butuh persetujuan owner — tampilkan peringatan di field harga. */
  isStaff?: boolean;
  /** Pengajuan harga yang masih menunggu persetujuan untuk produk ini (kalau ada). */
  pendingChange?: { newValue: number; requestedByName: string } | null;
}) {
  const isEdit = Boolean(initial.id);
  const [price, setPrice] = useState(initial.sellingPrice ?? 0);
  const [packagingCost, setPackagingCost] = useState(initial.costs?.packagingCost ?? 0);
  const [otherCost, setOtherCost] = useState(initial.costs?.otherCost ?? 0);
  const [materials, setMaterials] = useState<MaterialRow[]>(initial.materials ?? []);
  const [margin, setMargin] = useState(30);

  const materialCost = materials.reduce((s, m) => s + m.quantity * m.unitCost, 0);
  const totalCost = materialCost + packagingCost + otherCost;
  const profit = price - totalCost;
  const actualMargin = price > 0 ? (profit / price) * 100 : 0;
  const recommendedPrice = totalCost > 0 && margin < 100 ? Math.round(totalCost / (1 - margin / 100)) : 0;

  const num = (s: string) => Number(s.replace(/\D/g, "")) || 0;

  return (
    <ActionForm
      action={action}
      hidden={initial.id ? { id: initial.id } : undefined}
      footer={<SubmitButton>{submitLabel}</SubmitButton>}
    >
      <input type="hidden" name="materials" value={JSON.stringify(materials)} readOnly />

      {pendingChange && (
        <Callout tone="warn">
          Perubahan harga jadi <strong>{formatIDR(pendingChange.newValue)}</strong> (diajukan{" "}
          {pendingChange.requestedByName}) sedang menunggu persetujuan owner. Harga yang tampil ke pembeli masih harga
          lama sampai disetujui.{" "}
          <Link href="/approvals" className="underline">
            Lihat di Persetujuan
          </Link>
          .
        </Callout>
      )}

      <Card>
        <div className="flex flex-col gap-4">
          <PhotoInput current={initial.photoUrl} />
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Nama produk</span>
            <input name="name" required defaultValue={initial.name} className="field" placeholder="mis. Vas Bunga Motif Batik" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Kategori</span>
            <input name="category" list="prodcat" defaultValue={initial.category ?? ""} className="field" placeholder="Pilih atau ketik baru" />
            <datalist id="prodcat">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Bahan (opsional)</span>
            <input name="material" defaultValue={initial.material ?? ""} className="field" placeholder="mis. Tanah liat Plered, glasir bening" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Deskripsi (opsional)</span>
            <textarea name="description" rows={2} defaultValue={initial.description ?? ""} className="field" />
          </label>
        </div>
      </Card>

      <Card>
        <p className="label mb-3">Rincian Bahan Baku</p>
        <MaterialsEditor value={materials} onChange={setMaterials} />
      </Card>

      <Card>
        <p className="label mb-3">Biaya Lain per Barang</p>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-[13px] text-ink-2">Kemasan</span>
            <input type="hidden" name="packagingCost" value={packagingCost || ""} readOnly />
            <input
              inputMode="numeric"
              defaultValue={packagingCost ? new Intl.NumberFormat("id-ID").format(packagingCost) : ""}
              onChange={(e) => {
                const v = num(e.target.value);
                e.target.value = v ? new Intl.NumberFormat("id-ID").format(v) : "";
                setPackagingCost(v);
              }}
              placeholder="0"
              className="field tnum flex-1 !min-h-[44px] text-right"
            />
          </label>
          <div className="flex items-center gap-3">
            <input
              name="otherCostCategory"
              list="othercat"
              defaultValue={initial.costs?.otherCostCategory ?? ""}
              placeholder="Kategori lain-lain"
              className="field !min-h-[44px] w-24 shrink-0 !text-[13px]"
            />
            <datalist id="othercat">
              {otherCostCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <input type="hidden" name="otherCost" value={otherCost || ""} readOnly />
            <input
              inputMode="numeric"
              defaultValue={otherCost ? new Intl.NumberFormat("id-ID").format(otherCost) : ""}
              onChange={(e) => {
                const v = num(e.target.value);
                e.target.value = v ? new Intl.NumberFormat("id-ID").format(v) : "";
                setOtherCost(v);
              }}
              placeholder="0"
              className="field tnum flex-1 !min-h-[44px] text-right"
            />
          </div>
          <p className="text-help">
            Ketik nama kategori sendiri (mis. &quot;Listrik produksi&quot;, &quot;Ongkir bahan&quot;) atau pilih yang sudah ada. Biaya
            tenaga kerja bulanan diatur di menu <Link href="/assets" className="underline">Aset &amp; Biaya Tetap</Link>,
            bukan di sini.
          </p>
        </div>
      </Card>

      <Card>
        <span className="mb-2 block text-[14px] font-medium text-ink-2">Harga jual</span>
        {isStaff && isEdit && (
          <p className="text-help mb-2">Perubahan harga produk yang sudah ada perlu disetujui owner dulu.</p>
        )}
        <input type="hidden" name="sellingPrice" value={price || ""} readOnly />
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[22px] font-semibold text-ink-3">Rp</span>
          <input
            inputMode="numeric"
            defaultValue={price ? new Intl.NumberFormat("id-ID").format(price) : ""}
            onChange={(e) => {
              const v = num(e.target.value);
              e.target.value = v ? new Intl.NumberFormat("id-ID").format(v) : "";
              setPrice(v);
            }}
            placeholder="0"
            className="field tnum !min-h-[64px] !pl-11 !text-[26px] font-semibold text-ink"
          />
        </div>

        {totalCost > 0 && (
          <div className="mt-3 rounded-[var(--radius-md)] bg-surface-2 p-3">
            <div className="flex justify-between text-[13px] text-ink-2">
              <span>Total biaya (bahan + kemasan + lain-lain)</span>
              <span className="tnum">{formatIDR(totalCost)}</span>
            </div>
            {price > 0 && (
              <div className="mt-1 flex justify-between text-[14px] font-semibold">
                <span className={profit >= 0 ? "text-good" : "text-bad"}>
                  {profit >= 0 ? "Untung" : "Rugi"} per barang
                </span>
                <span className={`tnum ${profit >= 0 ? "text-good" : "text-bad"}`}>
                  {formatIDR(profit)} · {actualMargin.toFixed(0)}%
                </span>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
              <label className="flex items-center gap-2 text-[13px] text-ink-2">
                Target untung
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={95}
                  value={margin}
                  onChange={(e) => setMargin(Math.max(0, Math.min(95, Number(e.target.value) || 0)))}
                  className="field tnum !min-h-[34px] !w-16 !py-1 text-center"
                />
                %
              </label>
              <span className="text-[13px] text-ink-3">Rekomendasi</span>
            </div>
            <p className="mt-1 text-right text-[18px] font-bold text-clay-ink">{formatIDR(recommendedPrice)}</p>
            <p className="text-help">
              Sekadar bantuan hitung — harga jual di atas tetap kamu yang isi/ubah sendiri.
            </p>
          </div>
        )}
      </Card>

      <Card>
        <div className="grid grid-cols-2 gap-3">
          {!isEdit && (
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Stok awal</span>
              <input name="stock" type="number" inputMode="numeric" min={0} defaultValue={initial.stock ?? 0} className="field tnum" />
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Batas stok menipis</span>
            <input name="minStock" type="number" inputMode="numeric" min={0} defaultValue={initial.minStock ?? 0} className="field tnum" />
          </label>
        </div>
      </Card>
    </ActionForm>
  );
}
