import { ProfitRecord, StockMasterItem, SettingData, AuditLogItem } from '../types';
import { parseFormattedNumber } from '../utils/formatters';

const GAS_URL_KEY = 'spms_gas_webapp_url_v1';

export function getGasWebAppUrl(): string {
  let url = localStorage.getItem(GAS_URL_KEY) || '';
  url = url.trim();
  if (url.includes('/macros/s/')) {
    url = url.replace(/\/edit(\?.*)?$/, '/exec');
    url = url.replace(/\/dev(\?.*)?$/, '/exec');
  }
  return url;
}

export function setGasWebAppUrl(rawUrl: string): void {
  let cleaned = rawUrl.trim();
  // Auto-correct common mistakes in Google Apps Script Web App URLs
  if (cleaned.includes('/macros/s/')) {
    cleaned = cleaned.replace(/\/edit(\?.*)?$/, '/exec');
    cleaned = cleaned.replace(/\/dev(\?.*)?$/, '/exec');
  }
  localStorage.setItem(GAS_URL_KEY, cleaned);
}

export function isGasConfigured(): boolean {
  const url = getGasWebAppUrl();
  return Boolean(url && url.startsWith('http'));
}

export interface GasAllDataResponse {
  records: ProfitRecord[];
  stockMasters: StockMasterItem[];
  settings: SettingData;
  auditLogs: AuditLogItem[];
}

export interface GasFetchResult {
  success: boolean;
  data?: GasAllDataResponse;
  error?: string;
}

function normalizeYear(val: any): string {
  if (val === undefined || val === null) return '2568';
  let str = String(val).trim();
  if (!str) return '2568';

  const floatVal = parseFloat(str);
  if (!isNaN(floatVal) && floatVal > 1000) {
    return String(Math.floor(floatVal));
  }

  const yrMatch = str.match(/(20\d\d|25\d\d)/);
  if (yrMatch) {
    return yrMatch[1];
  }

  return str;
}

function normalizeQuarter(val: any): string {
  if (val === undefined || val === null) return 'Q1';
  let str = String(val).trim();
  if (!str) return 'Q1';

  if (str === '1' || str === '1.0') return 'Q1';
  if (str === '2' || str === '2.0') return 'Q2';
  if (str === '3' || str === '3.0') return 'Q3';
  if (str === '4' || str === '4.0') return 'Q4';

  const qMatch = str.match(/q\s*([1-4])/i);
  if (qMatch) {
    return `Q${qMatch[1]}`;
  }

  const tMatch = str.match(/ไตรมาส\s*([1-4])/);
  if (tMatch) {
    return `Q${tMatch[1]}`;
  }

  return str.toUpperCase();
}

function getObjectProp(obj: any, ...keys: string[]): any {
  if (!obj || typeof obj !== 'object') return undefined;

  // Tier 1: Direct exact property lookup
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
      return obj[k];
    }
  }

  const objKeys = Object.keys(obj);

  // Tier 2: Case-insensitive exact property lookup
  for (const k of keys) {
    const targetKey = k.trim().toLowerCase();
    const foundKey = objKeys.find(ok => ok.trim().toLowerCase() === targetKey);
    if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null && String(obj[foundKey]).trim() !== '') {
      return obj[foundKey];
    }
  }

  // Tier 3: Substring / loose matching for complex headers like "ปี (YEAR)" or "ไตรมาส (QUARTER)"
  for (const k of keys) {
    const targetKey = k.trim().toLowerCase();
    if (!targetKey || targetKey.length < 2) continue;
    const foundKey = objKeys.find(ok => {
      const lowerOk = ok.trim().toLowerCase();
      return lowerOk.includes(targetKey) || targetKey.includes(lowerOk);
    });
    if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null && String(obj[foundKey]).trim() !== '') {
      return obj[foundKey];
    }
  }

  return undefined;
}

