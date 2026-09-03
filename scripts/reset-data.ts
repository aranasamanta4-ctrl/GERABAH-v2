import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Kosongkan SEMUA data aplikasi (semua akun). Struktur tabel tetap.
 * Jalankan: npx tsx scripts/reset-data.ts
 */
async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    await prisma.payment.deleteMany();
    await prisma.financialTransaction.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.order.deleteMany();
    await prisma.productCostComponent.deleteMany();
    await prisma.product.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.productCategory.deleteMany();
    await prisma.expenseCategory.deleteMany();
    await prisma.incomeCategory.deleteMany();
    await prisma.salesChannel.deleteMany();
    await prisma.paymentMethod.deleteMany();
    await prisma.business.deleteMany();
    await prisma.user.deleteMany();
    console.log("✓ Semua data dihapus. Database kosong.");
  } finally {
    await prisma.$disconnect();
  }
}
main();
