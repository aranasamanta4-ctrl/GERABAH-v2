"use client";

/** Penghitung jumlah dengan tombol − / + dan angka yang bisa diketik langsung. */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max,
  invalid,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  invalid?: boolean;
}) {
  const clamp = (v: number) => {
    let n = Number.isFinite(v) ? Math.floor(v) : min;
    if (n < min) n = min;
    if (max != null && max > 0 && n > max) n = max;
    return n;
  };

  const btn =
    "flex h-[54px] w-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-line-strong bg-surface text-[22px] font-semibold text-ink-2 transition-colors active:bg-surface-2 disabled:opacity-40";

  return (
    <div className="flex items-stretch gap-2">
      <button type="button" onClick={() => onChange(clamp(value - 1))} disabled={value <= min} className={btn} aria-label="Kurangi">
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className={`field tnum flex-1 text-center !text-[18px] font-semibold ${invalid ? "!border-bad" : ""}`}
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={max != null && max > 0 && value >= max}
        className={btn}
        aria-label="Tambah"
      >
        +
      </button>
    </div>
  );
}
