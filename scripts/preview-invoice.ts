import { writeFileSync } from "node:fs";
import { buildInvoicePdf } from "../src/lib/invoice-pdf";

async function main() {
const bytes = await buildInvoicePdf({
  kind: "Invoice",
  number: "INV/2026/09/K7F2QX",
  date: new Date("2026-09-02"),
  business: {
    name: "Gerabah Bu Siti",
    location: "Desa Sitiwinangun, Kab. Cirebon",
    ownerName: "Siti Rohmah",
    phone: "0812-3456-7890",
  },
  customer: {
    name: "Toko Kerajinan Nusantara",
    phone: "0813-1111-2222",
    address: "Jl. Raya Jamblang No. 45, Cirebon, Jawa Barat 45156",
  },
  items: [
    { name: "Kendi Air Sitiwinangun ukuran besar", quantity: 12, unitPrice: 85000, lineTotal: 1020000 },
    { name: "Pot Tanaman Terakota", quantity: 30, unitPrice: 35000, lineTotal: 1050000 },
    { name: "Celengan Gerabah Motif Batik Mega Mendung", quantity: 24, unitPrice: 22500, lineTotal: 540000 },
  ],
  subtotal: 2610000,
  discount: 110000,
  total: 2500000,
  paid: 1000000,
  outstanding: 1500000,
  statusLabel: "Dibayar Sebagian",
  paidInFull: false,
  paymentMethod: "Transfer Bank",
  channel: "WhatsApp",
  notes: "Pengiriman diambil sendiri di lokasi pada tanggal 10 September 2026.",
});

writeFileSync("scripts/preview-invoice.pdf", bytes);
console.log("written scripts/preview-invoice.pdf");
}
main();
