import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/current-user";
import { updateProduct } from "@/lib/actions/products";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/product-form";

function costOf(components: { label: string; amount: number }[], label: string) {
  return components.find((c) => c.label === label)?.amount ?? 0;
}

export default async function EditProductPage({ params }: PageProps<"/products/[id]/edit">) {
  const { id } = await params;
  const ctx = await getSessionContext();
  const business = ctx?.business;
  if (!business) return null;

  const [product, categories, otherCostCategories] = await Promise.all([
    prisma.product.findFirst({
      where: { id, businessId: business.id },
      include: {
        category: true,
        costComponents: { include: { otherCategory: true } },
        materials: true,
        changeRequests: { where: { status: "pending", field: "sellingPrice" }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.productCategory.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
    prisma.productOtherCostCategory.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  const otherComponent = product.costComponents.find((c) => c.label === "Other Cost");
  const pending = product.changeRequests[0];

  return (
    <>
      <PageHeader title="Ubah Produk" back={`/products/${id}`} />
      <ProductForm
        action={updateProduct}
        categories={categories.map((c) => c.name)}
        otherCostCategories={otherCostCategories.map((c) => c.name)}
        submitLabel="Simpan Perubahan"
        isStaff={ctx.role === "staff"}
        pendingChange={pending ? { newValue: pending.newValue, requestedByName: pending.requestedByName } : null}
        initial={{
          id: product.id,
          name: product.name,
          category: product.category?.name ?? "",
          description: product.description,
          material: product.material,
          sellingPrice: product.sellingPrice,
          minStock: product.minStock,
          photoUrl: product.photoUrl,
          costs: {
            packagingCost: costOf(product.costComponents, "Packaging Cost"),
            otherCost: costOf(product.costComponents, "Other Cost"),
            otherCostCategory: otherComponent?.otherCategory?.name ?? "",
          },
          materials: product.materials.map((m) => ({ name: m.name, quantity: m.quantity, unit: m.unit, unitCost: m.unitCost })),
        }}
      />
    </>
  );
}
