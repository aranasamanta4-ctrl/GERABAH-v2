# Deploy GERABAH v2 ke Vercel

## 1. Import project

1. Buka https://vercel.com → **Add New… → Project**
2. **Import** repo `aranasamanta4-ctrl/GERABAH-v2`
   (kalau belum connect, sambungkan akun GitHub-nya dulu)
3. Framework otomatis terdeteksi **Next.js**. Jangan ubah Build/Output settings —
   `vercel.json` sudah mengatur region `sin1` + `prisma migrate deploy`.

## 2. Environment Variables

Sebelum klik Deploy, buka **Environment Variables**, tambahkan 3 ini
(nilainya ada di `KREDENSIAL-JANGAN-COMMIT.txt` dan `.env` lokal):

| Name | Value | Untuk |
|------|-------|-------|
| `DATABASE_URL` | `postgresql://postgres.sndvjvtfdsgbgedrevic:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true` | aplikasi |
| `DIRECT_URL` | `postgresql://postgres.sndvjvtfdsgbgedrevic:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres` | migrasi saat build |
| `AUTH_SECRET` | string acak dari `.env` | tanda tangan cookie login |
| `NEXT_PUBLIC_ADMIN_WHATSAPP` | `6281234567890` | menu "Bantuan" & halaman "Lupa Kata Sandi" |

Set semuanya untuk **Production, Preview, Development** (centang semua).

> `NEXT_PUBLIC_ADMIN_WHATSAPP` opsional — kalau kosong, tombol Tanya Admin & Lupa Kata Sandi
> menampilkan info "hubungi pengelola".

### Lupa kata sandi (reset manual)

Tidak ada email otomatis. Kalau ada pengguna lupa kata sandi:

1. Pengguna buka halaman **Lupa Kata Sandi** → kirim email akunnya ke admin via WhatsApp.
2. Admin jalankan dari komputer:
   ```bash
   npx tsx scripts/set-password.ts <email> <kata-sandi-baru>
   ```
3. Beri tahu pengguna kata sandi barunya; sarankan segera diganti setelah login.

## 3. Deploy

Klik **Deploy**. Build: `prisma generate && next build`.

> **Migrasi TIDAK dijalankan saat build Vercel** — `prisma migrate deploy` sering menggantung lewat
> Supabase pooler (advisory lock tidak didukung di session pooler). Skema dikelola dari lokal.

Selesai → dapat URL `https://gerabah-v2-xxxx.vercel.app`.

## 4. Setiap ada perubahan skema DB

Jalankan migrasi dari komputer, **sebelum** push:

```bash
npx prisma migrate deploy          # terapkan ke Supabase (pakai DIRECT_URL)
git add prisma/migrations && git commit -m "..." && git push
```
Vercel build berikutnya cuma `prisma generate` (baca skema baru) + `next build`.

## ⚠️ Yang BELUM jalan di production

**Upload foto/video** — `src/lib/upload.ts` menyimpan ke `public/uploads/` di disk. Vercel serverless
tidak permanen; foto akan hilang. Sebelum fitur foto dipakai serius, pindahkan ke **Supabase Storage**
(project Supabase sudah ada). Sampai itu dikerjakan, produk tanpa foto tetap berfungsi normal.

## Custom domain (opsional)

Vercel → Project → **Settings → Domains** → tambahkan domain, ikuti instruksi DNS.
