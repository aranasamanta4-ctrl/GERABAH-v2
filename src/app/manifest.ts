import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GERABAH — Catatan Keuangan UMKM",
    short_name: "GERABAH",
    description: "Catat uang masuk dan keluar usaha gerabah, lihat untung rugi, dan cetak invoice PDF dari HP.",
    lang: "id",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf9f7",
    theme_color: "#faf9f7",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Catat uang masuk", url: "/finance/new?type=INCOME" },
      { name: "Catat uang keluar", url: "/finance/new?type=EXPENSE" },
      { name: "Catat penjualan", url: "/sales/new" },
    ],
  };
}
