# GERABAH — Evaluasi, Rencana Pengembangan, Migrasi & Biaya

**Aplikasi:** GERABAH — Pencatatan Keuangan & Operasional UMKM Gerabah
**Konteks:** Program Pengabdian Masyarakat PPMI KKSIK ITB
**URL saat ini:** https://gerabah-v2-whxs.vercel.app
**Dokumen dibuat:** 8 September 2026
**Status:** Sudah live, dalam tahap uji coba oleh mitra UMKM

---

## 1. Ringkasan Eksekutif

GERABAH adalah aplikasi web untuk mencatat keuangan, penjualan, pesanan, piutang, stok, dan
kegiatan workshop sebuah UMKM gerabah. Dirancang khusus untuk pengguna yang belum terbiasa aplikasi
digital: bahasa Indonesia sederhana, tampilan besar dan bersih, bisa dipasang di HP seperti aplikasi
biasa.

**Kondisi sekarang:** aplikasi berfungsi penuh dan sudah dipakai, berjalan **tanpa biaya bulanan**
(Vercel + Supabase paket gratis). Kekuatan utamanya adalah kelengkapan fitur dan biaya operasional
rendah. Kelemahan utamanya adalah ketergantungan pada layanan gratis (risiko *pause* & tidak ada
cadangan otomatis) dan ketergantungan pada satu pengembang untuk pemeliharaan.

**Rekomendasi singkat:**
1. Jangka pendek — pasang pemantau uptime (gratis) + rutin backup manual, atau naik Supabase Pro
   (~Rp 400 rb/bln) untuk backup harian.
2. Legal — daftarkan **Hak Cipta program komputer** dan **Merek "GERABAH"** ke DJKI; **paten tidak
   relevan** untuk jenis aplikasi ini.
3. Jangka menengah — perbaiki keterbatasan operasional (edit/hapus transaksi, kompres foto,
   pemantauan error) sebelum diserahkan penuh ke mitra.

---

## 2. Gambaran Umum Aplikasi

### 2.1 Untuk siapa

| Peran | Kegunaan |
|---|---|
| **Owner** (pemilik usaha) | Melihat seluruh laporan, laba/rugi, mengelola akun staf, semua pengaturan |
| **Staf** | Mencatat penjualan, pesanan, pengeluaran, pelanggan, stok/harga produk, hitung workshop |

### 2.2 Teknologi

| Lapisan | Teknologi | Catatan |
|---|---|---|
| Antarmuka & server | Next.js 16 (App Router, Server Components, Server Actions), React 19 | Satu basis kode untuk tampilan + logika server |
| Bahasa | TypeScript | Pengecekan tipe menyeluruh |
| Basis data | PostgreSQL (Supabase), ORM Prisma 7 | Region Singapura (ap-southeast-1) |
| Penyimpanan foto | Supabase Storage | Bucket publik `uploads` |
| Autentikasi | Cookie JWT (jose) + bcrypt | Buatan sendiri, tanpa layanan pihak ketiga |
| Hosting | Vercel | Auto-deploy dari GitHub, auto-scale |
| Styling | Tailwind CSS v4 | |
| PDF | pdf-lib | Invoice/nota & laporan keuangan, tanpa layanan eksternal |

### 2.3 Fitur yang sudah ada

- **Dashboard** — ringkasan untung/rugi, arus kas, produk terlaris, pesanan jatuh tempo, aktivitas staf
- **Keuangan** — catat uang masuk & keluar per kategori; saldo kas
- **Penjualan** — transaksi multi-barang, stok berkurang otomatis, uang masuk tercatat otomatis
- **Pesanan** — dikerjakan dulu bayar kemudian; alur status; otomatis jadi penjualan saat selesai
- **Pelanggan** — data + riwayat belanja + piutang; tombol chat WhatsApp
- **Produk** — katalog, foto, stok, stok minimum, komponen biaya produksi, harga jual
- **Belum Lunas** — daftar tagihan (pesanan & penjualan) + tombol pengingat WhatsApp siap kirim
- **Workshop** — kalkulator harga (biaya gift + operasional + target untung → harga penawaran & per
  peserta), tersimpan, bisa dicatat ke Keuangan
- **Laporan** — laba rugi, arus kas, ringkasan penjualan, daftar piutang, nilai persediaan; unduh
  **PDF** & **Excel/CSV**
- **Invoice / Nota PDF** — per penjualan & pesanan, format resmi Indonesia (terbilang, tanda tangan)
- **Bantuan / Tanya Admin** — FAQ + tombol WhatsApp admin
- **Dua peran pengguna** (Owner / Staf) dengan pembatasan akses
- **Log Aktivitas** — catatan apa yang diubah, kapan, oleh siapa (dilihat owner)
- **Lupa Password** — reset manual oleh admin (tanpa layanan email)

---

## 3. Kelebihan

### 3.1 Biaya & operasional

- **Bisa berjalan tanpa biaya bulanan.** Vercel Hobby + Supabase Free = Rp 0.
- **Tanpa server untuk diurus.** Vercel & Supabase yang menangani patch keamanan, skala, SSL.
- **Auto-scale.** Vercel menambah kapasitas sendiri saat ramai — tidak "down" karena banyak
  pengunjung sekaligus.
- **Tanpa layanan berbayar pihak ketiga.** PDF dibuat sendiri, notifikasi lewat link WhatsApp
  gratis, tidak ada biaya API.

### 3.2 Fungsional

- **Lengkap untuk UMKM.** Menutup siklus penuh: catat → jual/pesan → tagih → laporan.
- **Otomatisasi yang mengurangi salah hitung.** Stok, uang masuk, dan piutang tercatat sendiri dari
  transaksi.
- **Laporan siap pakai.** PDF format resmi untuk keperluan bank/koperasi/hibah; Excel untuk
  pengolahan lanjutan.
- **Multi-pengguna dengan peran.** Owner bisa mendelegasikan pencatatan ke staf tanpa membuka data
  laba/rugi.
- **Jejak audit.** Setiap perubahan tercatat — mengurangi risiko kecurangan & memudahkan koreksi.

### 3.3 Pengalaman pengguna

- **Dirancang untuk pengguna non-digital.** Huruf besar, bahasa sehari-hari, tombol jelas, alur
  singkat.
