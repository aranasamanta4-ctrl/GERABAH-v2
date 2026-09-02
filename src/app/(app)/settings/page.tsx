import { prisma } from "@/lib/prisma";
import { getCurrentUser, getCurrentBusiness } from "@/lib/current-user";
import { updateBusiness } from "@/lib/actions/business";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/form";
import { LogoutButton } from "@/components/logout-button";

export default async function SettingsPage() {
  const [user, business] = await Promise.all([getCurrentUser(), getCurrentBusiness()]);
  if (!business) return null;

  const counts = await prisma.$transaction([
    prisma.productCategory.count({ where: { businessId: business.id } }),
    prisma.salesChannel.count({ where: { businessId: business.id } }),
    prisma.paymentMethod.count({ where: { businessId: business.id } }),
  ]);

  return (
    <>
      <PageHeader title="Pengaturan" back="/more" />

      <p className="label mb-2">Data Usaha</p>
      <ActionForm action={updateBusiness} footer={<SubmitButton>Simpan Perubahan</SubmitButton>}>
        <Card>
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Nama usaha</span>
              <input name="name" required defaultValue={business.name} className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Lokasi</span>
              <input name="location" defaultValue={business.location ?? ""} className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Keterangan</span>
              <textarea name="description" rows={2} defaultValue={business.description ?? ""} className="field" />
            </label>
          </div>
        </Card>
      </ActionForm>

      <p className="label mb-2 mt-6">Akun</p>
      <Card>
        <dl className="flex flex-col divide-y divide-line text-[13.5px]">
          <div className="flex justify-between py-2 first:pt-0">
            <dt className="text-ink-3">Nama</dt>
            <dd className="font-medium text-ink">{user?.name}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-3">Email</dt>
            <dd className="font-medium text-ink">{user?.email}</dd>
          </div>
          <div className="flex justify-between py-2 last:pb-0">
            <dt className="text-ink-3">Data tersimpan</dt>
            <dd className="font-medium text-ink">
              {counts[0]} kategori · {counts[1]} tempat jualan · {counts[2]} metode bayar
            </dd>
          </div>
        </dl>
      </Card>

      <div className="mt-6">
        <LogoutButton />
      </div>
    </>
  );
}
