import React, { useState, useMemo } from 'react';
import { ProfitRecord, StockMasterItem, SettingData } from '../types';
import { Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import Papa from 'papaparse';
import { formatProfitNumber } from '../utils/formatters';

interface ExportViewProps {
  records: ProfitRecord[];
  stockMasters: StockMasterItem[];
  settings: SettingData;
}

export const ExportView: React.FC<ExportViewProps> = ({
  records,
  stockMasters,
  settings
}) => {
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterQuarter, setFilterQuarter] = useState<string>('');
  const [filterSymbol, setFilterSymbol] = useState<string>('');
  const [filterSector, setFilterSector] = useState<string>('');

  const [snackbar, setSnackbar] = useState<string | null>(null);

  const uniqueSectors = useMemo(() => {
    return Array.from(new Set(stockMasters.map(s => s.Sector).filter(Boolean))).sort();
  }, [stockMasters]);

  const stockMap = useMemo(() => {
    const map = new Map<string, StockMasterItem>();
    stockMasters.forEach(s => map.set(s.Symbol, s));
    return map;
  }, [stockMasters]);

  const exportableRecords = useMemo(() => {
    return records.filter(r => {
      if (filterYear && r.FiscalYear !== filterYear) return false;
      if (filterQuarter && r.FiscalQuarter !== filterQuarter) return false;
      if (filterSymbol && !r.Symbol.toLowerCase().includes(filterSymbol.toLowerCase())) return false;
      
      const master = stockMap.get(r.Symbol);
      if (filterSector && master && master.Sector !== filterSector) return false;

      return (r.IsLatest ?? true);
    });
  }, [records, filterYear, filterQuarter, filterSymbol, filterSector, stockMap]);

  const handleExportCSV = () => {
    const dataToExport = exportableRecords.map(r => ({
      RecordID: r.RecordID,
      Timestamp: r.Timestamp,
      ModifiedTime: r.ModifiedTime,
      FiscalYear: r.FiscalYear,
      FiscalQuarter: r.FiscalQuarter,
      Symbol: r.Symbol,
      NetProfit: r.NetProfit,
      FormattedNetProfit: formatProfitNumber(r.NetProfit),
      Source: r.Source,
      Currency: r.Currency,
      AdjustmentNote: r.AdjustmentNote || ''
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `StockProfitData_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerSnackbar(`ส่งออกข้อมูล ${exportableRecords.length} รายการเป็นไฟล์ CSV เรียบร้อยแล้ว`);
  };

  const triggerSnackbar = (msg: string) => {
    setSnackbar(msg);
    setTimeout(() => setSnackbar(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {snackbar && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded shadow-lg flex items-center space-x-3 text-xs font-bold uppercase tracking-wider animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-4 h-4 text-blue-200" />
          <span>{snackbar}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ส่งออกข้อมูล (Export Data)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          เลือกเงื่อนไขข้อมูลที่ต้องการกรอง แล้วดาวน์โหลดเป็นไฟล์ CSV / Excel
        </p>
      </div>

      {/* Filter Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          ตัวกรองข้อมูลก่อน Export
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fiscal Year</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2 outline-none font-semibold"
            >
              <option value="">ทุกปีบัญชี</option>
              {settings.FiscalYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Quarter</label>
            <select
              value={filterQuarter}
              onChange={(e) => setFilterQuarter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2 outline-none font-semibold"
            >
              <option value="">ทุกไตรมาส</option>
              {settings.FiscalQuarters.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Symbol</label>
            <input
              type="text"
              placeholder="พิมพ์ชื่อหุ้น..."
              value={filterSymbol}
              onChange={(e) => setFilterSymbol(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2 outline-none font-semibold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sector</label>
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded p-2 outline-none font-semibold"
            >
              <option value="">ทุก Sector</option>
              {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
            ข้อมูลพร้อมส่งออก: {exportableRecords.length.toLocaleString()} รายการ
          </span>

          <button
            onClick={handleExportCSV}
            disabled={exportableRecords.length === 0}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs transition flex items-center gap-2 uppercase tracking-wider disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            ดาวน์โหลดไฟล์ CSV / Excel
          </button>
        </div>
      </div>

    </div>
  );
};
