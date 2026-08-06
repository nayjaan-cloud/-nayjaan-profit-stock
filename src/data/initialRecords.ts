import { ProfitRecord } from '../types';

// Compact tuples: [RecordID, FiscalYear, FiscalQuarter, Symbol, NetProfit, Source]
const SEED_TUPLES: [number, string, string, string, number, string][] = [
  [1, "2563", "Q1", "ADVANC", 6756.19, "Manual"],
  [2, "2563", "Q2", "ADVANC", 7001.11, "Manual"],
  [3, "2563", "Q3", "ADVANC", 6512.67, "Manual"],
  [4, "2563", "Q4", "ADVANC", 7164.38, "Manual"],
  [5, "2564", "Q1", "ADVANC", 6643.89, "Manual"],
  [6, "2564", "Q2", "ADVANC", 7040.82, "Manual"],
  [7, "2564", "Q3", "ADVANC", 6374.06, "Manual"],
  [8, "2564", "Q4", "ADVANC", 6863.38, "Manual"],
  [9, "2565", "Q1", "ADVANC", 6310.84, "Manual"],
  [10, "2565", "Q2", "ADVANC", 6305.15, "Manual"],
  [11, "2565", "Q3", "ADVANC", 6032.00, "Manual"],
  [12, "2565", "Q4", "ADVANC", 7363.29, "Manual"],
  [13, "2566", "Q1", "ADVANC", 6756.93, "Manual"],
  [14, "2566", "Q2", "ADVANC", 7180.22, "Manual"],
  [15, "2566", "Q3", "ADVANC", 8146.42, "Manual"],
  [16, "2566", "Q4", "ADVANC", 7002.53, "Manual"],
  [17, "2567", "Q1", "ADVANC", 8451.05, "Manual"],
  [18, "2567", "Q2", "ADVANC", 8577.26, "Manual"],
  [19, "2567", "Q3", "ADVANC", 8788.13, "Manual"],
  [20, "2567", "Q4", "ADVANC", 9258.91, "Manual"],
  [21, "2568", "Q1", "ADVANC", 10583.50, "Manual"],
  [22, "2568", "Q2", "ADVANC", 10981.90, "Manual"],
  [23, "2568", "Q3", "ADVANC", 12038.90, "Manual"],
  [24, "2568", "Q4", "ADVANC", 14281.60, "Manual"],
  [25, "2569", "Q1", "ADVANC", 13495.50, "Manual"],

  // ASIAN
  [26, "2559", "Q1", "ASIAN", 10.80, "Manual"],
  [27, "2559", "Q2", "ASIAN", 9.27, "Manual"],
  [28, "2559", "Q3", "ASIAN", 9.67, "Manual"],
  [29, "2559", "Q4", "ASIAN", 124.90, "Manual"],
  [30, "2560", "Q1", "ASIAN", 105.81, "Manual"],
  [31, "2560", "Q2", "ASIAN", 94.39, "Manual"],
  [32, "2560", "Q3", "ASIAN", 111.95, "Manual"],
  [33, "2560", "Q4", "ASIAN", 105.87, "Manual"],

  // AU
  [67, "2559", "Q4", "AU", 23.79, "Manual"],
  [68, "2560", "Q1", "AU", 21.74, "Manual"],
  [69, "2560", "Q2", "AU", 31.46, "Manual"],
  [70, "2560", "Q3", "AU", 41.72, "Manual"],

  // BBL
  [184, "2562", "Q1", "BBL", 9028.30, "Manual"],
  [185, "2562", "Q2", "BBL", 9347.01, "Manual"],
  [186, "2562", "Q3", "BBL", 9438.41, "Manual"],
  [187, "2562", "Q4", "BBL", 8002.38, "Manual"],
  [208, "2568", "Q1", "BBL", 12617.80, "Manual"],

  // BDMS
  [248, "2560", "Q1", "BDMS", 2044.05, "Manual"],
  [249, "2560", "Q2", "BDMS", 3865.60, "Manual"],
  [280, "2568", "Q1", "BDMS", 4346.44, "Manual"],

  // CPALL
  [661, "2559", "Q1", "CPALL", 4099.13, "Manual"],
  [662, "2559", "Q2", "CPALL", 4228.54, "Manual"],
  [697, "2568", "Q1", "CPALL", 7585.24, "Manual"],
  [698, "2568", "Q2", "CPALL", 6768.43, "Manual"],

  // CPN
  [743, "2559", "Q1", "CPN", 2415.38, "Manual"],
  [779, "2568", "Q1", "CPN", 4227.21, "Manual"],

  // GULF
  [921, "2561", "Q1", "GULF", 2165.50, "Manual"],
  [949, "2568", "Q1", "GULF", 5394.71, "Manual"],

  // KBANK
  [1192, "2559", "Q1", "KBANK", 9646.09, "Manual"],
  [1228, "2568", "Q1", "KBANK", 13791.50, "Manual"],

  // SCB
  [1871, "2562", "Q1", "SCB", 9156.50, "Manual"],
  [1895, "2568", "Q1", "SCB", 12502.10, "Manual"],

  // TU
  [2253, "2562", "Q1", "TU", 1273.39, "Manual"],
  [2277, "2568", "Q1", "TU", 1019.25, "Manual"],
];

const now = new Date('2026-07-23T19:43:23').toLocaleString('en-GB');

export const INITIAL_PROFIT_RECORDS: ProfitRecord[] = SEED_TUPLES.map(([id, year, quarter, symbol, profit, source]) => ({
  RecordID: String(id),
  Timestamp: now,
  ModifiedTime: now,
  FiscalYear: year,
  FiscalQuarter: quarter,
  Symbol: symbol,
  NetProfit: profit,
  AdjustmentNote: '',
  Source: source || 'Manual',
  Currency: 'THB',
  Version: 1,
  IsLatest: true,
}));
