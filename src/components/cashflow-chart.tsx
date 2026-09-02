"use client";

import { useState } from "react";
import { formatIDR, formatIDRCompact } from "@/lib/format";

export type ChartBucket = { label: string; fullLabel: string; income: number; expense: number };

export function CashflowChart({ buckets, windowLabel }: { buckets: ChartBucket[]; windowLabel: string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...buckets.map((b) => Math.max(b.income, b.expense)));
  const shown = active != null ? buckets[active] : null;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="label">Uang Masuk vs Keluar</p>
        <p className="text-[11.5px] text-ink-3">{windowLabel}</p>
      </div>

      <div className="flex items-end gap-1.5" style={{ height: 108 }}>
        {buckets.map((b, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(active === i ? null : i)}
            className="group flex flex-1 flex-col items-center justify-end gap-1"
            style={{ height: "100%" }}
          >
            <span className="flex w-full items-end justify-center gap-[3px]" style={{ height: "100%" }}>
              <span
                className={`w-full max-w-[10px] rounded-t-[3px] transition-colors ${
                  active === i ? "bg-teal" : "bg-teal/45"
                }`}
                style={{ height: `${Math.max((b.income / max) * 100, b.income > 0 ? 4 : 0)}%` }}
              />
              <span
                className={`w-full max-w-[10px] rounded-t-[3px] transition-colors ${
                  active === i ? "bg-clay" : "bg-clay/40"
                }`}
                style={{ height: `${Math.max((b.expense / max) * 100, b.expense > 0 ? 4 : 0)}%` }}
              />
            </span>
            <span className={`text-[10px] ${active === i ? "font-semibold text-ink" : "text-ink-3"}`}>
              {b.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 border-t border-line pt-3">
        {shown ? (
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="font-semibold text-ink">{shown.fullLabel}</span>
            <span className="flex gap-3">
              <span className="tnum text-teal">+{formatIDRCompact(shown.income)}</span>
              <span className="tnum text-clay">−{formatIDRCompact(shown.expense)}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-[12px] text-ink-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-teal/60" /> Masuk
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-clay/50" /> Keluar
            </span>
            <span className="ml-auto">Ketuk batang untuk detail</span>
          </div>
        )}
      </div>
      <span className="sr-only">
        {buckets.map((b) => `${b.fullLabel}: masuk ${formatIDR(b.income)}, keluar ${formatIDR(b.expense)}. `)}
      </span>
    </div>
  );
}
