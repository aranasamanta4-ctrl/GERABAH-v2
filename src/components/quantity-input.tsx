"use client";

import { useEffect, useState } from "react";

export function QuantityInput({
  name,
  defaultValue = 1,
  max,
  onValueChange,
}: {
  name: string;
  defaultValue?: number;
  max?: number;
  onValueChange?: (n: number) => void;
}) {
  const [n, setN] = useState(defaultValue);
  const clamp = (v: number) => Math.max(1, max != null && max > 0 ? Math.min(v, max) : v);

  useEffect(() => {
    onValueChange?.(n);
  }, [n, onValueChange]);

  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        onClick={() => setN((v) => clamp(v - 1))}
        className="flex h-[50px] w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-line-strong bg-surface text-[20px] font-semibold text-ink-2 active:bg-surface-2"
        aria-label="Kurangi"
      >
        −
      </button>
      <input
        name={name}
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={n}
        onChange={(e) => setN(clamp(Number(e.target.value) || 1))}
        className="field tnum flex-1 text-center !text-[18px] font-semibold"
      />
      <button
        type="button"
        onClick={() => setN((v) => clamp(v + 1))}
        className="flex h-[50px] w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-line-strong bg-surface text-[20px] font-semibold text-ink-2 active:bg-surface-2"
        aria-label="Tambah"
      >
        +
      </button>
    </div>
  );
}
