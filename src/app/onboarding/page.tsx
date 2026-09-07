import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCurrentBusiness, getCurrentUser } from "@/lib/current-user";
import { createBusiness } from "@/lib/actions/business";
import { AuthShell } from "@/components/auth-shell";
import { ActionForm, SubmitButton } from "@/components/form";
import { Callout } from "@/components/ui";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const currentUser = await getCurrentUser();
  if (currentUser?.memberOfBusinessId) redirect("/dashboard");
  if (await getCurrentBusiness()) redirect("/dashboard");

  return (
    <AuthShell title="Daftarkan Usahamu" subtitle="Sedikit keterangan sebelum mulai mencatat.">
      <ActionForm
        action={createBusiness}
        footer={<SubmitButton pendingLabel="Menyiapkan…">Mulai Mencatat</SubmitButton>}
      >
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Nama usaha</span>
          <input name="name" required autoFocus className="field" placeholder="mis. Gerabah Bu Siti" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Lokasi (opsional)</span>
          <input name="location" className="field" placeholder="Desa / Kecamatan / Kabupaten" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Keterangan singkat (opsional)</span>
          <textarea name="description" rows={2} className="field" placeholder="Apa saja yang dibuat dan dijual" />
        </label>
        <Callout>
          Kategori, tempat jualan, dan metode pembayaran umum akan otomatis disiapkan — bisa kamu ubah kapan saja.
        </Callout>
      </ActionForm>
    </AuthShell>
  );
}
