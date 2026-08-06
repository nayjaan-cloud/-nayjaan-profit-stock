export interface ProfitRecord {
  RecordID: string;
  Timestamp: string;
  ModifiedTime: string;
  FiscalYear: string;
  FiscalQuarter: string;
  Symbol: string;
  NetProfit: number; // Numeric value
  AdjustmentNote: string;
  Source: string;
  Currency: string;
  Version?: number;
  IsLatest?: boolean;
  // Future Expansion fields
  Revenue?: number;
  EPS?: number;
  ROE?: number;
  ROA?: number;
  Dividend?: number;
  BookValue?: number;
  PE?: number;
  PBV?: number;
}

export interface StockMasterItem {
  Symbol: string;
  CompanyName: string;
  Sector: string;
  Industry: string;
  Market: 'SET' | 'mai' | string;
  Currency: string;
  Active: boolean;
}

export interface SettingData {
  FiscalYears: string[];
  FiscalQuarters: string[];
  Sources: string[];
  Currencies: string[];
}

export interface AuditLogItem {
  LogID: string;
  DateTime: string;
  User: string;
  Action: 'Create' | 'Update' | 'Import' | 'Export' | 'Stock Master' | 'Setting Update' | 'Backup/Restore';
  Table: string;
  RecordID: string;
  OldValue?: string;
  NewValue?: string;
}

export interface SearchFilterState {
  fiscalYear: string;
  fiscalQuarter: string;
  symbol: string;
  companyName: string;
  source: string;
  currency: string;
  minProfit: string;
  maxProfit: string;
  market: string;
  sector: string;
}

export interface UserProfile {
  email: string;
  displayName: string;
  photoUrl?: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'addRecord'
  | 'editRecord'
  | 'search'
  | 'analytics'
  | 'stockMaster'
  | 'setting'
  | 'bulkPaste'
  | 'export'
  | 'auditLog'
  | 'backup'
  | 'gasCode';
