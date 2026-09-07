import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ADMIN_WHATSAPP } from "@/lib/config";
import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordHelp } from "@/components/forgot-password-help";

export default async function ForgotPasswordPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <AuthShell
      title="Lupa Kata Sandi"
      subtitle="Minta admin mengatur ulang kata sandimu."
      footer={
        <>
          Ingat kata sandinya?{" "}
          <Link href="/login" className="font-semibold text-clay">
            Masuk
          </Link>
        </>
      }
    >
      <ForgotPasswordHelp adminWhatsapp={ADMIN_WHATSAPP} />
    </AuthShell>
  );
}
