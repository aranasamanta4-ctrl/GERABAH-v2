import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/actions/_helpers";
import { approveProductChange, rejectProductChange } from "@/lib/actions/products";
import { formatIDR, formatDateTime } from "@/lib/format";
import { EmptyState, Card } from "@/components/ui";
import { ActionButton } from "@/components/action-button";
import { IconClipboardCheck, IconCheck, IconTrash } from "@/components/icons";

export default async function ApprovalsPage() {
  const business = await requireOwner();

  const requests = await prisma.productChangeRequest.findMany({
    where: { businessId: business.id, status: "pending" },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <header className="mb-5">
        <h1 className="text-[25px] font-bold text-ink">Persetujuan</h1>
        <p className="mt-0.5 text-[14px] text-ink-2">Perubahan harga produk yang diajukan staf, menunggu kamu setujui</p>
      </header>

      {requests.length === 0 ? (
        <EmptyState
          icon={<IconClipboardCheck className="h-6 w-6" strokeWidth={1.7} />}
          title="Tidak ada yang menunggu"
          body="Kalau staf mengubah harga jual produk yang sudah ada, pengajuannya akan muncul di sini sampai kamu setujui atau tolak."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-ink">{r.product.name}</p>
                  <p className="mt-0.5 text-[13px] text-ink-2">
                    {formatIDR(r.oldValue)} <span className="text-ink-3">→</span>{" "}
                    <span className="font-semibold text-ink">{formatIDR(r.newValue)}</span>
                  </p>
                  <p className="mt-1 text-[12px] text-ink-3">
                    Diajukan {r.requestedByName} · {formatDateTime(r.createdAt)}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <ActionButton
                  action={rejectProductChange}
                  hidden={{ requestId: r.id }}
                  confirm={`Tolak perubahan harga ${r.product.name} jadi ${formatIDR(r.newValue)}?`}
                  className="btn btn-danger"
                  pendingLabel="Memproses…"
                >
                  <IconTrash className="h-4 w-4" strokeWidth={2} />
                  Tolak
                </ActionButton>
                <ActionButton
                  action={approveProductChange}
                  hidden={{ requestId: r.id }}
                  className="btn btn-primary"
                  pendingLabel="Memproses…"
                >
                  <IconCheck className="h-4 w-4" strokeWidth={2.2} />
                  Setujui
                </ActionButton>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
