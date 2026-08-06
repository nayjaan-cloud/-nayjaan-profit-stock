import React, { useState } from 'react';
import { GAS_SCRIPT_CODE } from '../utils/gasGenerator';
import { Code, Copy, Check, Link, CheckCircle2, AlertTriangle, RefreshCw, XCircle, HelpCircle } from 'lucide-react';
import { getGasWebAppUrl, setGasWebAppUrl } from '../services/storageService';
import { fetchDataFromGAS, validateGasUrl } from '../services/gasService';

interface GasCodeViewProps {
  onUrlSaved?: () => void;
}

export const GasCodeView: React.FC<GasCodeViewProps> = ({ onUrlSaved }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [webAppUrl, setWebAppUrl] = useState<string>(getGasWebAppUrl());
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: { recordsCount: number; stocksCount: number };
  } | null>(null);

  const validation = validateGasUrl(webAppUrl);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GAS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveAndTestUrl = async () => {
    setGasWebAppUrl(webAppUrl);
    const cleaned = getGasWebAppUrl();
    setWebAppUrl(cleaned);

    setIsTesting(true);
    setTestResult(null);

    const res = await fetchDataFromGAS();
    setIsTesting(false);

    if (res.success && res.data) {
      setTestResult({
        success: true,
        message: 'เชื่อมต่อ Google Apps Script Web App สำเร็จ!',
        details: {
          recordsCount: res.data.records?.length || 0,
          stocksCount: res.data.stockMasters?.length || 0
        }
      });
      triggerSnackbar('บันทึกและเชื่อมต่อ Google Sheets สำเร็จ!');
      if (onUrlSaved) {
        onUrlSaved();
      }
    } else {
      setTestResult({
        success: false,
        message: res.error || 'ไม่สามารถเชื่อมต่อได้ (Unknown error)'
      });
    }
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
          <Code className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Google Apps Script & Google Sheets Backend Integration
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          โค้ด Google Apps Script (Code.gs) ที่ออกแบบตรงตามโครงสร้าง Sheets 4 แผ่น: Data, StockMaster, Setting และ AuditLog
        </p>
      </div>

      {/* Step by Step Setup Instructions */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs text-slate-700 dark:text-slate-300">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
          ขั้นตอนการติดตั้งใช้งานกับ Google Sheets ของคุณ:
        </h3>
        <ol className="list-decimal list-inside space-y-2 leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
          <li>สร้าง Google Sheets ใหม่ หรือใช้ Sheet เดิมที่มีแท็บชื่อ <strong>Data</strong>, <strong>StockMaster</strong>, <strong>Setting</strong>, <strong>AuditLog</strong></li>
          <li>ไปที่เมนู <strong>Extensions (ส่วนขยาย)</strong> &gt; <strong>Apps Script</strong></li>
          <li>คัดลอกซอร์สโค้ดด้านล่างไปวางในไฟล์ <code className="text-blue-600 dark:text-blue-400 font-bold">Code.gs</code> แล้วกด บันทึก (💾)</li>
          <li>กดปุ่ม <strong>Deploy (ทำให้ใช้งานได้)</strong> มุมขวาบน &gt; <strong>New deployment (การทำให้ใช้งานได้ใหม่)</strong></li>
          <li>คลิกไอคอนเฟืองข้าง "Select type" เลือกประเภทเป็น <strong>Web app (เว็บแอป)</strong></li>
          <li>ตั้งค่า:
            <ul className="list-disc list-inside ml-5 mt-1 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              <li>Execute as: <strong>Me (ฉัน)</strong></li>
              <li>Who has access: <strong className="text-blue-600 dark:text-blue-400">Anyone (ทุกคน)</strong> <span className="text-amber-600 dark:text-amber-400 font-bold">(สำคัญมาก! เพื่อป้องกัน HTTP 404 / CORS)</span></li>
            </ul>
          </li>
          <li>กดปุ่ม <strong>Deploy</strong> และกดยอมรับการเข้าถึงสิทธิ์ (Grant Permissions) หากมีป๊อปอัปแจ้งเตือน</li>
          <li>คัดลอก <strong>Web app URL</strong> (ลงท้ายด้วย <code className="text-blue-600 dark:text-blue-400 font-bold">/exec</code>) มาวางใส่ในช่องด้านล่างแล้วกด "บันทึก &amp; ทดสอบการเชื่อมต่อ"</li>
        </ol>
      </div>

      {/* Web App URL Sync Config */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <Link className="w-4 h-4 text-blue-600" />
          ตั้งค่า Google Apps Script Web App URL (Live Sync)
        </label>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            placeholder="https://script.google.com/macros/s/.../exec"
            value={webAppUrl}
            onChange={(e) => setWebAppUrl(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded px-4 py-2.5 outline-none font-mono"
          />
          <button
            onClick={handleSaveAndTestUrl}
            disabled={isTesting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs transition uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {isTesting ? 'กำลังทดสอบ...' : 'บันทึก & ทดสอบการเชื่อมต่อ'}
          </button>
        </div>

        {/* Real-time URL validation hints */}
        {webAppUrl.trim() !== '' && (
          <div>
            {!validation.valid ? (
              <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium mt-1">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{validation.error}</span>
              </div>
            ) : validation.warning ? (
              <div className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{validation.warning}</span>
              </div>
            ) : null}
          </div>
        )}

        {/* Test Result Display Box */}
        {testResult && (
          <div className={`p-4 rounded-lg border text-xs leading-relaxed mt-3 transition ${
            testResult.success
              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
              : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
          }`}>
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs mb-1">
              {testResult.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{testResult.message}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span>เกิดข้อผิดพลาดในการเชื่อมต่อ Google Apps Script</span>
                </>
              )}
            </div>

            {testResult.success && testResult.details && (
              <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                ดึงข้อมูลสำเร็จ: พบ Data Record <strong>{testResult.details.recordsCount}</strong> รายการ | Stock Master <strong>{testResult.details.stocksCount}</strong> รายการ
              </p>
            )}

            {!testResult.success && (
              <div className="mt-2 space-y-2 font-mono whitespace-pre-wrap text-[11px]">
                {testResult.message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* HTTP 404 Troubleshooting Guide Card */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-5 text-xs text-amber-900 dark:text-amber-200 space-y-3">
        <h4 className="font-bold uppercase tracking-wider flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          วิธีแก้ไขเมื่อเจอข้อผิดพลาด "Google Apps Script ตอบกลับด้วยสถานะ HTTP 404":
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] leading-relaxed">
          <div className="bg-white/70 dark:bg-slate-900/70 p-3 rounded border border-amber-200/60 dark:border-amber-800/60 space-y-1">
            <p className="font-bold text-amber-900 dark:text-amber-200">1. สาเหตุ: ใส่ URL ของ Google Sheet</p>
            <p className="text-slate-600 dark:text-slate-400">หาก URL ขึ้นต้นด้วย <code className="font-bold text-amber-700">docs.google.com/spreadsheets</code> จะส่งผลให้ได้ HTTP 404 ทันที ให้เปลี่ยนไปใช้ URL ของ Apps Script Web App</p>
          </div>
          <div className="bg-white/70 dark:bg-slate-900/70 p-3 rounded border border-amber-200/60 dark:border-amber-800/60 space-y-1">
            <p className="font-bold text-amber-900 dark:text-amber-200">2. สาเหตุ: ใส่ URL หน้าแก้ไขโค้ด</p>
            <p className="text-slate-600 dark:text-slate-400">หาก URL ขึ้นต้นด้วย <code className="font-bold text-amber-700">script.google.com/home/projects</code> ต้องกดปุ่ม Deploy ด้านขวาบนก่อนเพื่อสร้าง Web App URL</p>
          </div>
          <div className="bg-white/70 dark:bg-slate-900/70 p-3 rounded border border-amber-200/60 dark:border-amber-800/60 space-y-1">
            <p className="font-bold text-amber-900 dark:text-amber-200">3. สาเหตุ: ตั้งค่า Who has access ไม่ใช่ Anyone</p>
            <p className="text-slate-600 dark:text-slate-400">ขณะกด Deploy ต้องเลือก Who has access เป็น <strong>Anyone</strong> (ทุกคน) เท่านั้น เพื่อเปิดให้ App เรียกใช้ข้อมูลได้โดยไม่ติด 404/403</p>
          </div>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-950 text-slate-100 rounded-lg border border-slate-800 shadow-xl overflow-hidden">
        <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-blue-400">Code.gs (Apps Script)</span>
          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition flex items-center gap-1.5 uppercase tracking-wider"
          >
            {copied ? <Check className="w-4 h-4 text-blue-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด (Copy Code)'}
          </button>
        </div>

        <pre className="p-6 text-xs font-mono overflow-x-auto max-h-[500px] leading-relaxed text-slate-300">
          <code>{GAS_SCRIPT_CODE}</code>
        </pre>
      </div>

    </div>
  );
};

