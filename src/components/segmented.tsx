import Link from "next/link";

/** Link-based tab pills. Server-rendered; active tab passed in. */
export function Segmented({
  options,
  active,
}: {
  options: { key: string; label: string; href: string }[];
  active: string;
}) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.href}
          className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
            active === o.key
              ? "bg-ink text-canvas"
              : "border border-line-strong bg-surface text-ink-2 active:bg-surface-2"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
