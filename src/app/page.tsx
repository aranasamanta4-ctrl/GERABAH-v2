import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { IconWallet, IconBox, IconReceipt, IconChart } from "@/components/icons";

const FEATURES = [
  { icon: IconWallet, title: "Uang masuk & keluar", body: "Catat sekali sehari. Saldo kas usaha selalu terlihat." },
  { icon: IconBox, title: "Produk & stok", body: "Harga jual, biaya produksi, dan untung per barang otomatis." },
  { icon: IconReceipt, title: "Penjualan & pesanan", body: "Stok berkurang sendiri, invoice PDF siap dikirim ke WhatsApp." },
  { icon: IconChart, title: "Laba rugi sederhana", body: "Tahu untung atau rugi tiap bulan, tanpa istilah akuntansi." },
];

export default async function LandingPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-14">
      <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-clay">GERABAH</p>
      <h1 className="mt-4 text-[32px] font-bold leading-[1.15] text-ink">
        Catatan keuangan usaha, sesederhana menulis di buku.
      </h1>
      <p className="mt-3.5 text-[15px] leading-relaxed text-ink-2">
        Dibuat untuk perajin gerabah. Bahasa sehari-hari, tombol besar, langsung dari HP — dan bisa dipasang di
        layar utama seperti aplikasi biasa.
      </p>

      <div className="mt-7 flex flex-col gap-2.5">
        <Link href="/signup" className="btn btn-primary w-full">Buat Akun Gratis</Link>
        <Link href="/login" className="btn btn-secondary w-full">Saya sudah punya akun</Link>
      </div>

      <div className="mt-10 flex flex-col gap-2.5">
        {FEATURES.map((f) => (
          <div key={f.title} className="card flex items-start gap-3.5 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay-soft text-clay">
              <f.icon className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <div>
              <p className="text-[14.5px] font-semibold text-ink">{f.title}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{f.body}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-[12px] text-ink-3">
        Program Pengabdian Masyarakat PPMI KKSIK ITB · Desa Sitiwinangun, Cirebon
      </p>
    </main>
  );
}
