"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/current-user";
import { formatIDRPlain } from "@/lib/format";
import {
  type FormState,
  run,
  requireBusiness,
  findOrCreatePaymentMethod,
  findOrCreateIncomeCategory,
  findOrCreateExpenseCategory,
  parseAmount,
  logActivity,
} from "./_helpers";

export async function createFinancialTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const ctx = await getSessionContext();

  const res = await run(async () => {
    const type = String(formData.get("type") ?? "EXPENSE") === "INCOME" ? "INCOME" : "EXPENSE";
    if (type === "INCOME" && ctx?.role === "staff") {
      throw new Error("Staf hanya bisa mencatat uang keluar. Uang masuk otomatis dari penjualan.");
    }
    const categoryName = String(formData.get("category") ?? "");
    const description = String(formData.get("description") ?? "").trim();
    const amount = parseAmount(formData.get("amount"));
    const paymentMethodName = String(formData.get("paymentMethod") ?? "");
    const notes = String(formData.get("notes") ?? "").trim();
    const dateValue = String(formData.get("date") ?? "");

    if (amount <= 0) throw new Error("Isi jumlah uangnya dulu.");

    const paymentMethodId = paymentMethodName
      ? await findOrCreatePaymentMethod(business.id, paymentMethodName)
      : null;
    const incomeCategoryId =
      type === "INCOME" && categoryName ? await findOrCreateIncomeCategory(business.id, categoryName) : null;
    const expenseCategoryId =
      type === "EXPENSE" && categoryName ? await findOrCreateExpenseCategory(business.id, categoryName) : null;

    await prisma.financialTransaction.create({
      data: {
        businessId: business.id,
        type,
        incomeCategoryId: incomeCategoryId ?? undefined,
        expenseCategoryId: expenseCategoryId ?? undefined,
        description: description || undefined,
        amount,
        paymentMethodId: paymentMethodId ?? undefined,
        notes: notes || undefined,
        date: dateValue ? new Date(dateValue) : new Date(),
      },
    });
    await logActivity(
      business.id,
      type === "INCOME" ? "finance.income" : "finance.expense",
      `Catat ${type === "INCOME" ? "uang masuk" : "uang keluar"} ${formatIDRPlain(amount)}${
        description ? ` — ${description}` : categoryName ? ` — ${categoryName}` : ""
      }`
    );
  });

  if (res.error) return res;
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  redirect("/finance");
}

export async function deleteFinancialTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const id = String(formData.get("id") ?? "");

  const res = await run(async () => {
    const tx = await prisma.financialTransaction.findUnique({ where: { id } });
    if (!tx || tx.businessId !== business.id) throw new Error("Catatan tidak ditemukan.");
    if (tx.relatedSaleId) throw new Error("Catatan ini dari penjualan — batalkan lewat halaman Penjualan.");
    await prisma.financialTransaction.delete({ where: { id } });
    await logActivity(
      business.id,
      "finance.delete",
      `Hapus catatan ${tx.type === "INCOME" ? "uang masuk" : "uang keluar"} ${formatIDRPlain(tx.amount)}`
    );
  });

  if (res.error) return res;
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  redirect("/finance");
}
