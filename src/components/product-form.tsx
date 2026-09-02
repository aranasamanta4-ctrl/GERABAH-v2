"use client";

import { useState } from "react";
import { formatIDR } from "@/lib/format";
import { Card } from "./ui";
import { ActionForm, SubmitButton } from "./form";
import { PhotoInput } from "./photo-input";
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
  costs?: { materialCost: number; laborCost: number; packagingCost: number; otherCost: number };
};

const COSTS: [keyof NonNullable<Initial["costs"]>, string][] = [
  ["materialCost", "Bahan baku"],
  ["laborCost", "Tenaga kerja"],
  ["packagingCost", "Kemasan"],
  ["otherCost", "Lain-lain"],
];

export function ProductForm({
  action,
  categories,
  initial = {},
  submitLabel,
}: {
  action: Action;
  categories: string[];
  initial?: Initial;
  submitLabel: string;
}) {
  const isEdit = Boolean(initial.id);
  const [price, setPrice] = useState(initial.sellingPrice ?? 0);
  const [costs, setCosts] = useState({
    materialCost: initial.costs?.materialCost ?? 0,
    laborCost: initial.costs?.laborCost ?? 0,
    packagingCost: initial.costs?.packagingCost ?? 0,
    otherCost: initial.costs?.otherCost ?? 0,
  });
  const totalCost = Object.values(costs).reduce((a, b) => a + b, 0);
  const profit = price - totalCost;
  const margin = price > 0 ? (profit / price) * 100 : 0;

  const num = (s: string) => Number(s.replace(/\D/g, "")) || 0;

  return (
    <ActionForm
      action={action}
      hidden={initial.id ? { id: initial.id } : undefined}
      footer={<SubmitButton>{submitLabel}</SubmitButton>}
    >
      <Card>
        <div className="flex flex-col gap-4">
          <PhotoInput current={initial.photoUrl} />
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Nama produk</span>
            <input name="name" required defaultValue={initial.name} className="field" placeholder="mis. Vas Bunga Motif Batik" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Kategori</span>
            <input name="category" list="prodcat" defaultValue={initial.category ?? ""} className="field" placeholder="Pilih atau ketik baru" />
            <datalist id="prodcat">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Bahan (opsional)</span>
            <input name="material" defaultValue={initial.material ?? ""} className="field" placeholder="mis. Tanah liat Plered, glasir bening" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Deskripsi (opsional)</span>
            <textarea name="description" rows={2} defaultValue={initial.description ?? ""} className="field" />
          </label>
        </div>
      </Card>

      <Card>
        <span className="mb-2 block text-[13px] font-medium text-ink-2">Harga jual</span>
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
      </Card>

      <Card>
        <p className="label mb-3">Biaya Produksi per Barang</p>
        <div className="flex flex-col gap-3">
          {COSTS.map(([key, label]) => (
            <label key={key} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-[13px] text-ink-2">{label}</span>
              <input type="hidden" name={key} value={costs[key] || ""} readOnly />
              <input
                inputMode="numeric"
                defaultValue={costs[key] ? new Intl.NumberFormat("id-ID").format(costs[key]) : ""}
                onChange={(e) => {
                  const v = num(e.target.value);
                  e.target.value = v ? new Intl.NumberFormat("id-ID").format(v) : "";
                  setCosts((c) => ({ ...c, [key]: v }));
                }}
                placeholder="0"
                className="field tnum flex-1 !min-h-[44px] text-right"
              />
            </label>
          ))}
        </div>

        {(price > 0 || totalCost > 0) && (
          <div className="mt-3 rounded-[var(--radius-md)] bg-surface-2 p-3">
            <div className="flex justify-between text-[13px] text-ink-2">
              <span>Total biaya</span>
              <span className="tnum">{formatIDR(totalCost)}</span>
            </div>
            <div className="mt-1 flex justify-between text-[14px] font-semibold">
              <span className={profit >= 0 ? "text-good" : "text-bad"}>
                {profit >= 0 ? "Untung" : "Rugi"} per barang
              </span>
              <span className={`tnum ${profit >= 0 ? "text-good" : "text-bad"}`}>
                {formatIDR(profit)} · {margin.toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <div className="grid grid-cols-2 gap-3">
          {!isEdit && (
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Stok awal</span>
              <input name="stock" type="number" inputMode="numeric" min={0} defaultValue={initial.stock ?? 0} className="field tnum" />
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Batas stok menipis</span>
            <input name="minStock" type="number" inputMode="numeric" min={0} defaultValue={initial.minStock ?? 0} className="field tnum" />
          </label>
        </div>
      </Card>
    </ActionForm>
  );
}
