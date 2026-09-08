import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/actions/_helpers";
import { formatDate, formatDateTime } from "@/lib/format";
import { EmptyState, List, Row, Badge } from "@/components/ui";
import { IconClock } from "@/components/icons";

export default async function ActivityPage() {
  const business = await requireOwner();

  const logs = await prisma.activityLog.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const byDay = new Map<string, typeof logs>();
  for (const l of logs) {
    const key = l.createdAt.toISOString().slice(0, 10);
    byDay.set(key, [...(byDay.get(key) ?? []), l]);
  }

  return (
    <>
      <header className="mb-5">
        <h1 className="text-[25px] font-bold text-ink">Log Aktivitas</h1>
        <p className="mt-0.5 text-[14px] text-ink-2">Apa yang diubah, kapan, dan oleh siapa</p>
      </header>

      {logs.length === 0 ? (
        <EmptyState
          icon={<IconClock className="h-6 w-6" strokeWidth={1.7} />}
          title="Belum ada aktivitas"
          body="Setiap kali kamu atau staf mencatat penjualan, mengubah stok/harga, atau mencatat pengeluaran, tercatat di sini."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {[...byDay.entries()].map(([day, items]) => (
            <div key={day}>
              <p className="mb-1.5 px-1 text-[12.5px] font-semibold text-ink">{formatDate(items[0].createdAt)}</p>
              <List>
                {items.map((l) => (
                  <Row
                    key={l.id}
                    title={l.summary}
                    meta={`${formatDateTime(l.createdAt).split(", ").pop()} · ${l.userName}`}
                    trailing={
                      l.role === "staff" ? (
                        <Badge tone="info">Staf</Badge>
                      ) : (
                        <Badge tone="neutral">Owner</Badge>
                      )
                    }
                    chevron={false}
                  />
                ))}
              </List>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
