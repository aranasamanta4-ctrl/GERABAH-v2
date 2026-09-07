import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { formatIDRPlain, formatDateLong } from "@/lib/format";
import { san, wrap } from "@/lib/pdf-kit";

export type InvoiceItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type InvoiceData = {
  kind: "Invoice" | "Nota Pesanan";
  number: string;
  date: Date;
  dueDate?: Date | null;
  business: { name: string; location?: string | null; ownerName?: string | null; phone?: string | null };
  customer: { name: string; phone?: string | null; address?: string | null };
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  outstanding: number;
  statusLabel: string;
  paidInFull: boolean;
  paymentMethod?: string | null;
  channel?: string | null;
  notes?: string | null;
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 48;

const INK = rgb(0.137, 0.125, 0.114);
const MUTED = rgb(0.482, 0.443, 0.412);
const RULE = rgb(0.894, 0.847, 0.784);
const HAIRLINE = rgb(0.937, 0.905, 0.866);
const BAND = rgb(0.957, 0.925, 0.886);
const ACCENT = rgb(0.76, 0.255, 0.047);
const SAGE = rgb(0.016, 0.47, 0.341);


const UNITS = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
  "sepuluh",
  "sebelas",
];

function spell(n: number): string {
  if (n < 12) return UNITS[n];
  if (n < 20) return `${spell(n - 10)} belas`;
  if (n < 100) return `${spell(Math.floor(n / 10))} puluh ${spell(n % 10)}`.trim();
  if (n < 200) return `seratus ${spell(n - 100)}`.trim();
  if (n < 1000) return `${spell(Math.floor(n / 100))} ratus ${spell(n % 100)}`.trim();
  if (n < 2000) return `seribu ${spell(n - 1000)}`.trim();
  if (n < 1_000_000) return `${spell(Math.floor(n / 1000))} ribu ${spell(n % 1000)}`.trim();
  if (n < 1_000_000_000) return `${spell(Math.floor(n / 1_000_000))} juta ${spell(n % 1_000_000)}`.trim();
  return `${spell(Math.floor(n / 1_000_000_000))} miliar ${spell(n % 1_000_000_000)}`.trim();
}