- **Mobile-first & bisa dipasang** (PWA) — muncul seperti aplikasi di layar HP.
- **Cepat.** Server-rendered, hemat data, region dekat (Singapura, ~20–50 ms ke Indonesia).

### 3.4 Teknis

- **Basis kode modern & rapi.** TypeScript menyeluruh, satu bahasa (JS/TS) untuk semua lapisan.
- **Skema basis data terkelola migrasi** (Prisma) — perubahan struktur tercatat & dapat diulang.
- **Mudah dipindah.** PostgreSQL & Next.js adalah standar terbuka — tidak terkunci ke satu vendor.

---

## 4. Kekurangan & Keterbatasan

### 4.1 Kritis (perlu diperhatikan sebelum diserahkan penuh)

| # | Kekurangan | Dampak | Mitigasi |
|---|---|---|---|
| K1 | **Paket gratis: tidak ada backup otomatis** | Kalau data rusak/terhapus, tidak bisa dikembalikan | Supabase Pro (backup harian) **atau** skrip backup manual rutin |
| K2 | **Supabase Free "pause" setelah 7 hari tanpa aktivitas** | Aplikasi mati total sampai di-*resume* manual | Pemantau uptime (ping tiap 5 menit) **atau** Supabase Pro |
| K3 | **Basis data pengembangan = produksi** | Hanya ada 1 project Supabase — uji coba menyentuh data asli | Buat project Supabase kedua khusus *staging* |
| K4 | **Ketergantungan pada satu pengembang** | *Deploy*, migrasi skema, reset password, backup hanya bisa lewat komputer pengembang | Dokumentasi lengkap + pelatihan admin mitra / tim penerus |
| K5 | **Tidak ada mode offline** | Internet putus di lokasi = aplikasi tidak bisa dibuka sama sekali | Belum ada di kode; siapkan pencatatan kertas sebagai cadangan |

### 4.2 Sedang

| # | Kekurangan | Dampak |
|---|---|---|
| K6 | **Penjualan tidak bisa diedit/dihapus** | Salah input tidak bisa dikoreksi lewat aplikasi |
| K7 | **Foto produk tidak dikompres** | Foto 10–15 MB dari HP disimpan apa adanya → lambat, kuota storage/transfer Free cepat habis |
| K8 | **Tidak ada pemantauan error** | Kegagalan di produksi baru diketahui saat pengguna komplain |
| K9 | **Hak akses staf masih kasar** | Hanya Owner vs Staf; tidak bisa dibatasi per fitur (mis. staf boleh jual tapi tidak boleh ubah harga) |
| K10 | **Vercel Hobby "non-komersial"** + batas waktu fungsi 10 detik | Area abu-abu untuk usaha; laporan PDF sangat besar berpotensi *timeout* |
| K11 | **Migrasi skema manual dari komputer pengembang** | Tidak ada *staging* sebagai penyangga bila migrasi salah |
| K12 | **Reset password bergantung admin** | Pengguna lupa password → harus menunggu admin online dengan komputer |

### 4.3 Kecil

- Autentikasi sederhana: cookie JWT tanpa 2FA, tanpa "keluar dari semua perangkat". Bila
  `AUTH_SECRET` bocor, sesi siapa pun bisa dipalsukan.
- *Cold start* Vercel ~1 detik setelah lama tidak diakses (berkurang bila ada pemantau uptime).
- Belum ada halaman kelola kategori / tempat jualan / metode bayar (sekarang: ketik baru untuk
  menambah).
- Belum ada notifikasi otomatis (pengingat jatuh tempo masih manual).
- Belum ada ekspor ke format akuntansi standar (mis. untuk aplikasi pajak / Accurate / Jurnal).
- File `KREDENSIAL-JANGAN-COMMIT.txt` berisi kredensial dalam teks biasa di folder proyek lokal.

---

## 5. Potensi Pengembangan

### 5.1 Jangka pendek — perbaikan keandalan (1–2 bulan)

Fokus: layak diserahkan penuh ke mitra tanpa pendampingan intensif.

- **Backup otomatis** — skrip `pg_dump` terjadwal ke penyimpanan lain (atau Supabase Pro).
- **Kompres & ubah ukuran foto** saat upload (mis. maks 1600px, kualitas 80%) — hemat storage 10×.
- **Edit / batalkan penjualan & pengeluaran** dengan pencatatan koreksi di log aktivitas.
- **Pemantauan error** — Sentry (paket gratis cukup) untuk notifikasi kegagalan di produksi.
- **Mode offline dasar** — *service worker* agar data yang sudah dimuat tetap bisa dilihat saat
  internet putus; input disimpan lokal dan dikirim saat online kembali.
- **Halaman kelola** kategori, tempat jualan, metode pembayaran, dan **edit akun staf**
  (ganti nama/email, reset password staf oleh owner).

### 5.2 Jangka menengah — fitur bernilai tambah (3–6 bulan)

- **Notifikasi otomatis** — pengingat jatuh tempo terkirim sendiri (WhatsApp API / email) tanpa
  owner menekan tombol satu per satu.
- **Laporan pajak UMKM** — perhitungan & format PPh Final 0,5% (PP 55/2022), rekap bulanan siap
  lapor.
- **Target & analisis** — target penjualan bulanan, grafik tren, perbandingan periode, produk
  paling menguntungkan (bukan sekadar terlaris).
- **Multi-cabang / multi-lokasi** dalam satu usaha.
- **Hak akses staf granular** — atur per fitur (lihat saja / input / ubah / hapus).
- **Manajemen bahan baku** — stok tanah liat, glasir, kayu bakar; biaya produksi terhitung otomatis
  dari pemakaian bahan.
- **Katalog online sederhana** — halaman publik produk yang bisa dibagikan ke pelanggan.

### 5.3 Jangka panjang — perluasan (6–12 bulan+)

- **Aplikasi mobile native** (atau PWA yang diperkuat) untuk pengalaman lebih baik & notifikasi
  push.
- **Integrasi marketplace** — tarik pesanan dari Tokopedia/Shopee/TikTok Shop; stok tersinkron.
- **Integrasi pembayaran** — QRIS / payment gateway; status lunas otomatis.
- **Scan barcode/QR** produk untuk penjualan cepat saat bazar/pameran.
- **Bantuan AI** — prediksi kebutuhan stok, rekomendasi harga jual dari biaya produksi & margin
  pasar, ringkasan keuangan berbahasa awam.
