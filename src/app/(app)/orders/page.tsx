import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { formatIDR, formatDate } from "@/lib/format";
import { orderStatusLabel, orderStatusTone } from "@/lib/labels";
import { EmptyState, List, Row, Badge } from "@/components/ui";
import { Segmented } from "@/components/segmented";
import { IconClipboard, IconPlus } from "@/components/icons";

const TABS = [
  { key: "active", label: "Aktif", href: "/orders" },
  { key: "done", label: "Selesai", href: "/orders?filter=done" },
  { key: "all", label: "Semua", href: "/orders?filter=all" },
];

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const { filter } = await searchParams;
  const business = await getCurrentBusiness();
  if (!business) return null;

  const orders = await prisma.order.findMany({
    where: { businessId: business.id },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { date: "desc" }],
  });

  const active = filter === "done" ? "done" : filter === "all" ? "all" : "active";
  const shown = orders.filter((o) => {
    if (active === "done") return o.status === "Completed";
    if (active === "all") return true;
    return o.status !== "Completed" && o.status !== "Cancelled";
  });

  return (
    <>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold text-ink">Pesanan</h1>
          <p className="mt-0.5 text-[13.5px] text-ink-2">Pesanan yang dikerjakan dulu, dibayar kemudian</p>
        </div>
        <Link href="/orders/new" className="btn btn-primary !min-h-[40px] !px-3.5">
          <IconPlus className="h-4 w-4" strokeWidth={2.4} />
          Baru
        </Link>
      </header>

      <div className="mb-4">
        <Segmented options={TABS} active={active} />
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={<IconClipboard className="h-6 w-6" strokeWidth={1.7} />}
          title="Belum ada pesanan"
          body="Pakai Pesanan untuk barang yang harus dibuat dulu. Saat ditandai Selesai, otomatis jadi penjualan."
          actionLabel="Buat Pesanan"
          actionHref="/orders/new"
        />
      ) : (
        <List>
          {shown.map((o) => (
            <Row
              key={o.id}
              href={`/orders/${o.id}`}
              title={o.customer?.name ?? "Tanpa nama"}
              meta={
                <>
                  {o.items.map((i) => `${i.quantity}× ${i.product.name}`).join(", ")}
                  {o.dueDate && ` · tenggat ${formatDate(o.dueDate)}`}
                </>
              }
              amount={formatIDR(o.total)}
              amountSub={o.remainingPayment > 0 ? `sisa ${formatIDR(o.remainingPayment)}` : "lunas"}
              trailing={<Badge tone={orderStatusTone(o.status)}>{orderStatusLabel(o.status)}</Badge>}
              chevron={false}
            />
          ))}
        </List>
      )}
    </>
  );
}
