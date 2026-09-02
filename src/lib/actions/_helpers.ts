import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCurrentBusiness } from "@/lib/current-user";

export type FormState = { error?: string; ok?: boolean };
export const OK: FormState = { ok: true };

/** Run the mutation body, turning thrown errors into inline form state. */
export async function run(fn: () => Promise<void>): Promise<FormState> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    console.error("[action]", e);
    return { error: e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi." };
  }
}

export async function requireBusiness() {
  const session = await getSession();
  if (!session) redirect("/login");
  const business = await getCurrentBusiness();
  if (!business) redirect("/onboarding");
  return business;
}

async function findOrCreate(
  model: {
    findFirst: (a: { where: { businessId: string; name: string } }) => Promise<{ id: string } | null>;
    create: (a: { data: { businessId: string; name: string } }) => Promise<{ id: string }>;
  },
  businessId: string,
  name: string
) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = await model.findFirst({ where: { businessId, name: trimmed } });
  if (existing) return existing.id;
  const created = await model.create({ data: { businessId, name: trimmed } });
  return created.id;
}

export const findOrCreatePaymentMethod = (b: string, n: string) => findOrCreate(prisma.paymentMethod, b, n);
export const findOrCreateIncomeCategory = (b: string, n: string) => findOrCreate(prisma.incomeCategory, b, n);
export const findOrCreateExpenseCategory = (b: string, n: string) => findOrCreate(prisma.expenseCategory, b, n);
export const findOrCreateProductCategory = (b: string, n: string) => findOrCreate(prisma.productCategory, b, n);
export const findOrCreateChannel = (b: string, n: string) => findOrCreate(prisma.salesChannel, b, n);

export async function salesIncomeCategoryId(businessId: string) {
  return (await findOrCreateIncomeCategory(businessId, "Penjualan"))!;
}

/** "1.250.000" / "Rp 1.250.000" / "1250000" -> 1250000 */
export function parseAmount(raw: FormDataEntryValue | null): number {
  const digits = String(raw ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}
