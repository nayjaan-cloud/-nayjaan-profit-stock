import React, { useState, useEffect } from 'react';
import { AlertCircle, ExternalLink, RefreshCw, X } from 'lucide-react';
import {
  ProfitRecord,
  StockMasterItem,
  SettingData,
  AuditLogItem,
  ActiveTab,
  UserProfile
} from './types';
import {
  loadRecordsFromStorage,
  saveRecordsToStorage,
  mergeRecordsWithSeed,
  loadStockMasters,
  saveStockMasters,
  loadSettings,
  saveSettings,
  loadAuditLogs,
  addAuditLog,
  clearCache,
  syncStockMastersWithRecords
} from './services/storageService';
import {
  isGasConfigured,
  fetchDataFromGAS,
  saveRecordToGAS,
  bulkImportToGAS,
  updateStockMasterToGAS,
  updateSettingsToGAS
} from './services/gasService';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

import { DashboardView } from './components/DashboardView';
import { AddRecordView } from './components/AddRecordView';
import { EditRecordView } from './components/EditRecordView';
import { SearchView } from './components/SearchView';
import { AnalyticsView } from './components/AnalyticsView';
import { StockMasterView } from './components/StockMasterView';
import { SettingView } from './components/SettingView';
import { BulkPasteView } from './components/BulkPasteView';
import { ExportView } from './components/ExportView';
import { AuditLogView } from './components/AuditLogView';
import { BackupView } from './components/BackupView';
import { GasCodeView } from './components/GasCodeView';

