import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { deleteProduct, restoreProduct, productHasHistory } from "@/lib/actions/products";
import { formatIDR } from "@/lib/format";
import { costLabel } from "@/lib/labels";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, Callout, List, Row } from "@/components/ui";
import { StockAdjuster } from "@/components/stock-adjuster";
import { ActionButton } from "@/components/action-button";
import { IconEdit, IconTrash, IconReceipt } from "@/components/icons";

export default async function ProductDetailPage({ params }: PageProps<"/products/[id]"> ) {
  const { id } = await params;
  const business = await getCurrentBusiness();
  if (!business) return null;

  const product = await prisma.product.findFirst({
    where: { id, businessId: business.id },
    include: {
      category: true,
      costComponents: true,
      saleItems: { include: { sale: true }, orderBy: { sale: { date: "desc" } }, take: 5 },
    },
  });
  if (!product) notFound();

  const totalCost = product.costComponents.reduce((s, c) => s + c.amount, 0);
  const profit = product.sellingPrice - totalCost;
  const margin = product.sellingPrice > 0 ? (profit / product.sellingPrice) * 100 : 0;
  const archived = product.status === "inactive";
  const hasHistory = await productHasHistory(product.id);

  return (
    <>
      <PageHeader
        title={product.name}
        subtitle={product.category?.name ?? undefined}
        back="/products"
        action={
          !archived && (
            <Link href={`/products/${id}/edit`} className="btn btn-secondary !min-h-[40px] !px-3">
              <IconEdit className="h-4 w-4" strokeWidth={2} />
            </Link>
          )
        }
      />

      {archived && (
        <div className="mb-4">
          <Callout tone="warn">Produk ini diarsipkan — tidak muncul di katalog dan tidak bisa dijual.</Callout>
        </div>
      )}

      {product.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.photoUrl}
          alt={product.name}
          className="mb-4 aspect-[4/3] w-full rounded-[var(--radius-lg)] border border-line object-cover"
        />
      )}

      <Card className="mb-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="label">Harga Jual</p>
            <p className="figure mt-1 text-[26px] text-ink">{formatIDR(product.sellingPrice)}</p>
          </div>
          {totalCost > 0 && (
            <Badge tone={profit >= 0 ? "good" : "bad"}>
              {profit >= 0 ? "Untung" : "Rugi"} {formatIDR(profit)}
            </Badge>
          )}
        </div>
        {totalCost > 0 && (
          <div className="mt-3 border-t border-line pt-3">
            <dl className="flex flex-col gap-1.5">
              {product.costComponents.map((c) => (
                <div key={c.id} className="flex justify-between text-[13px]">
                  <dt className="text-ink-3">{costLabel(c.label)}</dt>
                  <dd className="tnum text-ink-2">{formatIDR(c.amount)}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-line pt-1.5 text-[13px] font-semibold">
                <dt className="text-ink">Total biaya · margin</dt>
                <dd className="tnum text-ink">
                  {formatIDR(totalCost)} · {margin.toFixed(0)}%
                </dd>
              </div>
            </dl>
          </div>
        )}
        {product.material && <p className="mt-3 text-[13px] text-ink-2">Bahan: {product.material}</p>}
        {product.description && <p className="mt-1 text-[13px] text-ink-2">{product.description}</p>}
      </Card>

      {!archived && (
        <div className="mb-3">
          <StockAdjuster productId={product.id} stock={product.stock} />
        </div>
      )}

      {product.saleItems.length > 0 && (
        <>
          <p className="label mb-2 mt-6">Penjualan Terakhir</p>
          <List>
            {product.saleItems.map((si) => (
              <Row
                key={si.id}
                href={`/sales/${si.saleId}`}
                leading={
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-ink-3">
                    <IconReceipt className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                }
                title={`${si.quantity} unit`}
                meta={si.sale.date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                amount={formatIDR(si.lineTotal)}
              />
            ))}
          </List>
        </>
      )}

      <div className="mt-6">
        {archived ? (
          <ActionButton action={restoreProduct} hidden={{ id: product.id }} className="btn btn-secondary w-full">
            Aktifkan Kembali
          </ActionButton>
        ) : (
          <ActionButton
            action={deleteProduct}
            hidden={{ id: product.id }}
            confirm={
              hasHistory
                ? "Produk ini punya riwayat penjualan. Ia akan diarsipkan (bukan dihapus) supaya laporan lama tetap benar. Lanjut?"
                : "Hapus produk ini?"
            }
            className="btn btn-danger w-full"
            pendingLabel="Memproses…"
          >
            <IconTrash className="h-4 w-4" strokeWidth={2} />
            {hasHistory ? "Arsipkan Produk" : "Hapus Produk"}
          </ActionButton>
        )}
      </div>
    </>
  );
}
