import { PDFDocument, StandardFonts, type PDFFont, type Color } from "pdf-lib";
import { formatIDRPlain, formatDateLong } from "@/lib/format";
import { INK, MUTED, RULE, BAND, ACCENT, SAGE, PAGE_W, PAGE_H, MARGIN, san, wrap } from "@/lib/pdf-kit";

export type CatAmount = { name: string; amount: number };

export type FinancialReportData = {
  businessName: string;
  location?: string | null;
  ownerName?: string | null;
  periodLabel: string;
  printedAt: Date;

  incomeByCat: CatAmount[];
  expenseByCat: CatAmount[];
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  openingBalance: number;
  closingBalance: number;

  salesCount: number;
  salesGross: number;
  salesDiscount: number;
  salesNet: number;
  salesByChannel: CatAmount[];

  receivables: { customer: string; due: Date | null; amount: number; status: string; kind: string }[];
  totalReceivable: number;

  inventory: { name: string; stock: number; price: number; value: number }[];
  totalInventoryValue: number;
};

const M = MARGIN;
const CONTENT_W = PAGE_W - M * 2;

export async function buildFinancialReportPdf(d: FinancialReportData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Laporan Keuangan ${d.businessName}`);
  pdf.setProducer("GERABAH");
  pdf.setCreator("GERABAH");

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - M;
  let pageNo = 1;

  const draw = (
    s: string,
    x: number,
    yy: number,
    opts: { size?: number; font?: PDFFont; color?: Color } = {}
  ) => {
    page.drawText(san(s), { x, y: yy, size: opts.size ?? 9.5, font: opts.font ?? regular, color: opts.color ?? INK });
  };
  const drawRight = (
    s: string,
    right: number,
    yy: number,
    opts: { size?: number; font?: PDFFont; color?: Color } = {}
  ) => {
    const size = opts.size ?? 9.5;
    const font = opts.font ?? regular;
    draw(s, right - font.widthOfTextAtSize(san(s), size), yy, { ...opts, size, font });
  };
  const line = (yy: number, color = RULE, thickness = 0.75) => {
    page.drawLine({ start: { x: M, y: yy }, end: { x: PAGE_W - M, y: yy }, thickness, color });
  };

  const footer = () => {
    draw("Dibuat dengan GERABAH", M, M - 18, { size: 8, color: MUTED });
    drawRight(`Halaman ${pageNo}`, PAGE_W - M, M - 18, { size: 8, color: MUTED });
  };

  const ensure = (needed: number) => {
    if (y - needed < M + 10) {
      footer();
      page = pdf.addPage([PAGE_W, PAGE_H]);
      pageNo += 1;
      y = PAGE_H - M;
    }
  };

  const sectionTitle = (title: string) => {
    ensure(40);
    y -= 6;
    page.drawRectangle({ x: M, y: y - 4, width: 20, height: 3, color: ACCENT });
    y -= 18;
    draw(title, M, y, { size: 12, font: bold });
    y -= 8;
    line(y);
    y -= 16;
  };

  const row = (label: string, value: string, opts: { bold?: boolean; color?: Color } = {}) => {
    ensure(16);
    const font = opts.bold ? bold : regular;
    draw(label, M + 4, y, { size: opts.bold ? 10 : 9.5, font, color: opts.bold ? INK : MUTED });
    drawRight(value, PAGE_W - M, y, { size: opts.bold ? 10 : 9.5, font, color: opts.color ?? INK });
    y -= opts.bold ? 17 : 14;
  };

  const catBlock = (rows: CatAmount[], totalLabel: string, total: number, totalColor: Color) => {
    if (rows.length === 0) row("(belum ada)", "-");
    for (const r of rows) row(r.name, formatIDRPlain(r.amount));
    ensure(20);
    line(y + 5, RULE, 0.75);
    y -= 4;
    row(totalLabel, formatIDRPlain(total), { bold: true, color: totalColor });
    y -= 4;
  };

  // ── Header ───────────────────────────────────────────────
  draw(d.businessName, M, y, { size: 18, font: bold });
  y -= 16;
  const sub = [d.location, `Periode ${d.periodLabel}`, `Dicetak ${formatDateLong(d.printedAt)}`]
    .filter(Boolean)
    .join("  ·  ");
  for (const l of wrap(sub, regular, 9, CONTENT_W)) {
    draw(l, M, y, { size: 9, color: MUTED });
    y -= 12;
  }
  y -= 4;
  drawRight("LAPORAN KEUANGAN", PAGE_W - M, PAGE_H - M - 14, { size: 13, font: bold, color: ACCENT });
  line(y);
  y -= 10;

  // ── 1. Laba Rugi ─────────────────────────────────────────
  sectionTitle("1. Laba Rugi");
  draw("Pendapatan", M + 4, y, { size: 9.5, font: bold });
  y -= 15;
  catBlock(d.incomeByCat, "Jumlah pendapatan", d.totalIncome, SAGE);
  draw("Pengeluaran", M + 4, y, { size: 9.5, font: bold });
  y -= 15;
  catBlock(d.expenseByCat, "Jumlah pengeluaran", d.totalExpense, ACCENT);
  ensure(24);
  page.drawRectangle({ x: M, y: y - 6, width: CONTENT_W, height: 22, color: BAND });
  draw(d.netProfit >= 0 ? "LABA BERSIH" : "RUGI BERSIH", M + 8, y, { size: 10, font: bold });
  drawRight(formatIDRPlain(d.netProfit), PAGE_W - M - 8, y, { size: 11, font: bold, color: d.netProfit >= 0 ? SAGE : ACCENT });
  y -= 28;

  // ── 2. Arus Kas ──────────────────────────────────────────
  sectionTitle("2. Arus Kas Masuk & Keluar");
  row("Saldo awal periode", formatIDRPlain(d.openingBalance));
  row("Kas masuk", `+ ${formatIDRPlain(d.totalIncome)}`, { color: SAGE });
  row("Kas keluar", `- ${formatIDRPlain(d.totalExpense)}`, { color: ACCENT });
  line(y + 5);
  y -= 4;
  row("Saldo akhir periode", formatIDRPlain(d.closingBalance), { bold: true });
  y -= 6;

  // ── 3. Ringkasan Penjualan ───────────────────────────────
  sectionTitle("3. Ringkasan Penjualan");
  row("Jumlah transaksi penjualan", String(d.salesCount));
  row("Penjualan kotor", formatIDRPlain(d.salesGross));
  row("Diskon diberikan", `- ${formatIDRPlain(d.salesDiscount)}`);
  line(y + 5);
  y -= 4;
  row("Penjualan bersih", formatIDRPlain(d.salesNet), { bold: true });
  y -= 6;
  if (d.salesByChannel.length > 0) {
    draw("Per tempat jualan", M + 4, y, { size: 9, font: bold, color: MUTED });
    y -= 14;
    for (const c of d.salesByChannel) row(c.name, formatIDRPlain(c.amount));
    y -= 2;
  }

  // ── 4. Daftar Piutang ────────────────────────────────────
  sectionTitle("4. Daftar Piutang (Belum Lunas)");
  if (d.receivables.length === 0) {
    row("Semua tagihan sudah lunas", "-");
  } else {
    ensure(16);
    draw("Pelanggan", M + 4, y, { size: 8, font: bold, color: MUTED });
    draw("Jatuh tempo", M + 220, y, { size: 8, font: bold, color: MUTED });
    drawRight("Tagihan", PAGE_W - M - 4, y, { size: 8, font: bold, color: MUTED });
    y -= 6;
    line(y);
    y -= 12;
    for (const r of d.receivables) {
      ensure(15);
      draw(`${r.customer} (${r.kind})`, M + 4, y, { size: 9 });
      draw(r.due ? formatDateLong(r.due) : "-", M + 220, y, { size: 9, color: MUTED });
      drawRight(formatIDRPlain(r.amount), PAGE_W - M - 4, y, { size: 9 });
      y -= 14;
    }
    line(y + 4);
    y -= 4;
    row("Total piutang", formatIDRPlain(d.totalReceivable), { bold: true, color: ACCENT });
  }
  y -= 6;

  // ── 5. Ringkasan Stok & Nilai Persediaan ─────────────────
  sectionTitle("5. Ringkasan Stok & Nilai Persediaan");
  ensure(16);
  draw("Produk", M + 4, y, { size: 8, font: bold, color: MUTED });
  drawRight("Stok", M + 320, y, { size: 8, font: bold, color: MUTED });
  drawRight("Harga jual", M + 430, y, { size: 8, font: bold, color: MUTED });
  drawRight("Nilai", PAGE_W - M - 4, y, { size: 8, font: bold, color: MUTED });
  y -= 6;
  line(y);
  y -= 12;
  for (const p of d.inventory) {
    ensure(15);
    for (const [i, l] of wrap(p.name, regular, 9, 260).entries()) {
      if (i > 0) y -= 11;
      draw(l, M + 4, y, { size: 9 });
    }
    drawRight(String(p.stock), M + 320, y, { size: 9 });
    drawRight(formatIDRPlain(p.price), M + 430, y, { size: 9, color: MUTED });
    drawRight(formatIDRPlain(p.value), PAGE_W - M - 4, y, { size: 9 });
    y -= 14;
  }
  line(y + 4);
  y -= 4;
  row("Total nilai persediaan", formatIDRPlain(d.totalInventoryValue), { bold: true });

  // ── Ringkasan kondisi keuangan ───────────────────────────
  sectionTitle("Ringkasan Kondisi Keuangan");
  const notes = [
    d.netProfit >= 0
      ? `Usaha untung ${formatIDRPlain(d.netProfit)} pada periode ini.`
      : `Usaha rugi ${formatIDRPlain(Math.abs(d.netProfit))} pada periode ini — tinjau harga jual atau biaya produksi.`,
    `Saldo kas akhir periode ${formatIDRPlain(d.closingBalance)}.`,
    d.totalReceivable > 0
      ? `Masih ada piutang ${formatIDRPlain(d.totalReceivable)} yang perlu ditagih.`
      : `Tidak ada piutang tertunggak.`,
    `Nilai persediaan barang ${formatIDRPlain(d.totalInventoryValue)}.`,
  ];
  for (const n of notes) {
    ensure(14);
    for (const [i, l] of wrap(n, regular, 9.5, CONTENT_W - 12).entries()) {
      draw(i === 0 ? `-  ${l}` : `   ${l}`, M + 4, y, { size: 9.5, color: i === 0 ? INK : MUTED });
      y -= 13;
    }
  }

  footer();
  return pdf.save();
}
