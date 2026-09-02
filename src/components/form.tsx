"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { IconAlert } from "./icons";
import type { FormState } from "@/lib/actions/_helpers";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function SubmitButton({
  children,
  className = "btn btn-primary w-full",
  pendingLabel,
}: {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending ? pendingLabel ?? "Menyimpan…" : children}
    </button>
  );
}

/**
 * Server-action form with inline error + pending state.
 * `footer` renders below the fields (usually the submit button).
 */
export function ActionForm({
  action,
  children,
  footer,
  className = "flex flex-col gap-4",
  hidden,
}: {
  action: Action;
  children: ReactNode;
  footer: ReactNode;
  className?: string;
  hidden?: Record<string, string>;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className={className}>
      {hidden &&
        Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {children}
      {state.error && (
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-bad-soft px-3.5 py-3 text-[13px] font-medium text-bad">
          <IconAlert className="mt-px h-4 w-4 shrink-0" strokeWidth={2} />
          <span>{state.error}</span>
        </div>
      )}
      {footer}
    </form>
  );
}
