import React from 'react';
import { ProfitRecord } from '../types';
import { AlertTriangle, RefreshCw, GitBranch, X } from 'lucide-react';
import { formatProfitNumber } from '../utils/formatters';

interface DuplicateModalProps {
  isOpen: boolean;
  existingRecord: ProfitRecord;
  newRecord: Partial<ProfitRecord>;
  onOverwrite: () => void;
  onSaveNewVersion: () => void;
  onCancel: () => void;
}

export const DuplicateModal: React.FC<DuplicateModalProps> = ({
  isOpen,
  existingRecord,
  newRecord,
  onOverwrite,
  onSaveNewVersion,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-amber-500/10 dark:bg-amber-500/20 border-b border-amber-500/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/20 rounded text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                พบข้อมูลนี้ในระบบแล้ว (Duplicate Detected)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ข้อมูลปี {existingRecord.FiscalYear} ไตรมาส {existingRecord.FiscalQuarter} ของ {existingRecord.Symbol} มีอยู่แล้ว
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Comparison */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            
            {/* Existing Data Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
              <span className="inline-block px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold mb-2 uppercase tracking-wider">
                ข้อมูลเดิม (Existing)
              </span>
              <div className="space-y-1 text-slate-700 dark:text-slate-300">
                <p><strong>Record ID:</strong> #{existingRecord.RecordID}</p>
                <p><strong>Net Profit:</strong> <span className="text-blue-600 dark:text-blue-400 font-bold">{formatProfitNumber(existingRecord.NetProfit)}</span> {existingRecord.Currency}</p>
                <p><strong>Source:</strong> {existingRecord.Source}</p>
                <p><strong>Version:</strong> v{existingRecord.Version || 1}</p>
                <p><strong>Note:</strong> {existingRecord.AdjustmentNote || '-'}</p>
                <p className="text-[10px] text-slate-400 mt-2">แก้ไขเมื่อ: {existingRecord.ModifiedTime}</p>
              </div>
            </div>

            {/* New Data Card */}
            <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
              <span className="inline-block px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-[10px] font-bold mb-2 uppercase tracking-wider">
                ข้อมูลใหม่ (New Entry)
              </span>
              <div className="space-y-1 text-slate-800 dark:text-slate-200">
                <p><strong>Fiscal:</strong> {newRecord.FiscalYear} {newRecord.FiscalQuarter}</p>
                <p><strong>Net Profit:</strong> <span className="text-blue-600 dark:text-blue-400 font-bold">{formatProfitNumber(newRecord.NetProfit)}</span> {newRecord.Currency}</p>
                <p><strong>Source:</strong> {newRecord.Source}</p>
                <p><strong>Note:</strong> {newRecord.AdjustmentNote || '-'}</p>
              </div>
            </div>

          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
            โปรดเลือกการดำเนินการที่ต้องการ:
          </p>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 rounded text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            ยกเลิก (Cancel)
          </button>
          
          <button
            onClick={onSaveNewVersion}
            className="w-full sm:w-auto px-4 py-2 rounded text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <GitBranch className="w-3.5 h-3.5" />
            สร้าง Version ใหม่
          </button>

          <button
            onClick={onOverwrite}
            className="w-full sm:w-auto px-4 py-2 rounded text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            เขียนทับข้อมูลเดิม
          </button>
        </div>

      </div>
    </div>
  );
};
