"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";
import { type FormState, run } from "./_helpers";

const signupSchema = z
  .object({
    name: z.string().trim().min(1, "Isi namamu."),
    email: z.string().trim().toLowerCase().email("Email tidak valid."),
    phone: z.string().trim().optional(),
    password: z.string().min(8, "Kata sandi minimal 8 karakter."),
    confirmPassword: z.string().min(1, "Ulangi kata sandinya."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Konfirmasi kata sandi tidak sama.",
    path: ["confirmPassword"],
  });

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const res = await run(async () => {
    const parsed = signupSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");

    const { name, email, phone, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error("Email ini sudah terdaftar. Coba masuk.");

    const user = await prisma.user.create({
      data: { name, email, phone: phone || undefined, passwordHash: await hashPassword(password) },
    });
    await createSession(user.id);
  });

  if (res.error) return res;
  redirect("/onboarding");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email tidak valid."),
  password: z.string().min(1, "Isi kata sandi."),
});

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  let target = "/dashboard";

  const res = await run(async () => {
    const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      throw new Error("Email atau kata sandi salah.");
    }
    await createSession(user.id);
    const business = await prisma.business.findFirst({ where: { ownerId: user.id } });
    target = business || user.memberOfBusinessId ? "/dashboard" : "/onboarding";
  });

  if (res.error) return res;
  redirect(target);
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