- **Integrasi akuntansi** — ekspor ke Accurate / Jurnal / Zahir untuk pembukuan formal.

### 5.4 Potensi model keberlanjutan

Karena arsitekturnya sudah **multi-usaha** (setiap `Business` terpisah), aplikasi ini berpotensi
menjadi **layanan bersama (SaaS)** untuk banyak UMKM gerabah/kerajinan sekaligus, bukan hanya satu
mitra. Opsi keberlanjutan:

| Model | Deskripsi | Konsekuensi |
|---|---|---|
| **Hibah / internal** | Dijalankan & dibiayai program pengabdian / kampus | Perlu penanggung jawab jangka panjang |
| **Donasi / gotong royong** | Komunitas perajin patungan biaya server | Cocok bila ada paguyuban |
| **Langganan ringan** | Rp 25–50 rb/bln per usaha untuk menutup biaya + pemeliharaan | Perlu badan hukum / bendahara & dukungan pengguna |
| **Sumber terbuka** | Kode dibuka, tiap komunitas *deploy* sendiri | Butuh dokumentasi instalasi yang sangat baik |

---

## 6. Opsi Migrasi Infrastruktur

Kode aplikasi **tidak perlu diubah** untuk pindah hosting — hanya konfigurasi (`.env`). Yang
berpindah: tempat menjalankan aplikasi, basis data, dan penyimpanan foto.

### 6.1 Perbandingan opsi

| Opsi | Cara | Biaya/bln (perkiraan) | Kelebihan | Kekurangan | Cocok bila |
|---|---|---|---|---|---|
| **A. Vercel + Supabase** (sekarang) | Sudah jalan | Rp 0 – Rp 400 rb | Tanpa urus server, auto-scale, auto-deploy | *Pause* & tanpa backup di paket gratis; batas Hobby | Ingin praktis, tim kecil |
| **B. VPS** (Hostinger / DigitalOcean / Contabo / Biznet) | Sewa server Linux, install sendiri | Rp 100 rb – Rp 300 rb | Semua jadi satu (app + DB + foto), kontrol penuh, hemat | Urus OS, keamanan, backup, SSL, *deploy* manual; satu titik gagal | Ada yang paham Linux, ingin mandiri & murah |
| **C. Platform lain** (Railway / Render / Fly.io) | Mirip Vercel, mendukung Next.js + Postgres bawaan | Rp 80 rb – Rp 400 rb | Lebih longgar dari Vercel Hobby, Postgres terkelola | Kurang populer di Indonesia, dokumentasi lokal minim | Ingin praktis tapi lepas dari batas Vercel |
| **D. Server kampus / on-premise** | *Deploy* di server institusi | Bervariasi (listrik + admin) | Kendali penuh, data di dalam institusi | Butuh IP publik, admin jaringan, ketersediaan listrik/internet | Institusi menyediakan & merawat |

### 6.2 Migrasi basis data (Supabase → PostgreSQL mandiri)

1. Install PostgreSQL 16 di server tujuan.
2. `pg_dump` dari Supabase (pakai `DIRECT_URL`, port 5432) → `pg_restore` ke server baru.
3. Ubah `DATABASE_URL` & `DIRECT_URL` di `.env` ke alamat baru.
4. `npx prisma migrate deploy` untuk memastikan skema sinkron.
5. Uji: login, buat 1 transaksi, buka laporan.

**Perkiraan usaha:** setengah hari (data kecil, di bawah 100 MB).

### 6.3 Migrasi penyimpanan foto

| Dari | Ke | Cara |
|---|---|---|
| Supabase Storage | Disk VPS | Hapus `SUPABASE_SERVICE_ROLE_KEY` — `src/lib/upload.ts` otomatis pakai `public/uploads/`. Salin file lama via Storage API. |
| Supabase Storage | Amazon S3 / Cloudflare R2 / Cloudinary | Perlu penyesuaian kecil di `src/lib/upload.ts` (ganti endpoint & header). |

### 6.4 Rekomendasi migrasi

- **Tetap di Vercel + Supabase** selama masih ada pendampingan tim (praktis, sudah teruji).
- **Naik ke VPS** hanya jika: (a) ada penerus yang paham server Linux, **dan** (b) ingin biaya
  serendah mungkin sekaligus foto permanen di satu tempat.
- Migrasi bukan pekerjaan besar (±1 hari), tapi **beban pemeliharaan setelahnya** yang perlu
  dipertimbangkan.

---

## 7. Kepemilikan & Hak Kekayaan Intelektual ("Paten")

> **Ringkas:** untuk aplikasi seperti ini, yang relevan adalah **Hak Cipta** (atas kode) dan
> **Merek** (atas nama "GERABAH"). **Paten hampir pasti tidak bisa/tidak efisien** untuk aplikasi
> pembukuan.

### 7.1 Paten — kenapa tidak cocok

Di Indonesia (UU No. 13/2016 tentang Paten), **program komputer dan metode bisnis "sebagaimana
adanya" tidak dapat dipatenkan**, kecuali menghasilkan **efek teknis** dan memecahkan persoalan
teknis (bukan sekadar otomatisasi proses administrasi). Aplikasi pencatatan keuangan UMLM adalah
CRUD + perhitungan bisnis biasa → **tidak memenuhi syarat langkah inventif teknis**. Proses paten
juga mahal (jutaan rupiah) dan lama (2–5 tahun). **Tidak disarankan.**

### 7.2 Hak Cipta (Program Komputer) — disarankan ✅

- Dasar: UU No. 28/2014 tentang Hak Cipta. Program komputer adalah ciptaan yang **otomatis
  dilindungi sejak dibuat** — pendaftaran bersifat **pencatatan** (bukti kepemilikan), bukan syarat
  perlindungan.
- Manfaat pencatatan: **Surat Pencatatan Ciptaan** dari DJKI sebagai alat bukti bila ada sengketa.
- Cara: online via **djki.go.id** (menu Hak Cipta) atau melalui sentra KI kampus.
- Biaya (PNBP): sekitar **Rp 200.000–400.000** untuk program komputer (tarif UMKM/akademik lebih
  rendah; cek tarif terbaru DJKI).
