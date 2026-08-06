import React, { useState, useMemo } from 'react';
import { ProfitRecord, StockMasterItem, SettingData } from '../types';
import { Edit3, Search, Save, Lock, Clock, CheckCircle2 } from 'lucide-react';
import { formatProfitNumber, parseFormattedNumber } from '../utils/formatters';

interface EditRecordViewProps {
  records: ProfitRecord[];
  stockMasters: StockMasterItem[];
  settings: SettingData;
  onUpdateRecord: (updatedRecord: ProfitRecord, saveAsNewVersion?: boolean) => void;
}

export const EditRecordView: React.FC<EditRecordViewProps> = ({
  records,
  settings,
  onUpdateRecord
}) => {
  // Search state for finding record
  const [searchYear, setSearchYear] = useState<string>('');
  const [searchQuarter, setSearchQuarter] = useState<string>('');
  const [searchSymbol, setSearchSearchSymbol] = useState<string>('');

  // Selected Record to edit
  const [selectedRecord, setSelectedRecord] = useState<ProfitRecord | null>(null);

  // Editable Form fields
  const [editProfit, setEditProfit] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [editSource, setEditSource] = useState<string>('');
  const [editCurrency, setEditCurrency] = useState<string>('');

  const [snackbar, setSnackbar] = useState<string | null>(null);

  // Filter records matching search criteria
  const searchResults = useMemo(() => {
    return records.filter(r => {
      if (searchYear && r.FiscalYear !== searchYear) return false;
      if (searchQuarter && r.FiscalQuarter !== searchQuarter) return false;
      if (searchSymbol && !r.Symbol.toLowerCase().includes(searchSymbol.toLowerCase())) return false;
      return (r.IsLatest ?? true);
    }).slice(0, 30);
  }, [records, searchYear, searchQuarter, searchSymbol]);

  const handleSelectToEdit = (rec: ProfitRecord) => {
    setSelectedRecord(rec);
    setEditProfit(String(rec.NetProfit));
    setEditNote(rec.AdjustmentNote || '');
    setEditSource(rec.Source || 'Manual');
    setEditCurrency(rec.Currency || 'THB');
  };

  const handleSave = (saveAsNewVersion: boolean = false) => {
    if (!selectedRecord) return;

    const numericProfit = parseFormattedNumber(editProfit);
    const nowStr = new Date().toLocaleString('th-TH');

    const updated: ProfitRecord = {
      ...selectedRecord,
      ModifiedTime: nowStr,
      NetProfit: numericProfit,
      AdjustmentNote: editNote,
      Source: editSource,
      Currency: editCurrency
    };

    if (saveAsNewVersion) {
      updated.RecordID = 'REC-' + Date.now();
      updated.Version = (selectedRecord.Version || 1) + 1;
      updated.IsLatest = true;
    }

    onUpdateRecord(updated, saveAsNewVersion);
    setSelectedRecord(null);
    triggerSuccessSnackbar(
      saveAsNewVersion
        ? `บันทึกเป็น Version ${updated.Version} สำเร็จ`
        : 'อัปเดตข้อมูลสำเร็จ (ModifiedTime Updated)'
    );
  };

  const triggerSuccessSnackbar = (msg: string) => {
    setSnackbar(msg);
    setTimeout(() => setSnackbar(null), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {snackbar && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded shadow-lg flex items-center space-x-3 text-xs font-bold uppercase tracking-wider animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-4 h-4 text-blue-200" />
          <span>{snackbar}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          แก้ไขข้อมูลรายการ (Edit Record)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          ค้นหาและเลือกข้อมูลที่ต้องการแก้ไข ไม่อนุญาตให้แก้ไข RecordID และ Timestamp ผ่านหน้า Web
        </p>
      </div>

      {/* Step 1: Filter to find record */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Search className="w-4 h-4 text-blue-600" /> ค้นหาเพื่อเลือกรายการแก้ไข
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fiscal Year</label>
            <select
              value={searchYear}
              onChange={(e) => setSearchYear(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded p-2 outline-none font-semibold"
            >
              <option value="">-- ทั้งหมดทุกปี --</option>
              {settings.FiscalYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Quarter</label>
            <select
              value={searchQuarter}
              onChange={(e) => setSearchQuarter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded p-2 outline-none font-semibold"
            >
              <option value="">-- ทุกไตรมาส --</option>
              {settings.FiscalQuarters.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Symbol</label>
            <input
              type="text"
              placeholder="พิมพ์ชื่อหุ้น เช่น ADVANC"
              value={searchSymbol}
              onChange={(e) => setSearchSearchSymbol(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded p-2 outline-none font-semibold"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="mt-4 border border-slate-200 dark:border-slate-800 rounded overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {searchResults.length > 0 ? (
            searchResults.map((r, idx) => (
              <div
                key={`${r.RecordID}-${r.FiscalYear}-${r.FiscalQuarter}-${r.Symbol}-${idx}`}
                onClick={() => handleSelectToEdit(r)}
                className={`p-3 text-xs flex items-center justify-between cursor-pointer transition ${
                  selectedRecord?.RecordID === r.RecordID
                    ? 'bg-slate-50 dark:bg-slate-800/80 font-bold border-l-4 border-blue-600'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div>
                  <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">{r.Symbol}</span>
                  <span className="text-slate-600 dark:text-slate-300 mr-2">({r.FiscalYear} {r.FiscalQuarter})</span>
                  <span className="text-slate-400 text-[10px]">#{r.RecordID}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-slate-800 dark:text-slate-100">{formatProfitNumber(r.NetProfit)} {r.Currency}</span>
                  <button className="px-2.5 py-1 bg-blue-600 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                    โหลดข้อมูล
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</div>
          )}
        </div>
      </div>

      {/* Step 2: Edit Form */}
      {selectedRecord && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              แก้ไขแถวข้อมูล #{selectedRecord.RecordID} ({selectedRecord.Symbol} - {selectedRecord.FiscalYear} {selectedRecord.FiscalQuarter})
            </h3>
            <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-800">
              Version {selectedRecord.Version || 1}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Readonly Fields */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3" /> RecordID (ห้ามแก้ไข)
              </label>
              <input
                type="text"
                disabled
                value={selectedRecord.RecordID}
                className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-400 text-xs rounded p-2.5 cursor-not-allowed font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Timestamp สร้างเมื่อ (ห้ามแก้ไข)
              </label>
              <input
                type="text"
                disabled
                value={selectedRecord.Timestamp}
                className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-400 text-xs rounded p-2.5 cursor-not-allowed font-semibold"
              />
            </div>

            {/* Editable Fields */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Net Profit (กำไรสุทธิ)</label>
              <input
                type="text"
                value={editProfit}
                onChange={(e) => setEditProfit(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Source</label>
              <select
                value={editSource}
                onChange={(e) => setEditSource(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                {settings.Sources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Currency</label>
              <select
                value={editCurrency}
                onChange={(e) => setEditCurrency(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                {settings.Currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Adjustment Note</label>
              <textarea
                rows={2}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              onClick={() => handleSave(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs rounded transition uppercase tracking-wider"
            >
              บันทึกเป็น Version ใหม่ (Save as v{(selectedRecord.Version || 1) + 1})
            </button>

            <button
              onClick={() => handleSave(false)}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs transition flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Save className="w-4 h-4" />
              อัปเดตข้อมูล (Update Row)
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
