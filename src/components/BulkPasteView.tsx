import React, { useState, useMemo } from 'react';
import { ProfitRecord, StockMasterItem, SettingData } from '../types';
import { ClipboardPaste, CheckCircle2, FileSpreadsheet, ArrowRight } from 'lucide-react';
import Papa from 'papaparse';
import { formatProfitNumber, parseFormattedNumber } from '../utils/formatters';

interface BulkPasteViewProps {
  records: ProfitRecord[];
  stockMasters: StockMasterItem[];
  settings: SettingData;
  onBulkImport: (importedRecords: ProfitRecord[]) => void;
}

interface ParsedRowResult {
  rowIndex: number;
  rawYear: string;
  rawQuarter: string;
  rawSymbol: string;
  rawProfit: string;
  rawSource?: string;
  isValid: boolean;
  isDuplicate: boolean;
  errorReason?: string;
  parsedRecord?: ProfitRecord;
}

export const BulkPasteView: React.FC<BulkPasteViewProps> = ({
  records,
  stockMasters,
  onBulkImport
}) => {
  const [pasteText, setPasteText] = useState<string>(
    `FiscalYear,FiscalQuarter,Symbol,NetProfit,Source
2568,Q1,AOT,8450,Import
2568,Q2,AOT,9120,Import
2568,Q1,CPALL,6452,Import
2568,Q1,ADVANC,10583.50,Import`
  );

  const [hasParsed, setHasParsed] = useState<boolean>(false);
  const [parsedRows, setParsedRows] = useState<ParsedRowResult[]>([]);
  const [importSummary, setImportSummary] = useState<{
    success: number;
    duplicates: number;
    errors: number;
  } | null>(null);

  const stockSymbolSet = useMemo(() => {
    return new Set(stockMasters.filter(s => s.Active).map(s => s.Symbol));
  }, [stockMasters]);

  const handleParseData = () => {
    if (!pasteText.trim()) return;

    // Use PapaParse to parse CSV or tab-delimited text
    const parsed = Papa.parse(pasteText.trim(), {
      header: false,
      skipEmptyLines: true
    });

    const rows = parsed.data as string[][];
    if (rows.length === 0) return;

    // Check if first row is header
    let startIndex = 0;
    const firstRowStr = rows[0].join(',').toLowerCase();
    if (firstRowStr.includes('fiscalyear') || firstRowStr.includes('symbol') || firstRowStr.includes('netprofit')) {
      startIndex = 1;
    }

    const nowStr = new Date().toLocaleString('th-TH');
    const results: ParsedRowResult[] = [];

    for (let i = startIndex; i < rows.length; i++) {
      const col = rows[i].map(c => String(c).trim());
      const rawYear = col[0] || '';
      const rawQuarter = col[1] || '';
      const rawSymbol = (col[2] || '').toUpperCase();
      const rawProfit = col[3] || '';
      const rawSource = col[4] || 'Import';

      let isValid = true;
      let errorReason = '';

      if (!rawYear) {
        isValid = false;
        errorReason = 'ปีบัญชีไม่ถูกต้อง';
      } else if (!rawQuarter) {
        isValid = false;
        errorReason = 'ไตรมาสไม่ถูกต้อง';
      } else if (!rawSymbol) {
        isValid = false;
        errorReason = 'กรุณาระบุ Symbol หุ้น';
      } else if (rawProfit === '' || isNaN(parseFormattedNumber(rawProfit))) {
        isValid = false;
        errorReason = 'ตัวเลขกำไรสุทธิไม่ถูกต้อง';
      }

      // Check duplicate in existing database
      const isDuplicate = isValid && records.some(
        r => r.FiscalYear === rawYear && r.FiscalQuarter === rawQuarter && r.Symbol === rawSymbol && (r.IsLatest ?? true)
      );

      let record: ProfitRecord | undefined = undefined;
      if (isValid) {
        record = {
          RecordID: 'REC-BULK-' + Date.now() + '-' + i,
          Timestamp: nowStr,
          ModifiedTime: nowStr,
          FiscalYear: rawYear,
          FiscalQuarter: rawQuarter,
          Symbol: rawSymbol,
          NetProfit: parseFormattedNumber(rawProfit),
          AdjustmentNote: 'Bulk Pasted Import',
          Source: rawSource,
          Currency: 'THB',
          Version: 1,
          IsLatest: true
        };
      }

      results.push({
        rowIndex: i + 1,
        rawYear,
        rawQuarter,
        rawSymbol,
        rawProfit,
        rawSource,
        isValid,
        isDuplicate,
        errorReason,
        parsedRecord: record
      });
    }

    setParsedRows(results);
    setHasParsed(true);
    setImportSummary(null);
  };

  const handleConfirmImport = () => {
    const validNonDuplicates = parsedRows
      .filter(r => r.isValid && !r.isDuplicate && r.parsedRecord)
      .map(r => r.parsedRecord!);

    if (validNonDuplicates.length > 0) {
      onBulkImport(validNonDuplicates);
    }

    const duplicatesCount = parsedRows.filter(r => r.isValid && r.isDuplicate).length;
    const errorsCount = parsedRows.filter(r => !r.isValid).length;

    setImportSummary({
      success: validNonDuplicates.length,
      duplicates: duplicatesCount,
      errors: errorsCount
    });

    setHasParsed(false);
  };

  const stats = useMemo(() => {
    const total = parsedRows.length;
    const valid = parsedRows.filter(r => r.isValid).length;
    const duplicates = parsedRows.filter(r => r.isValid && r.isDuplicate).length;
    const errors = parsedRows.filter(r => !r.isValid).length;
    return { total, valid, duplicates, errors };
  }, [parsedRows]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <ClipboardPaste className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          วางข้อมูลหลายรายการ (Bulk Paste & Import)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          คัดลอกตารางจาก Excel หรือ CSV แล้ววางลงในกล่องด้านล่าง ระบบจะทำการตรวจสอบความถูกต้องก่อนนำเข้า
        </p>
      </div>

      {/* Summary Alert after import */}
      {importSummary && (
        <div className="p-6 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2 animate-in fade-in duration-300">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            สรุปผลการนำเข้าข้อมูล (Import Completed)
          </h3>
          <div className="grid grid-cols-3 gap-4 text-xs font-semibold pt-2">
            <div className="p-3 bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
              นำเข้าสำเร็จ: <strong>{importSummary.success}</strong> รายการ
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
              ข้ามข้อมูลซ้ำ (Duplicate): <strong>{importSummary.duplicates}</strong> รายการ
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
              พบข้อผิดพลาด: <strong>{importSummary.errors}</strong> รายการ
            </div>
          </div>
        </div>
      )}

      {/* Input Box */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          วางข้อมูลที่นี่ (รูปแบบ: FiscalYear, FiscalQuarter, Symbol, NetProfit, Source):
        </label>
        
        <textarea
          rows={7}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={`2568,Q1,AOT,8450\n2568,Q2,AOT,9120`}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-mono rounded p-4 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex justify-end">
          <button
            onClick={handleParseData}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs transition flex items-center gap-2 uppercase tracking-wider"
          >
            <FileSpreadsheet className="w-4 h-4" />
            ตรวจสอบข้อมูล (Validate & Preview)
          </button>
        </div>
      </div>

      {/* Preview Table */}
      {hasParsed && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                ผลการตรวจสอบข้อมูลก่อนนำเข้า (Data Validation Preview)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ทั้งหมด {stats.total} รายการ | สมบูรณ์ {stats.valid} | ข้อมูลซ้ำ {stats.duplicates} | ผิดพลาด {stats.errors}
              </p>
            </div>

            <button
              disabled={stats.valid - stats.duplicates <= 0}
              onClick={handleConfirmImport}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs transition flex items-center gap-2 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยืนยันการนำเข้า ({stats.valid - stats.duplicates} รายการ)
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">แถวที่</th>
                  <th className="p-3">Year</th>
                  <th className="p-3">Quarter</th>
                  <th className="p-3">Symbol</th>
                  <th className="p-3 text-right">Net Profit</th>
                  <th className="p-3">สถานะ (Status)</th>
                  <th className="p-3">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                    <td className="p-3 text-slate-400 font-mono text-[11px]">{row.rowIndex}</td>
                    <td className="p-3 font-bold">{row.rawYear}</td>
                    <td className="p-3">{row.rawQuarter}</td>
                    <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{row.rawSymbol}</td>
                    <td className="p-3 text-right font-bold">{formatProfitNumber(parseFormattedNumber(row.rawProfit))}</td>
                    <td className="p-3">
                      {!row.isValid ? (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">Error</span>
                      ) : row.isDuplicate ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">Duplicate</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">Valid</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {row.errorReason || (row.isDuplicate ? 'พบในฐานข้อมูลแล้ว (จะถูก Skip)' : 'พร้อมนำเข้า')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};
