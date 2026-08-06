import React, { useState } from 'react';
import { ProfitRecord, StockMasterItem, SettingData } from '../types';
import { HardDriveDownload, Upload, CheckCircle2, RefreshCw } from 'lucide-react';
import { resetRecordsToSeed } from '../services/storageService';

interface BackupViewProps {
  records: ProfitRecord[];
  stockMasters: StockMasterItem[];
  settings: SettingData;
  onRestoreDatabase: (data: { records: ProfitRecord[]; stockMasters: StockMasterItem[]; settings: SettingData }) => void;
}

export const BackupView: React.FC<BackupViewProps> = ({
  records,
  stockMasters,
  settings,
  onRestoreDatabase
}) => {
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const handleDownloadBackup = () => {
    const backupData = {
      version: '2.5',
      exportDate: new Date().toISOString(),
      records,
      stockMasters,
      settings
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `StockProfitBackup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerSnackbar('ดาวน์โหลดไฟล์สำรองข้อมูล JSON เรียบร้อยแล้ว');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.records) && Array.isArray(parsed.stockMasters)) {
          if (window.confirm('คุณแน่ใจหรือไม่ที่จะเขียนทับฐานข้อมูลปัจจุบันด้วยไฟล์สำรองนี้?')) {
            onRestoreDatabase({
              records: parsed.records,
              stockMasters: parsed.stockMasters,
              settings: parsed.settings || settings
            });
            triggerSnackbar('กู้คืนฐานข้อมูล (Restore) สำเร็จ');
          }
        } else {
          alert('รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้อง');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์สำรองข้อมูล');
      }
    };
    reader.readAsText(file);
  };

  const triggerSnackbar = (msg: string) => {
    setSnackbar(msg);
    setTimeout(() => setSnackbar(null), 3500);
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
          <HardDriveDownload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          สำรองและกู้คืนฐานข้อมูล (Backup & Restore Database)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          สำรองตาราง Data, StockMaster และ Setting ป้องกันข้อมูลสูญหาย
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Backup Box */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <HardDriveDownload className="w-4 h-4 text-blue-600" />
            1. สำรองข้อมูล (Backup JSON)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ดาวน์โหลดไฟล์โครงสร้างฐานข้อมูลแบบเต็ม ประกอบด้วยข้อมูล {records.length.toLocaleString()} รายการ และ {stockMasters.length} หุ้น
          </p>
          <button
            onClick={handleDownloadBackup}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs transition flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <HardDriveDownload className="w-4 h-4" />
            ดาวน์โหลดไฟล์สำรองข้อมูล (.json)
          </button>
        </div>

        {/* Restore Box */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-600" />
            2. กู้คืนข้อมูล (Restore Database)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            เลือกไฟล์สำรองข้อมูล JSON ที่บันทึกไว้ล่วงหน้าเพื่อกู้คืนระบบ
          </p>
          <label className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded shadow-xs transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider">
            <Upload className="w-4 h-4" />
            เลือกไฟล์สำรองเพื่อ Restore
            <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
          </label>
        </div>

      </div>

      {/* Reset Seed Data Option */}
      <div className="bg-amber-50 dark:bg-amber-950/30 p-6 rounded-lg border border-amber-200 dark:border-amber-800 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-amber-600" />
          3. ฟื้นฟูข้อมูลเริ่มต้น (Restore Default Seed Data)
        </h3>
        <p className="text-xs text-amber-800 dark:text-amber-300">
          หากตัวเลขกำไรสุทธิเป็น 0 หรือต้องการล้างข้อมูลกลับเป็นค่าตัวอย่างเริ่มต้นของระบบ (เช่น ADVANC, BBL, CPALL, BDMS, KBANK) สามารถกดปุ่มนี้เพื่อโหลดข้อมูลกำไรสุทธิเริ่มต้นใหม่
        </p>
        <button
          onClick={() => {
            if (window.confirm('คุณแน่ใจหรือไม่ที่จะรีเซ็ตข้อมูลกลับเป็นค่าเริ่มต้น (Default Seed Data)?')) {
              const seedData = resetRecordsToSeed();
              onRestoreDatabase({
                records: seedData,
                stockMasters: stockMasters,
                settings: settings
              });
              triggerSnackbar('ฟื้นฟูชุดข้อมูลตัวอย่างเริ่มต้นสำเร็จแล้ว!');
            }
          }}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded transition flex items-center gap-2 uppercase tracking-wider"
        >
          <RefreshCw className="w-4 h-4" />
          ฟื้นฟูข้อมูลตัวอย่างเริ่มต้น (Reset to Seed Data)
        </button>
      </div>

    </div>
  );
};
