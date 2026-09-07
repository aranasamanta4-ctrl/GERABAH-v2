import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { formatIDR, formatDate } from "@/lib/format";
import { paymentStatusLabel, paymentStatusTone } from "@/lib/labels";
import { EmptyState, List, Row, Badge, Card } from "@/components/ui";
import { IconReceipt, IconPlus } from "@/components/icons";

export default async function SalesPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const sales = await prisma.sale.findMany({
    where: { businessId: business.id },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { date: "desc" },
  });

  const total = sales.reduce((s, x) => s + x.total, 0);
  const unpaid = sales.reduce((s, x) => s + x.outstandingBalance, 0);

  return (
    <>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[25px] font-bold text-ink">Penjualan</h1>
          <p className="mt-0.5 text-[14px] text-ink-2">Barang yang sudah terjual</p>
        </div>
        <Link href="/sales/new" className="btn btn-primary !min-h-[44px] !px-4">
          <IconPlus className="h-4 w-4" strokeWidth={2.4} />
          Baru
        </Link>
      </header>

      {sales.length > 0 && (
        <Card className="mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="label">Total Penjualan</p>
              <p className="figure mt-1 text-[20px] text-ink">{formatIDR(total)}</p>
            </div>
            <div>
              <p className="label">Belum Dibayar</p>
              <p className={`figure mt-1 text-[20px] ${unpaid > 0 ? "text-clay" : "text-ink"}`}>{formatIDR(unpaid)}</p>
            </div>
          </div>
        </Card>
      )}

      {sales.length === 0 ? (
        <EmptyState
          icon={<IconReceipt className="h-6 w-6" strokeWidth={1.7} />}
          title="Belum ada penjualan"
          body="Catat penjualan di sini. Stok produk berkurang otomatis dan uang masuk tercatat di Keuangan."
          actionLabel="Catat Penjualan"
          actionHref="/sales/new"
        />
      ) : (
        <List>
          {sales.map((s) => (
            <Row
              key={s.id}
              href={`/sales/${s.id}`}
              title={s.items.map((i) => `${i.quantity}× ${i.product.name}`).join(", ")}
              meta={`${formatDate(s.date)} · ${s.customer?.name ?? "Pelanggan umum"}`}
              amount={formatIDR(s.total)}
              trailing={<Badge tone={paymentStatusTone(s.paymentStatus)}>{paymentStatusLabel(s.paymentStatus)}</Badge>}
              chevron={false}
            />
          ))}
        </List>
      )}
    </>
  );
}
