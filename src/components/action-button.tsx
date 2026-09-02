"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import type { FormState } from "@/lib/actions/_helpers";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function Inner({
  children,
  className,
  pendingLabel,
  confirm,
}: {
  children: ReactNode;
  className: string;
  pendingLabel?: string;
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      aria-busy={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? pendingLabel ?? "…" : children}
    </button>
  );
}

/** A single-button form bound to a server action. Shows a toast-style error on failure. */
export function ActionButton({
  action,
  hidden,
  children,
  className = "btn btn-secondary",
  pendingLabel,
  confirm,
}: {
  action: Action;
  hidden?: Record<string, string>;
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
  confirm?: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  return (
    <form action={formAction} className="contents">
      {hidden &&
        Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <Inner className={className} pendingLabel={pendingLabel} confirm={confirm}>
        {children}
      </Inner>
      {state.error && (
        <p className="col-span-full mt-1 text-[12.5px] font-medium text-bad">{state.error}</p>
      )}
    </form>
  );
}
