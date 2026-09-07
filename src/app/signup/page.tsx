import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { signup } from "@/lib/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { ActionForm, SubmitButton } from "@/components/form";
import { PasswordField } from "@/components/password-field";

export default async function SignupPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <AuthShell
      title="Buat Akun"
      subtitle="Gratis. Datanya hanya bisa dilihat olehmu."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-clay">
            Masuk
          </Link>
        </>
      }
    >
      <ActionForm action={signup} footer={<SubmitButton pendingLabel="Membuat akun…">Daftar</SubmitButton>}>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Nama</span>
          <input name="name" required autoComplete="name" className="field" placeholder="mis. Siti Rohmah" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Email</span>
          <input name="email" type="email" required autoComplete="email" className="field" placeholder="nama@email.com" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Nomor HP (opsional)</span>
          <input name="phone" type="tel" inputMode="tel" className="field" placeholder="08…" />
        </label>
        <PasswordField
          name="password"
          label="Kata sandi"
          autoComplete="new-password"
          minLength={8}
          placeholder="Minimal 8 karakter"
          showHint
        />
        <PasswordField
          name="confirmPassword"
          label="Ulangi kata sandi"
          autoComplete="new-password"
          minLength={8}
        />
      </ActionForm>
    </AuthShell>
  );
}
