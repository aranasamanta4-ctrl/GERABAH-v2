"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconHome,
  IconWallet,
  IconBox,
  IconReceipt,
  IconClipboard,
  IconUsers,
  IconChart,
  IconSettings,
  IconPlus,
  IconArrowDown,
  IconArrowUp,
  IconCalculator,
  IconHelp,
  IconClock,
} from "./icons";

type Role = "owner" | "staff";
type Item = { href: string; label: string; icon: typeof IconHome; ownerOnly?: boolean };

const PRIMARY: Item[] = [
  { href: "/dashboard", label: "Beranda", icon: IconHome },
  { href: "/finance", label: "Keuangan", icon: IconWallet },
  { href: "/orders", label: "Pesanan", icon: IconClipboard },
  { href: "/more", label: "Lainnya", icon: IconBox },
];

const ALL: Item[] = [
  { href: "/dashboard", label: "Beranda", icon: IconHome },
  { href: "/finance", label: "Keuangan", icon: IconWallet },
  { href: "/products", label: "Produk", icon: IconBox },
  { href: "/sales", label: "Penjualan", icon: IconReceipt },
  { href: "/orders", label: "Pesanan", icon: IconClipboard },
  { href: "/receivables", label: "Belum Lunas", icon: IconWallet },
  { href: "/customers", label: "Pelanggan", icon: IconUsers },
  { href: "/workshop", label: "Workshop", icon: IconCalculator },
  { href: "/reports", label: "Laporan", icon: IconChart, ownerOnly: true },
  { href: "/activity", label: "Log Aktivitas", icon: IconClock, ownerOnly: true },
  { href: "/help", label: "Bantuan", icon: IconHelp },
  { href: "/settings", label: "Pengaturan", icon: IconSettings, ownerOnly: true },
];

const visibleFor = (role: Role) => (items: Item[]) =>
  role === "owner" ? items : items.filter((it) => !it.ownerOnly);

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

const RECORD_ACTIONS = [
  { href: "/finance/new?type=INCOME", label: "Uang Masuk", desc: "Uang yang diterima usaha", icon: IconArrowDown, tone: "in" },
  { href: "/finance/new?type=EXPENSE", label: "Uang Keluar", desc: "Uang yang dikeluarkan usaha", icon: IconArrowUp, tone: "out" },
  { href: "/sales/new", label: "Penjualan", desc: "Barang terjual, stok berkurang", icon: IconReceipt, tone: "neutral" },
  { href: "/orders/new", label: "Pesanan", desc: "Pesanan yang dikerjakan dulu", icon: IconClipboard, tone: "neutral" },
] as const;

function RecordSheet({ onClose, role }: { onClose: () => void; role: Role }) {
  const actions = role === "staff" ? RECORD_ACTIONS.filter((a) => a.label !== "Uang Masuk") : RECORD_ACTIONS;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="animate-fade absolute inset-0 bg-ink/35" onClick={onClose} />
      <div className="animate-sheet relative w-full max-w-md rounded-t-[24px] border border-line bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-pop sm:rounded-[24px] sm:pb-4">
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line-strong sm:hidden" />
        <p className="mb-3 px-1 text-[16px] font-bold text-ink">Mau catat apa?</p>
        <div className="flex flex-col gap-1.5">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              onClick={onClose}
              className="flex items-center gap-3.5 rounded-[var(--radius-md)] px-2.5 py-3 transition-colors active:bg-surface-2"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  a.tone === "in"
                    ? "bg-teal-soft text-teal"
                    : a.tone === "out"
                      ? "bg-clay-soft text-clay"
                      : "bg-surface-2 text-ink-2"
                }`}
              >
                <a.icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block text-[16px] font-semibold text-ink">{a.label}</span>
                <span className="block text-[13px] text-ink-3">{a.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TabBar({ role = "owner" }: { role?: Role }) {
  const pathname = usePathname();
  const [sheet, setSheet] = useState(false);
  const items = visibleFor(role)(PRIMARY);

  return (
    <>
      {sheet && <RecordSheet onClose={() => setSheet(false)} role={role} />}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-sm sm:hidden">
        <div className="mx-auto grid h-tabbar max-w-md grid-cols-5 items-start px-1 pt-1.5">
          {items.slice(0, 2).map((it) => (
            <TabLink key={it.href} it={it} active={isActive(pathname, it.href)} />
          ))}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setSheet(true)}
              className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-clay text-white shadow-pop transition-transform active:scale-95"
              aria-label="Catat"
            >
              <IconPlus className="h-6 w-6" strokeWidth={2.5} />
            </button>
          </div>
          {items.slice(2).map((it) => (
            <TabLink key={it.href} it={it} active={isActive(pathname, it.href)} />
          ))}
        </div>
      </nav>
    </>
  );
}

function TabLink({ it, active }: { it: Item; active: boolean }) {
  return (
    <Link
      href={it.href}
      className={`flex flex-col items-center gap-1 rounded-lg py-1 text-[11.5px] font-medium transition-colors ${
        active ? "text-clay" : "text-ink-3"
      }`}
    >
      <it.icon className="h-[24px] w-[24px]" strokeWidth={active ? 2.1 : 1.8} />
      {it.label}
    </Link>
  );
}

export function Sidebar({ businessName, role = "owner" }: { businessName: string; role?: Role }) {
  const pathname = usePathname();
  const items = visibleFor(role)(ALL);
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface px-3 py-5 sm:flex">
      <div className="mb-6 px-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">GERABAH</p>
        <p className="mt-1 truncate text-[15px] font-bold text-ink">{businessName}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5">
        {items.map((it) => {
          const active = isActive(pathname, it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-[15px] font-medium transition-colors ${
                active ? "bg-clay-soft text-clay-ink" : "text-ink-2 hover:bg-surface-2"
              }`}
            >
              <it.icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.1 : 1.8} />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <Link
        href={role === "staff" ? "/finance/new?type=EXPENSE" : "/finance/new?type=INCOME"}
        className="btn btn-primary mt-3"
      >
        <IconPlus className="h-4 w-4" strokeWidth={2.4} />
        {role === "staff" ? "Catat Uang Keluar" : "Catat Uang Masuk"}
      </Link>
    </aside>
  );
}
