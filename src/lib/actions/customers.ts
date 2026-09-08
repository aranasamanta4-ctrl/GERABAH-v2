"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { type FormState, run, requireBusiness, logActivity } from "./_helpers";

function read(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    type: String(formData.get("type") ?? "New"),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

export async function createCustomer(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  let newId = "";

  const res = await run(async () => {
    const d = read(formData);
    if (!d.name) throw new Error("Nama pelanggan wajib diisi.");
    if (d.phone) {
      const existing = await prisma.customer.findFirst({ where: { businessId: business.id, phone: d.phone } });
      if (existing) throw new Error(`Nomor ini sudah terdaftar atas nama ${existing.name}.`);
    }
    const customer = await prisma.customer.create({
      data: {
        businessId: business.id,
        name: d.name,
        phone: d.phone || undefined,
        email: d.email || undefined,
        address: d.address || undefined,
        type: d.type,
        notes: d.notes || undefined,
      },
    });
    newId = customer.id;
    await logActivity(business.id, "customer.create", `Tambah pelanggan ${d.name}${d.phone ? ` (${d.phone})` : ""}`);
  });

  if (res.error) return res;
  revalidatePath("/customers");
  redirect(`/customers/${newId}`);
}

export async function updateCustomer(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const id = String(formData.get("id") ?? "");

  const res = await run(async () => {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer || customer.businessId !== business.id) throw new Error("Pelanggan tidak ditemukan.");
    const d = read(formData);
    if (!d.name) throw new Error("Nama pelanggan wajib diisi.");
    await prisma.customer.update({
      where: { id },
      data: {
        name: d.name,
        phone: d.phone || null,
        email: d.email || null,
        address: d.address || null,
        type: d.type,
        notes: d.notes || null,
      },
    });
    await logActivity(business.id, "customer.update", `Ubah data pelanggan ${d.name}`);
  });

  if (res.error) return res;
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
}
