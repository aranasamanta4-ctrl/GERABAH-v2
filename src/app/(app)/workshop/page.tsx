import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { WorkshopCalculator, type WorkshopProduct } from "@/components/workshop-calculator";

export default async function WorkshopPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const products = await prisma.product.findMany({
    where: { businessId: business.id, status: { not: "inactive" } },
    orderBy: { name: "asc" },
    include: { costComponents: true },
  });

  const list: WorkshopProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    cost: p.costComponents.reduce((s, c) => s + c.amount, 0),
    price: p.sellingPrice,
  }));

  return <WorkshopCalculator products={list} />;
}
