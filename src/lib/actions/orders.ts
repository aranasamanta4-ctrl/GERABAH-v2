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
} from "./_helpers";

export async function createOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  let newId = "";

  const res = await run(async () => {
    const productId = String(formData.get("productId") ?? "");
    const customerId = String(formData.get("customerId") ?? "") || null;
    const quantity = Number(formData.get("quantity") ?? 0) || 0;
    const price = parseAmount(formData.get("price"));
    const discount = parseAmount(formData.get("discount"));
    const downPayment = parseAmount(formData.get("downPayment"));
    const channelName = String(formData.get("channel") ?? "");
    const dueDateValue = String(formData.get("dueDate") ?? "");
    const notes = String(formData.get("notes") ?? "").trim();

    if (!productId) throw new Error("Pilih produk yang dipesan.");
    if (quantity <= 0) throw new Error("Isi jumlah barangnya.");

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.businessId !== business.id) throw new Error("Produk tidak ditemukan.");

    const unit = price > 0 ? price : product.sellingPrice;
    const total = Math.max(quantity * unit - discount, 0);
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
        items: { create: [{ productId, quantity, price: unit, discount }] },
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

  const item = order.items[0];
  if (item.quantity > item.product.stock) {
    throw new Error(`Stok tidak cukup — tersisa ${item.product.stock}. Tambah stok dulu di halaman Produk.`);
  }

  const incomeCategoryId = await salesIncomeCategoryId(order.businessId);
  const amountReceived = order.total - order.remainingPayment;

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        businessId: order.businessId,
        customerId: order.customerId ?? undefined,
        channelId: order.channelId ?? undefined,
        subtotal: item.quantity * item.price,
        discount: item.discount,
        total: order.total,
        amountPaid: amountReceived,
        outstandingBalance: order.remainingPayment,
        paymentStatus: order.paymentStatus,
        orderId: order.id,
        items: {
          create: [
            {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.price,
              lineTotal: item.quantity * item.price,
            },
          ],
        },
      },
    });

    await tx.product.update({
      where: { id: item.productId },
      data: {
        stock: { decrement: item.quantity },
        status: item.product.stock - item.quantity <= 0 ? "out_of_stock" : "active",
      },
    });

    if (amountReceived > 0) {
      await tx.financialTransaction.create({
        data: {
          businessId: order.businessId,
          type: "INCOME",
          incomeCategoryId,
          description: `Penjualan ${item.product.name} (dari Pesanan)`,
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
