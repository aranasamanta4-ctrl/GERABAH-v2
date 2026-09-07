import Link from "next/link";
import type { ReactNode } from "react";
import { IconChevronLeft } from "./icons";

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5">
      {back && (
        <Link
          href={back}
          className="mb-2 -ml-1.5 inline-flex items-center gap-1 rounded-full py-1 pl-1 pr-2.5 text-[14px] font-medium text-ink-2 transition-colors active:bg-surface-2"
        >
          <IconChevronLeft className="h-4 w-4" strokeWidth={2} />
          Kembali
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-[25px] font-bold text-ink">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[14px] text-ink-2">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
