import React, { useState, useMemo } from 'react';
import { ProfitRecord, StockMasterItem, SettingData } from '../types';
import { PlusCircle, Save, CheckCircle2, Building, Calendar, DollarSign, FileText } from 'lucide-react';
import { DuplicateModal } from './DuplicateModal';
import { formatProfitNumber, parseFormattedNumber } from '../utils/formatters';

interface AddRecordViewProps {
  records: ProfitRecord[];
  stockMasters: StockMasterItem[];
  settings: SettingData;
  onSaveRecord: (record: ProfitRecord, isOverwrite?: boolean, isNewVersion?: boolean) => void;
  onAddSettingYear: (newYear: string) => void;
}

export const AddRecordView: React.FC<AddRecordViewProps> = ({
  records,
  stockMasters,
  settings,
  onSaveRecord,
  onAddSettingYear
}) => {
  // Form State
  const [fiscalYearInput, setFiscalYearInput] = useState<string>(settings.FiscalYears[0] || '2568');
  const [fiscalQuarter, setFiscalQuarter] = useState<string>(settings.FiscalQuarters[0] || 'Q1');
  const [symbolSearch, setSymbolSearch] = useState<string>('');
  const [selectedStock, setSelectedStock] = useState<StockMasterItem | null>(null);
  const [netProfitInput, setNetProfitInput] = useState<string>('');
  const [adjustmentNote, setAdjustmentNote] = useState<string>('');
  const [source, setSource] = useState<string>(settings.Sources[0] || 'Manual');
  const [currency, setCurrency] = useState<string>(settings.Currencies[0] || 'THB');

  // AutoComplete dropdown toggle state
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState<boolean>(false);

  // Validation Error state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState<string | null>(null);

  // Duplicate Check Modal state
  const [duplicateConflict, setDuplicateConflict] = useState<{
    existing: ProfitRecord;
    pendingRecord: ProfitRecord;
  } | null>(null);

  // Auto Complete suggestions filtered by Symbol or CompanyName
  const stockSuggestions = useMemo(() => {
    const query = symbolSearch.trim().toLowerCase();
    const activeMasters = stockMasters.filter(s => s.Active);
    if (!query) return activeMasters.slice(0, 20);
    return activeMasters.filter(
      s => s.Symbol.toLowerCase().includes(query) || s.CompanyName.toLowerCase().includes(query)
    );
  }, [stockMasters, symbolSearch]);

  const handleSelectSymbol = (stock: StockMasterItem) => {
    setSelectedStock(stock);
    setSymbolSearch(`${stock.Symbol} - ${stock.CompanyName}`);
    setIsSymbolDropdownOpen(false);
    if (errors.symbol) {
      setErrors(prev => ({ ...prev, symbol: '' }));
    }
  };

  // Form Validation
  const validate = (): { isValid: boolean; targetStock: StockMasterItem | null } => {
    const newErrors: Record<string, string> = {};

    if (!fiscalYearInput || !fiscalYearInput.trim()) {
      newErrors.fiscalYear = 'กรุณาระบุปีบัญชี (Fiscal Year)';
    }

    if (!fiscalQuarter) {
      newErrors.fiscalQuarter = 'กรุณาเลือกไตรมาส (Fiscal Quarter)';
    }

    let targetStock = selectedStock;
    if (!targetStock && symbolSearch.trim()) {
      const cleanInput = symbolSearch.split('-')[0].trim().toUpperCase();
      const match = stockMasters.find(s => s.Symbol.toUpperCase() === cleanInput);
      if (match) {
        targetStock = match;
      } else if (cleanInput) {
        targetStock = {
          Symbol: cleanInput,
          CompanyName: cleanInput,
          Sector: 'General',
          Industry: '',
          Market: 'SET',
          Currency: 'THB',
          Active: true
        };
      }
    }

    if (!targetStock) {
      newErrors.symbol = 'กรุณาระบุชื่อหุ้นหรือเลือกจาก StockMaster';
    }

    if (netProfitInput === '' || isNaN(parseFormattedNumber(netProfitInput))) {
      newErrors.netProfit = 'กรุณากรอกกำไรสุทธิเป็นตัวเลข';
    }

    if (!source) {
      newErrors.source = 'กรุณาเลือกที่มาของข้อมูล (Source)';
    }

    if (!currency) {
      newErrors.currency = 'กรุณาเลือกสกุลเงิน (Currency)';
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, targetStock };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { isValid, targetStock } = validate();
    if (!isValid || !targetStock) return;

    const trimmedYear = fiscalYearInput.trim();
    const numericProfit = parseFormattedNumber(netProfitInput);

    // Auto add new year to Setting master data if not exists
    if (!settings.FiscalYears.includes(trimmedYear)) {
      onAddSettingYear(trimmedYear);
    }

    const nowStr = new Date().toLocaleString('th-TH');

    const pendingRecord: ProfitRecord = {
      RecordID: '',
      Timestamp: nowStr,
      ModifiedTime: nowStr,
      FiscalYear: trimmedYear,
      FiscalQuarter: fiscalQuarter,
      Symbol: targetStock.Symbol,
      NetProfit: numericProfit,
      AdjustmentNote: adjustmentNote,
      Source: source,
      Currency: currency,
      Version: 1,
      IsLatest: true
    };

    // Duplicate Check against FiscalYear, FiscalQuarter, Symbol
    const existing = records.find(
      r =>
        r.FiscalYear === pendingRecord.FiscalYear &&
        r.FiscalQuarter === pendingRecord.FiscalQuarter &&
        r.Symbol === pendingRecord.Symbol &&
        (r.IsLatest ?? true)
    );

    if (existing) {
      // Conflict found! Trigger duplicate modal
      setDuplicateConflict({
        existing,
        pendingRecord
      });
      return;
    }

    // Normal Save
    pendingRecord.RecordID = 'REC-' + Date.now();
    onSaveRecord(pendingRecord);
    triggerSuccessSnackbar('บันทึกข้อมูลสำเร็จ (Record Created Successfully)');
    resetForm();
  };

  const handleModalOverwrite = () => {
    if (!duplicateConflict) return;
    const recordToUpdate: ProfitRecord = {
      ...duplicateConflict.existing,
      ModifiedTime: new Date().toLocaleString('th-TH'),
      NetProfit: duplicateConflict.pendingRecord.NetProfit,
      AdjustmentNote: duplicateConflict.pendingRecord.AdjustmentNote,
      Source: duplicateConflict.pendingRecord.Source,
      Currency: duplicateConflict.pendingRecord.Currency
    };
    onSaveRecord(recordToUpdate, true, false);
    setDuplicateConflict(null);
    triggerSuccessSnackbar('อัปเดตทับข้อมูลเดิมเรียบร้อยแล้ว');
    resetForm();
  };

  const handleModalNewVersion = () => {
    if (!duplicateConflict) return;
    const currentVersion = duplicateConflict.existing.Version || 1;
    const newVersionRecord: ProfitRecord = {
      ...duplicateConflict.pendingRecord,
      RecordID: 'REC-' + Date.now(),
      Timestamp: new Date().toLocaleString('th-TH'),
      ModifiedTime: new Date().toLocaleString('th-TH'),
      Version: currentVersion + 1,
      IsLatest: true
    };
    onSaveRecord(newVersionRecord, false, true);
    setDuplicateConflict(null);
    triggerSuccessSnackbar(`บันทึกเป็น Version ${currentVersion + 1} เรียบร้อยแล้ว`);
    resetForm();
  };

  const resetForm = () => {
    setNetProfitInput('');
    setAdjustmentNote('');
    setSymbolSearch('');
    setSelectedStock(null);
    setErrors({});
  };

  const triggerSuccessSnackbar = (msg: string) => {
    setSnackbar(msg);
    setTimeout(() => setSnackbar(null), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Toast Snackbar Notification */}
      {snackbar && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded shadow-lg flex items-center space-x-3 text-xs font-bold uppercase tracking-wider animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-4 h-4 text-blue-200" />
          <span>{snackbar}</span>
        </div>
      )}

      {/* Title Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            เพิ่มข้อมูลกำไรสุทธิรายไตรมาส (Add Record)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            กรอกข้อมูลกำไรสุทธิรายไตรมาสของหุ้น ระบบจะทำการตรวจสอบข้อมูลซ้ำให้อัตโนมัติ
          </p>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Fiscal Year (Editable Dropdown) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Fiscal Year (ปีบัญชี) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                list="fiscal-years-list"
                value={fiscalYearInput}
                onChange={(e) => {
                  setFiscalYearInput(e.target.value);
                  if (errors.fiscalYear) setErrors(prev => ({ ...prev, fiscalYear: '' }));
                }}
                placeholder="เลือกหรือพิมพ์ปีใหม่ เช่น 2568"
                className={`w-full bg-slate-50 dark:bg-slate-800 border ${
                  errors.fiscalYear ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                } text-slate-800 dark:text-slate-100 text-xs rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold`}
              />
              <datalist id="fiscal-years-list">
                {settings.FiscalYears.map((yr) => (
                  <option key={yr} value={yr} />
                ))}
              </datalist>
            </div>
            {errors.fiscalYear && <p className="text-[11px] text-red-500 mt-1">{errors.fiscalYear}</p>}
            <p className="text-[10px] text-slate-400 mt-1">สามารถพิมพ์ปีใหม่ได้ ระบบจะเพิ่มเข้า Setting อัตโนมัติ</p>
          </div>

          {/* Fiscal Quarter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Fiscal Quarter (ไตรมาส) <span className="text-red-500">*</span>
            </label>
            <select
              value={fiscalQuarter}
              onChange={(e) => setFiscalQuarter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              {settings.FiscalQuarters.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
            {errors.fiscalQuarter && <p className="text-[11px] text-red-500 mt-1">{errors.fiscalQuarter}</p>}
          </div>

          {/* Symbol AutoComplete (Reads strictly from StockMaster) */}
          <div className="md:col-span-2 relative">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              Symbol / Stock Name (ค้นหาจาก StockMaster) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={symbolSearch}
              onFocus={() => setIsSymbolDropdownOpen(true)}
              onChange={(e) => {
                setSymbolSearch(e.target.value);
                setSelectedStock(null);
                setIsSymbolDropdownOpen(true);
              }}
              placeholder="พิมพ์ชื่อหุ้น หรือ ชื่อบริษัท เช่น ADVANC, CPALL, PCL..."
              className={`w-full bg-slate-50 dark:bg-slate-800 border ${
                errors.symbol ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              } text-slate-800 dark:text-slate-100 text-xs rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold`}
            />

            {/* Auto Complete Dropdown List */}
            {isSymbolDropdownOpen && stockSuggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                {stockSuggestions.map((stock) => (
                  <div
                    key={stock.Symbol}
                    onClick={() => handleSelectSymbol(stock)}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">{stock.Symbol}</span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{stock.CompanyName}</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-bold">
                      {stock.Market} | {stock.Sector}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {errors.symbol && <p className="text-[11px] text-red-500 mt-1">{errors.symbol}</p>}
            {selectedStock && (
              <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded border border-blue-200 dark:border-blue-800 flex items-center justify-between font-semibold">
                <span>เลือก: <strong>{selectedStock.Symbol}</strong> - {selectedStock.CompanyName}</span>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded font-bold">
                  {selectedStock.Market} ({selectedStock.Sector})
                </span>
              </div>
            )}
          </div>

          {/* Net Profit (Numeric with decimal & formatted comma preview) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-blue-600" />
              Net Profit (กำไรสุทธิ - ล้านบาท) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={netProfitInput}
              onChange={(e) => {
                setNetProfitInput(e.target.value);
                if (errors.netProfit) setErrors(prev => ({ ...prev, netProfit: '' }));
              }}
              placeholder="เช่น 10583.50 หรือ -45.20"
              className={`w-full bg-slate-50 dark:bg-slate-800 border ${
                errors.netProfit ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              } text-slate-800 dark:text-slate-100 text-xs rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold`}
            />
            {netProfitInput && !isNaN(parseFormattedNumber(netProfitInput)) && (
              <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-bold">
                พรีวิวรูปแบบ: {formatProfitNumber(parseFormattedNumber(netProfitInput))} {currency}
              </p>
            )}
            {errors.netProfit && <p className="text-[11px] text-red-500 mt-1">{errors.netProfit}</p>}
          </div>

          {/* Source Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              Source (ที่มาของข้อมูล) <span className="text-red-500">*</span>
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              {settings.Sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Currency Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              Currency (สกุลเงิน) <span className="text-red-500">*</span>
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              {settings.Currencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Adjustment Note */}
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Adjustment Note (หมายเหตุการปรับปรุงรายการ)
            </label>
            <textarea
              rows={2}
              value={adjustmentNote}
              onChange={(e) => setAdjustmentNote(e.target.value)}
              placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs transition flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <Save className="w-4 h-4" />
            บันทึกข้อมูล (Save Record)
          </button>
        </div>

      </form>

      {/* Duplicate Conflict Popup Dialog */}
      {duplicateConflict && (
        <DuplicateModal
          isOpen={true}
          existingRecord={duplicateConflict.existing}
          newRecord={duplicateConflict.pendingRecord}
          onOverwrite={handleModalOverwrite}
          onSaveNewVersion={handleModalNewVersion}
          onCancel={() => setDuplicateConflict(null)}
        />
      )}

    </div>
  );
};