- Waktu: hitungan hari–minggu (jauh lebih cepat dari paten).
- Yang didaftarkan: judul ciptaan, pencipta, pemegang hak cipta, tanggal & tempat pertama
  diumumkan, lampiran kode/dokumentasi.

### 7.3 Merek (Trademark) — disarankan bila akan dipublikasikan luas ✅

- Melindungi **nama "GERABAH"** + logo agar tidak dipakai pihak lain untuk produk sejenis.
- Kelas yang relevan: **Kelas 9** (perangkat lunak) dan/atau **Kelas 42** (jasa perangkat lunak /
  SaaS).
- Biaya: **Rp 500.000/kelas** dengan surat rekomendasi UMKM (mis. dari dinas koperasi), atau
  **Rp 1.800.000/kelas** tarif umum.
- Waktu: 6–24 bulan (pemeriksaan + pengumuman).
- Catatan: "gerabah" adalah kata umum (jenis produk) — sebaiknya merek berupa **logo + nama khas**
  atau nama yang lebih distinktif agar mudah didaftarkan.

### 7.4 Rahasia Dagang

Bagian yang **tidak dipublikasikan** (mis. formula perhitungan tertentu, basis data pelanggan
mitra) otomatis terlindungi sebagai rahasia dagang selama dijaga kerahasiaannya (UU No. 30/2000).

### 7.5 Lisensi kode

Perlu ditetapkan status kode:

| Pilihan | Arti | Cocok bila |
|---|---|---|
| **Proprietary / tertutup** | Hak penuh di tim/ITB/mitra; pihak lain tak boleh pakai/salin | Ingin potensi komersialisasi terkontrol |
| **Sumber terbuka** (MIT / Apache-2.0) | Siapa pun boleh pakai & modifikasi | Ingin dampak luas, banyak komunitas UMKM *deploy* sendiri |
| **Sumber terbuka copyleft** (GPL-3.0) | Boleh pakai, tapi turunannya wajib terbuka juga | Ingin terbuka tapi mencegah "diambil & ditutup" pihak lain |

### 7.6 Perjanjian kepemilikan (paling penting untuk proyek kampus)

Perjelas **sejak sekarang**, tertulis:

1. **Siapa pemegang Hak Cipta?** Umumnya KI hasil kegiatan yang **didanai/difasilitasi institusi**
   menjadi milik institusi (cek Peraturan Rektor ITB tentang Pengelolaan KI). Mahasiswa/dosen
   sebagai **pencipta** (dicantumkan namanya), ITB/tim sebagai **pemegang hak**.
2. **Hak mitra UMKM** — perjanjian pemakaian (lisensi pakai gratis / selamanya) atas aplikasi &
   datanya. Data usaha & pelanggan adalah **milik mitra**.
3. **Kelanjutan pemeliharaan** — siapa yang bertanggung jawab setelah program pengabdian selesai,
   dan bagaimana pembiayaannya.
4. **Serah terima** — dokumen serah terima akun (Vercel, Supabase, GitHub, domain), kredensial,
   dan panduan operasional ke pihak penerus.

---

## 8. Analisis Biaya

### 8.1 Biaya bulanan (per skenario)

| Skenario | Komponen | Biaya/bln | Risiko / catatan |
|---|---|---|---|
| **A. Gratis** | Vercel Hobby + Supabase Free | **Rp 0** | DB bisa *pause*; tanpa backup; batas Hobby; kuota storage foto 1 GB |
| **B. Minimal aman** | Vercel Hobby + **Supabase Pro** | **± Rp 400.000** | Backup harian, DB selalu nyala, storage 100 GB, kapasitas lebih besar |
| **C. VPS mandiri** | 1 VPS (KVM ± 4 GB RAM) + domain | **± Rp 150.000–300.000** | + waktu pemeliharaan (patch, backup, *deploy* manual); satu titik gagal |
| **D. Produksi serius** | Vercel Pro + Supabase Pro + domain + Sentry + pemantau | **± Rp 800.000–1.100.000** | Layak untuk layanan banyak UMKM (SaaS) |

> Konversi kasar: 1 USD ≈ Rp 16.000. Supabase Pro $25, Vercel Pro $20/pengguna, domain `.com`
> ± Rp 180.000/tahun.

### 8.2 Biaya satu kali

| Item | Perkiraan | Wajib? |
|---|---|---|
| Pencatatan Hak Cipta program komputer (DJKI) | Rp 200.000 – 400.000 | Disarankan |
| Pendaftaran Merek (per kelas, tarif UMKM) | Rp 500.000 | Opsional (bila publik luas) |
| Domain khusus (mis. `gerabahbusiti.id`) | Rp 100.000 – 300.000 / tahun | Opsional |
| Pengembangan fitur jangka pendek (bila pakai jasa luar) | Rp 3 – 10 juta | Opsional |

### 8.3 Biaya tersembunyi (non-uang)

- **Waktu pemeliharaan** — pembaruan dependensi, migrasi skema, tanggap gangguan: ± 2–4 jam/bulan
  bila stabil, lebih saat ada masalah.
- **Ketergantungan orang** — selama hanya 1 orang yang paham *deploy* & basis data, itu adalah
  risiko keberlanjutan, bukan biaya rupiah tapi biaya kelembagaan.
- **Peningkatan paket** — bila jumlah usaha/foto/transaksi tumbuh, storage & DB perlu naik kelas.

### 8.4 Rekomendasi biaya

| Situasi | Pilihan |
|---|---|
| Masih uji coba, 1 mitra, ada pendampingan | **Skenario A (gratis)** + pemantau uptime + backup manual mingguan |
| Diserahkan ke mitra, dipakai serius, 1 usaha | **Skenario B** (Supabase Pro ± Rp 400 rb/bln) demi backup & kestabilan |
| Menjadi layanan untuk banyak UMKM | **Skenario D** + model langganan ringan untuk menutup biaya |
| Anggaran sangat terbatas & ada SDM teknis | **Skenario C** (VPS) — termurah, tapi tanggung jawab pemeliharaan berpindah |

---

## 9. Rekomendasi Akhir

**Segera (minggu ini):**
1. Selesaikan konfigurasi upload foto (bucket + kunci Supabase di Vercel).
2. Pasang pemantau uptime gratis (UptimeRobot) agar DB tidak *pause*.
3. Lakukan backup manual pertama & jadwalkan rutin.

