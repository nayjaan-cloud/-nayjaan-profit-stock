import { ProfitRecord, StockMasterItem, SettingData, AuditLogItem } from '../types';
import { INITIAL_STOCK_MASTERS, INITIAL_SETTINGS } from '../data/stockMasters';
import { INITIAL_PROFIT_RECORDS } from '../data/initialRecords';

const STORAGE_KEYS = {
  RECORDS: 'spms_data_records_v1',
  STOCK_MASTERS: 'spms_stock_masters_v1',
  SETTINGS: 'spms_settings_v1',
  AUDIT_LOGS: 'spms_audit_logs_v1',
  GAS_URL: 'spms_gas_webapp_url_v1',
};

// In-Memory Cache (Simulating Google Apps Script CacheService)
const memoryCache: Record<string, { data: any; expiry: number }> = {};

function getCached<T>(key: string): T | null {
  const cached = memoryCache[key];
  if (cached && Date.now() < cached.expiry) {
    return cached.data as T;
  }
  return null;
}

function setCached(key: string, data: any, ttlSeconds: number = 300): void {
  memoryCache[key] = {
    data,
    expiry: Date.now() + ttlSeconds * 1000,
  };
}

export function clearCache(): void {
  Object.keys(memoryCache).forEach((k) => delete memoryCache[k]);
}

export function mergeRecordsWithSeed(userRecords: ProfitRecord[]): ProfitRecord[] {
  if (!Array.isArray(userRecords) || userRecords.length === 0) {
    return INITIAL_PROFIT_RECORDS;
  }

  // Map seed records by RecordID and by Year_Quarter_Symbol
  const seedByIdMap = new Map<string, ProfitRecord>();
  const seedProfitMap = new Map<string, number>();
  INITIAL_PROFIT_RECORDS.forEach(s => {
    seedByIdMap.set(String(s.RecordID), s);
    const key = `${s.FiscalYear}_${s.FiscalQuarter}_${s.Symbol.toUpperCase()}`;
    if (s.NetProfit !== 0) {
      seedProfitMap.set(key, s.NetProfit);
    }
  });

  const recordMap = new Map<string, ProfitRecord>();

  userRecords.forEach((r, idx) => {
    if (!r || !r.Symbol) return;
    const sym = r.Symbol.trim().toUpperCase();

    let year = String(r.FiscalYear || '2568').trim();
    let quarter = String(r.FiscalQuarter || 'Q1').trim();

    // Auto-repair seed records whose year/quarter got corrupted to 2568 Q1
    const matchingSeed = r.RecordID ? seedByIdMap.get(String(r.RecordID).trim()) : undefined;
    if (matchingSeed) {
      if (year === '2568' && quarter === 'Q1' && matchingSeed.FiscalYear !== '2568') {
        year = matchingSeed.FiscalYear;
        quarter = matchingSeed.FiscalQuarter;
      }
    }

    let parsedProfit = typeof r.NetProfit === 'number'
      ? (isNaN(r.NetProfit) ? 0 : r.NetProfit)
      : (parseFloat(String(r.NetProfit || 0).replace(/,/g, '')) || 0);

    // If profit is 0, check if seed record has non-zero profit for this symbol/year/quarter
    if (parsedProfit === 0) {
      const seedKey = `${year}_${quarter}_${sym}`;
      if (seedProfitMap.has(seedKey)) {
        parsedProfit = seedProfitMap.get(seedKey)!;
      }
    }

    const cleanRecord: ProfitRecord = {
      ...r,
      FiscalYear: year,
      FiscalQuarter: quarter,
      Symbol: sym,
      NetProfit: parsedProfit,
      IsLatest: r.IsLatest !== undefined ? r.IsLatest : true
    };

    // Use RecordID as key if available; otherwise use Year_Quarter_Symbol_idx to preserve ALL rows
    const uniqueKey = (r.RecordID && String(r.RecordID).trim() !== '')
      ? String(r.RecordID).trim()
      : `${year}_${quarter}_${sym}_${idx}`;

    recordMap.set(uniqueKey, cleanRecord);
  });

  return Array.from(recordMap.values()).sort((a, b) => {
    if (a.FiscalYear !== b.FiscalYear) return a.FiscalYear.localeCompare(b.FiscalYear);
    if (a.FiscalQuarter !== b.FiscalQuarter) return a.FiscalQuarter.localeCompare(b.FiscalQuarter);
    if (a.Symbol !== b.Symbol) return a.Symbol.localeCompare(b.Symbol);
    return String(a.RecordID).localeCompare(String(b.RecordID));
  });
}

// Local Storage Helper
export function loadRecordsFromStorage(): ProfitRecord[] {
  const cached = getCached<ProfitRecord[]>('records');
  if (cached && cached.length > 0) return cached;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (raw) {
      let parsed = JSON.parse(raw) as ProfitRecord[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with seed to ensure complete multi-year dataset and fix zero-profit corruption
        const merged = mergeRecordsWithSeed(parsed);
        saveRecordsToStorage(merged);
        setCached('records', merged);
        return merged;
      }
    }
  } catch (e) {
    console.error('Failed loading records from storage', e);
  }

  // Fallback to seed records
  saveRecordsToStorage(INITIAL_PROFIT_RECORDS);
  return INITIAL_PROFIT_RECORDS;
}

