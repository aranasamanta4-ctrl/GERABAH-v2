import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { recordWorkshopToFinance, deleteWorkshop } from "@/lib/actions/workshop";
import { formatIDR, formatDateLong } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, List, Row, Callout } from "@/components/ui";
import { ActionButton } from "@/components/action-button";
import { IconCheck } from "@/components/icons";

export default async function WorkshopDetailPage({ params }: PageProps<"/workshop/[id]">) {
  const { id } = await params;
  const business = await getCurrentBusiness();
  if (!business) return null;

  const w = await prisma.workshop.findFirst({
    where: { id, businessId: business.id },
    include: { gifts: { include: { product: true } } },
  });
  if (!w) notFound();

  const recorded = w.status === "recorded";

  return (
    <>
      <PageHeader
        title={w.organizer}
        subtitle={w.date ? formatDateLong(w.date) : "tanpa tanggal"}
        back="/workshop"
        action={recorded ? <Badge tone="good">Tercatat</Badge> : <Badge tone="neutral">Draf</Badge>}
      />

      <Card className="mb-4">
        <p className="label">Harga Penawaran Workshop</p>
        <p className="figure mt-1 text-[26px] text-ink">{formatIDR(w.offerPrice)}</p>
        <p className="mt-1 text-[13px] text-ink-2">
          {w.participants} peserta · {formatIDR(w.pricePerPerson)} / peserta
        </p>
      </Card>

      <p className="label mb-2">Produk Gift</p>
      <List className="mb-4">
        {w.gifts.map((g) => (
          <Row
            key={g.id}
            title={g.product.name}
            meta={`${g.quantity} × ${formatIDR(g.unitCost)}`}
            amount={formatIDR(g.quantity * g.unitCost)}
            chevron={false}
          />
        ))}
      </List>

      <Card className="mb-4">
        <dl className="flex flex-col divide-y divide-line text-[14px]">
          <div className="flex justify-between py-2 first:pt-0">
            <dt className="text-ink-3">Biaya gift</dt>
            <dd className="tnum font-medium text-ink">{formatIDR(w.giftCost)}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-3">Biaya bahan & operasional</dt>
            <dd className="tnum font-medium text-ink">{formatIDR(w.operationalCost)}</dd>
          </div>
          <div className="flex justify-between py-2 font-semibold">
            <dt>Total biaya (uang keluar)</dt>
            <dd className="tnum text-clay">{formatIDR(w.totalCost)}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-3">
              Target keuntungan {w.profitMode === "percent" ? `(${w.profitValue}%)` : ""}
            </dt>
            <dd className="tnum font-medium text-ink">{formatIDR(w.targetProfit)}</dd>
          </div>
          <div className="flex justify-between py-2 last:pb-0 font-semibold">
            <dt>Harga penawaran (uang masuk)</dt>
            <dd className="tnum text-teal">{formatIDR(w.offerPrice)}</dd>
          </div>
        </dl>
        {w.notes && <p className="mt-3 border-t border-line pt-3 text-[13px] text-ink-2">{w.notes}</p>}
      </Card>

      {recorded ? (
        <Callout>
          Biaya dan pemasukan workshop ini sudah dicatat ke Keuangan
          {w.recordedAt ? ` pada ${formatDateLong(w.recordedAt)}` : ""}.{" "}
          <Link href="/finance" className="font-semibold underline">
            Lihat di Keuangan
          </Link>
        </Callout>
      ) : (
        <ActionButton
          action={recordWorkshopToFinance}
          hidden={{ id: w.id }}
          className="btn btn-primary w-full"
          pendingLabel="Mencatat…"
          confirm={`Catat ke Keuangan? Uang keluar ${formatIDR(w.totalCost)} dan uang masuk ${formatIDR(
            w.offerPrice
          )} akan dibuat.`}
        >
          <IconCheck className="h-4 w-4" strokeWidth={2.2} />
          Catat ke Keuangan
        </ActionButton>
      )}

      <div className="mt-3">
        <ActionButton
          action={deleteWorkshop}
          hidden={{ id: w.id }}
          className="btn btn-ghost w-full text-bad"
          confirm={
            recorded
              ? "Hapus workshop ini? Catatan keuangan yang tertaut juga ikut terhapus."
              : "Hapus workshop ini?"
          }
          pendingLabel="…"
        >
          Hapus Workshop
        </ActionButton>
      </div>
    </>
  );
}
