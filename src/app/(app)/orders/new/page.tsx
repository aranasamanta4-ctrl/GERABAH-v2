import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { createOrder } from "@/lib/actions/orders";
import { PageHeader } from "@/components/page-header";
import { OrderForm } from "@/components/order-form";

export default async function NewOrderPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const [products, customers, channels] = await Promise.all([
    prisma.product.findMany({
      where: { businessId: business.id, status: { not: "inactive" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sellingPrice: true },
    }),
    prisma.customer.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.salesChannel.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Buat Pesanan" subtitle="Belum mengurangi stok — nanti saat Selesai" back="/orders" />
      <OrderForm action={createOrder} products={products} customers={customers} channels={channels.map((c) => c.name)} />
    </>
  );
}