export default function App() {
  // Current Logged-In User Profile (Google Account)
  const currentUser: UserProfile = {
    email: 'nayjaan@gmail.com',
    displayName: 'Nay Jaan'
  };

  // Main Application State
  const [records, setRecords] = useState<ProfitRecord[]>([]);
  const [stockMasters, setStockMasters] = useState<StockMasterItem[]>([]);
  const [settings, setSettings] = useState<SettingData>({
    FiscalYears: [],
    FiscalQuarters: [],
    Sources: [],
    Currencies: []
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Gas Integration State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [gasConnected, setGasConnected] = useState<boolean>(isGasConfigured());
  const [gasSyncError, setGasSyncError] = useState<string | null>(null);

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('spms_theme') === 'dark';
  });

  // Load Data function (supports Google Apps Script & localStorage)
  const loadData = async () => {
    // 1. First load from local storage cache for instant UI rendering
    const loadedRecs = loadRecordsFromStorage();
    const loadedStocks = loadStockMasters();
    const syncedStocks = syncStockMastersWithRecords(loadedRecs, loadedStocks);
    const loadedSetts = loadSettings();
    const loadedLogs = loadAuditLogs();

    setRecords(loadedRecs);
    setStockMasters(syncedStocks);
    saveStockMasters(syncedStocks);
    setSettings(loadedSetts);
    setAuditLogs(loadedLogs);
    setGasSyncError(null);

    // 2. If Google Apps Script Web App URL is configured, fetch live data from Google Sheets!
    if (isGasConfigured()) {
      setGasConnected(true);
      setIsSyncing(true);
      try {
        const result = await fetchDataFromGAS();
        if (result.success && result.data) {
          const gasData = result.data;
          setGasSyncError(null);
          
          let finalRecs = loadedRecs;
          if (gasData.records && gasData.records.length > 0) {
            const merged = mergeRecordsWithSeed(gasData.records);
            finalRecs = merged;
            setRecords(merged);
            saveRecordsToStorage(merged);
          }
          
          let finalStocks = loadedStocks;
          if (gasData.stockMasters && gasData.stockMasters.length > 0) {
            finalStocks = gasData.stockMasters;
          }
          
          const syncedGasStocks = syncStockMastersWithRecords(finalRecs, finalStocks);
          setStockMasters(syncedGasStocks);
          saveStockMasters(syncedGasStocks);

          if (gasData.settings && gasData.settings.FiscalYears?.length > 0) {
            setSettings(gasData.settings);
            saveSettings(gasData.settings);
          }
          if (gasData.auditLogs && gasData.auditLogs.length > 0) {
            setAuditLogs(gasData.auditLogs);
          }
        } else if (result.error) {
          setGasSyncError(result.error);
        }
      } catch (e: any) {
        console.error('GAS sync error:', e);
        setGasSyncError('ไม่สามารถดึงข้อมูลจาก Google Apps Script ได้ (Network or CORS Error)');
      } finally {
        setIsSyncing(false);
      }
    } else {
      setGasConnected(false);
      setGasSyncError(null);
    }
  };

  // Initial Data Load
  useEffect(() => {
    loadData();
  }, []);

  // Sync Dark Mode Class to Root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('spms_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('spms_theme', 'light');
    }
  }, [darkMode]);

  // Handlers for Data Mutations
  const handleSaveRecord = (
    newRecord: ProfitRecord,
    isOverwrite: boolean = false,
    isNewVersion: boolean = false
  ) => {
    let updatedRecords: ProfitRecord[] = [];

    if (isOverwrite) {
      updatedRecords = records.map(r => (r.RecordID === newRecord.RecordID ? newRecord : r));
      addAuditLog({
        Action: 'Update',
        Table: 'Data',
        RecordID: newRecord.RecordID,
        NewValue: `Overwritten ${newRecord.Symbol} ${newRecord.FiscalYear} ${newRecord.FiscalQuarter} NetProfit: ${newRecord.NetProfit}`
      }, currentUser.email);
    } else if (isNewVersion) {
      const previous = records.find(
        r => r.FiscalYear === newRecord.FiscalYear && r.FiscalQuarter === newRecord.FiscalQuarter && r.Symbol === newRecord.Symbol
      );
      const modifiedRecords = records.map(r => {
        if (r.FiscalYear === newRecord.FiscalYear && r.FiscalQuarter === newRecord.FiscalQuarter && r.Symbol === newRecord.Symbol) {
          return { ...r, IsLatest: false };
        }
        return r;
      });
      updatedRecords = [newRecord, ...modifiedRecords];

      addAuditLog({
        Action: 'Update',
        Table: 'Data',
        RecordID: newRecord.RecordID,
        OldValue: previous ? `v${previous.Version}: ${previous.NetProfit}` : '',
        NewValue: `Created Version v${newRecord.Version}: ${newRecord.NetProfit}`
      }, currentUser.email);
    } else {
      updatedRecords = [newRecord, ...records];
      addAuditLog({
        Action: 'Create',
        Table: 'Data',
        RecordID: newRecord.RecordID,
        NewValue: `Created ${newRecord.Symbol} (${newRecord.FiscalYear} ${newRecord.FiscalQuarter}) NetProfit: ${newRecord.NetProfit}`
      }, currentUser.email);
    }

    setRecords(updatedRecords);
    saveRecordsToStorage(updatedRecords);
    setAuditLogs(loadAuditLogs());

    // Sync to Google Sheets if connected
    if (isGasConfigured()) {
      saveRecordToGAS(newRecord, currentUser.email);
    }
  };

  const handleBulkImport = (importedRecords: ProfitRecord[]) => {
    const updated = [...importedRecords, ...records];
    setRecords(updated);
    saveRecordsToStorage(updated);

    addAuditLog({
      Action: 'Import',
      Table: 'Data',
      RecordID: `BULK-${importedRecords.length}`,
      NewValue: `Bulk Imported ${importedRecords.length} records successfully`
    }, currentUser.email);

    setAuditLogs(loadAuditLogs());

    // Sync to Google Sheets if connected
    if (isGasConfigured()) {
      bulkImportToGAS(importedRecords, currentUser.email);
    }
  };

  const handleSaveStockMaster = (stock: StockMasterItem, isNew: boolean) => {
    let updated: StockMasterItem[] = [];
    if (isNew) {
      updated = [...stockMasters, stock];
    } else {
      updated = stockMasters.map(s => (s.Symbol === stock.Symbol ? stock : s));
    }

    setStockMasters(updated);
    saveStockMasters(updated);

    addAuditLog({
      Action: 'Stock Master',
      Table: 'StockMaster',
      RecordID: stock.Symbol,
      NewValue: `${isNew ? 'Added' : 'Updated'} Stock ${stock.Symbol} (${stock.CompanyName}) Active: ${stock.Active}`
    }, currentUser.email);

    setAuditLogs(loadAuditLogs());

    // Sync to Google Sheets if connected
    if (isGasConfigured()) {
      updateStockMasterToGAS(stock, currentUser.email);
    }
  };

  const handleUpdateSettings = (newSettings: SettingData) => {
    setSettings(newSettings);
    saveSettings(newSettings);

    addAuditLog({
      Action: 'Setting Update',
      Table: 'Setting',
      RecordID: 'SETTING',
      NewValue: 'Updated master settings configuration'
    }, currentUser.email);

    setAuditLogs(loadAuditLogs());

    // Sync to Google Sheets if connected
    if (isGasConfigured()) {
      updateSettingsToGAS(newSettings, currentUser.email);
    }
  };

  const handleAddSettingYear = (newYear: string) => {
    if (!settings.FiscalYears.includes(newYear)) {
      const updated = {
        ...settings,
        FiscalYears: [...settings.FiscalYears, newYear].sort()
      };
      setSettings(updated);
      saveSettings(updated);

      if (isGasConfigured()) {
        updateSettingsToGAS(updated, currentUser.email);
      }
    }
  };

  const handleRestoreDatabase = (data: {
    records: ProfitRecord[];
    stockMasters: StockMasterItem[];
    settings: SettingData;
  }) => {
    setRecords(data.records);
    saveRecordsToStorage(data.records);

    setStockMasters(data.stockMasters);
    saveStockMasters(data.stockMasters);

    setSettings(data.settings);
    saveSettings(data.settings);

    addAuditLog({
      Action: 'Backup/Restore',
      Table: 'All',
      RecordID: 'RESTORE',
      NewValue: `Restored database with ${data.records.length} records`
    }, currentUser.email);

    setAuditLogs(loadAuditLogs());

    if (isGasConfigured()) {
      bulkImportToGAS(data.records, currentUser.email);
      updateSettingsToGAS(data.settings, currentUser.email);
    }
  };

  const handleRefresh = () => {
    clearCache();
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 geometric-grid text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Top Application Bar */}
      <Header
        user={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        recordCount={records.length}
        stockCount={stockMasters.filter(s => s.Active).length}
        gasConnected={gasConnected}
        isSyncing={isSyncing}
        onRefresh={handleRefresh}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        
        {/* Navigation Drawer / Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content Stage View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-4">
          
          {/* Google Apps Script Sync Error Banner */}
          {gasSyncError && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-xs text-amber-900 dark:text-amber-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold uppercase tracking-wider text-[11px] text-amber-800 dark:text-amber-300">
                    แจ้งเตือนการเชื่อมต่อ Google Sheets (GAS Sync Error)
                  </p>
                  <p className="leading-relaxed text-slate-700 dark:text-amber-200/90">
                    {gasSyncError}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] transition flex items-center gap-1 uppercase tracking-wider"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  ลองใหม่
                </button>
                <button
                  onClick={() => setActiveTab('gasCode')}
                  className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 rounded font-bold text-[11px] transition flex items-center gap-1 uppercase tracking-wider"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  แก้ไข URL
                </button>
                <button
                  onClick={() => setGasSyncError(null)}
                  className="p-1.5 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded"
                  title="ปิดการแจ้งเตือน"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              records={records}
              stockMasters={stockMasters}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'addRecord' && (
            <AddRecordView
              records={records}
              stockMasters={stockMasters}
              settings={settings}
              onSaveRecord={handleSaveRecord}
              onAddSettingYear={handleAddSettingYear}
            />
          )}

          {activeTab === 'editRecord' && (
            <EditRecordView
              records={records}
              stockMasters={stockMasters}
              settings={settings}
              onUpdateRecord={(updated, isNewVer) => handleSaveRecord(updated, !isNewVer, isNewVer)}
            />
          )}

          {activeTab === 'search' && (
            <SearchView
              records={records}
              stockMasters={stockMasters}
              settings={settings}
              onEditRecordSelect={(r) => {
                setActiveTab('editRecord');
              }}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              records={records}
              stockMasters={stockMasters}
              settings={settings}
            />
          )}

          {activeTab === 'stockMaster' && (
            <StockMasterView
              stockMasters={stockMasters}
              onSaveStockMaster={handleSaveStockMaster}
            />
          )}

          {activeTab === 'setting' && (
            <SettingView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}

          {activeTab === 'bulkPaste' && (
            <BulkPasteView
              records={records}
              stockMasters={stockMasters}
              settings={settings}
              onBulkImport={handleBulkImport}
            />
          )}

          {activeTab === 'export' && (
            <ExportView
              records={records}
              stockMasters={stockMasters}
              settings={settings}
            />
          )}

          {activeTab === 'auditLog' && (
            <AuditLogView logs={auditLogs} />
          )}

          {activeTab === 'backup' && (
            <BackupView
              records={records}
              stockMasters={stockMasters}
              settings={settings}
              onRestoreDatabase={handleRestoreDatabase}
            />
          )}

          {activeTab === 'gasCode' && (
            <GasCodeView onUrlSaved={loadData} />
          )}
        </main>

      </div>

    </div>
  );
}