export function sanitizeProfitRecord(r: any): ProfitRecord {
  const symbol = String(
    getObjectProp(r, 'Symbol', 'symbol', 'STOCK', 'Stock', 'Ticker', 'ticker', 'ชื่อหุ้น', 'หุ้น', 'Symbol (หุ้น)', 'บริษัท / SECTOR', 'บริษัท/SECTOR') || ''
  ).trim().toUpperCase();

  const netProfitRaw = getObjectProp(
    r,
    'NetProfit', 'netProfit', 'net_profit', 'Profit', 'profit',
    'Net Profit', 'Net Profit (MB)', 'NetProfit(MB)', 'NetProfit (MB)',
    'Profit (MB)', 'Profit(MB)', 'กำไรสุทธิ', 'กำไร', 'กำไรสุทธิ (MB)', 'กำไรสุทธิ(MB)',
    'กำไรสุทธิ (ลบ.)', 'กำไร(ลบ.)', 'NetProfitMB', 'ProfitMB'
  );

  const parsedNetProfit = parseFormattedNumber(netProfitRaw);

  const rawYear = getObjectProp(
    r,
    'FiscalYear', 'fiscalYear', 'fiscal_year', 'Fiscal Year', 'Fiscal_Year',
    'Year', 'year', 'YEAR', 'ปี (YEAR)', 'ปี (Year)', 'ปี(YEAR)', 'ปี', 'ปีบัญชี', 'ปี/YEAR', 'FY'
  );
  const fiscalYear = normalizeYear(rawYear);

  const rawQuarter = getObjectProp(
    r,
    'FiscalQuarter', 'fiscalQuarter', 'fiscal_quarter', 'Fiscal Quarter', 'Fiscal_Quarter',
    'Quarter', 'quarter', 'QUARTER', 'ไตรมาส (QUARTER)', 'ไตรมาส (Quarter)', 'ไตรมาส(QUARTER)', 'ไตรมาส', 'QTR', 'Qtr', 'qtr', 'Q'
  );
  const fiscalQuarter = normalizeQuarter(rawQuarter);

  const adjustmentNote = String(
    getObjectProp(r, 'AdjustmentNote', 'adjustmentNote', 'adjustment_note', 'Note', 'note', 'หมายเหตุ') ?? ''
  ).trim();

  const source = String(
    getObjectProp(r, 'Source', 'source', 'ที่มา') ?? 'Manual'
  ).trim();

  const currency = String(
    getObjectProp(r, 'Currency', 'currency', 'สกุลเงิน') ?? 'THB'
  ).trim();

  const recordId = String(
    getObjectProp(r, 'RecordID', 'recordId', 'record_id', 'ID', 'id', 'RECORDID', 'ลำดับ') ||
    'REC-' + Math.random().toString(36).substring(2, 9)
  ).trim();

  const timestamp = String(
    getObjectProp(r, 'Timestamp', 'timestamp', 'เวลา') || new Date().toLocaleString('th-TH')
  ).trim();

  const modifiedTime = String(
    getObjectProp(r, 'ModifiedTime', 'modifiedTime', 'modified_time', 'MODIFIEDTIME') || timestamp
  ).trim();

  const isLatestRaw = getObjectProp(r, 'IsLatest', 'isLatest', 'is_latest');
  let isLatest = true;
  if (isLatestRaw !== undefined && isLatestRaw !== null && String(isLatestRaw).trim() !== '') {
    const strVal = String(isLatestRaw).trim().toLowerCase();
    if (strVal === 'false' || strVal === '0') {
      isLatest = false;
    }
  }

  const versionRaw = getObjectProp(r, 'Version', 'version');
  const version = typeof versionRaw === 'number' ? versionRaw : (parseInt(String(versionRaw)) || 1);

  return {
    RecordID: recordId,
    Timestamp: timestamp,
    ModifiedTime: modifiedTime,
    FiscalYear: fiscalYear,
    FiscalQuarter: fiscalQuarter,
    Symbol: symbol,
    NetProfit: parsedNetProfit,
    AdjustmentNote: adjustmentNote,
    Source: source,
    Currency: currency,
    IsLatest: isLatest,
    Version: version
  };
}

export function sanitizeStockMaster(s: any): StockMasterItem {
  const symbol = String(getObjectProp(s, 'Symbol', 'symbol', 'STOCK', 'Stock', 'Ticker', 'ticker', 'ชื่อหุ้น', 'หุ้น') || '').trim().toUpperCase();
  const companyName = String(getObjectProp(s, 'CompanyName', 'companyName', 'company_name', 'Name', 'name', 'Company', 'company', 'ชื่อบริษัท', 'บริษัท') || symbol).trim();
  const sector = String(getObjectProp(s, 'Sector', 'sector', 'หมวดธุรกิจ') || 'General').trim();
  const industry = String(getObjectProp(s, 'Industry', 'industry', 'กลุ่มอุตสาหกรรม') || '').trim();
  const market = String(getObjectProp(s, 'Market', 'market', 'ตลาด') || 'SET').trim();
  const currency = String(getObjectProp(s, 'Currency', 'currency', 'สกุลเงิน') || 'THB').trim();
  const activeRaw = getObjectProp(s, 'Active', 'active', 'สถานะ');
  const active = activeRaw !== undefined ? (activeRaw === true || String(activeRaw).toLowerCase() === 'true' || String(activeRaw) === '1') : true;

  return {
    Symbol: symbol,
    CompanyName: companyName || symbol,
    Sector: sector,
    Industry: industry,
    Market: market,
    Currency: currency,
    Active: active
  };
}

