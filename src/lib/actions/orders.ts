"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_FLOW } from "@/lib/labels";
import {
  type FormState,
  run,
  requireBusiness,
  findOrCreateChannel,
  salesIncomeCategoryId,
  parseAmount,
  parseItems,
} from "./_helpers";

export async function createOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  let newId = "";

  const res = await run(async () => {
    const items = parseItems(formData.get("items"));
    const customerId = String(formData.get("customerId") ?? "") || null;
    const discount = parseAmount(formData.get("discount"));
    const downPayment = parseAmount(formData.get("downPayment"));
    const channelName = String(formData.get("channel") ?? "");
    const dueDateValue = String(formData.get("dueDate") ?? "");
    const notes = String(formData.get("notes") ?? "").trim();

    if (items.length === 0) throw new Error("Pilih minimal satu barang yang dipesan.");

    const products = await prisma.product.findMany({
      where: { id: { in: [...new Set(items.map((i) => i.productId))] }, businessId: business.id },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    if (byId.size !== new Set(items.map((i) => i.productId)).size) throw new Error("Ada produk yang tidak ditemukan.");

    const lineItems = items.map((i, idx) => {
      const p = byId.get(i.productId)!;
      const unit = i.unitPrice > 0 ? i.unitPrice : p.sellingPrice;
      // diskon keseluruhan disimpan di baris pertama
      return { productId: i.productId, quantity: i.quantity, price: unit, discount: idx === 0 ? discount : 0 };
    });

    const gross = lineItems.reduce((s, i) => s + i.quantity * i.price, 0);
    const total = Math.max(gross - discount, 0);
    const remainingPayment = Math.max(total - downPayment, 0);
    const paymentStatus = remainingPayment <= 0 ? "Paid" : downPayment > 0 ? "Partially Paid" : "Unpaid";
    const channelId = channelName ? await findOrCreateChannel(business.id, channelName) : null;

    const order = await prisma.order.create({
      data: {
        businessId: business.id,
        customerId: customerId ?? undefined,
        channelId: channelId ?? undefined,
        status: "New",
        paymentStatus,
        downPayment,
        remainingPayment,
        total,
        dueDate: dueDateValue ? new Date(dueDateValue) : undefined,
        notes: notes || undefined,
        items: { create: lineItems },
      },
    });
    newId = order.id;
  });

  if (res.error) return res;
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect(`/orders/${newId}`);
}

export async function advanceOrderStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireBusiness();
  const orderId = String(formData.get("id") ?? "");
  const nextStatus = String(formData.get("status") ?? "");

  const res = await run(async () => {
    const valid = ORDER_STATUS_FLOW.includes(nextStatus as (typeof ORDER_STATUS_FLOW)[number]);
    if (!valid && nextStatus !== "Cancelled") throw new Error("Status tidak valid.");

    if (nextStatus === "Completed") {
      await completeOrderInner(orderId);
    } else {
      await prisma.order.update({ where: { id: orderId }, data: { status: nextStatus } });
    }
  });

  if (res.error) return res;
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { ok: true };
}

async function completeOrderInner(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) throw new Error("Pesanan tidak ditemukan.");
  if (order.items.length === 0) throw new Error("Pesanan tidak punya item.");

  const qtyByProduct = new Map<string, number>();
  for (const it of order.items) qtyByProduct.set(it.productId, (qtyByProduct.get(it.productId) ?? 0) + it.quantity);

  const productById = new Map(order.items.map((it) => [it.productId, it.product]));
  for (const [productId, qty] of qtyByProduct) {
    const p = productById.get(productId)!;
    if (qty > p.stock) {
      throw new Error(`Stok ${p.name} tidak cukup — tersisa ${p.stock}, dibutuhkan ${qty}. Tambah stok dulu.`);
    }
  }

  const incomeCategoryId = await salesIncomeCategoryId(order.businessId);
  const amountReceived = order.total - order.remainingPayment;
  const subtotal = order.items.reduce((s, it) => s + it.quantity * it.price, 0);
  const discount = order.items.reduce((s, it) => s + it.discount, 0);
  const firstName = order.items[0].product.name;
  const description =
    order.items.length === 1
      ? `Penjualan ${firstName} (dari Pesanan)`
      : `Penjualan ${firstName} + ${order.items.length - 1} barang lain (dari Pesanan)`;

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        businessId: order.businessId,
        customerId: order.customerId ?? undefined,
        channelId: order.channelId ?? undefined,
        subtotal,
        discount,
        total: order.total,
        amountPaid: amountReceived,
        outstandingBalance: order.remainingPayment,
        paymentStatus: order.paymentStatus,
        orderId: order.id,
        items: {
          create: order.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.price,
            lineTotal: it.quantity * it.price,
          })),
        },
      },
    });

    for (const [productId, qty] of qtyByProduct) {
      const p = productById.get(productId)!;
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: { decrement: qty },
          status: p.stock - qty <= 0 ? "out_of_stock" : "active",
        },
      });
    }

    if (amountReceived > 0) {
      await tx.financialTransaction.create({
        data: {
          businessId: order.businessId,
          type: "INCOME",
          incomeCategoryId,
          description,
          amount: amountReceived,
          relatedSaleId: sale.id,
        },
      });
    }

    await tx.order.update({ where: { id: order.id }, data: { status: "Completed" } });
  });
}

export async function recordOrderPayment(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireBusiness();
  const orderId = String(formData.get("orderId") ?? "");

  const res = await run(async () => {
    const amount = parseAmount(formData.get("amount"));
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Pesanan tidak ditemukan.");
    if (amount <= 0) throw new Error("Isi jumlah pembayaran.");
    if (amount > order.remainingPayment) throw new Error("Jumlah melebihi sisa tagihan.");

    const newRemaining = order.remainingPayment - amount;
    await prisma.order.update({
      where: { id: orderId },
      data: {
        downPayment: order.downPayment + amount,
        remainingPayment: newRemaining,
        paymentStatus: newRemaining <= 0 ? "Paid" : "Partially Paid",
      },
    });
  });

  if (res.error) return res;
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { ok: true };
}
