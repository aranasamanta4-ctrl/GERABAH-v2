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
  parseItems,
  sumQtyByProduct,
} from "./_helpers";

export async function createSale(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  let newId = "";

  const res = await run(async () => {
    const items = parseItems(formData.get("items"));
    const customerId = String(formData.get("customerId") ?? "") || null;
    const discount = parseAmount(formData.get("discount"));
    const channelName = String(formData.get("channel") ?? "");
    const paymentMethodName = String(formData.get("paymentMethod") ?? "");
    const paymentStatus = String(formData.get("paymentStatus") ?? "Paid");
    const amountPaidInput = parseAmount(formData.get("amountPaid"));
    const notes = String(formData.get("notes") ?? "").trim();
    const dateValue = String(formData.get("date") ?? "");

    if (items.length === 0) throw new Error("Pilih minimal satu barang yang dijual.");

    const products = await prisma.product.findMany({
      where: { id: { in: [...new Set(items.map((i) => i.productId))] }, businessId: business.id },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    if (byId.size !== new Set(items.map((i) => i.productId)).size) throw new Error("Ada produk yang tidak ditemukan.");

    for (const [productId, qty] of sumQtyByProduct(items)) {
      const p = byId.get(productId)!;
      if (qty > p.stock) throw new Error(`Stok ${p.name} tidak cukup — tersisa ${p.stock}, dibutuhkan ${qty}.`);
    }

    const lineItems = items.map((i) => {
      const p = byId.get(i.productId)!;
      const price = i.unitPrice > 0 ? i.unitPrice : p.sellingPrice;
      return { productId: i.productId, quantity: i.quantity, unitPrice: price, lineTotal: i.quantity * price };
    });

    const subtotal = lineItems.reduce((s, i) => s + i.lineTotal, 0);
    const total = Math.max(subtotal - discount, 0);
    const amountPaid =
      paymentStatus === "Paid" ? total : paymentStatus === "Unpaid" ? 0 : Math.min(amountPaidInput, total);
    const outstandingBalance = total - amountPaid;
    const when = dateValue ? new Date(dateValue) : new Date();

    const firstName = byId.get(items[0].productId)!.name;
    const description =
      items.length === 1 ? `Penjualan ${firstName}` : `Penjualan ${firstName} + ${items.length - 1} barang lain`;

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
          items: { create: lineItems },
        },
      });

      for (const [productId, qty] of sumQtyByProduct(items)) {
        const p = byId.get(productId)!;
        await tx.product.update({
          where: { id: productId },
          data: {
            stock: { decrement: qty },
            status: p.stock - qty <= 0 ? "out_of_stock" : "active",
          },
        });
      }

      if (amountPaid > 0) {
        await tx.financialTransaction.create({
          data: {
            businessId: business.id,
            type: "INCOME",
            incomeCategoryId,
            description,
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
