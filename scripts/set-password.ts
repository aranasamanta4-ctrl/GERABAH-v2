import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

/** Ganti kata sandi user. Pakai: npx tsx scripts/set-password.ts <email> <password-baru> */
async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Pakai: npx tsx scripts/set-password.ts <email> <password-baru>");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password minimal 8 karakter.");
    process.exit(1);
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    const user = await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { passwordHash: await bcrypt.hash(password, 10) },
    });
    console.log(`✓ Kata sandi ${user.email} diganti. Sekarang bisa login dengan password baru.`);
  } catch {
    console.error(`User ${email} tidak ditemukan.`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
main();
