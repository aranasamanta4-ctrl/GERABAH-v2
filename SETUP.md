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

Buka `.env` di folder ini, ganti `DATABASE_URL` dengan **Transaction pooler**:

```
DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-...pooler.supabase.com:6543/postgres?pgbouncer=true"
AUTH_SECRET="<hasil: openssl rand -base64 32>"
```

Ganti juga `AUTH_SECRET` dengan string acak (jangan pakai nilai dev untuk seterusnya).

## 4. Jalankan migrasi (bikin tabel)

Migrasi butuh **Session pooler (port 5432)**. Cara paling cepat — sementara pakai string 5432:

```bash
# sementara set DATABASE_URL ke versi port 5432 (tanpa ?pgbouncer=true), lalu:
npx prisma migrate dev --name init
# balikin DATABASE_URL ke versi port 6543 (?pgbouncer=true)
```

Atau, kalau belum mau ribet migrasi, cukup push skema:

```bash
npx prisma db push        # juga butuh koneksi biasa; tidak bikin file migrasi
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
