type CsvValue = string | number | boolean | null | undefined;

// Cells starting with these characters are run as formulas by Excel and
// Google Sheets, so they're prefixed with a quote to keep them as text.
const formulaPrefixes = ['=', '+', '-', '@', '\t', '\r'];

function escapeCell(value: CsvValue) {
  if (value === null || value === undefined) return '';

  let text = String(value);

  if (typeof value === 'string' && formulaPrefixes.includes(text[0])) {
    text = `'${text}`;
  }

  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

export function toCsv(header: string[], rows: CsvValue[][]) {
  return [header, ...rows]
    .map((row) => row.map(escapeCell).join(','))
    .join('\r\n');
}
