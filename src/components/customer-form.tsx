"use client";

import { Card } from "./ui";
import { ActionForm, SubmitButton } from "./form";
import { customerTypeLabel } from "@/lib/labels";
import type { FormState } from "@/lib/actions/_helpers";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

const TYPES = ["New", "Returning", "Reseller", "Wholesale", "Other"];

export function CustomerForm({
  action,
  initial,
  submitLabel,
}: {
  action: Action;
  initial?: { id?: string; name?: string; phone?: string | null; email?: string | null; address?: string | null; type?: string; notes?: string | null };
  submitLabel: string;
}) {
  return (
    <ActionForm
      action={action}
      hidden={initial?.id ? { id: initial.id } : undefined}
      footer={<SubmitButton>{submitLabel}</SubmitButton>}
    >
      <Card>
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Nama</span>
            <input name="name" required defaultValue={initial?.name} className="field" placeholder="Nama pelanggan" autoFocus={!initial?.id} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Nomor HP</span>
              <input name="phone" type="tel" inputMode="tel" defaultValue={initial?.phone ?? ""} className="field" placeholder="08…" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Jenis</span>
              <select name="type" defaultValue={initial?.type ?? "New"} className="field">
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {customerTypeLabel(t)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Email (opsional)</span>
            <input name="email" type="email" defaultValue={initial?.email ?? ""} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Alamat (opsional)</span>
            <textarea name="address" rows={2} defaultValue={initial?.address ?? ""} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Catatan (opsional)</span>
            <textarea name="notes" rows={2} defaultValue={initial?.notes ?? ""} className="field" placeholder="Preferensi, kebiasaan pesan…" />
          </label>
        </div>
      </Card>
    </ActionForm>
  );
}
