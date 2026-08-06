import React, { useState, useMemo } from 'react';
import { ProfitRecord, StockMasterItem, SettingData, SearchFilterState } from '../types';
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { formatProfitNumber, getQuarterRank } from '../utils/formatters';

interface SearchViewProps {
  records: ProfitRecord[];
  stockMasters: StockMasterItem[];
  settings: SettingData;
  onEditRecordSelect?: (record: ProfitRecord) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  records,
  stockMasters,
  settings,
  onEditRecordSelect
}) => {
  // Advanced Filter State
  const [filters, setFilters] = useState<SearchFilterState>({
    fiscalYear: '',
    fiscalQuarter: '',
    symbol: '',
    companyName: '',
    source: '',
    currency: '',
    minProfit: '',
    maxProfit: '',
    market: '',
    sector: ''
  });

  // Sort State: default 'yearDesc'
  const [sortBy, setSortBy] = useState<'default' | 'profitAsc' | 'profitDesc' | 'symbolAsc'>('default');

  // Pagination State (100 records per page as specified)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 100;

  // Map stock symbol -> StockMaster metadata
  const stockMap = useMemo(() => {
    const map = new Map<string, StockMasterItem>();
    stockMasters.forEach(s => map.set(s.Symbol, s));
    return map;
  }, [stockMasters]);

  // Unique sectors from StockMaster for filter dropdown
  const uniqueSectors = useMemo(() => {
    return Array.from(new Set(stockMasters.map(s => s.Sector).filter(Boolean))).sort();
  }, [stockMasters]);

  // Filter logic
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (filters.fiscalYear && r.FiscalYear !== filters.fiscalYear) return false;
      if (filters.fiscalQuarter && r.FiscalQuarter !== filters.fiscalQuarter) return false;
      if (filters.symbol && !(r.Symbol || '').toLowerCase().includes(filters.symbol.toLowerCase())) return false;
      if (filters.source && r.Source !== filters.source) return false;
      if (filters.currency && r.Currency !== filters.currency) return false;

      const master = stockMap.get(r.Symbol);
      if (filters.companyName && master && !(master.CompanyName || '').toLowerCase().includes(filters.companyName.toLowerCase())) return false;
      if (filters.market && master && master.Market !== filters.market) return false;
      if (filters.sector && master && master.Sector !== filters.sector) return false;

      if (filters.minProfit !== '' && !isNaN(parseFloat(filters.minProfit))) {
        if (r.NetProfit < parseFloat(filters.minProfit)) return false;
      }

      if (filters.maxProfit !== '' && !isNaN(parseFloat(filters.maxProfit))) {
        if (r.NetProfit > parseFloat(filters.maxProfit)) return false;
      }

      return (r.IsLatest ?? true);
    });
  }, [records, filters, stockMap]);

  // Sorting logic
  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];
    if (sortBy === 'profitAsc') {
      return list.sort((a, b) => a.NetProfit - b.NetProfit);
    }
    if (sortBy === 'profitDesc') {
      return list.sort((a, b) => b.NetProfit - a.NetProfit);
    }
    if (sortBy === 'symbolAsc') {
      return list.sort((a, b) => a.Symbol.localeCompare(b.Symbol));
    }

    // Default required sort: Year DESC, Quarter DESC, Symbol ASC
    return list.sort((a, b) => {
      if (a.FiscalYear !== b.FiscalYear) {
        return b.FiscalYear.localeCompare(a.FiscalYear);
      }
      const qA = getQuarterRank(a.FiscalQuarter);
      const qB = getQuarterRank(b.FiscalQuarter);
      if (qA !== qB) {
        return qB - qA;
      }
      return a.Symbol.localeCompare(b.Symbol);
    });
  }, [filteredRecords, sortBy]);

  // Pagination slicing
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const handleResetFilters = () => {
    setFilters({
      fiscalYear: '',
      fiscalQuarter: '',
      symbol: '',
      companyName: '',
      source: '',
      currency: '',
      minProfit: '',
      maxProfit: '',
      market: '',
      sector: ''
    });
    setSortBy('default');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ค้นหาและตารางข้อมูลกำไรสุทธิ (Advanced Search)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            เรียงตาม Year DESC, Quarter DESC, Symbol ASC • แสดง 100 รายการต่อหน้า
          </p>
        </div>
        <button
          onClick={handleResetFilters}
          className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded transition flex items-center gap-1.5 uppercase tracking-wider self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          ล้างตัวกรอง (Reset)
        </button>
      </div>

      {/* Filter Options Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" /> เงื่อนไขการค้นหาแบบละเอียด (Advanced Filters)
          </span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">
            พบ {filteredRecords.length.toLocaleString()} รายการ
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
          
          {/* Year */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fiscal Year</label>
            <select
              value={filters.fiscalYear}
              onChange={(e) => { setFilters(prev => ({ ...prev, fiscalYear: e.target.value })); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2 outline-none font-semibold"
            >
              <option value="">ทั้งหมดทุกปี</option>
              {settings.FiscalYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Quarter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Quarter</label>
            <select
              value={filters.fiscalQuarter}
              onChange={(e) => { setFilters(prev => ({ ...prev, fiscalQuarter: e.target.value })); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2 outline-none font-semibold"
            >
              <option value="">ทุกไตรมาส</option>
              {settings.FiscalQuarters.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>

          {/* Symbol */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Symbol</label>
            <input
              type="text"
              placeholder="เช่น ADVANC"
              value={filters.symbol}
              onChange={(e) => { setFilters(prev => ({ ...prev, symbol: e.target.value })); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2 outline-none font-semibold"
            />
          </div>

          {/* Market */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Market</label>
            <select
              value={filters.market}
              onChange={(e) => { setFilters(prev => ({ ...prev, market: e.target.value })); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2 outline-none font-semibold"
            >
              <option value="">ทั้งหมด (SET/mai)</option>
              <option value="SET">SET</option>
              <option value="mai">mai</option>
            </select>
          </div>

          {/* Sector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sector</label>
            <select
              value={filters.sector}
              onChange={(e) => { setFilters(prev => ({ ...prev, sector: e.target.value })); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2 outline-none font-semibold"
            >
              <option value="">ทุกกลุ่มอุตสาหกรรม</option>
              {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Min Profit */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">กำไรขั้นต่ำ (MB)</label>
            <input
              type="number"
              placeholder="-1000"
              value={filters.minProfit}
              onChange={(e) => { setFilters(prev => ({ ...prev, minProfit: e.target.value })); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2 outline-none font-semibold"
            />
          </div>

          {/* Max Profit */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">กำไรสูงสุด (MB)</label>
            <input
              type="number"
              placeholder="20000"
              value={filters.maxProfit}
              onChange={(e) => { setFilters(prev => ({ ...prev, maxProfit: e.target.value })); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2 outline-none font-semibold"
            />
          </div>

          {/* Source */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Source</label>
            <select
              value={filters.source}
              onChange={(e) => { setFilters(prev => ({ ...prev, source: e.target.value })); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2 outline-none font-semibold"
            >
              <option value="">ทุกแหล่งข้อมูล</option>
              {settings.Sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Currency</label>
            <select
              value={filters.currency}
              onChange={(e) => { setFilters(prev => ({ ...prev, currency: e.target.value })); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2 outline-none font-semibold"
            >
              <option value="">ทุกสกุลเงิน</option>
              {settings.Currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Sort By Option */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">เรียงลำดับ (Sort)</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2 outline-none font-semibold text-[11px]"
            >
              <option value="default">Year DESC, Q DESC, Symbol ASC</option>
              <option value="profitDesc">กำไรสุทธิ สูง -{'>'} ต่ำ</option>
              <option value="profitAsc">กำไรสุทธิ ต่ำ -{'>'} สูง</option>
              <option value="symbolAsc">ชื่อหุ้น A -{'>'} Z</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="p-3">RecordID</th>
                <th className="p-3">ปี (Year)</th>
                <th className="p-3">ไตรมาส (Quarter)</th>
                <th className="p-3">Symbol</th>
                <th className="p-3">บริษัท / Sector</th>
                <th className="p-3 text-right">กำไรสุทธิ (MB)</th>
                <th className="p-3">Source</th>
                <th className="p-3">Currency</th>
                <th className="p-3">ModifiedTime</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((r, index) => {
                  const master = stockMap.get(r.Symbol);
                  const isLoss = r.NetProfit < 0;
                  return (
                    <tr key={`${r.RecordID}-${r.FiscalYear}-${r.FiscalQuarter}-${r.Symbol}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition border-b border-slate-100 dark:border-slate-800">
                      <td className="p-3 font-mono text-slate-400 text-[11px]">#{r.RecordID}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{r.FiscalYear}</td>
                      <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{r.FiscalQuarter}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {r.Symbol}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="truncate max-w-[180px] font-medium" title={master?.CompanyName}>
                          {master?.CompanyName || '-'}
                        </div>
                        <span className="text-[10px] text-slate-400">{master?.Sector || '-'}</span>
                      </td>
                      <td className={`p-3 text-right font-bold text-xs ${isLoss ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatProfitNumber(r.NetProfit)}
                      </td>
                      <td className="p-3 text-slate-500">{r.Source}</td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{r.Currency}</td>
                      <td className="p-3 text-slate-400 text-[10px]">{r.ModifiedTime}</td>
                      <td className="p-3 text-center">
                        {onEditRecordSelect && (
                          <button
                            onClick={() => onEditRecordSelect(r)}
                            className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition text-[10px] uppercase tracking-wider"
                          >
                            แก้ไข
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400 text-xs">
                    ไม่พบข้อมูลที่ตรงตามเงื่อนไขการค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar (100 per page) */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-slate-600 dark:text-slate-400">
            แสดง {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredRecords.length)} จากทั้งหมด <strong>{filteredRecords.length.toLocaleString()}</strong> รายการ (หน้า {currentPage} / {totalPages})
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs">
              {currentPage}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
