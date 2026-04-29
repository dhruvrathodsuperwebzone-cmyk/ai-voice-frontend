/** Escape one CSV field (RFC-style). */
function escapeCsvCell(value) {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Trigger a browser download of a UTF-8 CSV (opens in Excel).
 * @param {string} filename - e.g. `leads-template.csv`
 * @param {string[][]} rows - first row = headers, rest = data
 */
export function downloadCsv(filename, rows) {
  if (!Array.isArray(rows) || rows.length === 0) return;
  const body = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
  const blob = new Blob(['\ufeff', body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Column names aligned with create lead / bulk import fields */
const LEADS_TEMPLATE_HEADERS = ['hotel_name', 'owner_name', 'phone', 'email', 'rooms', 'location', 'notes'];

export function downloadLeadsImportTemplate() {
  downloadCsv('leads-import-template.csv', [
    LEADS_TEMPLATE_HEADERS,
    ['Sample Hotel', 'Owner Name', '+919000000000', 'owner@example.com', '10', 'City, State', 'Optional notes'],
  ]);
}

/** CSV for outbound bulk calls: name, phone, optional email & location per row */
export function downloadOutboundCallsSampleCsv() {
  downloadCsv('outbound-calls-sample.csv', [
    ['name', 'phone', 'email', 'location'],
    ['Example contact', '+919876543210', 'contact@example.com', 'Mumbai, India'],
  ]);
}
