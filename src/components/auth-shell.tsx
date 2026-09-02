import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-10">
      <div className="mb-7">
        <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-clay">GERABAH</p>
        <h1 className="mt-3 text-[26px] font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{subtitle}</p>}
      </div>
      {children}
      {footer && <p className="mt-6 text-center text-[13.5px] text-ink-2">{footer}</p>}
    </div>
  );
}
