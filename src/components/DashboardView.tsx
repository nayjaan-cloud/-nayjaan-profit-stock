import React, { useState, useMemo } from 'react';
import { ProfitRecord, StockMasterItem } from '../types';
import {
  Building2,
  Database,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  BarChart2,
  Award,
  ArrowUpRight,
  PlusCircle,
  ClipboardPaste,
  Search,
  Filter,
  Layers,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { formatProfitNumber } from '../utils/formatters';

interface DashboardViewProps {
  records: ProfitRecord[];
  stockMasters: StockMasterItem[];
  onNavigate: (tab: any) => void;
}

const YEAR_COLORS = ['#94a3b8', '#38bdf8', '#8b5cf6', '#2563eb', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

export const DashboardView: React.FC<DashboardViewProps> = ({ records, stockMasters, onNavigate }) => {
  // Calculate Dashboard KPI Stats
  const activeStockCount = useMemo(() => stockMasters.filter(s => s.Active).length, [stockMasters]);
  const totalRecordCount = records.length;

  // Latest fiscal year & quarter
  const { latestYear, latestQuarter, recordsInLatestYear, totalProfitInLatestYear, lastModifiedTime, topStockSymbol, topStockCount } = useMemo(() => {
    if (records.length === 0) {
      return {
        latestYear: '-',
        latestQuarter: '-',
        recordsInLatestYear: 0,
        totalProfitInLatestYear: 0,
        lastModifiedTime: '-',
        topStockSymbol: '-',
        topStockCount: 0
      };
    }

    let maxYear = '0';
    let maxQ = 'Q1';
    let lastMod = '';

    const symbolCounts: Record<string, number> = {};

    records.forEach(r => {
      if (r.FiscalYear && r.FiscalYear > maxYear) {
        maxYear = r.FiscalYear;
      }
      if (r.ModifiedTime && (!lastMod || r.ModifiedTime > lastMod)) {
        lastMod = r.ModifiedTime;
      }
      const sym = (r.Symbol || '').trim().toUpperCase();
      if (sym) {
        symbolCounts[sym] = (symbolCounts[sym] || 0) + 1;
      }
    });

    const latestYearRecords = records.filter(r => r.FiscalYear === maxYear);
    latestYearRecords.forEach(r => {
      if (r.FiscalQuarter > maxQ) maxQ = r.FiscalQuarter;
    });

    const totalProfitLatest = latestYearRecords.reduce((sum, r) => sum + (r.NetProfit || 0), 0);

    let topSymbol = '-';
    let topCount = 0;
    Object.entries(symbolCounts).forEach(([sym, cnt]) => {
      if (cnt > topCount) {
        topCount = cnt;
        topSymbol = sym;
      }
    });

    return {
      latestYear: maxYear,
      latestQuarter: maxQ,
      recordsInLatestYear: latestYearRecords.length,
      totalProfitInLatestYear: totalProfitLatest,
      lastModifiedTime: lastMod || new Date().toLocaleString('th-TH'),
      topStockSymbol: topSymbol,
      topStockCount: topCount
    };
  }, [records]);

  // Selected Stock for Interactive Historical Profit Chart
  const [selectedStock, setSelectedStock] = useState<string>('ADVANC');

  // Chart Mode: 'timeline' | 'yoy_grouped' | 'yoy_single_quarter'
  const [chartMode, setChartMode] = useState<'timeline' | 'yoy_grouped' | 'yoy_single_quarter'>('timeline');
  const [selectedYoYQuarter, setSelectedYoYQuarter] = useState<string>('Q1');

  // Combine stocks from StockMaster and Records for chart dropdown
  const availableStockOptions = useMemo(() => {
    const stockMap = new Map<string, StockMasterItem>();
    
    // Add active stock masters
    stockMasters.filter(s => s.Active).forEach(s => {
      if (s.Symbol) stockMap.set(s.Symbol.trim().toUpperCase(), s);
    });

    // Add symbols present in records
    records.forEach(r => {
      if (r.Symbol) {
        const sym = r.Symbol.trim().toUpperCase();
        if (!stockMap.has(sym)) {
          stockMap.set(sym, {
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

    return Array.from(stockMap.values()).sort((a, b) => a.Symbol.localeCompare(b.Symbol));
  }, [stockMasters, records]);

  // Auto fallback if selectedStock is not in stockOptions or records
  React.useEffect(() => {
    if (availableStockOptions.length > 0) {
      const match = availableStockOptions.some(s => s.Symbol.toUpperCase() === selectedStock.toUpperCase());
      if (!match) {
        setSelectedStock(availableStockOptions[0].Symbol);
      }
    }
  }, [availableStockOptions, selectedStock]);

  // Records filtered for current selected stock (case-insensitive, IsLatest, and deduplicated per Year/Quarter)
  const selectedStockRecords = useMemo(() => {
    const targetSym = selectedStock.trim().toUpperCase();
    const matched = records.filter(
      r => (r.Symbol || '').trim().toUpperCase() === targetSym && (r.IsLatest ?? true)
    );

    // Deduplicate per (FiscalYear + FiscalQuarter) so each period appears exactly ONCE
    const periodMap = new Map<string, ProfitRecord>();
    matched.forEach(r => {
      const key = `${r.FiscalYear}_${r.FiscalQuarter}`;
      const existing = periodMap.get(key);
      if (!existing) {
        periodMap.set(key, r);
      } else {
        // Prefer record with non-zero profit if existing is zero
        if (existing.NetProfit === 0 && r.NetProfit !== 0) {
          periodMap.set(key, r);
        } else if ((r.Version || 1) > (existing.Version || 1)) {
          periodMap.set(key, r);
        }
      }
    });

    return Array.from(periodMap.values());
  }, [records, selectedStock]);

  // 1. Timeline Chart Data (Chronological)
  const timelineData = useMemo(() => {
    return [...selectedStockRecords]
      .sort((a, b) => {
        if (a.FiscalYear !== b.FiscalYear) return a.FiscalYear.localeCompare(b.FiscalYear);
        return a.FiscalQuarter.localeCompare(b.FiscalQuarter);
      })
      .map(r => ({
        period: `${r.FiscalYear} ${r.FiscalQuarter}`,
        profit: typeof r.NetProfit === 'number' ? r.NetProfit : (parseFloat(String(r.NetProfit)) || 0),
        formattedProfit: formatProfitNumber(r.NetProfit),
        source: r.Source
      }));
  }, [selectedStockRecords]);

  // Extract all unique FiscalYears present for selected stock (sorted)
  const availableYears = useMemo(() => {
    const yrs = Array.from(new Set(selectedStockRecords.map(r => r.FiscalYear).filter(Boolean))).sort();
    return yrs.length > 0 ? yrs : ['2021', '2022', '2023', '2024', '2025'];
  }, [selectedStockRecords]);

  // 2. YoY Grouped Chart Data (Grouped by Quarter: Q1, Q2, Q3, Q4, Q1-Q4)
  const yoyGroupedData = useMemo(() => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4', 'Q1-Q4'];
    return quarters.map(q => {
      const row: Record<string, any> = { quarter: q };
      availableYears.forEach(yr => {
        const rec = selectedStockRecords.find(r => r.FiscalYear === yr && r.FiscalQuarter === q);
        row[yr] = rec ? (typeof rec.NetProfit === 'number' ? rec.NetProfit : parseFloat(String(rec.NetProfit)) || 0) : null;
      });
      return row;
    });
  }, [selectedStockRecords, availableYears]);

  // 3. YoY Single Quarter Chart Data (Compare same quarter across all years)
  const yoySingleQuarterData = useMemo(() => {
    const filtered = selectedStockRecords
      .filter(r => r.FiscalQuarter === selectedYoYQuarter)
      .sort((a, b) => a.FiscalYear.localeCompare(b.FiscalYear));

    return filtered.map((r, idx, arr) => {
      const currentProfit = typeof r.NetProfit === 'number' ? r.NetProfit : (parseFloat(String(r.NetProfit)) || 0);
      let yoyGrowth: number | null = null;
      let yoyDiff: number | null = null;

      if (idx > 0) {
        const prevProfit = typeof arr[idx - 1].NetProfit === 'number' ? arr[idx - 1].NetProfit : (parseFloat(String(arr[idx - 1].NetProfit)) || 0);
        yoyDiff = currentProfit - prevProfit;
        if (prevProfit !== 0) {
          yoyGrowth = (yoyDiff / Math.abs(prevProfit)) * 100;
        }
      }

      return {
        year: `ปี ${r.FiscalYear}`,
        rawYear: r.FiscalYear,
        profit: currentProfit,
        formattedProfit: formatProfitNumber(currentProfit),
        yoyGrowth: yoyGrowth !== null ? yoyGrowth.toFixed(1) : '-',
        yoyDiff: yoyDiff !== null ? formatProfitNumber(yoyDiff) : '-',
        source: r.Source
      };
    });
  }, [selectedStockRecords, selectedYoYQuarter]);

  return (
    <div className="space-y-6">
      
      {/* Banner / Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-wide text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Dashboard Overview
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ระบบบริหารฐานข้อมูลกำไรสุทธิรายไตรมาสของหุ้น เชื่อมต่อ Google Sheets Backend
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => onNavigate('addRecord')}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 uppercase tracking-wider"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            + เพิ่มข้อมูล
          </button>
          <button
            onClick={() => onNavigate('bulkPaste')}
            className="px-4 py-2 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs transition flex items-center gap-1.5 uppercase tracking-wider"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-amber-500" />
            Bulk Paste
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Geometric Balance Stat Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        
        {/* Card 1: Total Active Stocks */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">หุ้นทั้งหมด</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {activeStockCount} <span className="text-xs font-normal text-slate-400">ตัว</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">StockMaster</p>
          </div>
        </div>

        {/* Card 2: Total Records */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">จำนวนข้อมูล</span>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded">
              <Database className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {totalRecordCount.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Data Sheet</p>
          </div>
        </div>

        {/* Card 3: Latest Year */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ปีล่าสุด</span>
            <div className="p-1.5 bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 rounded">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {latestYear}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Q ล่าสุด: {latestQuarter}</p>
          </div>
        </div>

        {/* Card 4: Records in Latest Year */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ข้อมูลปี {latestYear}</span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded">
              <BarChart2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {recordsInLatestYear}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">ปีล่าสุด</p>
          </div>
        </div>

        {/* Card 5: Total Profit in Latest Year */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">กำไรรวมปี {latestYear}</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 truncate" title={`${formatProfitNumber(totalProfitInLatestYear)} MB`}>
              {formatProfitNumber(totalProfitInLatestYear)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">ล้านบาท (THB)</p>
          </div>
        </div>

        {/* Card 6: Top Stock */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ข้อมูลเยอะสุด</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {topStockSymbol}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">{topStockCount} รายการ</p>
          </div>
        </div>

        {/* Card 7: Last Updated */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">แก้ไขล่าสุด</span>
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={lastModifiedTime}>
              {lastModifiedTime}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Timestamp</p>
          </div>
        </div>

      </div>

      {/* Main Stock Historical Profit & YoY Comparison Interactive Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Quarterly Profit & Year-over-Year (YoY) Comparison
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              วิเคราะห์กำไรสุทธิย้อนหลังและเปรียบเทียบไตรมาสเดียวกันรายปี (Year to Year)
            </p>
          </div>

          {/* Stock Symbol Dropdown Selector */}
          <div className="flex items-center space-x-2 shrink-0">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">เลือกหุ้น:</label>
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded p-2 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {availableStockOptions.map((stock) => (
                <option key={stock.Symbol} value={stock.Symbol}>
                  {stock.Symbol} - {stock.CompanyName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chart View Mode Switcher Sub-Header */}
        <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 p-1 rounded border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setChartMode('timeline')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold transition uppercase tracking-wider flex items-center gap-1.5 ${
                chartMode === 'timeline'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              ลำดับเวลาต่อเนื่อง (Timeline)
            </button>
            <button
              onClick={() => setChartMode('yoy_grouped')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold transition uppercase tracking-wider flex items-center gap-1.5 ${
                chartMode === 'yoy_grouped'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              เทียบทุก Q รายปี (YoY Grouped)
            </button>
            <button
              onClick={() => setChartMode('yoy_single_quarter')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold transition uppercase tracking-wider flex items-center gap-1.5 ${
                chartMode === 'yoy_single_quarter'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              เจาะจง Q รายปี (YoY Single Q)
            </button>
          </div>

          {/* Sub-selector when Single Quarter YoY is active */}
          {chartMode === 'yoy_single_quarter' && (
            <div className="flex items-center space-x-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">เลือกไตรมาส:</span>
              {['Q1', 'Q2', 'Q3', 'Q4', 'Q1-Q4'].map(q => (
                <button
                  key={q}
                  onClick={() => setSelectedYoYQuarter(q)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                    selectedYoYQuarter === q
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recharts Visualization Area */}
        <div className="p-6">
          {selectedStockRecords.length > 0 ? (
            <div className="h-80 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={250}>
                {chartMode === 'timeline' ? (
                  <BarChart data={timelineData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 11 }}
                      interval={Math.ceil(timelineData.length / 15)}
                      angle={-30}
                      textAnchor="end"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${v.toLocaleString()}`}
                      unit=" MB"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const isLoss = data.profit < 0;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded shadow-xl text-xs border border-slate-700">
                              <p className="font-bold text-blue-400 mb-1">{selectedStock} ({data.period})</p>
                              <p className="flex justify-between gap-4">
                                <span>กำไรสุทธิ:</span>
                                <strong className={isLoss ? 'text-red-400 font-bold' : 'text-emerald-300 font-bold'}>
                                  {data.formattedProfit} MB
                                </strong>
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">ที่มา: {data.source}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="profit" name="Net Profit (MB)" radius={[2, 2, 0, 0]}>
                      {timelineData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.profit >= 0 ? '#2563eb' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : chartMode === 'yoy_grouped' ? (
                  <BarChart data={yoyGroupedData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="quarter" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toLocaleString()}`} unit=" MB" />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded shadow-xl text-xs border border-slate-700 space-y-1">
                              <p className="font-bold text-blue-400 border-b border-slate-700 pb-1">
                                {selectedStock} - เปรียบเทียบ {label} (YoY)
                              </p>
                              {payload.map((p: any, idx: number) => {
                                if (p.value === null || p.value === undefined) return null;
                                return (
                                  <div key={idx} className="flex justify-between gap-4">
                                    <span style={{ color: p.color }} className="font-bold">ปี {p.dataKey}:</span>
                                    <span className="font-semibold">{formatProfitNumber(p.value)} MB</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    {availableYears.map((yr, idx) => (
                      <Bar
                        key={yr}
                        dataKey={yr}
                        name={`ปี ${yr}`}
                        fill={YEAR_COLORS[idx % YEAR_COLORS.length]}
                        radius={[2, 2, 0, 0]}
                      />
                    ))}
                  </BarChart>
                ) : (
                  <BarChart data={yoySingleQuarterData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toLocaleString()}`} unit=" MB" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const isLoss = data.profit < 0;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded shadow-xl text-xs border border-slate-700 space-y-1.5">
                              <p className="font-bold text-emerald-400 border-b border-slate-700 pb-1">
                                {selectedStock} ({selectedYoYQuarter} - {data.year})
                              </p>
                              <p className="flex justify-between gap-4">
                                <span>กำไรสุทธิ:</span>
                                <strong className={isLoss ? 'text-red-400' : 'text-emerald-300'}>
                                  {data.formattedProfit} MB
                                </strong>
                              </p>
                              <p className="flex justify-between gap-4 text-slate-300">
                                <span>YoY Difference:</span>
                                <span className={data.yoyDiff.startsWith('-') ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                                  {data.yoyDiff} MB
                                </span>
                              </p>
                              <p className="flex justify-between gap-4 text-slate-300">
                                <span>YoY Growth:</span>
                                <span className={String(data.yoyGrowth).startsWith('-') ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                                  {data.yoyGrowth !== '-' ? `${data.yoyGrowth}%` : '-'}
                                </span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="profit" name={`กำไรสุทธิ ${selectedYoYQuarter} (MB)`} radius={[2, 2, 0, 0]}>
                      {yoySingleQuarterData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.profit >= 0 ? '#10b981' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              ไม่พบข้อมูลไตรมาสสำหรับหุ้น {selectedStock}
            </div>
          )}
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div
          onClick={() => onNavigate('search')}
          className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-sm transition cursor-pointer flex items-center space-x-4"
        >
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-md text-blue-600 dark:text-blue-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1">
              ค้นหาข้อมูลขั้นสูง <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ค้นหาตามปี ไตรมาส หุ้น ช่วงกำไร และ Pagination 100 รายการ/หน้า
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('analytics')}
          className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 hover:shadow-sm transition cursor-pointer flex items-center space-x-4"
        >
          <div className="p-3 bg-purple-50 dark:bg-purple-950/60 rounded-md text-purple-600 dark:text-purple-400">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1">
              เปรียบเทียบหลายหุ้น <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เปรียบเทียบกำไรสุทธิหลายหุ้นบนกราฟเดียวกัน พร้อม Sector Filter
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('gasCode')}
          className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:shadow-sm transition cursor-pointer flex items-center space-x-4"
        >
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-md text-amber-600 dark:text-amber-400">
            <ClipboardPaste className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1">
              Google Apps Script <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              รับโค้ด Code.gs สำหรับสร้าง Web App & Google Sheet
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
