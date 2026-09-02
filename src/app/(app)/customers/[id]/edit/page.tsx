import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { updateCustomer } from "@/lib/actions/customers";
import { PageHeader } from "@/components/page-header";
import { CustomerForm } from "@/components/customer-form";

export default async function EditCustomerPage({ params }: PageProps<"/customers/[id]/edit">) {
  const { id } = await params;
  const business = await getCurrentBusiness();
  if (!business) return null;

  const customer = await prisma.customer.findFirst({ where: { id, businessId: business.id } });
  if (!customer) notFound();

  return (
    <>
      <PageHeader title="Ubah Pelanggan" back={`/customers/${id}`} />
      <CustomerForm action={updateCustomer} submitLabel="Simpan Perubahan" initial={customer} />
    </>
  );
}
