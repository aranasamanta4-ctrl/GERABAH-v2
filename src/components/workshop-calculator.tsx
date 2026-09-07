"use client";

import { useMemo, useState } from "react";
import { formatIDR, groupDigits } from "@/lib/format";
import { waShareUrl } from "@/lib/whatsapp";
import { Card, Callout } from "@/components/ui";
import { IconPlus, IconTrash, IconMessage } from "@/components/icons";

const parse = (s: string) => Number(s.replace(/\D/g, "")) || 0;

export type WorkshopProduct = { id: string; name: string; cost: number; price: number };
type GiftRow = { productId: string; qty: string; cost: string };

function MoneyField({
  label,
  value,
  onChange,
  hint,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-[14px] font-medium text-ink-2">{label}</span>}
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-3">Rp</span>
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(groupDigits(e.target.value))}
          placeholder="0"
          className="field tnum !pl-10 font-semibold"
        />
      </div>
      {hint && <span className="mt-1 block text-[12.5px] text-ink-3">{hint}</span>}
    </label>
  );
}

export function WorkshopCalculator({ products }: { products: WorkshopProduct[] }) {
  const [instansi, setInstansi] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [peserta, setPeserta] = useState("");
  const [gifts, setGifts] = useState<GiftRow[]>([
    { productId: products[0]?.id ?? "", qty: "", cost: products[0] ? String(products[0].cost || "") : "" },
  ]);
  const [operasional, setOperasional] = useState("");
  const [profitMode, setProfitMode] = useState<"percent" | "nominal">("percent");
  const [profitValue, setProfitValue] = useState("");

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const setGift = (i: number, patch: Partial<GiftRow>) =>
    setGifts((g) => g.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const calc = useMemo(() => {
    const pesertaN = parse(peserta);
    const giftCost = gifts.reduce((s, g) => s + parse(g.qty) * parse(g.cost), 0);
    const opsCost = parse(operasional);
    const totalCost = giftCost + opsCost;
    const profit =
      profitMode === "percent" ? Math.round((totalCost * parse(profitValue)) / 100) : parse(profitValue);
    const offer = totalCost + profit;
    const perPeserta = pesertaN > 0 ? Math.round(offer / pesertaN) : 0;
    return { pesertaN, giftCost, opsCost, totalCost, profit, offer, perPeserta };
  }, [peserta, gifts, operasional, profitMode, profitValue]);

  const summary = useMemo(() => {
    const lines = [
      "*Perkiraan Harga Workshop*",
      instansi && `Instansi: ${instansi}`,
      tanggal && `Tanggal: ${tanggal}`,
      calc.pesertaN > 0 && `Peserta: ${calc.pesertaN} orang`,
      "",
      ...gifts
        .filter((g) => g.productId && parse(g.qty) > 0)
        .map((g) => `- ${productById.get(g.productId)?.name ?? "Produk"}: ${parse(g.qty)} × ${formatIDR(parse(g.cost))}`),
      "",
      `Total biaya: ${formatIDR(calc.totalCost)}`,
      `Keuntungan: ${formatIDR(calc.profit)}`,
      `Harga penawaran: ${formatIDR(calc.offer)}`,
      `Harga per peserta: ${formatIDR(calc.perPeserta)}`,
    ];
    return lines.filter((l) => l !== false).join("\n");
  }, [instansi, tanggal, gifts, calc, productById]);

  const noProducts = products.length === 0;

  return (
    <>
      <header className="mb-5">
        <h1 className="text-[25px] font-bold text-ink">Hitung Harga Workshop</h1>
        <p className="mt-0.5 text-[14px] text-ink-2">
          Isi biaya-biayanya, aplikasi menghitung harga penawaran. Data di sini tidak disimpan.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Nama instansi / penyelenggara</span>
              <input value={instansi} onChange={(e) => setInstansi(e.target.value)} className="field" placeholder="mis. SD Negeri 1" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Tanggal kegiatan</span>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="field" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Jumlah peserta</span>
                <input
                  inputMode="numeric"
                  value={peserta}
                  onChange={(e) => setPeserta(e.target.value.replace(/\D/g, ""))}
                  className="field tnum"
                  placeholder="0"
                />
              </label>
            </div>
          </div>
        </Card>

        <div>
          <p className="label mb-2">Produk untuk Gift</p>
          {noProducts ? (
            <Callout tone="warn">
              Belum ada produk. Tambahkan produk dulu di menu Produk supaya bisa dipilih sebagai gift.
            </Callout>
          ) : (
            <div className="flex flex-col gap-3">
              {gifts.map((g, i) => {
                const p = productById.get(g.productId);
                return (
                  <Card key={i}>
                    <div className="flex flex-col gap-3">
                      <label className="block">
                        <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Produk</span>
                        <select
                          value={g.productId}
                          onChange={(e) => {
                            const np = productById.get(e.target.value);
                            setGift(i, { productId: e.target.value, cost: np ? String(np.cost || "") : "" });
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
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Jumlah gift</span>
                          <input
                            inputMode="numeric"
                            value={g.qty}
                            onChange={(e) => setGift(i, { qty: e.target.value.replace(/\D/g, "") })}
                            className="field tnum"
                            placeholder="0"
                          />
                        </label>
                        <MoneyField
                          label="Biaya / produk"
                          value={g.cost}
                          onChange={(v) => setGift(i, { cost: v })}
                          hint={p && p.cost === 0 ? "biaya produksi belum diisi di menu Produk" : undefined}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-ink-3">
                          Subtotal: {formatIDR(parse(g.qty) * parse(g.cost))}
                        </span>
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
                      </div>
                    </div>
                  </Card>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  setGifts((g) => [
                    ...g,
                    { productId: products[0]?.id ?? "", qty: "", cost: products[0] ? String(products[0].cost || "") : "" },
                  ])
                }
                className="btn btn-secondary w-full"
              >
                <IconPlus className="h-4 w-4" strokeWidth={2.4} />
                Tambah Produk Gift
              </button>
            </div>
          )}
        </div>

        <Card>
          <div className="flex flex-col gap-4">
            <MoneyField
              label="Biaya bahan & operasional workshop"
              value={operasional}
              onChange={setOperasional}
              hint="Tanah liat, glasir, sewa tempat, transport, tenaga, dll."
            />
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
                    value={profitValue}
                    onChange={(e) => setProfitValue(e.target.value.replace(/\D/g, ""))}
                    className="field tnum !pr-9 font-semibold"
                    placeholder="0"
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-3">%</span>
                </div>
              ) : (
                <MoneyField value={profitValue} onChange={setProfitValue} />
              )}
            </div>
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
                {calc.pesertaN > 0 ? formatIDR(calc.perPeserta) : "isi jumlah peserta"}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(summary)}
            className="btn btn-secondary"
          >
            Salin Rincian
          </button>
          <a
            href={waShareUrl(summary)}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            <IconMessage className="h-[18px] w-[18px]" strokeWidth={2} />
            Kirim ke WhatsApp
          </a>
        </div>

        <Callout>
          Harga penawaran sudah termasuk biaya gift, bahan, operasional, dan target keuntunganmu. Angka per peserta
          berguna kalau instansi menghitung anggaran per orang.
        </Callout>
      </div>
    </>
  );
}
