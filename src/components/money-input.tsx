"use client";

import { useId, useState } from "react";
import { groupDigits } from "@/lib/format";

/**
 * Grouped-digit Rupiah input. Stores the raw grouped string in a hidden-free
 * way: the visible input carries the name, the server strips non-digits.
 */
export function MoneyInput({
  name,
  defaultValue,
  placeholder = "0",
  required,
  autoFocus,
  big,
  tone = "ink",
}: {
  name: string;
  defaultValue?: number;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  big?: boolean;
  tone?: "ink" | "in" | "out";
}) {
  const [value, setValue] = useState(defaultValue ? groupDigits(String(defaultValue)) : "");
  const id = useId();
  const toneCls = tone === "in" ? "text-teal" : tone === "out" ? "text-clay" : "text-ink";

  return (
    <div className="relative">
      <span
        className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-3 ${
          big ? "text-[22px]" : "text-[15px]"
        }`}
      >
        Rp
      </span>
      <input
        id={id}
        name={name}
        inputMode="numeric"
        autoComplete="off"
        required={required}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(groupDigits(e.target.value))}
        placeholder={placeholder}
        className={`field tnum font-semibold ${toneCls} ${
          big ? "!min-h-[68px] !pl-11 !text-[28px]" : "!pl-10"
        }`}
      />
    </div>
  );
}
