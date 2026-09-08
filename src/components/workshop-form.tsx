"use client";

import { useMemo, useState } from "react";
import { formatIDR } from "@/lib/format";
import { Card, Callout } from "./ui";
import { ActionForm, SubmitButton } from "./form";
import { RpField } from "./rp-field";
import { QtyStepper } from "./qty-stepper";
import { IconPlus, IconTrash } from "./icons";
import type { FormState } from "@/lib/actions/_helpers";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;
export type WorkshopProduct = { id: string; name: string; sellingPrice: number };
type GiftRow = { productId: string; quantity: number; unitCost: number };

export function WorkshopForm({ action, products }: { action: Action; products: WorkshopProduct[] }) {
  const first = products[0];
  const [organizer, setOrganizer] = useState("");
  const [date, setDate] = useState("");
  const [participants, setParticipants] = useState(0);
  const [gifts, setGifts] = useState<GiftRow[]>(
    first ? [{ productId: first.id, quantity: 1, unitCost: first.sellingPrice }] : []
  );
  const [operational, setOperational] = useState(0);
  const [profitMode, setProfitMode] = useState<"percent" | "nominal">("percent");
  const [profitValue, setProfitValue] = useState(0);
  const [notes, setNotes] = useState("");

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const setGift = (i: number, patch: Partial<GiftRow>) =>
    setGifts((g) => g.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const calc = useMemo(() => {
    const giftCost = gifts.reduce((s, g) => s + g.quantity * g.unitCost, 0);
    const totalCost = giftCost + operational;
    const profit = profitMode === "percent" ? Math.round((totalCost * profitValue) / 100) : profitValue;
    const offer = totalCost + profit;
    const perPerson = participants > 0 ? Math.round(offer / participants) : 0;
    return { giftCost, totalCost, profit, offer, perPerson };
  }, [gifts, operational, profitMode, profitValue, participants]);

  if (products.length === 0) {
    return (
      <Callout tone="warn">
        Belum ada produk. Tambahkan produk dulu di menu Produk supaya bisa dipilih sebagai gift.
      </Callout>
    );
  }

  return (
    <ActionForm action={action} footer={<SubmitButton>Simpan Workshop</SubmitButton>}>
      <input type="hidden" name="gifts" value={JSON.stringify(gifts)} readOnly />
      <input type="hidden" name="participants" value={participants} readOnly />
      <input type="hidden" name="operationalCost" value={operational || ""} readOnly />
      <input type="hidden" name="profitMode" value={profitMode} readOnly />
      <input type="hidden" name="profitValue" value={profitValue || ""} readOnly />

      <Card>
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Nama instansi / penyelenggara</span>
            <input
              name="organizer"
              required
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              className="field"
              placeholder="mis. SD Negeri 1"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Tanggal kegiatan</span>
              <input name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
            </label>
            <div>
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Jumlah peserta</span>
              <QtyStepper value={participants} onChange={setParticipants} min={0} />
            </div>
          </div>
        </div>
      </Card>

      <p className="label mb-2 mt-2">Produk untuk Gift</p>
      <div className="flex flex-col gap-3">
        {gifts.map((g, i) => {
          const p = byId.get(g.productId);
          return (
            <Card key={i}>
              <div className="flex flex-col gap-3">
                <label className="block">
                  <span className="mb-1.5 flex items-center justify-between text-[14px] font-medium text-ink-2">
                    Produk {i + 1}
                    {gifts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setGifts((x) => x.filter((_, idx) => idx !== i))}
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-bad"
                      >
                        <IconTrash className="h-4 w-4" strokeWidth={2} />
                        Hapus
                      </button>
                    )}
                  </span>
                  <select
                    value={g.productId}
                    onChange={(e) => {
                      const np = byId.get(e.target.value);
                      setGift(i, { productId: e.target.value, unitCost: np?.sellingPrice ?? 0 });
                    }}
                    className="field"
                  >
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Jumlah gift</span>
                  <QtyStepper value={g.quantity} onChange={(n) => setGift(i, { quantity: n })} />
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Biaya / produk (dari harga jual)</span>
                  <RpField
                    value={g.unitCost}
                    onChange={(n) => setGift(i, { unitCost: n })}
                    placeholder={p ? String(p.sellingPrice) : "0"}
                  />
                </label>
                <p className="text-[13px] text-ink-3">Subtotal: {formatIDR(g.quantity * g.unitCost)}</p>
              </div>
            </Card>
          );
        })}
        <button
          type="button"
          onClick={() =>
            setGifts((g) => [
              ...g,
              { productId: first?.id ?? "", quantity: 1, unitCost: first?.sellingPrice ?? 0 },
            ])
          }
          className="btn btn-secondary w-full"
        >
          <IconPlus className="h-4 w-4" strokeWidth={2.4} />
          Tambah Produk Gift
        </button>
      </div>

      <p className="label mb-2 mt-2">Biaya &amp; Keuntungan</p>
      <Card>
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Biaya bahan &amp; operasional workshop</span>
            <RpField value={operational} onChange={setOperational} />
            <span className="mt-1 block text-[12.5px] text-ink-3">Tanah liat, glasir, sewa tempat, transport, tenaga, dll.</span>
          </label>
          <div>
            <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Target keuntungan</span>
            <div className="mb-2 grid grid-cols-2 gap-2">
              {(["percent", "nominal"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setProfitMode(m)}
                  className={`min-h-[44px] rounded-full text-[14px] font-semibold transition-colors ${
                    profitMode === m ? "bg-clay text-white" : "bg-surface-2 text-ink-2"
                  }`}
                >
                  {m === "percent" ? "Persen (%)" : "Nominal (Rp)"}
                </button>
              ))}
            </div>
            {profitMode === "percent" ? (
              <div className="relative">
                <input
                  inputMode="numeric"
                  value={profitValue || ""}
                  onChange={(e) => setProfitValue(Number(e.target.value.replace(/\D/g, "")) || 0)}
                  className="field tnum !pr-9 font-semibold"
                  placeholder="0"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-3">%</span>
              </div>
            ) : (
              <RpField value={profitValue} onChange={setProfitValue} />
            )}
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Catatan (opsional)</span>
            <textarea name="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="field" />
          </label>
        </div>
      </Card>

      <Card className="!bg-ink text-canvas">
        <p className="label !text-canvas/60">Rekomendasi Harga</p>
        <dl className="mt-2 flex flex-col divide-y divide-canvas/15 text-[14.5px]">
          <div className="flex justify-between py-2 first:pt-0">
            <dt className="text-canvas/70">Total biaya workshop</dt>
            <dd className="tnum font-semibold">{formatIDR(calc.totalCost)}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-canvas/70">Total keuntungan</dt>
            <dd className="tnum font-semibold">{formatIDR(calc.profit)}</dd>
          </div>
          <div className="flex justify-between py-2.5">
            <dt className="font-semibold">Harga penawaran workshop</dt>
            <dd className="figure text-[20px]">{formatIDR(calc.offer)}</dd>
          </div>
          <div className="flex justify-between py-2 last:pb-0">
            <dt className="text-canvas/70">Harga per peserta</dt>
            <dd className="tnum font-semibold">
              {participants > 0 ? formatIDR(calc.perPerson) : "isi jumlah peserta"}
            </dd>
          </div>
        </dl>
      </Card>

      <Callout>
        Setelah disimpan, dari halaman detail kamu bisa tekan &quot;Catat ke Keuangan&quot; untuk mencatat biaya (uang
        keluar) dan harga penawaran (uang masuk) sekaligus.
      </Callout>
    </ActionForm>
  );
}
