import { createCustomer } from "@/lib/actions/customers";
import { PageHeader } from "@/components/page-header";
import { CustomerForm } from "@/components/customer-form";

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader title="Tambah Pelanggan" back="/customers" />
      <CustomerForm action={createCustomer} submitLabel="Simpan Pelanggan" />
    </>
  );
}
