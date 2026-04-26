// ================================================================
// CSV Export — RFC 4180 compliant, zero dependencies.
// Replaces the legacy `import('https://cdn.sheetjs.com/...')` flow
// so exports keep working without an external CDN dependency.
//
// Usage:
//   import { exportToCsv } from '../../lib/csvExport';
//   exportToCsv('Participants_All_2026-04-26.csv', rows);
//
// Where `rows` is an array of plain objects. The keys of the first
// row become the column headers, in insertion order.
// ================================================================

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // Quote when the cell contains a comma, quote, CR, or LF.
  // Escape inner quotes by doubling them.
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function exportToCsv(filename, rows) {
  // UTF-8 BOM so Excel detects encoding and renders non-ASCII (e.g. Sinhala/Tamil) correctly.
  const BOM = '﻿';

  if (!rows || rows.length === 0) {
    const blob = new Blob([BOM], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename);
    return;
  }

  const columns = Object.keys(rows[0]);
  const header  = columns.map(escapeCell).join(',');
  const body    = rows.map(r => columns.map(c => escapeCell(r[c])).join(',')).join('\r\n');
  const csv     = BOM + header + '\r\n' + body;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}