**Sebelum diserahkan penuh ke mitra (1–2 bulan):**
4. Kerjakan perbaikan jangka pendek (§5.1): edit/hapus transaksi, kompres foto, pemantauan error,
   halaman kelola kategori & edit staf.
5. Buat **project Supabase kedua untuk *staging*** agar uji coba tidak menyentuh data asli.
6. Susun **dokumen serah terima** (akun, kredensial, panduan operasional) & latih admin mitra.

**Legal (paralel):**
7. Daftarkan **Hak Cipta program komputer** ke DJKI (murah, cepat).
8. Buat **perjanjian kepemilikan & pemeliharaan** tertulis antara tim/ITB dan mitra UMKM.
9. Pertimbangkan **Merek** bila aplikasi akan dipakai lebih dari satu usaha.

**Keputusan biaya:**
10. Jika dipakai serius: anggarkan **± Rp 400 rb/bulan** (Supabase Pro) sebagai biaya minimal yang
    aman, atau siapkan SDM untuk opsi VPS yang lebih murah.

---

## 10. Permintaan Fitur Baru dari Mitra (22 September 2026)

Catatan mentah dari mitra/pengguna, dikelompokkan ulang jadi rencana kerja lalu **dikerjakan** hari
itu juga (22 September 2026) — semua 11 poin di §10.1 sudah diimplementasikan, dites (migrasi
skema additive di database + skrip migrasi data lama + build/lint/type-check + uji integrasi
sekali-pakai di database sungguhan lalu dibersihkan), dan dokumen ini diperbarui untuk mencatat
keputusan yang diambil selama pengerjaan (lihat §10.7).

### 10.1 Daftar asli (untuk ketertelusuran)

**APLIKASI**
1. Tambah perhitungan aset dan *fixed cost* — dihitung di awal.
2. Langganan (software/alat) → berapa lama & berapa harganya → masuk *fixed cost* (biaya
   pemeliharaan).
3. Unduh Excel dalam format **.xls** — jangan .csv.
4. Tambah rentang periode laporan keuangan (dari tanggal – sampai tanggal).
5. Edit barang (harga, produk) harus ada otorisasi dari owner.
6. Tampilan untuk staf vs owner — bagaimana bedanya?

**PRODUK**
7. Harga jual otomatis muncul setelah bahan baku dll dihitung → sistem kasih *rekomendasi* harga;
   input manual yang sekarang tetap boleh.
8. Tenaga kerja & bahan baku dihitung per bulan, bukan per produk.
9. Rincian bahan baku — user bisa menambah item bahan baku sendiri, lebih rinci.
10. Kategori "Lain-lain" sebaiknya bisa dipilih dari daftar + bisa tambah isi sendiri (jangan
    tampil sebagai "lain-lain" polos).
11. Sediakan formulir pencatatan manual (versi kertas) sebagai dokumentasi, untuk antisipasi
    server down.

### 10.2 Aplikasi (umum)

#### 10.2.1 Aset & Fixed Cost di awal (#1)

**Kondisi sekarang:** tidak ada model aset maupun biaya tetap sama sekali di skema (`prisma/schema.prisma`).
Biaya operasional yang ada hanya `ProductCostComponent` (per produk: bahan baku/tenaga
kerja/kemasan/lain-lain) dan `FinancialTransaction` (transaksi harian, bukan biaya tetap berulang).

**Rencana:**
- Model baru `Asset` (nama, kategori — mis. alat produksi/kendaraan/bangunan, nilai perolehan,
  tanggal beli, umur pakai/penyusutan opsional, catatan).
- Model baru `FixedCost` (nama, kategori, jumlah, periode — bulanan/tahunan/sekali bayar, tanggal
  mulai, tanggal berakhir opsional, aktif/nonaktif).
