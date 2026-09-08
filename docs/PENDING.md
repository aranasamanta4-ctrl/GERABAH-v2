# GERABAH v2 — Pending

**Dibuat:** 3 September 2026 · **Terakhir diperbarui:** 3 September 2026

## ✅ Sudah beres

- Project Supabase (`ref sndvjvtfdsgbgedrevic`, ap-southeast-1) + `.env` terisi + `AUTH_SECRET` acak.
- `prisma migrate dev --name init` — semua tabel dibuat.
- Smoke test lewat HTTP: **semua 30 route** (termasuk detail produk/penjualan/pesanan/pelanggan, form
  edit, laporan dengan data, invoice PDF, export CSV) → 200, tidak ada error di log dev server.
  PDF valid (`%PDF-1.7`), CSV isinya benar.

## 🟡 Sebelum production

0. **Env var baru** (lihat `.env.example` + `DEPLOY.md`):
   - `ADMIN_WHATSAPP` — nomor admin (format `62…`) untuk menu Bantuan / Tanya Admin
     dan halaman Lupa Kata Sandi.
   - Lupa Password: **reset manual** oleh admin lewat `scripts/set-password.ts` (tidak ada email otomatis).
1. **Verifikasi visual di browser** — smoke test cuma cek "tidak error + konten muncul". Belum ada mata
   manusia yang melihat tata letaknya di HP asli. Buka `npm run dev` → daftar → coba tiap alur.
   Alur baru yang perlu dicek: Lupa Password, tambah/hapus Staf di Pengaturan, login sebagai Staf,
   halaman Belum Lunas + tombol WhatsApp, kalkulator Workshop, unduh Laporan PDF.
2. **Upload foto/video** — `src/lib/upload.ts` sudah dukung **Supabase Storage**. Untuk aktif di
   Vercel: buat bucket `uploads` (public) + set env `SUPABASE_SERVICE_ROLE_KEY`. Lihat `DEPLOY.md`.
3. **`AUTH_SECRET` di Vercel** — set env var-nya (nilainya ada di `KREDENSIAL-JANGAN-COMMIT.txt`), plus
   `DATABASE_URL` (pooler 6543). Region `sin1`.

## 🟢 Nice-to-have

4. Belum ada halaman kelola kategori / tempat jualan / metode bayar. Sekarang "ketik baru untuk menambah"
   di tiap form. Halaman kelola bisa ditambah di Pengaturan.
5. `SaleForm` / `OrderForm` hanya 1 produk per transaksi (sama seperti v1). Multi-item butuh perubahan
   form + action.
6. Belum ada service worker offline. Manifest + install-to-homescreen sudah jalan.
7. `next dev` menulis blok "This is NOT the Next.js you know" ke `AGENTS.md` saat pertama jalan — commit
   file itu bersama perubahan berikutnya supaya tree bersih.

## Reset data

- **Satu akun:** `npx tsx scripts/reset-account.ts <email>` — hapus data + user login.
- **Semua akun:** `npx tsx scripts/reset-data.ts` — kosongkan semua tabel.
- Keduanya hapus berurutan (child dulu). `onDelete: Cascade` dari `Business` **tidak cukup sendiri**
  karena `SaleItem.product` / `OrderItem.product` masih `Restrict`. Kalau mau `DELETE FROM "Business"`
  langsung jalan, tambah `onDelete: Cascade` di dua relasi itu + migrasi baru.

## Catatan teknis

- Semua server action: `(prevState, formData) => Promise<FormState>` + `useActionState`. Helper `run()`
  di `src/lib/actions/_helpers.ts` membungkus error jadi `{ error }` inline; tombol punya state pending
  lewat `useFormStatus`.
- `prisma.config.ts` pakai `DIRECT_URL` (port 5432) untuk migrasi, `src/lib/prisma.ts` pakai
  `DATABASE_URL` (pooler 6543) untuk aplikasi.
