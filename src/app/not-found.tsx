import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center px-5 text-center">
      <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-clay">404</p>
      <h1 className="mt-3 text-[22px] font-bold text-ink">Halaman tidak ditemukan</h1>
      <p className="mt-1.5 text-[14px] text-ink-2">Mungkin sudah dihapus atau alamatnya keliru.</p>
      <Link href="/dashboard" className="btn btn-primary mt-6">
        Ke Beranda
      </Link>
    </main>
  );
}
