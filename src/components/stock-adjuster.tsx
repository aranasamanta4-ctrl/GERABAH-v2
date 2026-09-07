"use client";

import { useState } from "react";
import { adjustProductStock } from "@/lib/actions/products";
import { ActionButton } from "./action-button";
import { ActionForm, SubmitButton } from "./form";

export function StockAdjuster({ productId, stock }: { productId: string; stock: number }) {
  const [mode, setMode] = useState<"quick" | "set">("quick");

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="label">Stok Sekarang</p>
        <p className="figure text-[22px] text-ink">{stock}</p>
      </div>

      {mode === "quick" ? (
        <>
          <div className="grid grid-cols-4 gap-2">
            {[-1, +1, +5, +10].map((d) => (
              <ActionButton
                key={d}
                action={adjustProductStock}
                hidden={{ productId, mode: "delta", value: String(d) }}
                className="btn btn-secondary !min-h-[44px] !px-0 tnum"
                pendingLabel="…"
              >
                {d > 0 ? `+${d}` : d}
              </ActionButton>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setMode("set")}
            className="mt-2.5 text-[12.5px] font-medium text-clay"
          >
            Atur jumlah pasti
          </button>
        </>
      ) : (
        <ActionForm
          action={adjustProductStock}
          hidden={{ productId, mode: "set" }}
          className="flex items-end gap-2"
          footer={
            <SubmitButton className="btn btn-primary shrink-0" pendingLabel="…">
              Simpan
            </SubmitButton>
          }
        >
          <label className="block flex-1">
            <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Jumlah stok</span>
            <input name="value" type="number" inputMode="numeric" min={0} defaultValue={stock} className="field tnum" autoFocus />
          </label>
        </ActionForm>
      )}
    </div>
  );
}
