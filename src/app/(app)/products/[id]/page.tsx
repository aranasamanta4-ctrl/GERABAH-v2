import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/current-user";
import { deleteProduct, restoreProduct, productHasHistory } from "@/lib/actions/products";
import { formatIDR } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, Callout, List, Row } from "@/components/ui";
import { StockAdjuster } from "@/components/stock-adjuster";
import { ActionButton } from "@/components/action-button";
import { IconEdit, IconTrash, IconReceipt } from "@/components/icons";

export default async function ProductDetailPage({ params }: PageProps<"/products/[id]"> ) {
  const { id } = await params;
  const ctx = await getSessionContext();
  const business = ctx?.business;
  if (!business) return null;

  const product = await prisma.product.findFirst({
    where: { id, businessId: business.id },
    include: {
      category: true,
      costComponents: { include: { otherCategory: true } },
      materials: true,
      changeRequests: { where: { status: "pending", field: "sellingPrice" }, orderBy: { createdAt: "desc" }, take: 1 },
      saleItems: { include: { sale: true }, orderBy: { sale: { date: "desc" } }, take: 5 },
    },
  });
  if (!product) notFound();

  const materialCost = product.materials.reduce((s, m) => s + m.quantity * m.unitCost, 0);
  const costRows = [
    ...(materialCost > 0 ? [{ label: "Bahan Baku", amount: materialCost }] : []),
    ...product.costComponents.map((c) => ({
      label: c.label === "Other Cost" ? c.otherCategory?.name ?? "Lain-lain" : "Kemasan",
      amount: c.amount,
    })),
  ];
  const totalCost = materialCost + product.costComponents.reduce((s, c) => s + c.amount, 0);
  const profit = product.sellingPrice - totalCost;
  const margin = product.sellingPrice > 0 ? (profit / product.sellingPrice) * 100 : 0;
  const archived = product.status === "inactive";
  const hasHistory = await productHasHistory(product.id);
  const pending = product.changeRequests[0];

  return (
    <>
      <PageHeader
        title={product.name}
        subtitle={product.category?.name ?? undefined}
        back="/products"
        action={
          !archived && (
            <Link href={`/products/${id}/edit`} className="btn btn-secondary !min-h-[42px] !px-4">
              <IconEdit className="h-4 w-4" strokeWidth={2} />
              Ubah
            </Link>
          )
        }
      />

      {archived && (
        <div className="mb-4">
          <Callout tone="warn">Produk ini diarsipkan — tidak muncul di katalog dan tidak bisa dijual.</Callout>
        </div>
      )}

      {pending && (
        <div className="mb-4">
          <Callout tone="warn">
            Perubahan harga jadi <strong>{formatIDR(pending.newValue)}</strong> (diajukan {pending.requestedByName})
            sedang menunggu persetujuan owner.
            {ctx.role === "owner" && (
              <>
                {" "}
                <Link href="/approvals" className="underline">
                  Tinjau di Persetujuan
                </Link>
                .
              </>
            )}
          </Callout>
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
              {costRows.map((c, i) => (
                <div key={i} className="flex justify-between text-[13px]">
                  <dt className="text-ink-3">{c.label}</dt>
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

      {product.materials.length > 0 && (
        <>
          <p className="label mb-2">Rincian Bahan Baku</p>
          <Card className="mb-3">
            <dl className="flex flex-col divide-y divide-line text-[13px]">
              {product.materials.map((m) => (
                <div key={m.id} className="flex justify-between py-1.5 first:pt-0 last:pb-0">
                  <dt className="text-ink-2">
                    {m.name} <span className="text-ink-3">({m.quantity} {m.unit})</span>
                  </dt>
                  <dd className="tnum text-ink-2">{formatIDR(m.quantity * m.unitCost)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </>
      )}

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
