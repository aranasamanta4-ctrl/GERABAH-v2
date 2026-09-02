# GERABAH v2

Versi bangun-ulang dari aplikasi pencatatan keuangan UMKM gerabah. Fokus: UI/UX yang bersih, netral, dan
intuitif; alur pendek; bahasa sehari-hari. Dibuat terpisah dari versi lama (`../APK Cata Uang UMKM Gerabah`)
yang tetap utuh.

## Tech stack

- **Next.js 16** (App Router, Turbopack, Server Actions + `useActionState`)
- **PostgreSQL di Supabase** + **Prisma 7** (`@prisma/adapter-pg`)
- **Tailwind CSS v4** — desain token di `src/app/globals.css`
- Auth custom: JWT httpOnly cookie + bcrypt (bukan NextAuth)
- Invoice PDF: `pdf-lib` (server, tanpa browser)
- Font: Plus Jakarta Sans · Bahasa: Indonesia

## Yang berbeda dari v1

- **Sistem desain baru**: kanvas warm-white, kartu putih, satu aksen clay (`#C2410C`), alur uang
  teal/clay yang aman untuk buta warna. Tidak ada serif dekoratif.
- **Semua form pakai `useActionState`** — error tampil inline, tombol punya state "menyimpan", tidak ada
  lagi form yang membeku diam-diam.
- **Onboarding idempotent** — kalau gagal separuh jalan, aman diulang; tidak menolak dengan 409.
- **Skema bersih** — tabel `Post*` komunitas dibuang, `onDelete: Cascade` dipasang dari `Business` ke
  bawah supaya reset data satu akun tidak perlu hapus manual berjenjang.
- Navigasi: tab bar bawah + tombol "Catat" mengambang di HP; sidebar penuh di desktop.

## Setup pertama kali

Lihat [`SETUP.md`](./SETUP.md) — bikin project Supabase baru, isi `.env`, jalankan migrasi.

Setelah `.env` terisi:

```bash
npm install
npx prisma migrate dev --name init   # butuh Session pooler (port 5432)
npm run dev                          # http://localhost:3000
```

## Struktur

- `prisma/schema.prisma` — skema DB
- `src/lib/` — prisma, auth, format, labels, date-range, invoice-pdf, seed-defaults
- `src/lib/actions/` — server actions per modul (`_helpers.ts` berisi `FormState`, `run`, `requireBusiness`)
- `src/components/` — design system (`ui.tsx`, `form.tsx`, `nav.tsx`, `*-form.tsx`, dll)
- `src/app/(app)/` — halaman yang butuh login
- `src/app/api/invoice/*` — endpoint PDF · `src/app/api/reports/export` — CSV

## Belum selesai

Lihat [`docs/PENDING.md`](./docs/PENDING.md).
