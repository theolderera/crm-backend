import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  VerticalAlign,
} from 'docx';
import { AttendanceReport } from './reports.service';

/* ─── Palette (matches the web UI) ─── */
const INDIGO = '4F46E5';
const INK = '0F172A';
const MUTED = '64748B';
const ROW_ALT = 'F8FAFC';
const HEADER_BG = 'EEF2FF';
const BORDER = 'E2E8F0';
const GREEN = '16A34A';
const AMBER = 'D97706';
const RED = 'DC2626';

const FONT = 'Calibri';

/* ─── Formatting helpers ─── */
function fmtDMY(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function fmtDateTime(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '—';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(dt.getDate())}.${p(dt.getMonth() + 1)}.${dt.getFullYear()} ${p(
    dt.getHours(),
  )}:${p(dt.getMinutes())}`;
}

function periodLabel(report: AttendanceReport): string {
  if (report.rangeStart && report.rangeEnd) {
    return report.rangeStart === report.rangeEnd
      ? fmtDMY(report.rangeStart)
      : `${fmtDMY(report.rangeStart)} – ${fmtDMY(report.rangeEnd)}`;
  }
  if (report.period.from || report.period.to) {
    return `${fmtDMY(report.period.from)} – ${fmtDMY(report.period.to)}`;
  }
  return 'Ҳамаи давра';
}

function rateColor(rate: number): string {
  if (rate >= 80) return GREEN;
  if (rate >= 60) return AMBER;
  return RED;
}

/* ─── Cell builders ─── */
type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

function textCell(
  text: string,
  opts: {
    width: number;
    bold?: boolean;
    align?: Align;
    color?: string;
    fill?: string;
    size?: number;
  },
): TableCell {
  return new TableCell({
    width: { size: opts.width, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    shading: opts.fill
      ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.fill }
      : undefined,
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: opts.bold,
            color: opts.color ?? INK,
            size: opts.size ?? 19,
            font: FONT,
          }),
        ],
      }),
    ],
  });
}

function metaLine(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${label}:  `, bold: true, color: INK, size: 21, font: FONT }),
      new TextRun({ text: value, color: INK, size: 21, font: FONT }),
    ],
  });
}

const evenBorder = {
  style: BorderStyle.SINGLE,
  size: 2,
  color: BORDER,
};
const tableBorders = {
  top: evenBorder,
  bottom: evenBorder,
  left: evenBorder,
  right: evenBorder,
  insideHorizontal: evenBorder,
  insideVertical: evenBorder,
};

/* ─── Summary table (label row + value row) ─── */
function summaryTable(report: AttendanceReport): Table {
  const s = report.summary;
  const w = 100 / 8;
  const labels = [
    'Талабагон',
    'Ҷаласаҳо',
    'Ҳузури миёна',
    'Ҳозириҳо',
    'Ғоибиҳо',
    'Сабабнок',
    'Дер омадан',
    'Масъалаҳо',
  ];
  const values = [
    String(s.totalStudents),
    String(s.totalSessions),
    `${s.avgRate}%`,
    String(s.present),
    String(s.absent),
    String(s.excused),
    String(s.late),
    String(s.hwSolved),
  ];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: [
      new TableRow({
        children: labels.map((l) =>
          textCell(l, {
            width: w,
            bold: true,
            align: AlignmentType.CENTER,
            color: MUTED,
            fill: HEADER_BG,
            size: 17,
          }),
        ),
      }),
      new TableRow({
        children: values.map((v, i) =>
          textCell(v, {
            width: w,
            bold: true,
            align: AlignmentType.CENTER,
            size: 26,
            color: i === 2 ? rateColor(report.summary.avgRate) : INDIGO,
          }),
        ),
      }),
    ],
  });
}