export function resetRecordsToSeed(): ProfitRecord[] {
  clearCache();
  saveRecordsToStorage(INITIAL_PROFIT_RECORDS);
  return INITIAL_PROFIT_RECORDS;
}

export function saveRecordsToStorage(records: ProfitRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    setCached('records', records);
  } catch (e) {
    console.error('Failed saving records to storage', e);
  }
}

export function loadStockMasters(): StockMasterItem[] {
  const cached = getCached<StockMasterItem[]>('stockMasters');
  if (cached && cached.length > 0) return cached;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK_MASTERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setCached('stockMasters', parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed loading stock masters', e);
  }

  saveStockMasters(INITIAL_STOCK_MASTERS);
  return INITIAL_STOCK_MASTERS;
}

export function saveStockMasters(masters: StockMasterItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STOCK_MASTERS, JSON.stringify(masters));
    setCached('stockMasters', masters);
  } catch (e) {
    console.error('Failed saving stock masters', e);
  }
}

export function loadSettings(): SettingData {
  const cached = getCached<SettingData>('settings');
  if (cached) return cached;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      setCached('settings', parsed);
      return parsed;
    }
  } catch (e) {
    console.error('Failed loading settings', e);
  }

  saveSettings(INITIAL_SETTINGS);
  return INITIAL_SETTINGS;
}

export function saveSettings(settings: SettingData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    setCached('settings', settings);
  } catch (e) {
    console.error('Failed saving settings', e);
  }
}

export function syncStockMastersWithRecords(records: ProfitRecord[], currentMasters: StockMasterItem[]): StockMasterItem[] {
  const masterMap = new Map<string, StockMasterItem>();
  
  // 1. Pre-fill with INITIAL_STOCK_MASTERS so full catalog is available
  INITIAL_STOCK_MASTERS.forEach(m => {
    masterMap.set(m.Symbol.toUpperCase(), { ...m });
  });

  // 2. Override with saved/fetched currentMasters
  (currentMasters || []).forEach(m => {
    if (m && m.Symbol) {
      const sym = m.Symbol.trim().toUpperCase();
      const existing = masterMap.get(sym);
      masterMap.set(sym, {
        Symbol: sym,
        CompanyName: m.CompanyName || existing?.CompanyName || sym,
        Sector: m.Sector || existing?.Sector || 'General',
        Industry: m.Industry || existing?.Industry || '',
        Market: m.Market || existing?.Market || 'SET',
        Currency: m.Currency || existing?.Currency || 'THB',
        Active: m.Active !== undefined ? m.Active : true
      });
    }
  });

  // 3. Ensure every record's Symbol exists in stockMasters catalog
  (records || []).forEach(r => {
    if (r && r.Symbol) {
      const sym = r.Symbol.trim().toUpperCase();
      if (!masterMap.has(sym)) {
        masterMap.set(sym, {
          Symbol: sym,
          CompanyName: sym,
          Sector: 'General',
          Industry: '',
          Market: 'SET',
          Currency: r.Currency || 'THB',
          Active: true
        });
      }
    }
  });

  return Array.from(masterMap.values());
}

export function loadAuditLogs(): AuditLogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed loading audit logs', e);
  }
  return [];
}

export function saveAuditLogs(logs: AuditLogItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed saving audit logs', e);
  }
}

export function addAuditLog(item: Omit<AuditLogItem, 'LogID' | 'DateTime' | 'User'>, userEmail: string = 'nayjaan@gmail.com'): void {
  const logs = loadAuditLogs();
  const newLog: AuditLogItem = {
    LogID: 'LOG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    DateTime: new Date().toLocaleString('th-TH'),
    User: userEmail,
    ...item,
  };
  logs.unshift(newLog);
  // keep last 500 logs
  if (logs.length > 500) logs.length = 500;
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed writing audit log', e);
  }
}

export function getGasWebAppUrl(): string {
  let url = localStorage.getItem(STORAGE_KEYS.GAS_URL) || '';
  url = url.trim();
  if (url.includes('/macros/s/')) {
    url = url.replace(/\/edit(\?.*)?$/, '/exec');
    url = url.replace(/\/dev(\?.*)?$/, '/exec');
  }
  return url;
}

export function setGasWebAppUrl(rawUrl: string): void {
  let cleaned = rawUrl.trim();
  if (cleaned.includes('/macros/s/')) {
    cleaned = cleaned.replace(/\/edit(\?.*)?$/, '/exec');
    cleaned = cleaned.replace(/\/dev(\?.*)?$/, '/exec');
  }
  localStorage.setItem(STORAGE_KEYS.GAS_URL, cleaned);
}
