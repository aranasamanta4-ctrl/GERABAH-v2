"use client";

import { useId, useState } from "react";
import { IconEye, IconEyeOff } from "./icons";

/**
 * Kolom kata sandi dengan tombol lihat/sembunyikan.
 * Opsional: daftar syarat yang menyala saat terpenuhi (petunjuk format).
 */
export function PasswordField({
  name,
  label,
  autoComplete = "current-password",
  required = true,
  minLength,
  placeholder,
  autoFocus,
  showHint,
}: {
  name: string;
  label: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  autoFocus?: boolean;
  showHint?: boolean;
}) {
  const id = useId();
  const [show, setShow] = useState(false);
  const [value, setValue] = useState("");

  const longEnough = value.length >= (minLength ?? 8);

  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[14px] font-medium text-ink-2">{label}</span>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="field !pr-12"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-3 transition-colors active:bg-surface-2"
        >
          {show ? <IconEyeOff className="h-5 w-5" strokeWidth={1.9} /> : <IconEye className="h-5 w-5" strokeWidth={1.9} />}
        </button>
      </div>
      {showHint && (
        <span
          className={`mt-1.5 flex items-center gap-1.5 text-[12.5px] ${
            value.length === 0 ? "text-ink-3" : longEnough ? "text-good" : "text-warn"
          }`}
        >
          <span aria-hidden>{longEnough ? "✓" : "•"}</span>
          Minimal {minLength ?? 8} karakter
        </span>
      )}
    </label>
  );
}
