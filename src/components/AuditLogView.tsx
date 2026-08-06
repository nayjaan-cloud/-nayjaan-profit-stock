import React from 'react';
import { AuditLogItem } from '../types';
import { History, User, Clock } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLogItem[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Audit Log (ประวัติบันทึกการทำงานของระบบ)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          บันทึกทุกการทำงานในระบบ เช่น Create, Update, Import, Export พร้อมระบุวันที่และผู้ใช้งาน
        </p>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="p-3">DateTime</th>
                <th className="p-3">User (ผู้ใช้งาน)</th>
                <th className="p-3">Action</th>
                <th className="p-3">Table</th>
                <th className="p-3">RecordID</th>
                <th className="p-3">รายละเอียดการเปลี่ยน (Old vs New)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <tr key={`${log.LogID || 'log'}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition border-b border-slate-100 dark:border-slate-800">
                    <td className="p-3 text-slate-500 whitespace-nowrap text-[11px]">
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {log.DateTime}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-blue-600 dark:text-blue-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.User}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        log.Action === 'Create' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                        log.Action === 'Update' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                        log.Action === 'Import' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {log.Action}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{log.Table}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">#{log.RecordID || '-'}</td>
                    <td className="p-3 text-[11px]">
                      <div className="truncate max-w-xs text-slate-500 font-medium" title={`New: ${log.NewValue || ''}`}>
                        {log.NewValue || log.OldValue || '-'}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 text-xs">
                    ยังไม่มีประวัติการทำงานใน Audit Log
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
