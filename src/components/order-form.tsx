"use client";

import { useState } from "react";
import { formatIDR } from "@/lib/format";
import { Card, Callout } from "./ui";
import { ActionForm, SubmitButton } from "./form";
import { ItemsEditor, type ItemRow } from "./items-editor";
import { RpField } from "./rp-field";
import type { FormState } from "@/lib/actions/_helpers";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;
type Product = { id: string; name: string; sellingPrice: number };
type Customer = { id: string; name: string };

export function OrderForm({
  action,
  products,
  customers,
  channels,
}: {
  action: Action;
  products: Product[];
  customers: Customer[];
  channels: string[];
}) {
  const first = products[0];
  const [rows, setRows] = useState<ItemRow[]>(
    first ? [{ productId: first.id, quantity: 1, unitPrice: first.sellingPrice }] : []
  );
  const [discount, setDiscount] = useState(0);
  const [dp, setDp] = useState(0);

  const subtotal = rows.reduce((s, r) => s + r.quantity * r.unitPrice, 0);
  const total = Math.max(subtotal - discount, 0);
  const remaining = Math.max(total - dp, 0);
  const totalUnits = rows.reduce((s, r) => s + r.quantity, 0);

  if (products.length === 0) {
    return <Callout tone="warn">Belum ada produk. Tambahkan produk dulu sebelum membuat pesanan.</Callout>;
  }

  return (
    <ActionForm action={action} footer={<SubmitButton>Simpan Pesanan</SubmitButton>}>
      <input type="hidden" name="items" value={JSON.stringify(rows)} readOnly />

      <p className="label mb-2">Barang yang Dipesan</p>
      <ItemsEditor products={products} value={rows} onChange={setRows} />

      <Card>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Diskon keseluruhan (opsional)</span>
          <input type="hidden" name="discount" value={discount || ""} readOnly />
          <RpField value={discount} onChange={setDiscount} />
        </label>
      </Card>

      <p className="label mb-2 mt-2">Pembeli &amp; Pembayaran</p>
      <Card>
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Pelanggan (opsional)</span>
            <select name="customerId" className="field" defaultValue="">
              <option value="">Tanpa nama</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Tenggat (opsional)</span>
              <input name="dueDate" type="date" className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Dari mana</span>
              <input name="channel" list="ochan" className="field" placeholder="mis. WhatsApp" />
              <datalist id="ochan">
                {channels.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Uang muka / DP (opsional)</span>
            <input type="hidden" name="downPayment" value={dp || ""} readOnly />
            <RpField value={dp} onChange={setDp} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Catatan (opsional)</span>
            <textarea name="notes" rows={2} className="field" placeholder="Warna, ukuran, permintaan khusus…" />
          </label>
        </div>
      </Card>

      <div className="rounded-[var(--radius-lg)] bg-ink px-4 py-3.5 text-canvas">
        <div className="flex items-center justify-between text-[13px] text-canvas/70">
          <span>
            {rows.length} jenis · {totalUnits} barang
          </span>
          {dp > 0 && <span>DP {formatIDR(dp)} · sisa {formatIDR(remaining)}</span>}
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-[13px] font-medium text-canvas/80">Total pesanan</span>
          <span className="figure text-[24px]">{formatIDR(total)}</span>
        </div>
      </div>
    </ActionForm>
  );
}
