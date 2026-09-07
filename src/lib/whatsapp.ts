import { formatIDRPlain, formatDateLong } from "@/lib/format";

/** Normalisasi nomor Indonesia ke format internasional: "08xx" → "628xx". */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

/** Link wa.me siap-klik. `null` bila nomor kosong. */
export function waUrl(phone: string | null | undefined, message?: string): string | null {
  const n = normalizePhone(phone ?? "");
  if (!n) return null;
  const q = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${n}${q}`;
}

/** Buka WhatsApp dengan teks siap kirim, penerima dipilih sendiri oleh pengguna. */
export function waShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Pesan pengingat pembayaran berbahasa Indonesia, sopan, siap kirim. */
export function reminderMessage(args: {
  businessName: string;
  customerName?: string | null;
  amount: number;
  dueDate?: Date | null;
  ref?: string | null;
}): string {
  const { businessName, customerName, amount, dueDate, ref } = args;
  const sapaan = customerName ? `Halo ${customerName},` : "Halo,";
  const jatuhTempo = dueDate ? ` dengan jatuh tempo ${formatDateLong(dueDate)}` : "";
  const nomor = ref ? ` (${ref})` : "";
  return (
    `${sapaan}\n\n` +
    `Izin mengingatkan, masih ada tagihan${nomor} sebesar ${formatIDRPlain(amount)}${jatuhTempo} ` +
    `dari ${businessName}.\n\n` +
    `Mohon konfirmasi bila sudah melakukan pembayaran. Terima kasih 🙏`
  );
}
