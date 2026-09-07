import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { markSalePaid } from "@/lib/actions/sales";
import { formatIDR, formatDateLong, invoiceNumber } from "@/lib/format";
import { waUrl, reminderMessage } from "@/lib/whatsapp";
import { paymentStatusLabel, paymentStatusTone } from "@/lib/labels";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, List, Row } from "@/components/ui";
import { InvoiceActions } from "@/components/invoice-actions";
import { ActionButton } from "@/components/action-button";
import { IconCheck } from "@/components/icons";

export default async function SaleDetailPage({ params }: PageProps<"/sales/[id]">) {
  const { id } = await params;
  const business = await getCurrentBusiness();
  if (!business) return null;

  const sale = await prisma.sale.findFirst({
    where: { id, businessId: business.id },
    include: { customer: true, channel: true, paymentMethod: true, items: { include: { product: true } }, order: true },
  });
  if (!sale) notFound();

  const number = invoiceNumber("INV", sale.id, sale.date);

  return (
    <>
      <PageHeader title="Penjualan" subtitle={number} back="/sales" />

      <Card className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label">Total</p>
            <p className="figure mt-1 text-[28px] text-ink">{formatIDR(sale.total)}</p>
          </div>
          <Badge tone={paymentStatusTone(sale.paymentStatus)}>{paymentStatusLabel(sale.paymentStatus)}</Badge>
        </div>
        {sale.outstandingBalance > 0 && (
          <p className="mt-2 text-[13px] text-clay">Sisa tagihan {formatIDR(sale.outstandingBalance)}</p>
        )}
      </Card>

      <List className="mb-4">
        {sale.items.map((it) => (
          <Row
            key={it.id}
            title={it.product.name}
            meta={`${it.quantity} × ${formatIDR(it.unitPrice)}`}
            amount={formatIDR(it.lineTotal)}
            chevron={false}
          />
        ))}
        {sale.discount > 0 && <Row title="Diskon" amount={`−${formatIDR(sale.discount)}`} amountTone="out" chevron={false} />}
      </List>

      <Card className="mb-4">
        <dl className="flex flex-col divide-y divide-line">
          {[
            ["Tanggal", formatDateLong(sale.date)],
            ["Pelanggan", sale.customer?.name ?? "Pelanggan umum"],
            ["Tempat jualan", sale.channel?.name ?? "-"],
            ["Bayar pakai", sale.paymentMethod?.name ?? "-"],
            ["Sudah dibayar", formatIDR(sale.amountPaid)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
              <dt className="text-[13px] text-ink-3">{k}</dt>
              <dd className="text-right text-[13.5px] font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        {sale.notes && <p className="mt-3 border-t border-line pt-3 text-[13px] text-ink-2">{sale.notes}</p>}
      </Card>

      {sale.outstandingBalance > 0 && (
        <div className="mb-3 flex flex-col gap-2.5">
          {sale.customer?.phone && (
            <a
              href={
                waUrl(
                  sale.customer.phone,
                  reminderMessage({
                    businessName: business.name,
                    customerName: sale.customer.name,
                    amount: sale.outstandingBalance,
                    ref: number,
                  })
                ) ?? undefined
              }
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary w-full"
            >
              Hubungi Pembeli (WhatsApp)
            </a>
          )}
          <ActionButton
            action={markSalePaid}
            hidden={{ id: sale.id }}
            className="btn btn-secondary w-full"
            pendingLabel="Menyimpan…"
            confirm="Tandai penjualan ini lunas? Sisa tagihan akan dicatat sebagai uang masuk."
          >
            <IconCheck className="h-4 w-4" strokeWidth={2.2} />
            Tandai Lunas
          </ActionButton>
        </div>
      )}

      <InvoiceActions url={`/api/invoice/sale/${sale.id}`} filename={`Invoice-${number.replace(/\//g, "-")}.pdf`} />
    </>
  );
}
