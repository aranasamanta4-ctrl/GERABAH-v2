"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  type FormState,
  run,
  requireBusiness,
  findOrCreateChannel,
  findOrCreatePaymentMethod,
  salesIncomeCategoryId,
  parseAmount,
} from "./_helpers";

export async function createSale(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  let newId = "";

  const res = await run(async () => {
    const productId = String(formData.get("productId") ?? "");
    const customerId = String(formData.get("customerId") ?? "") || null;
    const quantity = Number(formData.get("quantity") ?? 0) || 0;
    const unitPrice = parseAmount(formData.get("unitPrice"));
    const discount = parseAmount(formData.get("discount"));
    const channelName = String(formData.get("channel") ?? "");
    const paymentMethodName = String(formData.get("paymentMethod") ?? "");
    const paymentStatus = String(formData.get("paymentStatus") ?? "Paid");
    const amountPaidInput = parseAmount(formData.get("amountPaid"));
    const notes = String(formData.get("notes") ?? "").trim();
    const dateValue = String(formData.get("date") ?? "");

    if (!productId) throw new Error("Pilih produk yang dijual.");
    if (quantity <= 0) throw new Error("Isi jumlah barangnya.");

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.businessId !== business.id) throw new Error("Produk tidak ditemukan.");
    if (quantity > product.stock) throw new Error(`Stok tidak cukup — tersisa ${product.stock}.`);

    const price = unitPrice > 0 ? unitPrice : product.sellingPrice;
    const subtotal = quantity * price;
    const total = Math.max(subtotal - discount, 0);
    const amountPaid =
      paymentStatus === "Paid" ? total : paymentStatus === "Unpaid" ? 0 : Math.min(amountPaidInput, total);
    const outstandingBalance = total - amountPaid;
    const when = dateValue ? new Date(dateValue) : new Date();

    const [channelId, paymentMethodId, incomeCategoryId] = await Promise.all([
      channelName ? findOrCreateChannel(business.id, channelName) : Promise.resolve(null),
      paymentMethodName ? findOrCreatePaymentMethod(business.id, paymentMethodName) : Promise.resolve(null),
      salesIncomeCategoryId(business.id),
    ]);

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          businessId: business.id,
          customerId: customerId ?? undefined,
          channelId: channelId ?? undefined,
          date: when,
          subtotal,
          discount,
          total,
          amountPaid,
          outstandingBalance,
          paymentStatus,
          paymentMethodId: paymentMethodId ?? undefined,
          notes: notes || undefined,
          items: { create: [{ productId, quantity, unitPrice: price, lineTotal: subtotal }] },
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          stock: { decrement: quantity },
          status: product.stock - quantity <= 0 ? "out_of_stock" : "active",
        },
      });

      if (amountPaid > 0) {
        await tx.financialTransaction.create({
          data: {
            businessId: business.id,
            type: "INCOME",
            incomeCategoryId,
            description: `Penjualan ${product.name}`,
            amount: amountPaid,
            paymentMethodId: paymentMethodId ?? undefined,
            relatedSaleId: created.id,
            date: when,
          },
        });
      }
      return created;
    });
    newId = sale.id;
  });

  if (res.error) return res;
  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  redirect(`/sales/${newId}`);
}

export async function markSalePaid(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const saleId = String(formData.get("id") ?? "");

  const res = await run(async () => {
    const sale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale || sale.businessId !== business.id) throw new Error("Penjualan tidak ditemukan.");
    const remaining = sale.outstandingBalance;
    if (remaining <= 0) return;

    await prisma.$transaction([
      prisma.sale.update({
        where: { id: saleId },
        data: { amountPaid: sale.total, outstandingBalance: 0, paymentStatus: "Paid" },
      }),
      prisma.financialTransaction.create({
        data: {
          businessId: sale.businessId,
          type: "INCOME",
          description: "Pelunasan penjualan",
          amount: remaining,
          relatedSaleId: sale.id,
        },
      }),
    ]);
  });

  if (res.error) return res;
  revalidatePath(`/sales/${saleId}`);
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { ok: true };
}
