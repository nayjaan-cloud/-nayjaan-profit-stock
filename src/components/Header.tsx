import React from 'react';
import { UserProfile, ActiveTab } from '../types';
import {
  TrendingUp,
  Database,
  Moon,
  Sun,
  FileCode,
  RefreshCw,
  Layers
} from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  recordCount: number;
  stockCount: number;
  gasConnected: boolean;
  isSyncing?: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  recordCount,
  stockCount,
  gasConnected,
  isSyncing = false,
  onRefresh
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  <span className="text-blue-600 dark:text-blue-400">Stock</span>Profit
                </h1>
                <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded font-bold uppercase tracking-widest hidden sm:inline-block">
                  v2.5 GAS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest hidden md:block">
                Database Management System (Google Sheets Backend)
              </p>
            </div>
          </div>

          {/* Right Status Controls */}
          <div className="flex items-center space-x-3">
            
            {/* Quick Metrics Badges */}
            <div className="hidden lg:flex items-center space-x-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 font-medium">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>หุ้น: <strong className="text-slate-900 dark:text-white font-bold">{stockCount}</strong></span>
              </div>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Records: <strong className="text-slate-900 dark:text-white font-bold">{recordCount.toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Google Sheets Connection Status Badge */}
            <div
              onClick={() => setActiveTab('gasCode')}
              className={`cursor-pointer px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition ${
                gasConnected
                  ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
              title={gasConnected ? 'เชื่อมต่อ Google Sheets backend เรียบร้อย' : 'ยังไม่ได้เชื่อมต่อ Google Sheets URL (ใช้ออฟไลน์ Local Storage)'}
            >
              <span className={`w-2 h-2 rounded-full ${gasConnected ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="hidden sm:inline">{gasConnected ? 'Sheets Connected' : 'Local Only'}</span>
            </div>

            {/* Refresh / Batch Sync Button */}
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              title="Refresh / Batch Sync with Google Sheets"
              className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'รีเฟรช / Sync'}</span>
            </button>

            {/* GAS Apps Script Integration Tab Shortcut */}
            <button
              onClick={() => setActiveTab('gasCode')}
              className={`p-2 rounded-md transition flex items-center gap-1.5 text-xs font-semibold ${
                activeTab === 'gasCode'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
              title="Google Apps Script Setup"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">GAS Apps Script</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              title="สลับ Light / Dark Mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Account Chip */}
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full text-xs">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                {user.displayName.charAt(0)}
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-300 max-w-[120px] truncate hidden sm:inline-block">
                {user.email}
              </span>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
