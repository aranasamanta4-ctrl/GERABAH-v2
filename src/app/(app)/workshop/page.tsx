import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { formatIDR, formatDate } from "@/lib/format";
import { EmptyState, List, Row, Badge } from "@/components/ui";
import { IconCalculator, IconPlus } from "@/components/icons";

export default async function WorkshopPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const workshops = await prisma.workshop.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[25px] font-bold text-ink">Workshop</h1>
          <p className="mt-0.5 text-[14px] text-ink-2">Hitung harga & catat biaya/pemasukan workshop</p>
        </div>
        <Link href="/workshop/new" className="btn btn-primary !min-h-[44px] !px-4">
          <IconPlus className="h-4 w-4" strokeWidth={2.4} />
          Baru
        </Link>
      </header>

      {workshops.length === 0 ? (
        <EmptyState
          icon={<IconCalculator className="h-6 w-6" strokeWidth={1.7} />}
          title="Belum ada workshop"
          body="Hitung perkiraan harga workshop, simpan, lalu catat biaya dan pemasukannya ke Keuangan."
          actionLabel="Hitung Workshop"
          actionHref="/workshop/new"
        />
      ) : (
        <List>
          {workshops.map((w) => (
            <Row
              key={w.id}
              href={`/workshop/${w.id}`}
              title={w.organizer}
              meta={
                <>
                  {w.date ? formatDate(w.date) : "tanpa tanggal"} · {w.participants} peserta
                </>
              }
              amount={formatIDR(w.offerPrice)}
              amountSub={`untung ${formatIDR(w.targetProfit)}`}
              trailing={
                w.status === "recorded" ? (
                  <Badge tone="good">Tercatat</Badge>
                ) : (
                  <Badge tone="neutral">Draf</Badge>
                )
              }
              chevron={false}
            />
          ))}
        </List>
      )}
    </>
  );
}
