# Setup GERABAH v2

## 1. Buat project Supabase baru

1. https://supabase.com/dashboard → login `a.fhardhanwijaya14@gmail.com`
2. **New project** → nama `gerabah-v2`, region **Southeast Asia (Singapore)** atau **Northeast Asia (Seoul)**
   (dekat Indonesia). Simpan database password yang kamu buat.
3. Tunggu project selesai dibuat (~2 menit).

> Ini project **terpisah** dari yang lama (`xmzvuyuklhdxxwmuvbtk`). Data v1 tidak tersentuh.

## 2. Ambil connection string

Di dashboard project baru → **Connect** (tombol atas) → tab **ORMs** → **Prisma**.

Ada 2 string:
- **Transaction pooler** — port `6543`, ada `?pgbouncer=true` → dipakai aplikasi sehari-hari
- **Session pooler** — port `5432` → dipakai `prisma migrate`

## 3. Isi `.env`

Tab **Prisma** di Supabase menampilkan 2 baris (`DATABASE_URL` = pooler 6543, `DIRECT_URL` = 5432).
Salin keduanya ke `C:\Users\LENOVO\Downloads\GERABAH-v2\.env`, ganti `[YOUR-PASSWORD]` dengan database
password project-mu, dan ganti `AUTH_SECRET` dengan string acak.

## 4. Jalankan migrasi (bikin tabel)

`prisma.config.ts` otomatis pakai `DIRECT_URL` untuk migrasi — tidak perlu tukar string manual:

```bash
npx prisma migrate dev --name init
```

## 5. Cek koneksi & jalankan

```bash
npx tsx scripts/db-check.ts   # harus "SEMUA OK" dengan semua count = 0
npm run dev                   # http://localhost:3000
```

Buka di browser → **Buat Akun** → isi usaha → mulai.

## 6. Deploy (nanti)

- Vercel: import repo, set env `DATABASE_URL` (pooler 6543) + `AUTH_SECRET`, region `sin1` atau `icn1`.
- `postinstall` sudah menjalankan `prisma generate` otomatis.
- ⚠️ Upload foto masih ke disk lokal (`src/lib/upload.ts`) — belum jalan di serverless. Lihat `docs/PENDING.md`.
