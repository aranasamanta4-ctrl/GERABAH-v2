import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { formatIDR, formatDate } from "@/lib/format";
import { customerTypeLabel, paymentStatusLabel, paymentStatusTone } from "@/lib/labels";
import { PageHeader } from "@/components/page-header";
import { Card, Avatar, Badge, List, Row, EmptyState } from "@/components/ui";
import { IconEdit, IconReceipt } from "@/components/icons";

export default async function CustomerDetailPage({ params }: PageProps<"/customers/[id]">) {
  const { id } = await params;
  const business = await getCurrentBusiness();
  if (!business) return null;

  const customer = await prisma.customer.findFirst({
    where: { id, businessId: business.id },
    include: {
      sales: { include: { items: { include: { product: true } } }, orderBy: { date: "desc" } },
      orders: { orderBy: { date: "desc" } },
    },
  });
  if (!customer) notFound();

  const spent = customer.sales.reduce((s, x) => s + x.total, 0);
  const owed =
    customer.sales.reduce((s, x) => s + x.outstandingBalance, 0) +
    customer.orders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.remainingPayment, 0);
  const waLink = customer.phone
    ? `https://wa.me/${customer.phone.replace(/\D/g, "").replace(/^0/, "62")}`
    : null;

  return (
    <>
      <PageHeader
        title={customer.name}
        back="/customers"
        action={
          <Link href={`/customers/${id}/edit`} className="btn btn-secondary !min-h-[40px] !px-3">
            <IconEdit className="h-4 w-4" strokeWidth={2} />
          </Link>
        }
      />

      <Card className="mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={customer.name} className="h-12 w-12 text-[15px]" />
          <div className="min-w-0">
            <Badge tone="neutral">{customerTypeLabel(customer.type)}</Badge>
            {customer.phone && <p className="mt-1 text-[13px] text-ink-2">{customer.phone}</p>}
          </div>
        </div>
        {(customer.address || customer.notes) && (
          <div className="mt-3 border-t border-line pt-3 text-[13px] text-ink-2">
            {customer.address && <p>{customer.address}</p>}
            {customer.notes && <p className="mt-1 italic">{customer.notes}</p>}
          </div>
        )}
        {waLink && (
          <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-secondary mt-3 w-full">
            Chat WhatsApp
          </a>
        )}
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <Card>
          <p className="label">Total Belanja</p>
          <p className="figure mt-1 text-[19px] text-ink">{formatIDR(spent)}</p>
        </Card>
        <Card>
          <p className="label">Utang / Piutang</p>
          <p className={`figure mt-1 text-[19px] ${owed > 0 ? "text-clay" : "text-ink"}`}>{formatIDR(owed)}</p>
        </Card>
      </div>

      <p className="label mb-2 mt-6">Riwayat Pembelian</p>
      {customer.sales.length === 0 ? (
        <EmptyState title="Belum ada pembelian" body="Penjualan atas nama pelanggan ini akan muncul di sini." />
      ) : (
        <List>
          {customer.sales.map((s) => (
            <Row
              key={s.id}
              href={`/sales/${s.id}`}
              leading={
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-ink-3">
                  <IconReceipt className="h-4 w-4" strokeWidth={1.8} />
                </span>
              }
              title={s.items.map((i) => `${i.quantity}× ${i.product.name}`).join(", ")}
              meta={formatDate(s.date)}
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
