import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Hapus semua data SATU akun (berdasarkan email). User login-nya ikut terhapus.
 * Jalankan: npx tsx scripts/reset-account.ts email@contoh.com
 */
async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Pakai: npx tsx scripts/reset-account.ts <email>");
    process.exit(1);
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    const user = await prisma.user.findUnique({ where: { email }, include: { businesses: true } });
    if (!user) {
      console.error(`User ${email} tidak ditemukan.`);
      process.exit(1);
    }
    const bizIds = user.businesses.map((b) => b.id);
    const inBiz = { businessId: { in: bizIds } };

    await prisma.payment.deleteMany({ where: inBiz });
    await prisma.financialTransaction.deleteMany({ where: inBiz });
    await prisma.saleItem.deleteMany({ where: { sale: inBiz } });
    await prisma.orderItem.deleteMany({ where: { order: inBiz } });
    await prisma.sale.deleteMany({ where: inBiz });
    await prisma.order.deleteMany({ where: inBiz });
    await prisma.productCostComponent.deleteMany({ where: { product: inBiz } });
    await prisma.product.deleteMany({ where: inBiz });
    await prisma.customer.deleteMany({ where: inBiz });
    await prisma.productCategory.deleteMany({ where: inBiz });
    await prisma.expenseCategory.deleteMany({ where: inBiz });
    await prisma.incomeCategory.deleteMany({ where: inBiz });
    await prisma.salesChannel.deleteMany({ where: inBiz });
    await prisma.paymentMethod.deleteMany({ where: inBiz });
    await prisma.business.deleteMany({ where: { id: { in: bizIds } } });
    await prisma.user.delete({ where: { id: user.id } });

    console.log(`✓ Akun ${email} beserta semua datanya dihapus.`);
  } finally {
    await prisma.$disconnect();
  }
}
main();
