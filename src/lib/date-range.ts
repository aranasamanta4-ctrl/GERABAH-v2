export type RangeKey = "today" | "week" | "month" | "year";

export function resolveRange(key: string | undefined): { from: Date; to: Date; label: string } {
  const now = new Date();
  const to = now;

  if (key === "today") {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { from, to, label: "Hari Ini" };
  }
  if (key === "week") {
    const from = new Date(now);
    from.setDate(now.getDate() - 7);
    return { from, to, label: "7 Hari Terakhir" };
  }
  if (key === "year") {
    const from = new Date(now.getFullYear(), 0, 1);
    return { from, to, label: "Tahun Ini" };
  }
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from, to, label: "Bulan Ini" };
}

export function previousRange(from: Date, to: Date): { from: Date; to: Date } {
  const span = to.getTime() - from.getTime();
  return { from: new Date(from.getTime() - span), to: new Date(from.getTime()) };
}

export function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function todayISO(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export type Bucket = { start: Date; end: Date; label: string; fullLabel: string };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Trailing buckets for the cash-flow chart, sized to the selected range. */
export function cashflowBuckets(rangeKey: string | undefined): { buckets: Bucket[]; windowLabel: string } {
  const now = new Date();
  const buckets: Bucket[] = [];

  if (rangeKey === "today") {
    for (let i = 6; i >= 0; i--) {
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
      buckets.push({
        start,
        end,
        label: start.toLocaleDateString("id-ID", { weekday: "short" }),
        fullLabel: start.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" }),
      });
    }
    return { buckets, windowLabel: "7 hari terakhir" };
  }

  if (rangeKey === "week") {
    for (let i = 7; i >= 0; i--) {
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7 - 6));
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
      const last = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
      buckets.push({
        start,
        end,
        label: `${start.getDate()}/${start.getMonth() + 1}`,
        fullLabel: `${start.getDate()}–${last.getDate()} ${last.toLocaleDateString("id-ID", { month: "short" })}`,
      });
    }
    return { buckets, windowLabel: "8 minggu terakhir" };
  }

  if (rangeKey === "year") {
    for (let i = 4; i >= 0; i--) {
      const year = now.getFullYear() - i;
      buckets.push({
        start: new Date(year, 0, 1),
        end: new Date(year + 1, 0, 1),
        label: String(year),
        fullLabel: `Tahun ${year}`,
      });
    }
    return { buckets, windowLabel: "5 tahun terakhir" };
  }

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      start,
      end: new Date(start.getFullYear(), start.getMonth() + 1, 1),
      label: start.toLocaleDateString("id-ID", { month: "short" }),
      fullLabel: start.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
    });
  }
  return { buckets, windowLabel: "6 bulan terakhir" };
}
