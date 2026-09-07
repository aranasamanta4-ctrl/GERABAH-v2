import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCurrentBusiness } from "@/lib/current-user";

export type FormState = { error?: string; ok?: boolean; message?: string };
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

/** Seperti requireBusiness, tapi menolak staf (halaman/aksi khusus owner). */
export async function requireOwner() {
  const session = await getSession();
  if (!session) redirect("/login");
  const business = await prisma.business.findFirst({ where: { ownerId: session.userId } });
  if (!business) {
    // staf yang ditautkan ke sebuah business → tendang ke dashboard, bukan onboarding
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (user?.memberOfBusinessId) redirect("/dashboard");
    redirect("/onboarding");
  }
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

export type LineItemInput = { productId: string; quantity: number; unitPrice: number };

/** Baca daftar barang dari field JSON tersembunyi form penjualan/pesanan. */
export function parseItems(raw: FormDataEntryValue | null): LineItemInput[] {
  try {
    const arr = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => ({
        productId: String(x?.productId ?? ""),
        quantity: Math.max(0, Math.floor(Number(x?.quantity) || 0)),
        unitPrice: Math.max(0, Math.floor(Number(x?.unitPrice) || 0)),
      }))
      .filter((x) => x.productId && x.quantity > 0);
  } catch {
    return [];
  }
}

/** Jumlahkan kuantitas per produk (produk yang sama muncul di beberapa baris). */
export function sumQtyByProduct(items: LineItemInput[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) m.set(it.productId, (m.get(it.productId) ?? 0) + it.quantity);
  return m;
}