// Amount in words — expected on Indonesian invoices and kwitansi.
export function terbilang(amount: number): string {
  const n = Math.round(Math.abs(amount));
  if (n === 0) return "Nol rupiah";
  const words = spell(n).replace(/\s+/g, " ").trim();
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} rupiah`;
}

export async function buildInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${data.kind} ${data.number}`);
  pdf.setProducer("GERABAH");
  pdf.setCreator("GERABAH");

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - M;

  type TextOpts = { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb> };

  const text = (s: string, x: number, yy: number, opts: TextOpts = {}) => {
    page.drawText(san(s), {
      x,
      y: yy,
      size: opts.size ?? 9.5,
      font: opts.font ?? regular,
      color: opts.color ?? INK,
    });
  };

  const rightText = (s: string, right: number, yy: number, opts: TextOpts = {}) => {
    const size = opts.size ?? 9.5;
    const font = opts.font ?? regular;
    text(s, right - font.widthOfTextAtSize(san(s), size), yy, { ...opts, size, font });
  };

  const rule = (yy: number, color = RULE, thickness = 0.75) => {
    page.drawLine({ start: { x: M, y: yy }, end: { x: PAGE_W - M, y: yy }, thickness, color });
  };

  // ── Header ──────────────────────────────────────────────
  page.drawRectangle({ x: M, y: y - 4, width: 26, height: 3, color: ACCENT });
  y -= 26;
  text(data.business.name, M, y, { size: 17, font: bold });

  const sub = [data.business.location, data.business.phone].filter(Boolean).join(" – ");
  if (sub) {
    y -= 14;
    text(sub, M, y, { size: 9, color: MUTED });
  }

  let ry = PAGE_H - M - 22;
  rightText(data.kind.toUpperCase(), PAGE_W - M, ry, { size: 20, font: bold, color: ACCENT });
  ry -= 16;
  rightText(data.number, PAGE_W - M, ry, { size: 9.5, color: MUTED });
  ry -= 13;
  rightText(formatDateLong(data.date), PAGE_W - M, ry, { size: 9.5, color: MUTED });
  if (data.dueDate) {
    ry -= 13;
    rightText(`Jatuh tempo ${formatDateLong(data.dueDate)}`, PAGE_W - M, ry, { size: 9.5, color: MUTED });
  }

  y = Math.min(y, ry) - 26;
  rule(y);
  y -= 22;

  // ── Bill-to and payment meta ────────────────────────────
  const metaLabelX = PAGE_W - M - 190;
  text("DITAGIHKAN KEPADA", M, y, { size: 8, font: bold, color: MUTED });
  text("PEMBAYARAN", metaLabelX, y, { size: 8, font: bold, color: MUTED });
  y -= 15;

  let ly = y;
  const customerLines = [data.customer.name, data.customer.phone ?? "", data.customer.address ?? ""].filter(Boolean);
  customerLines.forEach((line, i) => {
    if (i === 0) {
      text(line, M, ly, { size: 11, font: bold });
      ly -= 15;
    } else {
      for (const w of wrap(line, regular, 9.5, metaLabelX - M - 20)) {
        text(w, M, ly, { size: 9.5, color: MUTED });
        ly -= 13;
      }
    }
  });

  let my = y;
  const meta: [string, string][] = [
    ["Status", data.statusLabel],
    ["Metode", data.paymentMethod ?? "-"],
    ["Kanal", data.channel ?? "-"],
  ];
  for (const [k, v] of meta) {
    text(k, metaLabelX, my, { size: 9.5, color: MUTED });
    rightText(v, PAGE_W - M, my, { size: 9.5, font: k === "Status" ? bold : regular });
    my -= 14;
  }

  y = Math.min(ly, my) - 14;

  // ── Items ───────────────────────────────────────────────
  const colQtyRight = PAGE_W - M - 184;
  const colPriceRight = PAGE_W - M - 70;
  const colTotalRight = PAGE_W - M;
  const nameWidth = colQtyRight - M - 46;

  const drawTableHead = () => {
    page.drawRectangle({ x: M, y: y - 6, width: PAGE_W - M * 2, height: 22, color: BAND });
    text("PRODUK", M + 10, y, { size: 8, font: bold, color: MUTED });
    rightText("QTY", colQtyRight, y, { size: 8, font: bold, color: MUTED });
    rightText("HARGA", colPriceRight, y, { size: 8, font: bold, color: MUTED });
    rightText("JUMLAH", colTotalRight, y, { size: 8, font: bold, color: MUTED });
    y -= 26;
  };

  drawTableHead();

  for (const item of data.items) {
    const lines = wrap(item.name, regular, 10, nameWidth);
    const rowHeight = lines.length * 12 + 8;
    if (y - rowHeight < M + 200) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - M;
      drawTableHead();
    }
    const rowTop = y;
    lines.forEach((line, i) => text(line, M + 10, rowTop - i * 12, { size: 10 }));
    rightText(String(item.quantity), colQtyRight, rowTop, { size: 10 });
    rightText(formatIDRPlain(item.unitPrice), colPriceRight, rowTop, { size: 10, color: MUTED });
    rightText(formatIDRPlain(item.lineTotal), colTotalRight, rowTop, { size: 10, font: bold });
    y = rowTop - rowHeight;
    rule(y + 4, HAIRLINE, 0.5);
  }

  // ── Totals ──────────────────────────────────────────────
  if (y < M + 210) {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - M;
  }
  y -= 12;
  const totalsLabelX = PAGE_W - M - 190;

  const totalRow = (
    label: string,
    value: number,
    opts: { emphasis?: boolean; color?: ReturnType<typeof rgb> } = {}
  ) => {
    const size = opts.emphasis ? 12 : 9.5;
    const font = opts.emphasis ? bold : regular;
    text(label, totalsLabelX, y, { size, font, color: opts.emphasis ? INK : MUTED });
    rightText(formatIDRPlain(value), PAGE_W - M, y, { size, font, color: opts.color ?? INK });
    y -= opts.emphasis ? 20 : 15;
  };

  totalRow("Subtotal", data.subtotal);
  if (data.discount > 0) totalRow("Diskon", -data.discount);

  page.drawLine({
    start: { x: totalsLabelX, y: y + 6 },
    end: { x: PAGE_W - M, y: y + 6 },
    thickness: 0.75,
    color: RULE,
  });
  y -= 8;
  totalRow("Total", data.total, { emphasis: true });
  totalRow("Sudah dibayar", data.paid);
  totalRow("Sisa tagihan", data.outstanding, {
    emphasis: true,
    color: data.outstanding > 0 ? ACCENT : SAGE,
  });

  // ── Terbilang ───────────────────────────────────────────
  y -= 4;
  text("TERBILANG", M, y, { size: 8, font: bold, color: MUTED });
  y -= 14;
  for (const line of wrap(terbilang(data.total), regular, 10, PAGE_W - M * 2 - 200)) {
    text(line, M, y, { size: 10 });
    y -= 13;
  }

  if (data.notes) {
    y -= 8;
    text("CATATAN", M, y, { size: 8, font: bold, color: MUTED });
    y -= 14;
    for (const line of wrap(data.notes, regular, 9.5, PAGE_W - M * 2 - 200)) {
      text(line, M, y, { size: 9.5, color: MUTED });
      y -= 12;
    }
  }

  // ── Signature and footer ────────────────────────────────
  const footerY = M + 20;
  // Follow the content rather than pinning to the page bottom, so short invoices
  // don't leave a large void — but never collide with the footer rule.
  const signLineY = Math.max(M + 96, y - 76);
  text("Hormat kami,", PAGE_W - M - 150, signLineY + 46, { size: 9.5, color: MUTED });
  page.drawLine({
    start: { x: PAGE_W - M - 150, y: signLineY },
    end: { x: PAGE_W - M, y: signLineY },
    thickness: 0.75,
    color: RULE,
  });
  text(data.business.ownerName ?? data.business.name, PAGE_W - M - 150, signLineY - 13, { size: 9.5 });

  rule(footerY + 16);
  text(
    data.paidInFull
      ? "Terima kasih, pembayaran telah kami terima."
      : "Mohon lakukan pembayaran sebelum tanggal jatuh tempo. Terima kasih.",
    M,
    footerY,
    { size: 8.5, color: MUTED }
  );
  rightText("Dibuat dengan GERABAH", PAGE_W - M, footerY, { size: 8.5, color: MUTED });

  return pdf.save();
}