export function sanitizeSettings(st: any): SettingData {
  const defaultYears = ['2021', '2022', '2023', '2024', '2025'];
  const defaultQuarters = ['Q1', 'Q2', 'Q3', 'Q4', 'Q1-Q4 (FULL YEAR)'];
  const defaultSources = ['Manual', 'Import', 'System Sync'];
  const defaultCurrencies = ['THB', 'USD', 'EUR'];

  return {
    FiscalYears: Array.isArray(st?.FiscalYears) && st.FiscalYears.length > 0
      ? st.FiscalYears.map((y: any) => String(y).trim()).filter(Boolean)
      : defaultYears,
    FiscalQuarters: Array.isArray(st?.FiscalQuarters) && st.FiscalQuarters.length > 0
      ? st.FiscalQuarters.map((q: any) => String(q).trim()).filter(Boolean)
      : defaultQuarters,
    Sources: Array.isArray(st?.Sources) && st.Sources.length > 0
      ? st.Sources.map((src: any) => String(src).trim()).filter(Boolean)
      : defaultSources,
    Currencies: Array.isArray(st?.Currencies) && st.Currencies.length > 0
      ? st.Currencies.map((c: any) => String(c).trim()).filter(Boolean)
      : defaultCurrencies
  };
}

export function sanitizeAuditLog(log: any): AuditLogItem {
  return {
    LogID: String(log?.LogID || 'LOG-' + Math.random().toString(36).substring(2, 9)),
    DateTime: String(log?.DateTime || new Date().toLocaleString('th-TH')),
    User: String(log?.User || 'User'),
    Action: (log?.Action || 'Update') as AuditLogItem['Action'],
    Table: String(log?.Table || 'Data'),
    RecordID: String(log?.RecordID || ''),
    OldValue: String(log?.OldValue || ''),
    NewValue: String(log?.NewValue || '')
  };
}

export function validateGasUrl(url: string): { valid: boolean; warning?: string; error?: string } {
  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: false, error: 'ยังไม่ได้ระบุ Web App URL' };
  }
  if (trimmed.includes('docs.google.com/spreadsheets/')) {
    return {
      valid: false,
      error: 'URL ที่ใส่เป็นลิงก์ Google Sheets — ต้องใช้ Web App Exec URL (ขึ้นต้นด้วย https://script.google.com/macros/s/.../exec) ที่ได้จากเมนู Deploy > Web app'
    };
  }
  if (trimmed.includes('script.google.com/home/projects/')) {
    return {
      valid: false,
      error: 'URL ที่ใส่เป็นลิงก์ Script Editor — ต้องใช้ Web App Exec URL ที่ได้จากเมนู Deploy > Web app'
    };
  }
  if (!trimmed.startsWith('https://script.google.com/macros/s/')) {
    return {
      valid: true,
      warning: 'URL ไม่ได้ขึ้นต้นด้วย https://script.google.com/macros/s/ — โปรดตรวจสอบว่าคัดลอกมาถูกต้องหรือไม่'
    };
  }
  if (trimmed.endsWith('/edit') || trimmed.endsWith('/dev')) {
    return {
      valid: true,
      warning: 'URL ลงท้ายด้วย /edit หรือ /dev — ระบบจะเปลี่ยนเป็น /exec ให้โดยอัตโนมัติ'
    };
  }
  return { valid: true };
}

/**
 * Fetch all data from Google Apps Script Web App backend
 */
