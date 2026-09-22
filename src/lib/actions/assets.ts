"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatIDRPlain } from "@/lib/format";
import { type FormState, run, requireOwner, findOrCreateFixedCostCategory, parseAmount, logActivity } from "./_helpers";

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function createAsset(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();

  const res = await run(async () => {
    const name = String(formData.get("name") ?? "").trim();
    const category = String(formData.get("category") ?? "Lainnya").trim() || "Lainnya";
    const purchaseValue = parseAmount(formData.get("purchaseValue"));
    const purchaseDateRaw = String(formData.get("purchaseDate") ?? "");
    const note = String(formData.get("note") ?? "").trim();

    if (!name) throw new Error("Nama aset wajib diisi.");
    if (purchaseValue <= 0) throw new Error("Isi nilai/harga asetnya dulu.");

    await prisma.asset.create({
      data: {
        businessId: business.id,
        name,
        category,
        purchaseValue,
        purchaseDate: purchaseDateRaw ? new Date(purchaseDateRaw) : null,
        note: note || null,
      },
    });
    await logActivity(business.id, "asset.create", `Tambah aset ${name} (${formatIDRPlain(purchaseValue)})`);
  });

  if (res.error) return res;
  revalidatePath("/assets");
  return { ok: true };
}

export async function deleteAsset(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();
  const id = String(formData.get("id") ?? "");

  const res = await run(async () => {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset || asset.businessId !== business.id) throw new Error("Aset tidak ditemukan.");
    await prisma.asset.delete({ where: { id } });
    await logActivity(business.id, "asset.delete", `Hapus aset ${asset.name}`);
  });

  if (res.error) return res;
  revalidatePath("/assets");
  return { ok: true };
}

export async function createFixedCost(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();

  const res = await run(async () => {
    const name = String(formData.get("name") ?? "").trim();
    const categoryName = String(formData.get("category") ?? "").trim();
    const amount = parseAmount(formData.get("amount"));
    const period = String(formData.get("period") ?? "monthly");
    const startDateRaw = String(formData.get("startDate") ?? "");
    const durationMonthsRaw = String(formData.get("durationMonths") ?? "");
    const durationMonths = durationMonthsRaw ? Math.max(0, Number(durationMonthsRaw) || 0) : null;
    const note = String(formData.get("note") ?? "").trim();

    if (!name) throw new Error("Nama biaya wajib diisi.");
    if (amount <= 0) throw new Error("Isi jumlah biayanya dulu.");
    if (!["monthly", "yearly", "one_time"].includes(period)) throw new Error("Periode tidak valid.");

    const startDate = startDateRaw ? new Date(startDateRaw) : new Date();
    const categoryId = categoryName ? await findOrCreateFixedCostCategory(business.id, categoryName) : null;

    await prisma.fixedCost.create({
      data: {
        businessId: business.id,
        name,
        categoryId: categoryId ?? undefined,
        amount,
        period,
        startDate,
        endDate: durationMonths ? addMonths(startDate, durationMonths) : null,
        durationMonths: durationMonths ?? undefined,
        note: note || null,
      },
    });
    await logActivity(business.id, "fixedcost.create", `Tambah biaya tetap ${name} (${formatIDRPlain(amount)}/${period === "monthly" ? "bulan" : period === "yearly" ? "tahun" : "sekali"})`);
  });

  if (res.error) return res;
  revalidatePath("/assets");
  return { ok: true };
}

export async function toggleFixedCostActive(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();
  const id = String(formData.get("id") ?? "");

  const res = await run(async () => {
    const fc = await prisma.fixedCost.findUnique({ where: { id } });
    if (!fc || fc.businessId !== business.id) throw new Error("Biaya tetap tidak ditemukan.");
    await prisma.fixedCost.update({ where: { id }, data: { active: !fc.active } });
    await logActivity(business.id, "fixedcost.toggle", `${fc.active ? "Nonaktifkan" : "Aktifkan"} biaya tetap ${fc.name}`);
  });

  if (res.error) return res;
  revalidatePath("/assets");
  return { ok: true };
}

export async function deleteFixedCost(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();
  const id = String(formData.get("id") ?? "");

  const res = await run(async () => {
    const fc = await prisma.fixedCost.findUnique({ where: { id } });
    if (!fc || fc.businessId !== business.id) throw new Error("Biaya tetap tidak ditemukan.");
    await prisma.fixedCost.delete({ where: { id } });
    await logActivity(business.id, "fixedcost.delete", `Hapus biaya tetap ${fc.name}`);
  });

  if (res.error) return res;
  revalidatePath("/assets");
  return { ok: true };
}
