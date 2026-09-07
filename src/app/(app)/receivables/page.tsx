import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { formatIDR, formatDateLong } from "@/lib/format";
import { paymentStatusLabel, paymentStatusTone } from "@/lib/labels";
import { waUrl, reminderMessage } from "@/lib/whatsapp";
import { Card, Badge, EmptyState, Callout } from "@/components/ui";
import { IconWallet } from "@/components/icons";

type Bill = {
  id: string;
  kind: "order" | "sale";
  href: string;
  customerName: string | null;
  phone: string | null;
  amount: number;
  dueDate: Date | null;
  status: string;
  ref: string | null;
};

export default async function ReceivablesPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const [orders, sales] = await Promise.all([
    prisma.order.findMany({
      where: { businessId: business.id, remainingPayment: { gt: 0 }, status: { not: "Cancelled" } },
      include: { customer: true },
      orderBy: [{ dueDate: "asc" }, { date: "desc" }],
    }),
    prisma.sale.findMany({
      where: { businessId: business.id, outstandingBalance: { gt: 0 } },
      include: { customer: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const bills: Bill[] = [
    ...orders.map((o) => ({
      id: o.id,
      kind: "order" as const,
      href: `/orders/${o.id}`,
      customerName: o.customer?.name ?? null,
      phone: o.customer?.phone ?? null,
      amount: o.remainingPayment,
      dueDate: o.dueDate,
      status: o.paymentStatus,
      ref: null,
    })),
    ...sales.map((s) => ({
      id: s.id,
      kind: "sale" as const,
      href: `/sales/${s.id}`,
      customerName: s.customer?.name ?? null,
      phone: s.customer?.phone ?? null,
      amount: s.outstandingBalance,
      dueDate: null,
      status: s.paymentStatus,
      ref: null,
    })),
  ].sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  const total = bills.reduce((s, b) => s + b.amount, 0);

  return (
    <>
      <header className="mb-5">
        <h1 className="text-[25px] font-bold text-ink">Belum Lunas</h1>
        <p className="mt-0.5 text-[14px] text-ink-2">Pesanan &amp; penjualan yang pembayarannya belum penuh</p>
      </header>

      {bills.length === 0 ? (
        <EmptyState
          icon={<IconWallet className="h-6 w-6" strokeWidth={1.7} />}
          title="Semua sudah lunas"
          body="Tagihan yang belum dibayar penuh akan muncul di sini, lengkap dengan tombol pengingat WhatsApp."
        />
      ) : (
        <>
          <Card className="mb-4">
            <p className="label">Total Tagihan Belum Lunas</p>
            <p className="figure mt-1 text-[24px] text-clay">{formatIDR(total)}</p>
            <p className="mt-1 text-[13px] text-ink-3">{bills.length} tagihan dari pelanggan</p>
          </Card>

          <div className="flex flex-col gap-3">
            {bills.map((b) => {
              const link =
                b.phone &&
                waUrl(
                  b.phone,
                  reminderMessage({
                    businessName: business.name,
                    customerName: b.customerName,
                    amount: b.amount,
                    dueDate: b.dueDate,
                  })
                );
              return (
                <Card key={`${b.kind}-${b.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[16px] font-semibold text-ink">{b.customerName ?? "Tanpa nama"}</p>
                      <p className="mt-0.5 text-[13.5px] text-ink-3">{b.phone || "Nomor HP belum ada"}</p>
                    </div>
                    <Badge tone={paymentStatusTone(b.status)}>{paymentStatusLabel(b.status)}</Badge>
                  </div>

                  <dl className="mt-3 flex flex-col divide-y divide-line border-t border-line pt-2 text-[14px]">
                    <div className="flex justify-between py-1.5">
                      <dt className="text-ink-3">Jumlah tagihan</dt>
                      <dd className="tnum font-semibold text-clay">{formatIDR(b.amount)}</dd>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <dt className="text-ink-3">Jatuh tempo</dt>
                      <dd className="font-medium text-ink">{b.dueDate ? formatDateLong(b.dueDate) : "—"}</dd>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <dt className="text-ink-3">Jenis</dt>
                      <dd className="font-medium text-ink">{b.kind === "order" ? "Pesanan" : "Penjualan"}</dd>
                    </div>
                  </dl>

                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    <Link href={b.href} className="btn btn-secondary">
                      Lihat Detail
                    </Link>
                    {link ? (
                      <a href={link} target="_blank" rel="noreferrer" className="btn btn-primary">
                        Ingatkan (WA)
                      </a>
                    ) : (
                      <span className="btn btn-primary pointer-events-none opacity-50">Ingatkan (WA)</span>
                    )}
                  </div>
                  {!b.phone && (
                    <p className="mt-2 text-[12.5px] text-warn">
                      Tambah nomor HP pelanggan ini dulu supaya bisa dihubungi lewat WhatsApp.
                    </p>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="mt-6">
            <Callout>
              Tombol &quot;Ingatkan (WA)&quot; membuka WhatsApp dengan pesan pengingat yang sudah disiapkan — kamu
              tinggal periksa lalu kirim.
            </Callout>
          </div>
        </>
      )}
    </>
  );
}
