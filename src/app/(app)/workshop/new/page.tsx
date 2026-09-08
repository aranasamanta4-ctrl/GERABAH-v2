import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { createWorkshop } from "@/lib/actions/workshop";
import { PageHeader } from "@/components/page-header";
import { WorkshopForm, type WorkshopProduct } from "@/components/workshop-form";

export default async function NewWorkshopPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const products = await prisma.product.findMany({
    where: { businessId: business.id, status: { not: "inactive" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, sellingPrice: true },
  });

  return (
    <>
      <PageHeader title="Hitung Harga Workshop" subtitle="Isi biaya, aplikasi hitung harga penawaran" back="/workshop" />
      <WorkshopForm action={createWorkshop} products={products as WorkshopProduct[]} />
    </>
  );
}
