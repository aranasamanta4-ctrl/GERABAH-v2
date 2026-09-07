/**
 * Nomor WhatsApp admin untuk fitur "Tanya Admin" dan "Lupa Kata Sandi".
 * Format internasional tanpa "+" (mis. 6281234567890).
 * Bisa ditimpa lewat env NEXT_PUBLIC_ADMIN_WHATSAPP; kalau tidak, pakai nilai bawaan.
 */
export const ADMIN_WHATSAPP = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "6281386164339";
