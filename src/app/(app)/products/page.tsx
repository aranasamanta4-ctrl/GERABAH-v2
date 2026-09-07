import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { formatIDR } from "@/lib/format";
import { Card, EmptyState, List, Row, Badge, Callout } from "@/components/ui";
import { Segmented } from "@/components/segmented";
import { IconBox, IconPlus } from "@/components/icons";

const TABS = [
  { key: "active", label: "Aktif", href: "/products" },
  { key: "low", label: "Stok Menipis", href: "/products?filter=low" },
  { key: "archived", label: "Arsip", href: "/products?filter=archived" },
];

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const { filter } = await searchParams;
  const business = await getCurrentBusiness();
  if (!business) return null;

  const products = await prisma.product.findMany({
    where: { businessId: business.id },
    include: { category: true, costComponents: true },
    orderBy: { createdAt: "desc" },
  });

  const active = filter === "archived" ? "archived" : filter === "low" ? "low" : "active";
  const shown = products.filter((p) => {
    if (active === "archived") return p.status === "inactive";
    if (active === "low") return p.status !== "inactive" && p.stock <= p.minStock;
    return p.status !== "inactive";
  });

  const totalStockValue = products
    .filter((p) => p.status !== "inactive")
    .reduce((s, p) => s + p.stock * p.sellingPrice, 0);

  return (
    <>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[25px] font-bold text-ink">Produk</h1>
          <p className="mt-0.5 text-[14px] text-ink-2">Katalog, stok, dan untung per barang</p>
        </div>
        <Link href="/products/new" className="btn btn-primary !min-h-[44px] !px-4">
          <IconPlus className="h-4 w-4" strokeWidth={2.4} />
          Baru
        </Link>
      </header>

      <Card className="mb-4">
        <p className="label">Nilai Stok (harga jual)</p>
        <p className="figure mt-1.5 text-[26px] text-ink">{formatIDR(totalStockValue)}</p>
      </Card>

      <div className="mb-4">
        <Segmented options={TABS} active={active} />
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={<IconBox className="h-6 w-6" strokeWidth={1.7} />}
          title={active === "active" ? "Belum ada produk" : "Tidak ada produk di sini"}
          body="Tambahkan produk beserta biaya produksinya, supaya untung dan margin tiap barang dihitung otomatis."
          actionLabel={active === "active" ? "Tambah Produk" : undefined}
          actionHref={active === "active" ? "/products/new" : undefined}
        />
      ) : (
        <List>
          {shown.map((p) => {
            const cost = p.costComponents.reduce((s, c) => s + c.amount, 0);
            const profit = p.sellingPrice - cost;
            const low = p.status !== "inactive" && p.stock <= p.minStock;
            return (
              <Row
                key={p.id}
                href={`/products/${p.id}`}
                leading={
                  p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photoUrl} alt="" className="h-11 w-11 shrink-0 rounded-[10px] object-cover" />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-ink-3">
                      <IconBox className="h-5 w-5" strokeWidth={1.7} />
                    </span>
                  )
                }
                title={p.name}
                meta={
                  <>
                    {formatIDR(p.sellingPrice)}
                    {cost > 0 && <> · untung {formatIDR(profit)}</>}
                  </>
                }
                trailing={
                  low ? (
                    <Badge tone="warn">Stok {p.stock}</Badge>
                  ) : (
                    <span className="tnum shrink-0 text-[13px] font-medium text-ink-3">Stok {p.stock}</span>
                  )
                }
                chevron={false}
              />
            );
          })}
        </List>
      )}

      <div className="mt-6">
        <Callout>
          Isi biaya produksi selengkap mungkin (bahan, tenaga kerja, kemasan). Dari situ aplikasi tahu apakah harga
          jualmu sudah untung.
        </Callout>
      </div>
    </>
  );
}
