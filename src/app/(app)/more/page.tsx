import { getCurrentUser, getCurrentBusiness } from "@/lib/current-user";
import { List, Row, Avatar } from "@/components/ui";
import { LogoutButton } from "@/components/logout-button";
import { IconBox, IconReceipt, IconUsers, IconChart, IconSettings } from "@/components/icons";

const LINKS = [
  { href: "/products", label: "Produk", icon: IconBox },
  { href: "/sales", label: "Penjualan", icon: IconReceipt },
  { href: "/customers", label: "Pelanggan", icon: IconUsers },
  { href: "/reports", label: "Laporan", icon: IconChart },
  { href: "/settings", label: "Pengaturan", icon: IconSettings },
] as const;

export default async function MorePage() {
  const [user, business] = await Promise.all([getCurrentUser(), getCurrentBusiness()]);

  return (
    <>
      <header className="mb-5">
        <h1 className="text-[24px] font-bold text-ink">Lainnya</h1>
      </header>

      <div className="card mb-4 flex items-center gap-3 p-4">
        <Avatar name={business?.name ?? user?.name ?? "?"} className="h-12 w-12 text-[15px]" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-ink">{business?.name}</p>
          <p className="truncate text-[13px] text-ink-2">{user?.email}</p>
        </div>
      </div>

      <List>
        {LINKS.map((l) => (
          <Row
            key={l.href}
            href={l.href}
            leading={
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-ink-2">
                <l.icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </span>
            }
            title={l.label}
          />
        ))}
      </List>

      <div className="mt-4">
        <LogoutButton />
      </div>

      <p className="mt-8 text-center text-[11.5px] text-ink-3">
        GERABAH · Program Pengabdian Masyarakat PPMI KKSIK ITB
      </p>
    </>
  );
}
