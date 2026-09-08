"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatIDRPlain } from "@/lib/format";
import {
  type FormState,
  run,
  requireBusiness,
  findOrCreateIncomeCategory,
  findOrCreateExpenseCategory,
  parseAmount,
  logActivity,
} from "./_helpers";

type GiftInput = { productId: string; quantity: number; unitCost: number };

function parseGifts(raw: FormDataEntryValue | null): GiftInput[] {
  try {
    const arr = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => ({
        productId: String(x?.productId ?? ""),
        quantity: Math.max(0, Math.floor(Number(x?.quantity) || 0)),
        unitCost: Math.max(0, Math.floor(Number(x?.unitCost) || 0)),
      }))
      .filter((x) => x.productId && x.quantity > 0);
  } catch {
    return [];
  }
}

function compute(gifts: GiftInput[], operationalCost: number, profitMode: string, profitValue: number, participants: number) {
  const giftCost = gifts.reduce((s, g) => s + g.quantity * g.unitCost, 0);
  const totalCost = giftCost + operationalCost;
  const targetProfit = profitMode === "percent" ? Math.round((totalCost * profitValue) / 100) : profitValue;
  const offerPrice = totalCost + targetProfit;
  const pricePerPerson = participants > 0 ? Math.round(offerPrice / participants) : 0;
  return { giftCost, totalCost, targetProfit, offerPrice, pricePerPerson };
}

export async function createWorkshop(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  let newId = "";

  const res = await run(async () => {
    const organizer = String(formData.get("organizer") ?? "").trim();
    const dateValue = String(formData.get("date") ?? "");
    const participants = Math.max(0, Math.floor(Number(formData.get("participants")) || 0));
    const operationalCost = parseAmount(formData.get("operationalCost"));
    const profitMode = String(formData.get("profitMode") ?? "percent") === "nominal" ? "nominal" : "percent";
    const profitValue = parseAmount(formData.get("profitValue"));
    const notes = String(formData.get("notes") ?? "").trim();
    const gifts = parseGifts(formData.get("gifts"));

    if (!organizer) throw new Error("Isi nama instansi / penyelenggara.");
    if (gifts.length === 0) throw new Error("Pilih minimal satu produk gift.");

    const ids = [...new Set(gifts.map((g) => g.productId))];
    const products = await prisma.product.findMany({ where: { id: { in: ids }, businessId: business.id } });
    if (products.length !== ids.length) throw new Error("Ada produk yang tidak ditemukan.");

    const c = compute(gifts, operationalCost, profitMode, profitValue, participants);

    const ws = await prisma.workshop.create({
      data: {
        businessId: business.id,
        organizer,
        date: dateValue ? new Date(dateValue) : null,
        participants,
        operationalCost,
        profitMode,
        profitValue,
        notes: notes || undefined,
        ...c,
        gifts: {
          create: gifts.map((g) => ({ productId: g.productId, quantity: g.quantity, unitCost: g.unitCost })),
        },
      },
    });
    newId = ws.id;
    await logActivity(business.id, "workshop.create", `Buat workshop ${organizer} — penawaran ${formatIDRPlain(c.offerPrice)}`);
  });

  if (res.error) return res;
  revalidatePath("/workshop");
  redirect(`/workshop/${newId}`);
}

export async function recordWorkshopToFinance(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const id = String(formData.get("id") ?? "");

  const res = await run(async () => {
    const ws = await prisma.workshop.findFirst({ where: { id, businessId: business.id } });
    if (!ws) throw new Error("Workshop tidak ditemukan.");
    if (ws.status === "recorded") throw new Error("Workshop ini sudah dicatat ke Keuangan.");

    const [incomeCategoryId, expenseCategoryId] = await Promise.all([
      findOrCreateIncomeCategory(business.id, "Workshop"),
      findOrCreateExpenseCategory(business.id, "Workshop"),
    ]);
    const when = ws.date ?? new Date();

    await prisma.$transaction(async (tx) => {
      if (ws.totalCost > 0) {
        await tx.financialTransaction.create({
          data: {
            businessId: business.id,
            type: "EXPENSE",
            expenseCategoryId: expenseCategoryId ?? undefined,
            description: `Biaya workshop ${ws.organizer}`,
            amount: ws.totalCost,
            date: when,
            relatedWorkshopId: ws.id,
          },
        });
      }
      if (ws.offerPrice > 0) {
        await tx.financialTransaction.create({
          data: {
            businessId: business.id,
            type: "INCOME",
            incomeCategoryId: incomeCategoryId ?? undefined,
            description: `Workshop ${ws.organizer}`,
            amount: ws.offerPrice,
            date: when,
            relatedWorkshopId: ws.id,
          },
        });
      }
      await tx.workshop.update({ where: { id: ws.id }, data: { status: "recorded", recordedAt: new Date() } });
    });
    await logActivity(
      business.id,
      "workshop.record",
      `Catat workshop ${ws.organizer} ke Keuangan — keluar ${formatIDRPlain(ws.totalCost)}, masuk ${formatIDRPlain(ws.offerPrice)}`
    );
  });

  if (res.error) return res;
  revalidatePath(`/workshop/${id}`);
  revalidatePath("/workshop");
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteWorkshop(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const id = String(formData.get("id") ?? "");

  const res = await run(async () => {
    const ws = await prisma.workshop.findFirst({ where: { id, businessId: business.id } });
    if (!ws) throw new Error("Workshop tidak ditemukan.");

    await prisma.$transaction(async (tx) => {
      // hapus juga catatan keuangan yang tertaut (kalau sudah dicatat)
      await tx.financialTransaction.deleteMany({ where: { relatedWorkshopId: id } });
      await tx.workshopGift.deleteMany({ where: { workshopId: id } });
      await tx.workshop.delete({ where: { id } });
    });
    await logActivity(business.id, "workshop.delete", `Hapus workshop ${ws.organizer}`);
  });

  if (res.error) return res;
  revalidatePath("/workshop");
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  redirect("/workshop");
}
