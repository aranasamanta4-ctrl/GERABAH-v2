import { getCurrentUser, getCurrentBusiness } from "@/lib/current-user";
import { ADMIN_WHATSAPP } from "@/lib/config";
import { waUrl } from "@/lib/whatsapp";
import { Card, Callout } from "@/components/ui";
import { IconMessage } from "@/components/icons";

const FAQ = [
  {
    q: "Bagaimana mencatat uang masuk atau keluar?",
    a: "Buka menu Keuangan, tekan tombol tambah (lingkaran di tengah bawah), lalu pilih Uang Masuk atau Uang Keluar.",
  },
  {
    q: "Apa beda Penjualan dan Pesanan?",
    a: "Penjualan untuk barang yang langsung terjual. Pesanan untuk barang yang dikerjakan dulu, dibayar kemudian — saat ditandai Selesai otomatis jadi penjualan.",
  },
  {
    q: "Bagaimana menagih pembeli yang belum bayar?",
    a: "Buka menu Belum Lunas. Semua tagihan tampil di sana lengkap dengan tombol pengingat WhatsApp.",
  },
  {
    q: "Bagaimana mengunduh laporan keuangan?",
    a: "Buka menu Laporan, pilih periode, lalu tekan Unduh PDF atau Unduh Excel.",
  },
];

export default async function HelpPage() {
  const [user, business] = await Promise.all([getCurrentUser(), getCurrentBusiness()]);

  const chatLink = waUrl(
    ADMIN_WHATSAPP,
    `Halo Admin GERABAH, saya ${user?.name ?? ""}` +
      (business?.name ? ` dari usaha ${business.name}` : "") +
      `. Saya mau tanya: `
  );

  return (
    <>
      <header className="mb-5">
        <h1 className="text-[25px] font-bold text-ink">Bantuan</h1>
        <p className="mt-0.5 text-[14px] text-ink-2">Pertanyaan umum, atau hubungi admin langsung.</p>
      </header>

      <Card className="mb-5">
        <p className="text-[15px] font-semibold text-ink">Masih bingung atau ada kendala?</p>
        <p className="mt-1 text-[14px] text-ink-2">
          Kirim pertanyaanmu ke admin lewat WhatsApp. Nama dan nama usaha sudah otomatis terisi.
        </p>
        {chatLink ? (
          <a href={chatLink} target="_blank" rel="noreferrer" className="btn btn-primary mt-3 w-full">
            <IconMessage className="h-[18px] w-[18px]" strokeWidth={2} />
            Chat Admin via WhatsApp
          </a>
        ) : (
          <Callout tone="warn">
            Nomor admin belum diatur. Hubungi pengelola aplikasi untuk bantuan.
          </Callout>
        )}
      </Card>

      <p className="label mb-2">Pertanyaan yang Sering Ditanya</p>
      <div className="flex flex-col gap-3">
        {FAQ.map((f) => (
          <Card key={f.q}>
            <p className="text-[15px] font-semibold text-ink">{f.q}</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{f.a}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
