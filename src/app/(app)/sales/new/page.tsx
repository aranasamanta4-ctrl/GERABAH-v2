import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { createSale } from "@/lib/actions/sales";
import { todayISO } from "@/lib/date-range";
import { PageHeader } from "@/components/page-header";
import { SaleForm } from "@/components/sale-form";

export default async function NewSalePage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const [products, customers, channels, paymentMethods] = await Promise.all([
    prisma.product.findMany({
      where: { businessId: business.id, status: { not: "inactive" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sellingPrice: true, stock: true },
    }),
    prisma.customer.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.salesChannel.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
    prisma.paymentMethod.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Catat Penjualan" subtitle="Stok berkurang & uang masuk otomatis" back="/sales" />
      <SaleForm
        action={createSale}
        products={products}
        customers={customers}
        channels={channels.map((c) => c.name)}
        paymentMethods={paymentMethods.map((c) => c.name)}
        today={todayISO()}
      />
    </>
  );
}
