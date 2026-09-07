"use client";

import { groupDigits } from "@/lib/format";

/**
 * Input Rupiah terkontrol dengan pemisah ribuan otomatis dan prefiks "Rp".
 * Nilai disimpan sebagai angka murni di state pemanggil.
 */
export function RpField({
  value,
  onChange,
  placeholder = "0",
  autoFocus,
  className = "",
  invalid,
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-3">Rp</span>
      <input
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        value={value ? groupDigits(String(value)) : ""}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
        placeholder={placeholder}
        className={`field tnum !pl-10 font-semibold ${invalid ? "!border-bad" : ""} ${className}`}
      />
    </div>
  );
}
