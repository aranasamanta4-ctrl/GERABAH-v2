import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { requireOwner } from "@/lib/actions/_helpers";
import { updateBusiness } from "@/lib/actions/business";
import { addStaff, removeStaff } from "@/lib/actions/staff";
import { ActionButton } from "@/components/action-button";
import { PasswordField } from "@/components/password-field";
import { PageHeader } from "@/components/page-header";
import { Card, List, Row } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/form";
import { LogoutButton } from "@/components/logout-button";
import { IconTrash } from "@/components/icons";

export default async function SettingsPage() {
  const business = await requireOwner();
  const user = await getCurrentUser();

  const [prodCat, channels, methods, staff] = await Promise.all([
    prisma.productCategory.count({ where: { businessId: business.id } }),
    prisma.salesChannel.count({ where: { businessId: business.id } }),
    prisma.paymentMethod.count({ where: { businessId: business.id } }),
    prisma.user.findMany({
      where: { memberOfBusinessId: business.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader title="Pengaturan" back="/more" />

      <p className="label mb-2">Data Usaha</p>
      <ActionForm action={updateBusiness} footer={<SubmitButton>Simpan Perubahan</SubmitButton>}>
        <Card>
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Nama usaha</span>
              <input name="name" required defaultValue={business.name} className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Lokasi</span>
              <input name="location" defaultValue={business.location ?? ""} className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Keterangan</span>
              <textarea name="description" rows={2} defaultValue={business.description ?? ""} className="field" />
            </label>
          </div>
        </Card>
      </ActionForm>

      {/* ── Pengguna / Staf ── */}
      <p className="label mb-2 mt-7">Pengguna</p>
      <p className="text-help mb-2">
        Owner melihat semua laporan, keuntungan, dan pengaturan. Staf hanya bisa mencatat transaksi, pesanan, dan
        pelanggan.
      </p>

      {staff.length > 0 && (
        <List className="mb-3">
          {staff.map((s) => (
            <Row
              key={s.id}
              title={s.name}
              meta={s.email}
              trailing={
                <ActionButton
                  action={removeStaff}
                  hidden={{ id: s.id }}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[13px] font-medium text-bad active:bg-bad-soft"
                  confirm={`Hapus akun staf ${s.name}? Mereka tidak bisa login lagi.`}
                  pendingLabel="…"
                >
                  <IconTrash className="h-4 w-4" strokeWidth={2} />
                  Hapus
                </ActionButton>
              }
            />
          ))}
        </List>
      )}

      <ActionForm action={addStaff} footer={<SubmitButton>Tambah Staf</SubmitButton>}>
        <Card>
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Nama staf</span>
              <input name="name" required className="field" placeholder="Nama lengkap" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Email staf</span>
              <input name="email" type="email" required className="field" placeholder="nama@email.com" />
            </label>
            <PasswordField name="password" label="Kata sandi awal" autoComplete="new-password" minLength={8} showHint />
            <PasswordField
              name="confirmPassword"
              label="Ulangi kata sandi"
              autoComplete="new-password"
              minLength={8}
            />
          </div>
        </Card>
      </ActionForm>

      <p className="label mb-2 mt-7">Akun</p>
      <Card>
        <dl className="flex flex-col divide-y divide-line text-[14px]">
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
              {prodCat} kategori · {channels} tempat jualan · {methods} metode bayar
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
