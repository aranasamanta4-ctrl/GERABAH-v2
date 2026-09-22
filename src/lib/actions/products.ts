"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";
import { formatIDRPlain } from "@/lib/format";
import { getSessionContext } from "@/lib/current-user";
import {
  type FormState,
  run,
  requireBusiness,
  requireOwner,
  findOrCreateProductCategory,
  findOrCreateProductOtherCostCategory,
  parseAmount,
  parseMaterials,
  logActivity,
} from "./_helpers";

function readMaterials(formData: FormData) {
  return parseMaterials(formData.get("materials")).map((m) => ({
    name: m.name,
    quantity: m.quantity,
    unit: m.unit,
    unitCost: m.unitCost,
  }));
}

/** Kemasan + Lain-lain (Bahan Baku sekarang di ProductMaterial, Tenaga Kerja di FixedCost bulanan). */
async function readCostComponents(businessId: string, formData: FormData) {
  const rows: { label: string; amount: number; otherCategoryId?: string }[] = [];

  const packagingCost = parseAmount(formData.get("packagingCost"));
  if (packagingCost > 0) rows.push({ label: "Packaging Cost", amount: packagingCost });

  const otherCost = parseAmount(formData.get("otherCost"));
  const otherCategoryName = String(formData.get("otherCostCategory") ?? "").trim();
  if (otherCost > 0) {
    const otherCategoryId = otherCategoryName
      ? await findOrCreateProductOtherCostCategory(businessId, otherCategoryName)
      : null;
    rows.push({ label: "Other Cost", amount: otherCost, otherCategoryId: otherCategoryId ?? undefined });
  }

  return rows;
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
    const costComponents = await readCostComponents(business.id, formData);
    const materials = readMaterials(formData);

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
        costComponents: { create: costComponents },
        materials: { create: materials },
      },
    });
    newId = product.id;
    await logActivity(business.id, "product.create", `Tambah produk ${name} (harga ${formatIDRPlain(sellingPrice)}, stok ${stock})`);
  });

  if (res.error) return res;
  revalidatePath("/products");
  redirect(`/products/${newId}`);
}

export async function updateProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const id = String(formData.get("id") ?? "");
  const ctx = await getSessionContext();

  const res = await run(async () => {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.businessId !== business.id) throw new Error("Produk tidak ditemukan.");

    const name = String(formData.get("name") ?? "").trim();
    const categoryName = String(formData.get("category") ?? "");
    const description = String(formData.get("description") ?? "").trim();
    const material = String(formData.get("material") ?? "").trim();
    const submittedPrice = parseAmount(formData.get("sellingPrice"));
    const minStock = Number(formData.get("minStock") ?? 0) || 0;
    const photoFile = formData.get("photo") as File | null;
    const priceChanged = submittedPrice !== product.sellingPrice;
    // Staf yang mengubah harga jual butuh persetujuan owner dulu — harga lama dipertahankan
    // sampai disetujui (lihat docs/EVALUASI-DAN-RENCANA-PENGEMBANGAN.md §10.2.5).
    const needsApproval = priceChanged && ctx?.role === "staff";
    const sellingPrice = needsApproval ? product.sellingPrice : submittedPrice;

    if (!name) throw new Error("Nama produk wajib diisi.");
    if (submittedPrice <= 0) throw new Error("Isi harga jualnya dulu.");

    const categoryId = categoryName ? await findOrCreateProductCategory(business.id, categoryName) : null;
    const photoUrl = await saveUploadedFile(photoFile);
    const costComponents = await readCostComponents(business.id, formData);
    const materials = readMaterials(formData);

    await prisma.$transaction(async (tx) => {
      await tx.productCostComponent.deleteMany({ where: { productId: id } });
      await tx.productMaterial.deleteMany({ where: { productId: id } });
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
          costComponents: { create: costComponents },
          materials: { create: materials },
        },
      });

      if (needsApproval) {
        const existingPending = await tx.productChangeRequest.findFirst({
          where: { productId: id, field: "sellingPrice", status: "pending" },
        });
        if (existingPending) {
          await tx.productChangeRequest.update({ where: { id: existingPending.id }, data: { newValue: submittedPrice } });
        } else {
          await tx.productChangeRequest.create({
            data: {
              businessId: business.id,
              productId: id,
              field: "sellingPrice",
              oldValue: product.sellingPrice,
              newValue: submittedPrice,
              requestedById: ctx?.user.id,
              requestedByName: ctx?.user.name ?? "Staf",
            },
          });
        }
      }
    });

    await logActivity(
      business.id,
      "product.update",
      needsApproval
        ? `Ajukan perubahan harga ${name}: ${formatIDRPlain(product.sellingPrice)} → ${formatIDRPlain(submittedPrice)} (menunggu persetujuan owner)`
        : priceChanged
          ? `Ubah produk ${name} — harga jual ${formatIDRPlain(product.sellingPrice)} → ${formatIDRPlain(sellingPrice)}`
          : `Ubah data produk ${name}`
    );
  });

  if (res.error) return res;
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  revalidatePath("/approvals");
  redirect(`/products/${id}`);
}

export async function approveProductChange(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();
  const requestId = String(formData.get("requestId") ?? "");
  let productId = "";

  const res = await run(async () => {
    const req = await prisma.productChangeRequest.findUnique({ where: { id: requestId }, include: { product: true } });
    if (!req || req.businessId !== business.id) throw new Error("Pengajuan tidak ditemukan.");
    if (req.status !== "pending") throw new Error("Pengajuan ini sudah diproses.");
    productId = req.productId;

    await prisma.$transaction([
      prisma.product.update({ where: { id: req.productId }, data: { sellingPrice: req.newValue } }),
      prisma.productChangeRequest.update({
        where: { id: req.id },
        data: { status: "approved", reviewedAt: new Date() },
      }),
    ]);
    await logActivity(
      business.id,
      "product.approve_price",
      `Setujui perubahan harga ${req.product.name}: ${formatIDRPlain(req.oldValue)} → ${formatIDRPlain(req.newValue)} (diajukan ${req.requestedByName})`
    );
  });

  if (res.error) return res;
  revalidatePath("/approvals");
  revalidatePath("/products");
  if (productId) revalidatePath(`/products/${productId}`);
  return { ok: true, message: "Perubahan harga disetujui." };
}

export async function rejectProductChange(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();
  const requestId = String(formData.get("requestId") ?? "");
  const note = String(formData.get("reviewNote") ?? "").trim();

  const res = await run(async () => {
    const req = await prisma.productChangeRequest.findUnique({ where: { id: requestId }, include: { product: true } });
    if (!req || req.businessId !== business.id) throw new Error("Pengajuan tidak ditemukan.");
    if (req.status !== "pending") throw new Error("Pengajuan ini sudah diproses.");

    await prisma.productChangeRequest.update({
      where: { id: req.id },
      data: { status: "rejected", reviewedAt: new Date(), reviewNote: note || null },
    });
    await logActivity(
      business.id,
      "product.reject_price",
      `Tolak perubahan harga ${req.product.name} (diajukan ${req.requestedByName})`
    );
  });

  if (res.error) return res;
  revalidatePath("/approvals");
  revalidatePath("/products");
  return { ok: true, message: "Pengajuan ditolak." };
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
    await logActivity(
      business.id,
      "stock.adjust",
      `Sesuaikan stok ${product.name}: ${product.stock} → ${newStock}`
    );
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
    await logActivity(business.id, "product.delete", `Arsipkan/hapus produk ${product.name}`);
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
