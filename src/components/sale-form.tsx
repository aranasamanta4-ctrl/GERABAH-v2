"use client";

import { useMemo, useState } from "react";
import { formatIDR } from "@/lib/format";
import { Card, Callout } from "./ui";
import { ActionForm, SubmitButton } from "./form";
import { ItemsEditor, type ItemRow } from "./items-editor";
import { RpField } from "./rp-field";
import type { FormState } from "@/lib/actions/_helpers";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;
type Product = { id: string; name: string; sellingPrice: number; stock: number };
type Customer = { id: string; name: string };

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
  const first = products[0];
  const [rows, setRows] = useState<ItemRow[]>(
    first ? [{ productId: first.id, quantity: 1, unitPrice: first.sellingPrice }] : []
  );
  const [discount, setDiscount] = useState(0);
  const [status, setStatus] = useState<"Paid" | "Partially Paid" | "Unpaid">("Paid");
  const [paid, setPaid] = useState(0);

  const stockById = useMemo(() => new Map(products.map((p) => [p.id, p.stock])), [products]);

  const subtotal = rows.reduce((s, r) => s + r.quantity * r.unitPrice, 0);
  const total = Math.max(subtotal - discount, 0);
  const outstanding = status === "Paid" ? 0 : status === "Unpaid" ? total : Math.max(total - paid, 0);
  const totalUnits = rows.reduce((s, r) => s + r.quantity, 0);

  // stok dicek per produk (produk sama di dua baris dijumlahkan)
  const perProduct = new Map<string, number>();
  for (const r of rows) perProduct.set(r.productId, (perProduct.get(r.productId) ?? 0) + r.quantity);
  const overStock = [...perProduct.entries()].some(([id, qty]) => qty > (stockById.get(id) ?? 0));

  if (products.length === 0) {
    return (
      <Callout tone="warn">
        Belum ada produk. Tambahkan produk dulu di menu Produk sebelum mencatat penjualan.
      </Callout>
    );
  }

  return (
    <ActionForm
      action={action}
      footer={
        <SubmitButton disabled={overStock}>
          {overStock ? "Perbaiki jumlah dulu" : "Simpan Penjualan"}
        </SubmitButton>
      }
    >
      <input type="hidden" name="items" value={JSON.stringify(rows)} readOnly />

      <p className="label mb-2">Barang yang Dijual</p>
      <ItemsEditor products={products} value={rows} onChange={setRows} showStock />

      <Card>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Diskon keseluruhan (opsional)</span>
          <input type="hidden" name="discount" value={discount || ""} readOnly />
          <RpField value={discount} onChange={setDiscount} />
        </label>
      </Card>

      <p className="label mb-2 mt-2">Pembeli &amp; Penjualan</p>
      <Card>
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Pelanggan (opsional)</span>
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
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Tanggal</span>
              <input name="date" type="date" defaultValue={today} className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Tempat jualan</span>
              <input name="channel" list="chan" className="field" placeholder="mis. Toko" />
              <datalist id="chan">
                {channels.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Bayar pakai</span>
            <input name="paymentMethod" list="pm" className="field" placeholder="Tunai" />
            <datalist id="pm">
              {paymentMethods.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
        </div>
      </Card>

      <p className="label mb-2 mt-2">Pembayaran</p>
      <Card>
        <span className="mb-2 block text-[14px] font-medium text-ink-2">Status pembayaran</span>
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
            <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Dibayar sekarang</span>
            <input type="hidden" name="amountPaid" value={paid || ""} readOnly />
            <RpField value={paid} onChange={setPaid} />
          </label>
        )}

        <label className="mt-3 block">
          <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Catatan (opsional)</span>
          <textarea name="notes" rows={2} className="field" />
        </label>
      </Card>

      <div className="rounded-[var(--radius-lg)] bg-ink px-4 py-3.5 text-canvas">
        <div className="flex items-center justify-between text-[13px] text-canvas/70">
          <span>
            {rows.length} jenis · {totalUnits} barang{discount > 0 ? ` · diskon ${formatIDR(discount)}` : ""}
          </span>
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