export async function fetchDataFromGAS(): Promise<GasFetchResult> {
  const url = getGasWebAppUrl();
  if (!url) {
    return { success: false, error: 'ยังไม่ได้ตั้งค่า Google Apps Script Web App URL' };
  }

  const validation = validateGasUrl(url);
  if (!validation.valid) {
    return { success: false, error: validation.error || 'URL ของ Google Apps Script ไม่ถูกต้อง' };
  }

  try {
    const separator = url.includes('?') ? '&' : '?';
    // Fetch from Google Apps Script
    const response = await fetch(`${url}${separator}action=getAll`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        if (url.includes('docs.google.com/spreadsheets/')) {
          return {
            success: false,
            error: 'Google Apps Script ตอบกลับด้วยสถานะ HTTP 404 (Not Found)\n• สาเหตุ: คุณระบุ URL ของ Google Sheets แทนที่จะเป็น URL ของ Web App\n• วิธีแก้: ใน Google Sheets ไปที่ ส่วนขยาย (Extensions) > Apps Script > กดปุ่ม Deploy > New deployment > เลือกประเภท Web app (Who has access: Anyone) แล้วคัดลอก Web App Exec URL มาวาง'
          };
        }
        if (url.includes('script.google.com/home/projects/')) {
          return {
            success: false,
            error: 'Google Apps Script ตอบกลับด้วยสถานะ HTTP 404 (Not Found)\n• สาเหตุ: คุณระบุ URL หน้าแก้ไขโค้ด (Script Editor) ไม่ใช่ Web App Exec URL\n• วิธีแก้: ใน Apps Script ให้กดปุ่ม Deploy > New deployment > เลือกประเภท Web app (Who has access: Anyone) แล้วคัดลอก Web App Exec URL มาวาง'
          };
        }
        return {
          success: false,
          error: 'Google Apps Script ตอบกลับด้วยสถานะ HTTP 404 (Not Found)\n• สาเหตุ 1: ยังไม่ได้สร้าง Deployment เป็น Web App ใน Google Apps Script\n• สาเหตุ 2: คัดลอก Web App URL ไม่ครบถ้วน หรือ Deployment ID เดิมถูกลบ/เปลี่ยนใหม่\n• วิธีแก้: ใน Apps Script กด Deploy (ทำให้ใช้งานได้) > New deployment > เลือกประเภท Web app > ตั้งค่า Who has access เป็น Anyone (ทุกคน) แล้วคัดลอก URL ขึ้นต้นด้วย https://script.google.com/macros/s/.../exec มาวาง'
        };
      }
      return { success: false, error: `Google Apps Script ตอบกลับด้วยสถานะ HTTP ${response.status}` };
    }

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      return {
        success: false,
        error: 'Google Apps Script ส่งข้อมูลกลับมาเป็น HTML แทนที่จะเป็น JSON — อาจเป็นเพราะ URL ไม่ถูกต้อง หรือไม่ได้ตั้งค่า Who has access เป็น Anyone'
      };
    }

    if (data && data.status === 'success') {
      const rawRecords = Array.isArray(data.records) ? data.records : [];
      const rawStocks = Array.isArray(data.stockMasters) ? data.stockMasters : [];
      const rawAudit = Array.isArray(data.auditLogs) ? data.auditLogs : [];

      const sanitizedRecords = rawRecords.map(sanitizeProfitRecord).filter(r => Boolean(r.Symbol));
      const sanitizedStocks = rawStocks.map(sanitizeStockMaster).filter(s => Boolean(s.Symbol));
      const sanitizedSettings = sanitizeSettings(data.settings);
      const sanitizedAudit = rawAudit.map(sanitizeAuditLog);

      return {
        success: true,
        data: {
          records: sanitizedRecords,
          stockMasters: sanitizedStocks,
          settings: sanitizedSettings,
          auditLogs: sanitizedAudit
        }
      };
    } else {
      console.warn('GAS return non-success status:', data);
      return { success: false, error: data?.message || 'Google Apps Script ไม่สามารถอ่านข้อมูลได้ (Status non-success)' };
    }
  } catch (err: any) {
    console.error('Failed fetching data from Google Apps Script:', err);
    return {
      success: false,
      error: 'ไม่สามารถดึงข้อมูลจาก Google Apps Script ได้ (CORS / Failed to fetch) - กรุณาตรวจสอบว่าตั้งค่า Web App Deployment เป็น "Who has access: Anyone" (ทุกคน) และ URL ลงท้ายด้วย /exec'
    };
  }
}

/**
 * Post a payload to Google Apps Script Web App
 */
async function postToGAS(payload: any): Promise<boolean> {
  const url = getGasWebAppUrl();
  if (!url) return false;

  try {
    // Note: Use text/plain;charset=utf-8 header to avoid CORS preflight issues with GAS
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    if (response.ok) {
      const resData = await response.json();
      return Boolean(resData && resData.status === 'success');
    }

    console.warn('GAS POST HTTP non-OK status:', response.status);
    // Fallback attempt: execute no-cors POST so payload is still transmitted to Google Apps Script doPost
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    console.warn('Network or CORS notice during POST to Google Apps Script, attempting no-cors fallback:', err);
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });
      return true;
    } catch (fallbackErr) {
      console.error('Failed no-cors POST fallback to GAS:', fallbackErr);
      return false;
    }
  }
}

export async function saveRecordToGAS(record: ProfitRecord, user: string): Promise<boolean> {
  return postToGAS({
    action: 'saveRecord',
    record,
    user
  });
}

export async function bulkImportToGAS(records: ProfitRecord[], user: string): Promise<boolean> {
  return postToGAS({
    action: 'bulkImport',
    records,
    user
  });
}

export async function updateStockMasterToGAS(stockMaster: StockMasterItem, user: string): Promise<boolean> {
  return postToGAS({
    action: 'updateStockMaster',
    stockMaster,
    user
  });
}

export async function updateSettingsToGAS(settings: SettingData, user: string): Promise<boolean> {
  return postToGAS({
    action: 'updateSettings',
    settings,
    user
  });
}