/* ─── Detailed per-student table ─── */
function detailTable(report: AttendanceReport): Table {
  const headers: { label: string; width: number; align: Align }[] = [
    { label: '№', width: 4, align: AlignmentType.CENTER },
    { label: 'Ному насаб', width: 22, align: AlignmentType.LEFT },
    { label: 'Ҷаласа', width: 9, align: AlignmentType.CENTER },
    { label: 'Ҳозир', width: 9, align: AlignmentType.CENTER },
    { label: 'Ғоиб', width: 9, align: AlignmentType.CENTER },
    { label: 'Саб.', width: 9, align: AlignmentType.CENTER },
    { label: 'Дер', width: 9, align: AlignmentType.CENTER },
    { label: 'Дер(д)', width: 10, align: AlignmentType.CENTER },
    { label: 'Масъала', width: 9, align: AlignmentType.CENTER },
    { label: 'Ҳузур', width: 10, align: AlignmentType.CENTER },
  ];

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) =>
      textCell(h.label, {
        width: h.width,
        bold: true,
        align: h.align,
        color: 'FFFFFF',
        fill: INDIGO,
        size: 18,
      }),
    ),
  });

  const bodyRows = report.students.map((row, i) => {
    const fill = i % 2 === 1 ? ROW_ALT : undefined;
    return new TableRow({
      children: [
        textCell(String(i + 1), { width: 4, align: AlignmentType.CENTER, color: MUTED, fill }),
        textCell(row.name, { width: 22, fill, bold: true }),
        textCell(String(row.sessions), { width: 9, align: AlignmentType.CENTER, color: MUTED, fill }),
        textCell(String(row.present), { width: 9, align: AlignmentType.CENTER, color: GREEN, bold: true, fill }),
        textCell(String(row.absent), { width: 9, align: AlignmentType.CENTER, color: row.absent > 0 ? RED : MUTED, fill }),
        textCell(String(row.excused), { width: 9, align: AlignmentType.CENTER, color: row.excused > 0 ? RED : MUTED, fill }),
        textCell(String(row.late), { width: 9, align: AlignmentType.CENTER, color: row.late > 0 ? AMBER : MUTED, fill }),
        textCell(row.lateMinutes > 0 ? String(row.lateMinutes) : '—', { width: 10, align: AlignmentType.CENTER, color: row.lateMinutes > 0 ? AMBER : MUTED, fill }),
        textCell(row.hwSolved > 0 ? String(row.hwSolved) : '—', { width: 9, align: AlignmentType.CENTER, color: INDIGO, fill }),
        textCell(`${row.rate}%`, { width: 10, align: AlignmentType.CENTER, color: rateColor(row.rate), bold: true, fill }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: [headerRow, ...bodyRows],
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 360, after: 140 },
    children: [new TextRun({ text, bold: true, color: INK, size: 24, font: FONT })],
  });
}

/* ─── Document assembly ─── */
export async function buildAttendanceDocx(
  report: AttendanceReport,
): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [
    // Title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: 'ҲИСОБОТИ ҲУЗУР', bold: true, color: INK, size: 34, font: FONT }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: INDIGO, space: 8 } },
      children: [
        new TextRun({
          text: 'Системаи қайди ҳузур · Student CRM',
          color: MUTED,
          size: 18,
          font: FONT,
        }),
      ],
    }),

    // Meta
    metaLine('Гурӯҳ', report.group.name),
    ...(report.group.description
      ? [metaLine('Тавсиф', report.group.description)]
      : []),
    metaLine('Ментор', report.mentor ?? '—'),
    metaLine('Давра', periodLabel(report)),
    metaLine('Шумораи ҷаласаҳо', String(report.summary.totalSessions)),
    metaLine('Санаи таҳия', fmtDateTime(report.generatedAt)),

    // Summary
    sectionHeading('Хулосаи умумӣ'),
    summaryTable(report),

    // Detail
    sectionHeading('Натиҷаҳои талабагон'),
  ];

  if (report.students.length === 0) {
    children.push(
      new Paragraph({
        spacing: { before: 80 },
        children: [
          new TextRun({
            text: 'Дар ин гурӯҳ ҳоло талаба нест.',
            color: MUTED,
            italics: true,
            size: 21,
            font: FONT,
          }),
        ],
      }),
    );
  } else {
    if (report.summary.totalSessions === 0) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: 'Дар ин давра ягон ҷаласа қайд нашудааст.',
              color: MUTED,
              italics: true,
              size: 20,
              font: FONT,
            }),
          ],
        }),
      );
    }
    children.push(detailTable(report));
  }

  // Footer
  children.push(
    new Paragraph({
      spacing: { before: 400 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER, space: 8 } },
      children: [
        new TextRun({
          text: `Ин ҳисобот ба таври худкор аз ҷониби Student CRM таҳия шудааст · ${fmtDateTime(
            report.generatedAt,
          )}`,
          color: MUTED,
          size: 15,
          font: FONT,
        }),
      ],
    }),
  );

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: 20 } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
