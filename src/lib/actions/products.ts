"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";
import { type FormState, run, requireBusiness, findOrCreateProductCategory, parseAmount } from "./_helpers";

const COST_FIELDS: [string, string][] = [
  ["materialCost", "Material Cost"],
  ["laborCost", "Labor Cost"],
  ["packagingCost", "Packaging Cost"],
  ["otherCost", "Other Cost"],
];

function readCostComponents(formData: FormData) {
  return COST_FIELDS.map(([field, label]) => ({ label, amount: parseAmount(formData.get(field)) })).filter(
    (c) => c.amount > 0
  );
}

export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  let newId = "";

  const res = await run(async () => {
    const name = String(formData.get("name") ?? "").trim();
    const categoryName = String(formData.get("category") ?? "");
    const description = String(formData.get("description") ?? "").trim();
    const material = String(formData.get("material") ?? "").trim();
    const sellingPrice = parseAmount(formData.get("sellingPrice"));
    const stock = Number(formData.get("stock") ?? 0) || 0;
    const minStock = Number(formData.get("minStock") ?? 0) || 0;
    const photoFile = formData.get("photo") as File | null;

    if (!name) throw new Error("Nama produk wajib diisi.");
    if (sellingPrice <= 0) throw new Error("Isi harga jualnya dulu.");

    const categoryId = categoryName ? await findOrCreateProductCategory(business.id, categoryName) : null;
    const photoUrl = await saveUploadedFile(photoFile);

    const product = await prisma.product.create({
      data: {
        businessId: business.id,
        name,
        categoryId: categoryId ?? undefined,
        description: description || undefined,
        material: material || undefined,
        sellingPrice,
        stock,
        minStock,
        photoUrl: photoUrl || undefined,
        status: stock > 0 ? "active" : "out_of_stock",
        costComponents: { create: readCostComponents(formData) },
      },
    });
    newId = product.id;
  });

  if (res.error) return res;
  revalidatePath("/products");
  redirect(`/products/${newId}`);
}

export async function updateProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const id = String(formData.get("id") ?? "");

  const res = await run(async () => {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.businessId !== business.id) throw new Error("Produk tidak ditemukan.");

    const name = String(formData.get("name") ?? "").trim();
    const categoryName = String(formData.get("category") ?? "");
    const description = String(formData.get("description") ?? "").trim();
    const material = String(formData.get("material") ?? "").trim();
    const sellingPrice = parseAmount(formData.get("sellingPrice"));
    const minStock = Number(formData.get("minStock") ?? 0) || 0;
    const photoFile = formData.get("photo") as File | null;

    if (!name) throw new Error("Nama produk wajib diisi.");
    if (sellingPrice <= 0) throw new Error("Isi harga jualnya dulu.");

    const categoryId = categoryName ? await findOrCreateProductCategory(business.id, categoryName) : null;
    const photoUrl = await saveUploadedFile(photoFile);

    await prisma.$transaction(async (tx) => {
      await tx.productCostComponent.deleteMany({ where: { productId: id } });
      await tx.product.update({
        where: { id },
        data: {
          name,
          categoryId: categoryId ?? null,
          description: description || null,
          material: material || null,
          sellingPrice,
          minStock,
          photoUrl: photoUrl ?? undefined,
          costComponents: { create: readCostComponents(formData) },
        },
      });
    });
  });

  if (res.error) return res;
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

export async function adjustProductStock(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();

  const res = await run(async () => {
    const productId = String(formData.get("productId") ?? "");
    const mode = String(formData.get("mode") ?? "delta");
    const value = Number(formData.get("value") ?? 0) || 0;
    if (!productId) throw new Error("Produk tidak ditemukan.");

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.businessId !== business.id) throw new Error("Produk tidak ditemukan.");

    const newStock = mode === "set" ? Math.max(value, 0) : Math.max(product.stock + value, 0);
    await prisma.product.update({
      where: { id: productId },
      data: {
        stock: newStock,
        status: product.status === "inactive" ? "inactive" : newStock <= 0 ? "out_of_stock" : "active",
      },
    });
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
  });

  return res;
}

export async function productHasHistory(productId: string) {
  const [s, o] = await Promise.all([
    prisma.saleItem.count({ where: { productId } }),
    prisma.orderItem.count({ where: { productId } }),
  ]);
  return s > 0 || o > 0;
}

export async function deleteProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const productId = String(formData.get("id") ?? "");

  const res = await run(async () => {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.businessId !== business.id) throw new Error("Produk tidak ditemukan.");

    if (await productHasHistory(productId)) {
      await prisma.product.update({ where: { id: productId }, data: { status: "inactive" } });
    } else {
      await prisma.product.delete({ where: { id: productId } });
    }
  });

  if (res.error) return res;
  revalidatePath("/products");
  redirect("/products");
}

export async function restoreProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const productId = String(formData.get("id") ?? "");

  const res = await run(async () => {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.businessId !== business.id) throw new Error("Produk tidak ditemukan.");
    await prisma.product.update({
      where: { id: productId },
      data: { status: product.stock > 0 ? "active" : "out_of_stock" },
    });
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
  });

  return res;
}
