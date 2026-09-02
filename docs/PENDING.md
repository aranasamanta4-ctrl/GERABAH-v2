# GERABAH v2 — Pending

**Dibuat:** 3 September 2026

## 🔴 Sebelum bisa dipakai

1. **Buat project Supabase baru + isi `.env`** — lihat `SETUP.md`. Tanpa ini `npm run dev` jalan tapi semua
   halaman error waktu query DB.
2. **Jalankan `prisma migrate dev --name init`** (atau `prisma db push`) untuk membuat tabel.
3. **`AUTH_SECRET`** — ganti dari nilai dev sebelum dipakai serius.

## 🟡 Sebelum production

4. **Upload foto/video** — `src/lib/upload.ts` masih simpan ke `public/uploads/` (disk). Tidak permanen di
   Vercel. Pindah ke **Supabase Storage** (project sudah ada).
5. **Verifikasi visual tiap layar** dengan data asli — build + typecheck + lint sudah bersih, tapi belum
   pernah dijalankan dengan database sungguhan. Layar yang perlu dicek: Beranda, Keuangan, Produk (form +
   detail + edit), Penjualan (form + detail + invoice PDF), Pesanan (pipeline status + pembayaran + nota),
   Pelanggan, Laporan, Pengaturan.
6. **Invoice PDF** — logika di-port dari v1 (sudah terbukti). Uji `scripts/preview-invoice.ts` untuk
   mengecek layout tanpa DB: `npx tsx scripts/preview-invoice.ts`.

## 🟢 Nice-to-have

7. Belum ada halaman kelola kategori/tempat jualan/metode bayar terpisah — untuk sekarang semuanya
   "ketik baru untuk menambah" di form masing-masing. Halaman kelola bisa ditambah di Pengaturan.
8. `SaleForm`/`OrderForm` hanya mendukung 1 produk per transaksi (sama seperti v1). Multi-item butuh
   perubahan skema form + action.
9. Belum ada service worker untuk offline. Manifest + install-to-homescreen sudah jalan.
10. `next dev` menulis blok "This is NOT the Next.js you know" ke `AGENTS.md` — belum dibuat file itu di
    v2; biarkan `next dev` yang membuatnya, lalu commit.

## Catatan teknis

- Semua server action pakai signature `(prevState, formData) => Promise<FormState>` + `useActionState`.
  Helper `run()` di `src/lib/actions/_helpers.ts` membungkus error jadi `{ error }` inline.
- Skema pakai `onDelete: Cascade` dari `Business` ke bawah → reset data 1 akun cukup
  `DELETE FROM "Business" WHERE "ownerId" = ...` (atau hapus User, cascade ikut).
- Reset semua: `TRUNCATE ... RESTART IDENTITY CASCADE` seperti di v1.
