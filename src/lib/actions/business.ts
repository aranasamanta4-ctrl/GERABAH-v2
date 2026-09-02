"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCurrentBusiness } from "@/lib/current-user";
import { seedBusinessDefaults } from "@/lib/seed-defaults";
import { type FormState, run, requireBusiness } from "./_helpers";

export async function createBusiness(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const res = await run(async () => {
    const name = String(formData.get("name") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    if (!name) throw new Error("Isi nama usahanya dulu.");

    let business = await getCurrentBusiness();
    if (!business) {
      business = await prisma.business.create({
        data: { ownerId: session.userId, name, location: location || null, description: description || null },
      });
    }
    // idempotent — aman diulang kalau langkah ini gagal separuh jalan
    await seedBusinessDefaults(business.id);
  });

  if (res.error) return res;
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateBusiness(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();

  const res = await run(async () => {
    const name = String(formData.get("name") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    if (!name) throw new Error("Nama usaha wajib diisi.");
    await prisma.business.update({
      where: { id: business.id },
      data: { name, location: location || null, description: description || null },
    });
  });

  if (res.error) return res;
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirect("/settings");
}
