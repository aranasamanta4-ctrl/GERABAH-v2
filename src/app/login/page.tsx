import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { login } from "@/lib/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { ActionForm, SubmitButton } from "@/components/form";
import { PasswordField } from "@/components/password-field";

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <AuthShell
      title="Masuk"
      subtitle="Lanjutkan mencatat keuangan usahamu."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/signup" className="font-semibold text-clay">
            Buat akun
          </Link>
        </>
      }
    >
      <ActionForm action={login} footer={<SubmitButton pendingLabel="Masuk…">Masuk</SubmitButton>}>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Email</span>
          <input name="email" type="email" required autoComplete="email" className="field" placeholder="nama@email.com" />
        </label>
        <div>
          <PasswordField name="password" label="Kata sandi" autoComplete="current-password" />
          <Link href="/forgot-password" className="mt-2 inline-block text-[13.5px] font-semibold text-clay">
            Lupa kata sandi?
          </Link>
        </div>
      </ActionForm>
    </AuthShell>
  );
}
