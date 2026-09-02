"use client";

import { useMemo, useState } from "react";
import { formatIDR, groupDigits } from "@/lib/format";
import { Card, Callout } from "./ui";
import { ActionForm, SubmitButton } from "./form";
import { QuantityInput } from "./quantity-input";
import type { FormState } from "@/lib/actions/_helpers";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;
type Product = { id: string; name: string; sellingPrice: number };
type Customer = { id: string; name: string };

const num = (s: string) => Number(s.replace(/\D/g, "")) || 0;

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
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const product = useMemo(() => products.find((p) => p.id === productId), [productId, products]);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(product?.sellingPrice ?? 0);
  const [discount, setDiscount] = useState(0);
  const [dp, setDp] = useState(0);

  const unit = price || product?.sellingPrice || 0;
  const total = Math.max(qty * unit - discount, 0);
  const remaining = Math.max(total - dp, 0);

  if (products.length === 0) {
    return <Callout tone="warn">Belum ada produk. Tambahkan produk dulu sebelum membuat pesanan.</Callout>;
  }

  return (
    <ActionForm action={action} footer={<SubmitButton>Simpan Pesanan</SubmitButton>}>
      <Card>
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Produk yang dipesan</span>
            <select
              name="productId"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setPrice(products.find((x) => x.id === e.target.value)?.sellingPrice ?? 0);
              }}
              className="field"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Jumlah</span>
            <QuantityInput name="quantity" defaultValue={1} onValueChange={setQty} />
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Harga satuan</span>
            <input type="hidden" name="price" value={price || ""} readOnly />
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-3">Rp</span>
              <input
                inputMode="numeric"
                defaultValue={price ? groupDigits(String(price)) : ""}
                onChange={(e) => {
                  const v = num(e.target.value);
                  e.target.value = groupDigits(String(v));
                  setPrice(v);
                }}
                className="field tnum !pl-10 font-semibold"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Diskon (opsional)</span>
            <input type="hidden" name="discount" value={discount || ""} readOnly />
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-3">Rp</span>
              <input
                inputMode="numeric"
                onChange={(e) => {
                  const v = num(e.target.value);
                  e.target.value = v ? groupDigits(String(v)) : "";
                  setDiscount(v);
                }}
                className="field tnum !pl-10"
                placeholder="0"
              />
            </div>
          </label>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Pelanggan (opsional)</span>
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
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Tenggat (opsional)</span>
              <input name="dueDate" type="date" className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Dari mana</span>
              <input name="channel" list="ochan" className="field" placeholder="mis. WhatsApp" />
              <datalist id="ochan">
                {channels.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Uang muka / DP (opsional)</span>
            <input type="hidden" name="downPayment" value={dp || ""} readOnly />
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-3">Rp</span>
              <input
                inputMode="numeric"
                onChange={(e) => {
                  const v = num(e.target.value);
                  e.target.value = v ? groupDigits(String(v)) : "";
                  setDp(v);
                }}
                className="field tnum !pl-10"
                placeholder="0"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Catatan (opsional)</span>
            <textarea name="notes" rows={2} className="field" placeholder="Warna, ukuran, permintaan khusus…" />
          </label>
        </div>
      </Card>

      <div className="rounded-[var(--radius-lg)] bg-ink px-4 py-3.5 text-canvas">
        <div className="flex items-center justify-between text-[13px] text-canvas/70">
          <span>{qty} barang</span>
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
