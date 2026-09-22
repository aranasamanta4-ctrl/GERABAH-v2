import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Migrasi data lama ke skema baru (lihat docs/EVALUASI-DAN-RENCANA-PENGEMBANGAN.md §10.3.2/10.3.3/10.3.4):
//   - ProductCostComponent "Material Cost" (satu angka) -> 1 baris ProductMaterial per produk.
//   - ProductCostComponent "Labor Cost" (per produk)     -> dijumlah per bisnis -> 1 FixedCost bulanan.
//   - ProductCostComponent "Other Cost" tanpa kategori    -> ditautkan ke ProductOtherCostCategory "Lainnya".
// Aman dijalankan berkali-kali (idempotent): baris yang sudah dimigrasi tidak diproses ulang.
// Jalankan: npx tsx scripts/migrate-product-costs.ts
async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

  try {
    // 1) Material Cost -> ProductMaterial
    const materialComponents = await prisma.productCostComponent.findMany({
      where: { label: "Material Cost" },
      include: { product: { select: { id: true, name: true } } },
    });
    let materialMoved = 0;
    for (const c of materialComponents) {
      if (c.amount > 0) {
        await prisma.productMaterial.create({
          data: {
            productId: c.productId,
            name: "Bahan baku (migrasi data lama)",
            quantity: 1,
            unit: "paket",
            unitCost: c.amount,
          },
        });
        materialMoved++;
      }
      await prisma.productCostComponent.delete({ where: { id: c.id } });
    }
    console.log(`✓ Material Cost -> ProductMaterial: ${materialMoved} produk dipindah (${materialComponents.length} baris lama dihapus)`);

    // 2) Labor Cost -> 1 FixedCost bulanan per bisnis
    const laborComponents = await prisma.productCostComponent.findMany({
      where: { label: "Labor Cost" },
      include: { product: { select: { businessId: true } } },
    });
    const laborByBusiness = new Map<string, number>();
    for (const c of laborComponents) {
      laborByBusiness.set(c.product.businessId, (laborByBusiness.get(c.product.businessId) ?? 0) + c.amount);
    }
    for (const [businessId, total] of laborByBusiness) {
      if (total <= 0) continue;
      let category = await prisma.fixedCostCategory.findFirst({ where: { businessId, name: "Tenaga Kerja" } });
      if (!category) category = await prisma.fixedCostCategory.create({ data: { businessId, name: "Tenaga Kerja" } });
      await prisma.fixedCost.create({
        data: {
          businessId,
          name: "Tenaga kerja (migrasi dari data produk lama)",
          categoryId: category.id,
          amount: total,
          period: "monthly",
          note:
            "Dipindah otomatis dari total biaya tenaga kerja yang tadinya diisi per produk. Sesuaikan jumlahnya di menu Aset & Biaya Tetap.",
        },
      });
    }
    if (laborComponents.length > 0) {
      await prisma.productCostComponent.deleteMany({ where: { id: { in: laborComponents.map((c) => c.id) } } });
    }
    console.log(`✓ Labor Cost -> FixedCost bulanan: ${laborByBusiness.size} bisnis (${laborComponents.length} baris lama dihapus)`);

    // 3) Other Cost tanpa kategori -> kategori "Lainnya"
    const otherComponents = await prisma.productCostComponent.findMany({
      where: { label: "Other Cost", otherCategoryId: null },
      include: { product: { select: { businessId: true } } },
    });
    const catCache = new Map<string, string>();
    let otherLinked = 0;
    for (const c of otherComponents) {
      const businessId = c.product.businessId;
      let categoryId = catCache.get(businessId);
      if (!categoryId) {
        let cat = await prisma.productOtherCostCategory.findFirst({ where: { businessId, name: "Lainnya" } });
        if (!cat) cat = await prisma.productOtherCostCategory.create({ data: { businessId, name: "Lainnya" } });
        categoryId = cat.id;
        catCache.set(businessId, categoryId);
      }
      await prisma.productCostComponent.update({ where: { id: c.id }, data: { otherCategoryId: categoryId } });
      otherLinked++;
    }
    console.log(`✓ Other Cost -> kategori "Lainnya": ${otherLinked} baris ditautkan`);

    console.log("\nSelesai.");
  } catch (err) {
    console.error("\n✗ GAGAL:");
    console.error(err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
