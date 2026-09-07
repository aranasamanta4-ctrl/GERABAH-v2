import { rgb, type PDFFont } from "pdf-lib";

// Palet bersama invoice & laporan.
export const INK = rgb(0.137, 0.125, 0.114);
export const MUTED = rgb(0.482, 0.443, 0.412);
export const RULE = rgb(0.894, 0.847, 0.784);
export const HAIRLINE = rgb(0.937, 0.905, 0.866);
export const BAND = rgb(0.957, 0.925, 0.886);
export const ACCENT = rgb(0.76, 0.255, 0.047);
export const SAGE = rgb(0.016, 0.47, 0.341);

export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
export const MARGIN = 48;

// Helvetica WinAnsi: lipat tanda baca tipografis, buang di atas Latin-1.
export function san(input: string): string {
  return input
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/•/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    .replace(/[^\x20-\xFF]/g, "");
}

export function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = san(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}