- Alur **onboarding**: saat bisnis pertama kali disiapkan (atau lewat menu Pengaturan → "Aset &
  Biaya Tetap"), owner mengisi daftar aset + fixed cost sebelum lanjut pakai fitur lain — sesuai
  permintaan "yg dihitung diawal itu dulu".
- Dipakai untuk: (a) tampil di Laporan sebagai komponen biaya tetap bulanan, (b) jadi salah satu
  input hitungan **rekomendasi harga jual** (§10.3.1) supaya harga jual menutup biaya tetap, bukan
  cuma biaya bahan.

**Keputusan yang perlu disepakati dulu:**
- Apakah aset dicatat sekadar daftar (tanpa penyusutan otomatis), atau perlu hitungan penyusutan
  bulanan yang masuk ke laporan laba/rugi? (Disarankan: mulai dari daftar sederhana dulu, penyusutan
  otomatis masuk fase berikutnya.)

#### 10.2.2 Langganan sebagai Fixed Cost (#2)

Ini adalah kasus khusus dari `FixedCost` di atas, bukan model terpisah:
- Tambah field `durationMonths` (atau `endDate`) pada `FixedCost` supaya langganan yang punya masa
  berlaku (mis. "Canva Pro 12 bulan Rp 600.000") bisa dihitung per bulan otomatis
  (`jumlah / durationMonths`) dan diberi pengingat saat mendekati tanggal habis.
- Kategori bawaan: "Langganan / Software", muncul di daftar kategori fixed cost (lihat pola
  kategori bisa-tambah-sendiri di §10.3.4 — dipakai ulang di sini).

#### 10.2.3 Unduh Excel asli .xls, bukan .csv (#3)

**Kondisi sekarang:** `src/app/api/reports/export/route.ts` menghasilkan **CSV murni** (bukan file
Excel biner) dengan nama file `gerabah-report-*.csv` dan header `Content-Type: text/csv`. Dokumen
lama (`docs/EVALUASI-DAN-RENCANA-PENGEMBANGAN.md` §2.3, `docs/PENDING.md`) menyebutnya "Excel/CSV" —
ini yang membuat mitra kira sudah dapat file Excel, padahal isinya teks CSV yang dibuka Excel.

**Rencana:**
- Ganti proses ekspor pakai library penulis **.xls/.xlsx** biner (mis. `xlsx`/SheetJS, atau
  `write-excel-file` yang ringan tanpa dependency native) — hasil akhir file `.xls`/`.xlsx` asli,
  bisa dibuka Excel tanpa peringatan format.
- Terapkan ke **semua** unduhan laporan yang sekarang CSV (laba rugi, arus kas, ringkasan
  penjualan, piutang, nilai persediaan — lihat §2.3), bukan cuma satu endpoint.
- Perbarui `Content-Type` (`application/vnd.ms-excel` untuk `.xls`) & ekstensi nama file.

**Keputusan:** `.xls` (format Excel lama, biner sederhana) atau `.xlsx` (format modern, lebih
kompatibel dengan Excel/Sheets versi baru)? Permintaan eksplisit menyebut **.xls** — akan diikuti,
tapi perlu dikonfirmasi karena beberapa versi Excel Mac/Sheets kadang lebih mulus dengan `.xlsx`.

#### 10.2.4 Rentang tanggal kustom untuk laporan (#4)

**Kondisi sekarang:** `src/lib/date-range.ts` cuma punya 4 pilihan tetap: `today` / `week` /
`month` / `year` (dipakai di Dashboard & Laporan). Tidak ada opsi "dari tanggal – sampai tanggal"
bebas.

**Rencana:**
- Tambah `RangeKey` baru `"custom"` + dua parameter `from`/`to` (tanggal eksplisit) di
  `resolveRange()`.
- Di halaman Laporan: tambah dua input tanggal (mulai & akhir) yang muncul saat pilihan "Kustom"
  dipilih, dipakai baik untuk tampilan di layar maupun untuk ekspor PDF/Excel
  (`/api/reports/pdf`, `/api/reports/export`).
- Validasi: `from <= to`, batasi rentang maksimum (mis. 2 tahun) supaya query & PDF tidak berat
  (relevan dengan K10 — batas waktu fungsi Vercel 10 detik).

#### 10.2.5 Otorisasi owner untuk edit harga/produk (#5)

**Kondisi sekarang:** `createProduct`/`updateProduct` (`src/lib/actions/products.ts`) **tidak ada
pembatasan peran** — staf bisa langsung mengubah harga jual & data produk tanpa persetujuan siapa
pun (beda dengan ekspor laporan yang sudah dikunci `ctx.role !== "owner"`). Ini konsisten dengan
K9 di §4.2 ("hak akses staf masih kasar").

**Rencana (alur persetujuan):**
- Saat staf mengubah field sensitif (harga jual, mungkin juga hapus produk), perubahan **tidak
  langsung berlaku** — disimpan sebagai `ProductChangeRequest` (produk, field, nilai lama, nilai
  usulan, pengaju, status pending/disetujui/ditolak, catatan owner).
- Owner dapat notifikasi/badge (mis. di Dashboard atau menu baru "Persetujuan") berisi daftar
  perubahan yang menunggu; owner **Setujui** (perubahan diterapkan ke `Product` + tercatat di
  `ActivityLog`) atau **Tolak** (perubahan dibuang, alasan opsional tersimpan).
- Produk baru yang dibuat staf: apakah juga perlu approval, atau cukup harga pada produk yang
  sudah ada? *(perlu keputusan mitra — lihat di bawah)*.

**Keputusan yang perlu disepakati dulu:**
- Field apa saja yang wajib approval — hanya `sellingPrice`, atau termasuk semua data produk
  (nama, stok, foto)? Menyempitkan ke harga dulu lebih murah untuk dikerjakan & lebih sesuai
  keluhan spesifik mitra.
- Apakah staf boleh tetap **mengusulkan** stok/foto langsung (tanpa approval) karena itu operasional
  harian, dan hanya **harga** yang dikunci?

#### 10.2.6 Tampilan Owner vs Staf (#6)

**Kondisi sekarang — sudah ada beberapa pembatasan**, tapi tersebar dan tidak didokumentasikan di
satu tempat:

| Area | Yang dibatasi untuk staf |
|---|---|
| Dashboard | `isStaff` menyembunyikan sebagian ringkasan (lihat `src/app/(app)/dashboard/page.tsx`) |
| Keuangan | staf tidak bisa mencatat transaksi tipe **Pemasukan** langsung (`finance/new/page.tsx`) |
| Navigasi (sidebar/tab bawah) | menu bertanda `ownerOnly` disembunyikan dari staf (`components/nav.tsx`, `more/page.tsx`) |
| Ekspor laporan (PDF & Excel) | 403 kalau bukan owner (`api/reports/export`, `api/reports/pdf`) |
| Produk | **belum dibatasi** — staf bebas ubah harga (lihat §10.2.5) |

**Rencana:** dokumentasikan ini sebagai "matriks hak akses" resmi (tabel di atas jadi cikal
bakalnya), lalu lengkapi baris yang masih kosong (laba/rugi di Dashboard untuk staf, dan Produk
setelah alur approval §10.2.5 jalan). Ini juga fondasi untuk K9 "hak akses staf granular" di §5.2.

### 10.3 Produk

#### 10.3.1 Rekomendasi harga jual otomatis (#7)

**Kondisi sekarang:** `Product.sellingPrice` diisi manual, sepenuhnya independen dari
`ProductCostComponent`. Tidak ada perhitungan/saran otomatis.

**Rencana:** di form tambah/edit produk, begitu bahan baku + tenaga kerja + kemasan + lain-lain +
target margin diisi, tampilkan **kotak rekomendasi** ("Rekomendasi harga jual: Rp X, berdasarkan
biaya Rp Y + margin Z%") — **bukan** field yang otomatis menimpa nilai jual. Input `sellingPrice`
tetap manual & wajib diisi sendiri oleh pengguna, sesuai catatan mitra "yg sekarang boleh"
(mempertahankan alur saat ini, cuma ditambah bantuan angka).

**Ketergantungan:** rapi kalau dikerjakan **setelah** §10.3.2 (biaya bulanan) & §10.3.3 (rincian
bahan baku) selesai, karena rekomendasi harga butuh angka biaya per unit yang lebih akurat dari
situ. Kalau mau versi cepat duluan, bisa pakai `ProductCostComponent` yang ada sekarang sebagai
dasar sementara.

#### 10.3.2 Tenaga kerja & bahan baku: per bulan, bukan per produk (#8)

**Kondisi sekarang:** `ProductCostComponent` (Bahan Baku/Tenaga Kerja/Kemasan/Lain-lain) melekat
**per produk** — user mengisi ulang biaya tenaga kerja & bahan baku setiap kali menambah/mengedit
1 produk. Ini yang dikeluhkan: tenaga kerja & operasional biasanya dibayar bulanan (gaji, dsb),
bukan per satuan produk.

**Rencana (restrukturisasi, ini perubahan skema paling besar di daftar ini):**
- Tenaga kerja pindah jadi entri **bulanan di level bisnis** (bisa dianggap bagian dari
  `FixedCost`/model baru `MonthlyLaborCost` — gaji per bulan) — **bukan** per produk lagi.
- Untuk menghitung **biaya tenaga kerja per unit produk**, perlu cara alokasi: total biaya tenaga
  kerja bulan itu ÷ total unit yang diproduksi/terjual bulan itu (atau dibagi rata ke semua produk
  aktif, atau proporsional berdasarkan jumlah terjual per produk). *(pilihan metode alokasi perlu
  disepakati — lihat di bawah)*.
- **Bahan baku** tetap melekat ke produk (karena beda produk beda resep bahan), tapi direstrukturisasi
  jadi rincian per item (§10.3.3) — bukan satu angka gabungan seperti sekarang.
- `ProductCostComponent` yang ada disederhanakan jadi 2 label saja: **Kemasan** (masih per produk,
  wajar karena kemasan beda-beda per produk) dan **Lain-lain** (§10.3.4). Bahan baku pindah ke
  model baru, tenaga kerja pindah ke fixed cost bulanan.
- Perlu skrip migrasi data: `ProductCostComponent` yang label-nya "Labor Cost" pada produk lama
  dipindah jadi entri `MonthlyLaborCost` (satu kali, sebagai titik awal) supaya data lama tidak
  hilang begitu saja.

**Keputusan yang perlu disepakati dulu (penting, ini menentukan desain tabel):**
- **Metode alokasi tenaga kerja ke produk** — rata dibagi semua produk aktif? Proporsional jumlah
  terjual bulan berjalan? Atau tenaga kerja **tidak** dialokasikan per produk sama sekali, cukup
  tampil sebagai biaya tetap di laporan laba/rugi (tidak memengaruhi rekomendasi harga per produk)?
  Opsi terakhir ini paling sederhana untuk dikerjakan duluan.
- Apakah "per bulan" berarti **satu angka gaji bulanan total**, atau tetap perlu breakdown per
  pekerja/peran (mis. "tukang putar Rp 1jt, finishing Rp 800rb")? Breakdown per pekerja lebih rinci
  tapi menambah tabel `LaborEntry` terpisah.

#### 10.3.3 Rincian bahan baku per produk (#9)

**Kondisi sekarang:** biaya bahan baku 1 produk = **satu angka total** (`materialCost`), tidak ada
rincian item apa saja & berapa banyak.

**Rencana:**
- Model baru `ProductMaterial` (produk, nama bahan — bebas isi sendiri seperti pola kategori yang
  sudah ada di aplikasi, jumlah/qty, satuan — kg/liter/pcs/dll, harga per satuan, subtotal
  otomatis = qty × harga satuan).
- Di form produk: daftar bahan baku bisa ditambah baris sendiri ("+ Tambah bahan baku") — pola UI
  sudah ada presedennya di `SaleForm`/`OrderForm` (multi-item, walau catatan `docs/PENDING.md` §5
  bilang saat ini masih 1 produk per transaksi — pola tambah-baris tetap relevan untuk dicontoh).
- Total biaya bahan baku produk = jumlah semua subtotal `ProductMaterial` — menggantikan field
  `materialCost` tunggal yang sekarang.

#### 10.3.4 Kategori "Lain-lain" yang bisa dipilih & ditambah sendiri (#10)

**Kondisi sekarang:** label `"Other Cost"` tampil sebagai teks tetap **"Lain-lain"**
(`src/lib/labels.ts`) — satu kotak angka polos, bukan daftar pilihan.

**Rencana:** ikuti pola yang **sudah dipakai** di aplikasi untuk kategori lain (Kategori Produk,
Kategori Pengeluaran/Pemasukan, Channel Penjualan, Metode Bayar — semua lewat
`findOrCreate...Category`, "ketik untuk menambah baru"): buat daftar pilihan biaya lain-lain per
bisnis (mis. "Listrik produksi", "Sewa alat", "Ongkir bahan") yang bisa dipilih dari dropdown atau
ketik nama baru untuk menambah — sama seperti kategori-kategori lain, **bukan** field bebas
bernama "lain-lain". Ganti juga label tampilannya jadi nama kategori yang dipilih, bukan literal
"Lain-lain" (sesuai catatan "jangan lain-lain").

#### 10.3.5 Formulir pencatatan manual (#11)

Dibuat sebagai dokumen terpisah agar bisa langsung dicetak: **[FORMULIR-PENCATATAN-MANUAL.md](./FORMULIR-PENCATATAN-MANUAL.md)**.
Berisi versi kertas dari field-field yang ada di aplikasi (Penjualan, Pengeluaran/Pemasukan,
Pesanan, Pembayaran Piutang) — dipakai kalau server/internet mati (terkait juga K5 di §4.1, "tidak
ada mode offline").

### 10.4 Ringkasan dampak skema data (Prisma)

Model baru yang perlu ditambah kalau semua poin di atas dikerjakan:

| Model baru | Untuk poin | Ukuran perubahan |
|---|---|---|
| `Asset` | #1 | Kecil — tabel baru berdiri sendiri |
| `FixedCost` (dengan field masa berlaku utk langganan) | #1, #2 | Kecil — tabel baru berdiri sendiri |
| `ProductChangeRequest` | #5 | Sedang — tabel baru + alur approval di UI |
| `MonthlyLaborCost` (atau masuk ke `FixedCost`) | #8 | **Besar** — mengubah cara `ProductCostComponent` dipakai + perlu migrasi data lama |
| `ProductMaterial` | #9 | Sedang — tabel baru + form multi-baris |
| `ExtraCostCategory` (atau reuse pola kategori yang ada) | #10 | Kecil — mengikuti pola kategori yang sudah ada |

Poin **#3 (.xls), #4 (rentang tanggal), #6 (tampilan role), #7 (rekomendasi harga), #11 (formulir
manual)** tidak butuh model baru — perubahan di kode/UI saja.

### 10.5 Urutan pengerjaan yang disarankan

Disusun berdasar ketergantungan teknis (bukan prioritas bisnis — mitra sudah menandai semuanya
penting):

1. **Cepat & tanpa risiko skema** — bisa paralel, dikerjakan duluan:
   - #3 Ekspor `.xls` asli (§10.2.3)
   - #4 Rentang tanggal kustom laporan (§10.2.4)
   - #11 Formulir pencatatan manual (§10.3.5) — sudah dibuat bersamaan dengan dokumen ini
   - #6 Dokumentasi matriks hak akses (§10.2.6) — dokumentasi dulu, baru dilengkapi setelah #5
2. **Butuh 1 model baru, berdiri sendiri:**
   - #1 + #2 Aset & Fixed Cost (termasuk langganan) (§10.2.1–10.2.2)
   - #5 Otorisasi edit harga (§10.2.5) — sekalian melengkapi baris "Produk" di matriks #6
   - #10 Kategori lain-lain bisa pilih/tambah (§10.3.4)
3. **Restrukturisasi besar, saling bergantung — dikerjakan dalam satu batch:**
   - #8 Tenaga kerja & bahan baku per bulan (§10.3.2)
   - #9 Rincian bahan baku per produk (§10.3.3)
   - #7 Rekomendasi harga jual otomatis (§10.3.1) — dikerjakan **setelah** #8 & #9 supaya angka
     dasarnya benar

### 10.6 Keputusan yang perlu dikonfirmasi mitra sebelum mulai coding tahap 2–3

Supaya tidak bolak-balik migrasi skema, tolong konfirmasi dulu:

1. `.xls` beneran (biner lama) atau `.xlsx` cukup? (§10.2.3)
2. Field produk apa saja yang wajib approval owner — harga saja, atau lebih? Produk baru ikut
   approval juga? (§10.2.5)
3. Metode alokasi biaya tenaga kerja bulanan ke tiap produk — rata semua produk, proporsional
   terjual, atau tidak usah dialokasikan per produk (cukup di laporan laba/rugi umum)? (§10.3.2)
4. Tenaga kerja bulanan: satu angka gaji total, atau rincian per pekerja/peran? (§10.3.2)

### 10.7 Yang sudah dikerjakan (22 September 2026) — keputusan yang diambil

Karena diminta langsung eksekusi, 4 pertanyaan di §10.6 dijawab dengan pilihan yang paling
sederhana & paling kecil risikonya, supaya bisa jalan hari itu juga. **Owner tetap bisa minta
diubah** kalau pilihannya tidak cocok — semuanya masih mudah diubah karena strukturnya sudah ada.

1. **Format Excel → dipilih `.xlsx`**, bukan `.xls`. `.xlsx` adalah format Excel asli (bukan CSV
   menyamar), dibangun pakai library `write-excel-file` (ringan, tanpa kerentanan keamanan
   dikenal), dan dijamin terbuka tanpa peringatan "format tidak cocok" di Excel/Sheets versi apa
   pun — lebih aman ketimbang `.xls` biner lama atau trik HTML-berkedok-`.xls`. Dipakai di semua
   unduhan Laporan (`/api/reports/export`).
2. **Approval owner → hanya untuk perubahan harga jual pada produk yang SUDAH ADA.** Produk baru
   boleh dibuat staf dengan harga apa saja (tidak masuk approval) — karena kalau produk baru pun
   perlu approval, staf tidak akan bisa menambah katalog sendiri sama sekali. Field lain (nama,
   stok, foto, dll.) boleh diubah staf langsung, tanpa approval. Kalau staf ternyata perlu dikunci
   lebih ketat lagi, tinggal tambah field ke pengecekan `needsApproval` di
   `src/lib/actions/products.ts`.
3. **Tenaga kerja bulanan TIDAK dialokasikan otomatis ke tiap produk.** Dicatat sebagai `FixedCost`
   di menu **Aset & Biaya Tetap**, tampil sebagai biaya bulanan usaha secara keseluruhan — bukan
   ikut menghitung untung/rugi per produk. Ini pilihan paling aman karena metode alokasi otomatis
   (rata rata vs proporsional terjual) gampang salah kalau tebak sendiri tanpa dikonfirmasi mitra;
   kalau nanti mitra mau salah satu metode alokasi, tinggal ditambah sebagai fitur di halaman
   Produk (baca total `FixedCost` kategori "Tenaga Kerja" lalu bagi sesuai metode yang dipilih).
4. **Tenaga kerja bulanan = satu angka total per entri**, bukan rincian per pekerja/peran (bisa
   ditambah beberapa entri terpisah kalau mau per-orang, mis. "Gaji tukang putar", "Gaji
   finishing" — masing-masing baris `FixedCost` sendiri di menu Aset & Biaya Tetap).

**Yang berubah di kode/database** (ringkas — detail teknis di §10.2–10.4 di atas, sudah sesuai
implementasi kecuali poin format Excel):

- Migrasi database additive `20260922022325_aset_fixedcost_produk_restrukturisasi` (tabel baru:
  `Asset`, `FixedCost`, `FixedCostCategory`, `ProductMaterial`, `ProductOtherCostCategory`,
  `ProductChangeRequest` — tidak ada tabel/kolom lama yang dihapus).
  `scripts/migrate-product-costs.ts` sudah dijalankan sekali untuk memindah data lama (2 produk
  yang tadinya punya "Material Cost"/"Labor Cost" per-produk) ke struktur baru.
- Halaman baru: **Aset & Biaya Tetap** (`/assets`) dan **Persetujuan** (`/approvals`), keduanya
  owner-only, ditautkan dari menu Lainnya.
- Form Produk (`src/components/product-form.tsx`): bahan baku sekarang rincian per item (bisa
  tambah baris sendiri), field tenaga kerja dihapus (pindah ke Aset & Biaya Tetap), "Lain-lain"
  jadi kategori pilih-atau-tambah, dan ada kotak "Rekomendasi harga jual" berdasar target
  untung % — harga jual tetap manual, rekomendasi cuma bantuan hitung (sesuai "yg sekarang boleh").
- Laporan: tab periode "Kustom" (pilih tanggal dari–sampai) + unduhan Excel jadi `.xlsx` asli.
