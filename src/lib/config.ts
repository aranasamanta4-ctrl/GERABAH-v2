/**
 * Nomor WhatsApp admin untuk fitur "Tanya Admin" dan "Lupa Kata Sandi".
 * Format internasional tanpa "+" (mis. 6281234567890).
 * Hanya dibaca di server (halaman Bantuan & Lupa Kata Sandi diproses di server),
 * jadi env-nya TIDAK perlu prefix NEXT_PUBLIC_. Bisa ditimpa lewat env ADMIN_WHATSAPP.
 */
export const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP || "6281386164339";
