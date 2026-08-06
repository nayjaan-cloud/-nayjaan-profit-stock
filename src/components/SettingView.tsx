import React, { useState } from 'react';
import { SettingData } from '../types';
import { Settings, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface SettingViewProps {
  settings: SettingData;
  onUpdateSettings: (newSettings: SettingData) => void;
}

export const SettingView: React.FC<SettingViewProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [newYear, setNewYear] = useState<string>('');
  const [newQuarter, setNewQuarter] = useState<string>('');
  const [newSource, setNewSource] = useState<string>('');
  const [newCurrency, setNewCurrency] = useState<string>('');

  const [snackbar, setSnackbar] = useState<string | null>(null);

  const handleAddOption = (type: keyof SettingData, value: string, setter: (v: string) => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (settings[type].includes(trimmed)) return;

    const updated = {
      ...settings,
      [type]: [...settings[type], trimmed]
    };
    onUpdateSettings(updated);
    setter('');
    triggerSnackbar(`เพิ่ม ${trimmed} ลงใน ${type} เรียบร้อยแล้ว`);
  };

  const handleRemoveOption = (type: keyof SettingData, itemToRemove: string) => {
    const updated = {
      ...settings,
      [type]: settings[type].filter(i => i !== itemToRemove)
    };
    onUpdateSettings(updated);
    triggerSnackbar(`ลบ ${itemToRemove} จาก ${type} เรียบร้อยแล้ว`);
  };

  const triggerSnackbar = (msg: string) => {
    setSnackbar(msg);
    setTimeout(() => setSnackbar(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {snackbar && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded shadow-lg flex items-center space-x-3 text-xs font-bold uppercase tracking-wider animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-4 h-4 text-blue-200" />
          <span>{snackbar}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Setting Management (จัดการ Master Data ของระบบ)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          การเปลี่ยนแปลงค่าในหน้านี้จะอัปเดตตัวเลือก Dropdown ทั้งหมดในระบบโดยอัตโนมัติ
        </p>
      </div>

      {/* Grid of Master Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Fiscal Years */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
            Fiscal Years (รายการปีบัญชี)
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="พิมพ์ปี เช่น 2571"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded p-2 outline-none font-semibold text-slate-800 dark:text-slate-100"
            />
            <button
              onClick={() => handleAddOption('FiscalYears', newYear, setNewYear)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded flex items-center gap-1 shadow-xs uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" /> เพิ่ม
            </button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
            {settings.FiscalYears.map((yr) => (
              <span key={yr} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-2">
                {yr}
                <button
                  onClick={() => handleRemoveOption('FiscalYears', yr)}
                  className="text-slate-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 2. Fiscal Quarters */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
            Fiscal Quarters (รายการไตรมาส)
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="เช่น Q5 หรือ Half1"
              value={newQuarter}
              onChange={(e) => setNewQuarter(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded p-2 outline-none font-semibold text-slate-800 dark:text-slate-100"
            />
            <button
              onClick={() => handleAddOption('FiscalQuarters', newQuarter, setNewQuarter)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded flex items-center gap-1 shadow-xs uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" /> เพิ่ม
            </button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
            {settings.FiscalQuarters.map((q) => (
              <span key={q} className="bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded text-xs font-bold flex items-center gap-2">
                {q}
                <button
                  onClick={() => handleRemoveOption('FiscalQuarters', q)}
                  className="text-blue-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 3. Sources */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
            Sources (แหล่งที่มาของข้อมูล)
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="เช่น SET Smart"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded p-2 outline-none font-semibold text-slate-800 dark:text-slate-100"
            />
            <button
              onClick={() => handleAddOption('Sources', newSource, setNewSource)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded flex items-center gap-1 shadow-xs uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" /> เพิ่ม
            </button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
            {settings.Sources.map((src) => (
              <span key={src} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-2">
                {src}
                <button
                  onClick={() => handleRemoveOption('Sources', src)}
                  className="text-slate-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 4. Currencies */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
            Currencies (สกุลเงิน)
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="เช่น THB, USD"
              value={newCurrency}
              onChange={(e) => setNewCurrency(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded p-2 outline-none uppercase font-semibold text-slate-800 dark:text-slate-100"
            />
            <button
              onClick={() => handleAddOption('Currencies', newCurrency.toUpperCase(), setNewCurrency)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded flex items-center gap-1 shadow-xs uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" /> เพิ่ม
            </button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
            {settings.Currencies.map((c) => (
              <span key={c} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-2">
                {c}
                <button
                  onClick={() => handleRemoveOption('Currencies', c)}
                  className="text-slate-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
