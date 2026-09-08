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

Set semuanya untuk **Production, Preview, Development** (centang semua).

> Nomor WhatsApp admin (menu Bantuan & Lupa Kata Sandi) sudah punya nilai bawaan di
> `src/lib/config.ts`. Untuk menggantinya tanpa ubah kode, set env `ADMIN_WHATSAPP`
> (format `62…`, **tanpa** prefix `NEXT_PUBLIC_`) lalu redeploy.

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

## Upload foto produk (Supabase Storage)

`src/lib/upload.ts` mengunggah ke **Supabase Storage** kalau `SUPABASE_SERVICE_ROLE_KEY` diset.
Tanpa key, foto disimpan ke disk lokal — **tidak jalan di Vercel** (filesystem read-only).

Langkah sekali saja:

1. Supabase → **Storage** → **New bucket** → nama `uploads` → centang **Public bucket** → Save.
2. Supabase → **Settings → API** → salin **`service_role`** key (RAHASIA).
3. Vercel → **Settings → Environment Variables** → tambah `SUPABASE_SERVICE_ROLE_KEY` = key tadi
   (Production + Preview + Development) → **Redeploy**.

Foto tampil lewat URL publik `…/storage/v1/object/public/uploads/…` (dipakai `<img>` biasa, tidak
perlu allowlist domain).

## Custom domain (opsional)

Vercel → Project → **Settings → Domains** → tambahkan domain, ikuti instruksi DNS.
