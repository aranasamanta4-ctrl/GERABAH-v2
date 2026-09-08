import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const BUCKET = "uploads";

// URL project Supabase (bisa ditimpa lewat env). Ref project ada di DEPLOY.md.
const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://sndvjvtfdsgbgedrevic.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

/**
 * Simpan file yang diunggah.
 * - Produksi (Vercel): unggah ke Supabase Storage bucket "uploads" (butuh SUPABASE_SERVICE_ROLE_KEY).
 * - Lokal tanpa key: simpan ke public/uploads/ di disk.
 * Mengembalikan URL publik untuk disimpan di kolom photoUrl.
 */
export async function saveUploadedFile(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Format file tidak didukung. Gunakan JPG, PNG, WEBP, GIF, MP4, WEBM, atau MOV.");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Ukuran file maksimal 20MB.");
  }

  const ext = path.extname(file.name) || (file.type.startsWith("video/") ? ".mp4" : ".jpg");
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (SERVICE_KEY) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        // Supabase Storage butuh apikey juga (baik key lama service_role maupun baru sb_secret_).
        apikey: SERVICE_KEY,
        "Content-Type": file.type,
        "x-upsert": "true",
        "cache-control": "public, max-age=31536000, immutable",
      },
      body: new Uint8Array(buffer),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[upload] Supabase Storage gagal", res.status, detail);
      throw new Error(
        res.status === 404
          ? `Bucket "${BUCKET}" belum dibuat di Supabase Storage.`
          : "Gagal mengunggah foto. Coba lagi."
      );
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
  }

  // Fallback lokal (dev). Di Vercel filesystem read-only — akan error, itu wajar.
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}
