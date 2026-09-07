import Link from "next/link";
import type { ReactNode } from "react";
import { IconChevronRight } from "./icons";

/* ── Card ── */
export function Card({
  className = "",
  children,
  as: As = "div",
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "section";
}) {
  return <As className={`card p-4 ${className}`}>{children}</As>;
}

/* ── Section heading ── */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2.5 mt-7 flex items-center justify-between gap-3">
      <h2 className="label">{children}</h2>
      {action}
    </div>
  );
}

/* ── Money-flow + status tones ── */
const TEXT_TONE = {
  ink: "text-ink",
  in: "text-teal",
  out: "text-clay",
  good: "text-good",
  bad: "text-bad",
  warn: "text-warn",
  muted: "text-ink-3",
} as const;
export type TextTone = keyof typeof TEXT_TONE;

/* ── Stat tile ── */
export function Stat({
  label,
  value,
  sub,
  tone = "ink",
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: TextTone;
  href?: string;
}) {
  const body = (
    <>
      <p className="label truncate">{label}</p>
      <p className={`figure mt-2 truncate text-[20px] ${TEXT_TONE[tone]}`}>{value}</p>
      {sub && <p className="mt-1 truncate text-[12px] text-ink-3">{sub}</p>}
    </>
  );
  const cls = "card min-w-0 overflow-hidden p-3.5";
  return href ? (
    <Link href={href} className={`${cls} transition-colors active:bg-surface-2`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ── Badge ── */
const BADGE = {
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  info: "bg-teal-soft text-teal",
  neutral: "bg-surface-2 text-ink-2",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof BADGE; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${BADGE[tone]}`}
    >
      {children}
    </span>
  );
}

/* ── List + Row ── */
export function List({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card overflow-hidden p-0 ${className}`}>{children}</div>;
}

export function Row({
  href,
  onClick,
  leading,
  title,
  meta,
  amount,
  amountTone = "ink",
  amountSub,
  trailing,
  chevron = true,
}: {
  href?: string;
  onClick?: () => void;
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  amount?: string;
  amountTone?: TextTone;
  amountSub?: string;
  trailing?: ReactNode;
  chevron?: boolean;
}) {
  const body = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-medium text-ink">{title}</p>
        {meta && <p className="mt-0.5 truncate text-[13px] text-ink-3">{meta}</p>}
      </div>
      {amount != null && (
        <div className="shrink-0 text-right">
          <p className={`tnum text-[16px] font-semibold ${TEXT_TONE[amountTone]}`}>{amount}</p>
          {amountSub && <p className="tnum text-[12px] text-ink-3">{amountSub}</p>}
        </div>
      )}
      {trailing}
      {href && chevron && <IconChevronRight className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={2} />}
    </>
  );
  const cls =
    "flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left last:border-b-0";
  if (href)
    return (
      <Link href={href} className={`${cls} transition-colors active:bg-surface-2`}>
        {body}
      </Link>
    );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={`${cls} transition-colors active:bg-surface-2`}>
        {body}
      </button>
    );
  return <div className={cls}>{body}</div>;
}

/* ── Empty state ── */
export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  actionHref,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      {icon && (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-ink-3">
          {icon}
        </div>
      )}
      <p className="text-[18px] font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-xs text-[14.5px] leading-relaxed text-ink-2">{body}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-primary mt-5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

/* ── Callout / tip ── */
export function Callout({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warn" }) {
  const cls =
    tone === "warn"
      ? "bg-warn-soft text-warn"
      : "bg-surface-2 text-ink-2";
  return <p className={`rounded-[var(--radius-md)] px-4 py-3 text-[14px] leading-relaxed ${cls}`}>{children}</p>;
}

/* ── Field label wrapper ── */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12.5px] text-ink-3">{hint}</span>}
    </label>
  );
}

/* ── Avatar (initials) ── */
export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  const text = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[13px] font-semibold text-ink-2 ${className}`}
    >
      {text || "?"}
    </span>
  );
}

/* ── Progress bar ── */
export function Progress({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
      <div className="h-full rounded-full bg-clay" style={{ width: `${Math.min(Math.max(value, 2), 100)}%` }} />
    </div>
  );
}

/* ── Money-flow icon chip ── */
export function FlowChip({ dir }: { dir: "in" | "out" }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        dir === "in" ? "bg-teal-soft text-teal" : "bg-clay-soft text-clay"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
        {dir === "in" ? <path d="M12 19V5m0 0-6 6m6-6 6 6" transform="rotate(180 12 12)" /> : <path d="M12 19V5m0 0-6 6m6-6 6 6" />}
      </svg>
    </span>
  );
}
