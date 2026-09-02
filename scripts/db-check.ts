import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Cek koneksi database + isi tabel inti. Jalankan:
//   npx tsx scripts/db-check.ts
async function main() {
  const url = process.env.DATABASE_URL ?? "";
  console.log("DATABASE_URL host:", url.replace(/:[^:@/]*@/, ":***@").split("?")[0] || "(kosong)");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`select 1`;
    console.log(`✓ SELECT 1 OK (${Date.now() - t0} ms)`);

    const [users, businesses, prodCat] = await Promise.all([
      prisma.user.count(),
      prisma.business.count(),
      prisma.productCategory.count(),
    ]);
    console.log(`✓ User=${users}  Business=${businesses}  ProductCategory=${prodCat}`);

    // simulasikan langkah onboarding yang macet
    const b = await prisma.business.findFirst();
    if (b) {
      const t1 = Date.now();
      await prisma.productCategory.createMany({
        data: ["__cek1", "__cek2"].map((name) => ({ businessId: b.id, name })),
        skipDuplicates: true,
      });
      await prisma.productCategory.deleteMany({ where: { name: { in: ["__cek1", "__cek2"] } } });
      console.log(`✓ createMany + deleteMany OK (${Date.now() - t1} ms)`);
    } else {
      console.log("… belum ada Business, lewati tes createMany");
    }

    console.log("\nSEMUA OK — database sehat.");
  } catch (err) {
    console.error("\n✗ GAGAL:");
    console.error(err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
