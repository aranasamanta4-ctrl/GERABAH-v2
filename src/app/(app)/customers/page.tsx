import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { formatIDR } from "@/lib/format";
import { EmptyState, List, Row, Avatar, Badge } from "@/components/ui";
import { IconUsers, IconPlus } from "@/components/icons";

export default async function CustomersPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const customers = await prisma.customer.findMany({
    where: { businessId: business.id },
    include: {
      sales: { select: { total: true, outstandingBalance: true } },
      orders: { select: { remainingPayment: true, status: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold text-ink">Pelanggan</h1>
          <p className="mt-0.5 text-[13.5px] text-ink-2">Riwayat belanja dan piutang</p>
        </div>
        <Link href="/customers/new" className="btn btn-primary !min-h-[40px] !px-3.5">
          <IconPlus className="h-4 w-4" strokeWidth={2.4} />
          Baru
        </Link>
      </header>

      {customers.length === 0 ? (
        <EmptyState
          icon={<IconUsers className="h-6 w-6" strokeWidth={1.7} />}
          title="Belum ada pelanggan"
          body="Simpan data pelanggan tetap supaya riwayat belanja dan sisa tagihannya gampang dilihat."
          actionLabel="Tambah Pelanggan"
          actionHref="/customers/new"
        />
      ) : (
        <List>
          {customers.map((c) => {
            const spent = c.sales.reduce((s, x) => s + x.total, 0);
            const owed =
              c.sales.reduce((s, x) => s + x.outstandingBalance, 0) +
              c.orders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.remainingPayment, 0);
            return (
              <Row
                key={c.id}
                href={`/customers/${c.id}`}
                leading={<Avatar name={c.name} />}
                title={c.name}
                meta={`${c.sales.length} penjualan · total belanja ${formatIDR(spent)}`}
                trailing={owed > 0 ? <Badge tone="warn">Utang {formatIDR(owed)}</Badge> : undefined}
              />
            );
          })}
        </List>
      )}
    </>
  );
}
