"use client";

import { useMemo, useState } from "react";
import { formatIDR, groupDigits } from "@/lib/format";
import { Card, Callout } from "./ui";
import { ActionForm, SubmitButton } from "./form";
import { QuantityInput } from "./quantity-input";
import type { FormState } from "@/lib/actions/_helpers";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;
type Product = { id: string; name: string; sellingPrice: number; stock: number };
type Customer = { id: string; name: string };

const num = (s: string) => Number(s.replace(/\D/g, "")) || 0;

export function SaleForm({
  action,
  products,
  customers,
  channels,
  paymentMethods,
  today,
}: {
  action: Action;
  products: Product[];
  customers: Customer[];
  channels: string[];
  paymentMethods: string[];
  today: string;
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const product = useMemo(() => products.find((p) => p.id === productId), [productId, products]);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(product?.sellingPrice ?? 0);
  const [discount, setDiscount] = useState(0);
  const [status, setStatus] = useState<"Paid" | "Partially Paid" | "Unpaid">("Paid");
  const [paid, setPaid] = useState(0);

  const effectivePrice = price || product?.sellingPrice || 0;
  const total = Math.max(qty * effectivePrice - discount, 0);
  const outstanding = status === "Paid" ? 0 : status === "Unpaid" ? total : Math.max(total - paid, 0);

  if (products.length === 0) {
    return (
      <Callout tone="warn">
        Belum ada produk. Tambahkan produk dulu di menu Produk sebelum mencatat penjualan.
      </Callout>
    );
  }

  return (
    <ActionForm action={action} footer={<SubmitButton>Simpan Penjualan</SubmitButton>}>
      <Card>
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Produk</span>
            <select
              name="productId"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                const p = products.find((x) => x.id === e.target.value);
                setPrice(p?.sellingPrice ?? 0);
              }}
              className="field"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                  {p.name} — stok {p.stock}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">
              Jumlah{product ? ` (stok ${product.stock})` : ""}
            </span>
            <QuantityInput name="quantity" defaultValue={1} max={product?.stock} onValueChange={setQty} />
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Harga satuan</span>
            <input type="hidden" name="unitPrice" value={price || ""} readOnly />
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
                placeholder={product ? groupDigits(String(product.sellingPrice)) : "0"}
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
                defaultValue=""
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
              <option value="">Pelanggan umum</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Tanggal</span>
              <input name="date" type="date" defaultValue={today} className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Tempat jualan</span>
              <input name="channel" list="chan" className="field" placeholder="mis. Toko" />
              <datalist id="chan">
                {channels.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Bayar pakai</span>
            <input name="paymentMethod" list="pm" className="field" placeholder="Tunai" />
            <datalist id="pm">
              {paymentMethods.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
        </div>
      </Card>

      <Card>
        <span className="mb-2 block text-[13px] font-medium text-ink-2">Status pembayaran</span>
        <div className="grid grid-cols-3 gap-2">
          {(["Paid", "Partially Paid", "Unpaid"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-[var(--radius-md)] border px-2 py-2.5 text-[12.5px] font-semibold transition-colors ${
                status === s ? "border-clay bg-clay-soft text-clay-ink" : "border-line-strong text-ink-2"
              }`}
            >
              {s === "Paid" ? "Lunas" : s === "Partially Paid" ? "Sebagian" : "Belum"}
            </button>
          ))}
        </div>
        <input type="hidden" name="paymentStatus" value={status} />

        {status === "Partially Paid" && (
          <label className="mt-3 block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Dibayar sekarang</span>
            <input type="hidden" name="amountPaid" value={paid || ""} readOnly />
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-3">Rp</span>
              <input
                inputMode="numeric"
                onChange={(e) => {
                  const v = num(e.target.value);
                  e.target.value = v ? groupDigits(String(v)) : "";
                  setPaid(v);
                }}
                className="field tnum !pl-10"
                placeholder="0"
              />
            </div>
          </label>
        )}

        <label className="mt-3 block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Catatan (opsional)</span>
          <textarea name="notes" rows={2} className="field" />
        </label>
      </Card>

      <div className="rounded-[var(--radius-lg)] bg-ink px-4 py-3.5 text-canvas">
        <div className="flex items-center justify-between text-[13px] text-canvas/70">
          <span>{qty} barang{discount > 0 ? ` · diskon ${formatIDR(discount)}` : ""}</span>
          {outstanding > 0 && <span>sisa {formatIDR(outstanding)}</span>}
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-[13px] font-medium text-canvas/80">Total</span>
          <span className="figure text-[24px]">{formatIDR(total)}</span>
        </div>
      </div>
    </ActionForm>
  );
}
