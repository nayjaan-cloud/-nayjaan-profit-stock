import React, { useState, useMemo } from 'react';
import { ProfitRecord, StockMasterItem, SettingData } from '../types';
import { BarChart3, TrendingUp, CheckSquare, Square } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { formatProfitNumber } from '../utils/formatters';

interface AnalyticsViewProps {
  records: ProfitRecord[];
  stockMasters: StockMasterItem[];
  settings: SettingData;
}

const STOCK_COLORS = [
  '#2563eb', '#9333ea', '#059669', '#ea580c', '#0891b2', '#4f46e5'
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  records,
  stockMasters
}) => {
  // Filter state
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  
  // Selected multi-stocks to compare (default to top 3 stocks: ADVANC, CPALL, KBANK)
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['ADVANC', 'CPALL', 'KBANK']);

  // Auto fallback if none of default selectedSymbols exist in records
  React.useEffect(() => {
    if (records.length > 0) {
      const existingSymbols = new Set(records.map(r => r.Symbol));
      const hasOverlap = selectedSymbols.some(s => existingSymbols.has(s));
      if (!hasOverlap) {
        const topSymbols = Array.from(existingSymbols).slice(0, 3);
        if (topSymbols.length > 0) {
          setSelectedSymbols(topSymbols);
        }
      }
    }
  }, [records]);

  const [viewMode, setViewMode] = useState<'quarterly' | 'yoy_quarter' | 'yearly'>('quarterly');
  const [selectedAnalyticsQuarter, setSelectedAnalyticsQuarter] = useState<string>('Q1');

  const uniqueSectors = useMemo(() => {
    return Array.from(new Set(stockMasters.map(s => s.Sector).filter(Boolean))).sort();
  }, [stockMasters]);

  // Filter available stocks based on Sector & Market
  const availableStocks = useMemo(() => {
    const map = new Map<string, StockMasterItem>();
    stockMasters.forEach(s => {
      if (s.Symbol) map.set(s.Symbol.trim().toUpperCase(), s);
    });

    records.forEach(r => {
      if (r.Symbol) {
        const sym = r.Symbol.trim().toUpperCase();
        if (!map.has(sym)) {
          map.set(sym, {
            Symbol: sym,
            CompanyName: sym,
            Sector: 'General',
            Industry: '',
            Market: 'SET',
            Currency: 'THB',
            Active: true
          });
        }
      }
    });

    return Array.from(map.values()).filter(s => {
      if (!s.Active) return false;
      if (selectedSector && s.Sector !== selectedSector) return false;
      if (selectedMarket && s.Market !== selectedMarket) return false;
      return true;
    }).sort((a, b) => a.Symbol.localeCompare(b.Symbol));
  }, [stockMasters, records, selectedSector, selectedMarket]);

  const toggleStockSymbol = (sym: string) => {
    const cleanSym = sym.trim().toUpperCase();
    if (selectedSymbols.some(s => s.trim().toUpperCase() === cleanSym)) {
      if (selectedSymbols.length === 1) return; // keep at least 1
      setSelectedSymbols(prev => prev.filter(s => s.trim().toUpperCase() !== cleanSym));
    } else {
      if (selectedSymbols.length >= 6) return; // limit to 6 for clean visual
      setSelectedSymbols(prev => [...prev, sym]);
    }
  };

  // Build pivot chart data with case-insensitive symbol matching and IsLatest deduplication
  const chartData = useMemo(() => {
    const selectedSet = new Set(selectedSymbols.map(s => s.trim().toUpperCase()));

    // Filter by IsLatest and deduplicate per (FiscalYear, FiscalQuarter, Symbol)
    const latestRecords = records.filter(r => (r.IsLatest ?? true));
    const dedupMap = new Map<string, ProfitRecord>();
    latestRecords.forEach(r => {
      const sym = (r.Symbol || '').trim().toUpperCase();
      if (!selectedSet.has(sym)) return;
      const key = `${r.FiscalYear}_${r.FiscalQuarter}_${sym}`;
      const existing = dedupMap.get(key);
      if (!existing) {
        dedupMap.set(key, r);
      } else {
        if (existing.NetProfit === 0 && r.NetProfit !== 0) {
          dedupMap.set(key, r);
        } else if ((r.Version || 1) > (existing.Version || 1)) {
          dedupMap.set(key, r);
        }
      }
    });

    const activeRecords = Array.from(dedupMap.values());

    if (viewMode === 'quarterly') {
      // Group by FiscalYear + FiscalQuarter
      const periodMap = new Map<string, Record<string, number>>();

      activeRecords.forEach(r => {
        const sym = (r.Symbol || '').trim().toUpperCase();
        const periodKey = `${r.FiscalYear} ${r.FiscalQuarter}`;
        if (!periodMap.has(periodKey)) {
          periodMap.set(periodKey, {});
        }
        const obj = periodMap.get(periodKey)!;
        const profitVal = typeof r.NetProfit === 'number' ? r.NetProfit : (parseFloat(String(r.NetProfit)) || 0);
        obj[sym] = profitVal;
      });

      const sortedPeriods = Array.from(periodMap.keys()).sort((a, b) => a.localeCompare(b));

      return sortedPeriods.map(period => {
        const item: any = { period };
        const obj = periodMap.get(period)!;
        selectedSymbols.forEach(s => {
          const sym = s.trim().toUpperCase();
          item[s] = obj[sym] !== undefined ? obj[sym] : null;
        });
        return item;
      });
    } else if (viewMode === 'yoy_quarter') {
      // YoY Quarter Comparison (Compare same quarter across all years for selected stocks)
      const yearMap = new Map<string, Record<string, number>>();

      activeRecords.forEach(r => {
        const sym = (r.Symbol || '').trim().toUpperCase();
        if (r.FiscalQuarter !== selectedAnalyticsQuarter) return;

        const yr = r.FiscalYear;
        if (!yearMap.has(yr)) {
          yearMap.set(yr, {});
        }
        const obj = yearMap.get(yr)!;
        const profitVal = typeof r.NetProfit === 'number' ? r.NetProfit : (parseFloat(String(r.NetProfit)) || 0);
        obj[sym] = profitVal;
      });

      const sortedYears = Array.from(yearMap.keys()).sort((a, b) => a.localeCompare(b));

      return sortedYears.map(yr => {
        const item: any = { period: `ปี ${yr}` };
        const obj = yearMap.get(yr)!;
        selectedSymbols.forEach(s => {
          const sym = s.trim().toUpperCase();
          item[s] = obj[sym] !== undefined ? obj[sym] : null;
        });
        return item;
      });
    } else {
      // Yearly Aggregation
      const yearMap = new Map<string, Record<string, number>>();

      activeRecords.forEach(r => {
        const sym = (r.Symbol || '').trim().toUpperCase();

        const yr = r.FiscalYear;
        if (!yearMap.has(yr)) {
          yearMap.set(yr, {});
        }
        const obj = yearMap.get(yr)!;
        const profitVal = typeof r.NetProfit === 'number' ? r.NetProfit : (parseFloat(String(r.NetProfit)) || 0);
        obj[sym] = (obj[sym] || 0) + profitVal;
      });

      const sortedYears = Array.from(yearMap.keys()).sort((a, b) => a.localeCompare(b));

      return sortedYears.map(yr => {
        const item: any = { period: `ปี ${yr}` };
        const obj = yearMap.get(yr)!;
        selectedSymbols.forEach(s => {
          const sym = s.trim().toUpperCase();
          item[s] = obj[sym] !== undefined ? obj[sym] : 0;
        });
        return item;
      });
    }
  }, [records, selectedSymbols, viewMode, selectedAnalyticsQuarter]);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Analytics & Comparative Analysis (กราฟเปรียบเทียบกำไรหลายหุ้น)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            เลือกหุ้นเปรียบเทียบผลประกอบการรายไตรมาสหรือรายปีได้หลายตัวพร้อมกัน
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded shrink-0">
          <button
            onClick={() => setViewMode('quarterly')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition uppercase tracking-wider ${
              viewMode === 'quarterly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            รายไตรมาส (Timeline)
          </button>
          <button
            onClick={() => setViewMode('yoy_quarter')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition uppercase tracking-wider ${
              viewMode === 'yoy_quarter'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            เปรียบเทียบ YoY
          </button>
          <button
            onClick={() => setViewMode('yearly')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition uppercase tracking-wider ${
              viewMode === 'yearly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            รายปี (Sum)
          </button>
        </div>
      </div>

      {/* Sector & Market Filters + Multi-stock Chips */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Quarter Filter Sub-bar when YoY mode is active */}
        {viewMode === 'yoy_quarter' && (
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded border border-blue-100 dark:border-blue-900 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              เลือกไตรมาสเปรียบเทียบ YoY (Year-over-Year):
            </span>
            <div className="flex items-center space-x-1">
              {['Q1', 'Q2', 'Q3', 'Q4', 'Q1-Q4'].map(q => (
                <button
                  key={q}
                  onClick={() => setSelectedAnalyticsQuarter(q)}
                  className={`px-3 py-1 rounded text-xs font-bold transition ${
                    selectedAnalyticsQuarter === q
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-500'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">กรองตาม Sector</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2 outline-none font-semibold"
            >
              <option value="">ทุก Sector</option>
              {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">กรองตาม Market</label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2 outline-none font-semibold"
            >
              <option value="">ทั้งหมด (SET & mai)</option>
              <option value="SET">SET</option>
              <option value="mai">mai</option>
            </select>
          </div>
        </div>

        {/* Stock Selector Checkbox Chips */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            เลือกหุ้นเปรียบเทียบ (สูงสุด 6 ตัว):
          </label>
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50/50 dark:bg-slate-800/30">
            {availableStocks.map((stock) => {
              const isSelected = selectedSymbols.includes(stock.Symbol);
              return (
                <button
                  key={stock.Symbol}
                  onClick={() => toggleStockSymbol(stock.Symbol)}
                  className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-500'
                  }`}
                >
                  {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{stock.Symbol}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Multi-Stock Comparison Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          เปรียบเทียบกำไรสุทธิ ({selectedSymbols.join(', ')})
        </h3>

        <div className="h-96 w-full pt-2 min-h-[350px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={250}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toLocaleString()}`} unit=" MB" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded shadow-xl text-xs border border-slate-700 space-y-1">
                        <p className="font-bold text-blue-400 border-b border-slate-700 pb-1">{label}</p>
                        {payload.map((p: any, idx: number) => (
                          <div key={idx} className="flex justify-between gap-4">
                            <span style={{ color: p.color }} className="font-bold">{p.name}:</span>
                            <span className="font-semibold">{formatProfitNumber(p.value)} MB</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} />
              {selectedSymbols.map((sym, i) => (
                <Line
                  key={sym}
                  type="monotone"
                  dataKey={sym}
                  name={sym}
                  stroke={STOCK_COLORS[i % STOCK_COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
