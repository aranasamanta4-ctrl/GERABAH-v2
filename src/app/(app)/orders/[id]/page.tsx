import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { advanceOrderStatus, recordOrderPayment } from "@/lib/actions/orders";
import { formatIDR, formatDateLong, invoiceNumber } from "@/lib/format";
import { ORDER_STATUS_FLOW, orderStatusLabel, orderStatusTone, paymentStatusLabel, paymentStatusTone } from "@/lib/labels";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, List, Row, Callout } from "@/components/ui";
import { ActionButton } from "@/components/action-button";
import { ActionForm, SubmitButton } from "@/components/form";
import { MoneyInput } from "@/components/money-input";
import { InvoiceActions } from "@/components/invoice-actions";
import { IconCheck, IconChevronRight } from "@/components/icons";

export default async function OrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const business = await getCurrentBusiness();
  if (!business) return null;

  const order = await prisma.order.findFirst({
    where: { id, businessId: business.id },
    include: { customer: true, channel: true, items: { include: { product: true } }, sale: true },
  });
  if (!order) notFound();

  const number = invoiceNumber("ORD", order.id, order.date);
  const item = order.items[0];
  const stepIndex = ORDER_STATUS_FLOW.indexOf(order.status as (typeof ORDER_STATUS_FLOW)[number]);
  const nextStatus = stepIndex >= 0 && stepIndex < ORDER_STATUS_FLOW.length - 1 ? ORDER_STATUS_FLOW[stepIndex + 1] : null;
  const done = order.status === "Completed";
  const cancelled = order.status === "Cancelled";
  const active = !done && !cancelled;
  const stockShort = nextStatus === "Completed" && item && item.quantity > item.product.stock;

  return (
    <>
      <PageHeader title={order.customer?.name ?? "Pesanan"} subtitle={number} back="/orders" />

      {/* pipeline */}
      {!cancelled && (
        <div className="mb-4 flex items-center gap-1.5">
          {ORDER_STATUS_FLOW.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full ${
                  i <= (done ? ORDER_STATUS_FLOW.length : stepIndex) ? "bg-clay" : "bg-line-strong"
                }`}
              />
              <span className={`text-[9.5px] ${i === stepIndex && !done ? "font-semibold text-ink" : "text-ink-3"}`}>
                {orderStatusLabel(s)}
              </span>
            </div>
          ))}
        </div>
      )}

      <Card className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label">Total Pesanan</p>
            <p className="figure mt-1 text-[26px] text-ink">{formatIDR(order.total)}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
            <Badge tone={paymentStatusTone(order.paymentStatus)}>{paymentStatusLabel(order.paymentStatus)}</Badge>
          </div>
        </div>
        {order.remainingPayment > 0 && (
          <p className="mt-2 text-[13px] text-clay">
            DP {formatIDR(order.downPayment)} · sisa {formatIDR(order.remainingPayment)}
          </p>
        )}
      </Card>

      <List className="mb-4">
        {order.items.map((it) => (
          <Row
            key={it.id}
            title={it.product.name}
            meta={`${it.quantity} × ${formatIDR(it.price)}`}
            amount={formatIDR(it.quantity * it.price - it.discount)}
            chevron={false}
          />
        ))}
      </List>

      <Card className="mb-4">
        <dl className="flex flex-col divide-y divide-line">
          {[
            ["Dibuat", formatDateLong(order.date)],
            ["Tenggat", order.dueDate ? formatDateLong(order.dueDate) : "-"],
            ["Dari", order.channel?.name ?? "-"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
              <dt className="text-[13px] text-ink-3">{k}</dt>
              <dd className="text-right text-[13.5px] font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        {order.notes && <p className="mt-3 border-t border-line pt-3 text-[13px] text-ink-2">{order.notes}</p>}
      </Card>

      {stockShort && (
        <div className="mb-3">
          <Callout tone="warn">
            Stok {item.product.name} tinggal {item.product.stock}, pesanan butuh {item.quantity}. Tambah stok dulu di
            halaman Produk sebelum menyelesaikan pesanan.
          </Callout>
        </div>
      )}

      {active && (
        <div className="flex flex-col gap-2.5">
          {nextStatus && (
            <ActionButton
              action={advanceOrderStatus}
              hidden={{ id: order.id, status: nextStatus }}
              className="btn btn-primary w-full"
              pendingLabel="Memproses…"
              confirm={
                nextStatus === "Completed"
                  ? "Selesaikan pesanan? Stok akan berkurang dan pesanan ini menjadi penjualan."
                  : undefined
              }
            >
              {nextStatus === "Completed" ? (
                <IconCheck className="h-4 w-4" strokeWidth={2.2} />
              ) : (
                <IconChevronRight className="h-4 w-4" strokeWidth={2.2} />
              )}
              {nextStatus === "Completed" ? "Selesaikan Pesanan" : `Lanjut ke ${orderStatusLabel(nextStatus)}`}
            </ActionButton>
          )}

          {order.remainingPayment > 0 && (
            <ActionForm
              action={recordOrderPayment}
              hidden={{ orderId: order.id }}
              className="card flex flex-col gap-3 p-4"
              footer={
                <SubmitButton className="btn btn-secondary w-full" pendingLabel="Menyimpan…">
                  Catat Pembayaran
                </SubmitButton>
              }
            >
              <span className="text-[13px] font-medium text-ink-2">Terima pembayaran</span>
              <MoneyInput name="amount" placeholder="0" />
            </ActionForm>
          )}

          <ActionButton
            action={advanceOrderStatus}
            hidden={{ id: order.id, status: "Cancelled" }}
            className="btn btn-ghost w-full text-bad"
            confirm="Batalkan pesanan ini?"
            pendingLabel="…"
          >
            Batalkan Pesanan
          </ActionButton>
        </div>
      )}

      {cancelled && <Callout tone="warn">Pesanan ini dibatalkan.</Callout>}

      {done && order.sale && (
        <div className="mt-3">
          <Callout>Pesanan selesai dan sudah menjadi penjualan.</Callout>
          <div className="mt-3">
            <Row href={`/sales/${order.sale.id}`} title="Lihat penjualannya" chevron />
          </div>
        </div>
      )}

      <div className="mt-4">
        <InvoiceActions url={`/api/invoice/order/${order.id}`} filename={`Nota-${number.replace(/\//g, "-")}.pdf`} />
      </div>
    </>
  );
}
