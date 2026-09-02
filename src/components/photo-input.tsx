"use client";

import { useRef, useState } from "react";
import { IconCamera } from "./icons";

export function PhotoInput({ name = "photo", current }: { name?: string; current?: string | null }) {
  const [preview, setPreview] = useState<string | null>(current ?? null);
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-dashed border-line-strong bg-surface-2"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Pratinjau foto produk" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-ink-3">
            <IconCamera className="h-7 w-7" strokeWidth={1.6} />
            <span className="text-[13px] font-medium">Tambah foto produk</span>
          </span>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        name={name}
        accept="image/*,video/mp4,video/webm,video/quicktime"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          setPreview(f ? URL.createObjectURL(f) : (current ?? null));
        }}
      />
      {preview && (
        <button
          type="button"
          onClick={() => {
            if (ref.current) ref.current.value = "";
            setPreview(null);
          }}
          className="mt-1.5 text-[12.5px] font-medium text-bad"
        >
          Hapus foto
        </button>
      )}
    </div>
  );
}
