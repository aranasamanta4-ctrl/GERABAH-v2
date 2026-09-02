import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { createProduct } from "@/lib/actions/products";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/product-form";

export default async function NewProductPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const categories = await prisma.productCategory.findMany({
    where: { businessId: business.id },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader title="Tambah Produk" back="/products" />
      <ProductForm action={createProduct} categories={categories.map((c) => c.name)} submitLabel="Simpan Produk" />
    </>
  );
}
