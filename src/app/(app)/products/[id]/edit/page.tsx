import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { updateProduct } from "@/lib/actions/products";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/product-form";

function costOf(components: { label: string; amount: number }[], label: string) {
  return components.find((c) => c.label === label)?.amount ?? 0;
}

export default async function EditProductPage({ params }: PageProps<"/products/[id]/edit">) {
  const { id } = await params;
  const business = await getCurrentBusiness();
  if (!business) return null;

  const [product, categories] = await Promise.all([
    prisma.product.findFirst({ where: { id, businessId: business.id }, include: { category: true, costComponents: true } }),
    prisma.productCategory.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <>
      <PageHeader title="Ubah Produk" back={`/products/${id}`} />
      <ProductForm
        action={updateProduct}
        categories={categories.map((c) => c.name)}
        submitLabel="Simpan Perubahan"
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
            materialCost: costOf(product.costComponents, "Material Cost"),
            laborCost: costOf(product.costComponents, "Labor Cost"),
            packagingCost: costOf(product.costComponents, "Packaging Cost"),
            otherCost: costOf(product.costComponents, "Other Cost"),
          },
        }}
      />
    </>
  );
}
