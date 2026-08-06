export function formatProfitNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null || num === '') return '0.00';
  const val = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(val)) return '0.00';
  return val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseFormattedNumber(valStr: any): number {
  if (valStr === undefined || valStr === null) return 0;
  if (typeof valStr === 'number') return isNaN(valStr) ? 0 : valStr;

  let str = String(valStr).trim();
  if (!str) return 0;

  // Remove currency / unit suffixes like "MB", "THB", "ลบ.", "บาท"
  str = str.replace(/(MB|THB|ลบ\.|บาท)/gi, '').trim();

  // Handle formatted negative values like "(957.83)" or "-957.83"
  let clean = str.replace(/,/g, '').trim();
  if (clean.startsWith('(') && clean.endsWith(')')) {
    clean = '-' + clean.substring(1, clean.length - 1);
  }
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

export function getQuarterRank(quarter: string): number {
  switch (quarter) {
    case 'Q1': return 1;
    case 'Q2': return 2;
    case 'Q3': return 3;
    case 'Q4': return 4;
    default: return 0;
  }
}
