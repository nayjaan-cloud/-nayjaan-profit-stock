export const GAS_SCRIPT_CODE = `/**
 * Stock Profit Management System - Google Apps Script Backend (Code.gs)
 * Required Sheets in Google Spreadsheet:
 *  1. "Data" (Headers: RecordID, Timestamp, ModifiedTime, FiscalYear, FiscalQuarter, Symbol, NetProfit, AdjustmentNote, Source, Currency)
 *  2. "StockMaster" (Headers: Symbol, CompanyName, Sector, Industry, Market, Currency, Active)
 *  3. "Setting" (Headers: FiscalYears, FiscalQuarters, Sources, Currencies)
 *  4. "AuditLog" (Headers: DateTime, User, Action, Table, RecordID, OldValue, NewValue)
 */

const SHEET_NAMES = {
  DATA: 'Data',
  STOCK_MASTER: 'StockMaster',
  SETTING: 'Setting',
  AUDIT_LOG: 'AuditLog'
};

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'getAll';
  let result = {};
  
  try {
    if (action === 'getAll') {
      result = {
        status: 'success',
        records: getSheetData(SHEET_NAMES.DATA),
        stockMasters: getSheetData(SHEET_NAMES.STOCK_MASTER),
        settings: getSettingsData(),
        auditLogs: getSheetData(SHEET_NAMES.AUDIT_LOG)
      };
    } else if (action === 'getRecords') {
      result = { status: 'success', records: getSheetData(SHEET_NAMES.DATA) };
    } else if (action === 'getStockMasters') {
      result = { status: 'success', stockMasters: getSheetData(SHEET_NAMES.STOCK_MASTER) };
    } else if (action === 'getSettings') {
      result = { status: 'success', settings: getSettingsData() };
    } else if (action === 'getAuditLogs') {
      result = { status: 'success', auditLogs: getSheetData(SHEET_NAMES.AUDIT_LOG) };
    }
  } catch (error) {
    result = { status: 'error', message: error.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let result = {};
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const user = postData.user || 'User';

    if (action === 'saveRecord') {
      result = handleSaveRecord(postData.record, user);
    } else if (action === 'bulkImport') {
      result = handleBulkImport(postData.records, user);
    } else if (action === 'updateStockMaster') {
      result = handleUpdateStockMaster(postData.stockMaster, user);
    } else if (action === 'updateSettings') {
      result = handleUpdateSettings(postData.settings, user);
    } else {
      result = { status: 'error', message: 'Unknown action: ' + action };
    }
  } catch (error) {
    result = { status: 'error', message: error.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(sheetName) {
  // Only use CacheService for smaller sheets like StockMaster or AuditLog to prevent 100KB truncation on Data sheet
  if (sheetName !== SHEET_NAMES.DATA) {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(sheetName);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = data.slice(1).map((row, rIdx) => {
    let obj = {};
    headers.forEach((header, index) => {
      let val = row[index];
      if (val instanceof Date) {
        val = val.toLocaleString('th-TH');
      }
      obj[header] = val;
    });

    // Parse boolean for StockMaster Active column if needed
    if (sheetName === SHEET_NAMES.STOCK_MASTER && obj.hasOwnProperty('Active')) {
      obj.Active = obj.Active === true || String(obj.Active).toUpperCase() === 'TRUE';
    }

    // Parse number for NetProfit column safely
    if (sheetName === SHEET_NAMES.DATA) {
      if (!obj.RecordID || String(obj.RecordID).trim() === '') {
        obj.RecordID = 'REC-' + (rIdx + 1);
      }
      if (obj.hasOwnProperty('NetProfit')) {
        var np = obj.NetProfit;
        if (typeof np === 'number') {
          obj.NetProfit = isNaN(np) ? 0 : np;
        } else if (np !== null && np !== undefined && String(np).trim() !== '') {
          var str = String(np).replace(/(MB|THB|ลบ\.|บาท)/gi, '').replace(/,/g, '').trim();
          if (str.indexOf('(') === 0 && str.indexOf(')') === str.length - 1) {
            str = '-' + str.substring(1, str.length - 1);
          }
          obj.NetProfit = parseFloat(str) || 0;
        } else {
          obj.NetProfit = 0;
        }
      }
      if (!obj.hasOwnProperty('IsLatest') || obj.IsLatest === '' || obj.IsLatest === null || obj.IsLatest === undefined) {
        obj.IsLatest = true;
      } else {
        obj.IsLatest = String(obj.IsLatest).toLowerCase() !== 'false' && String(obj.IsLatest) !== '0';
      }
    }
    return obj;
  });

  if (sheetName !== SHEET_NAMES.DATA) {
    try {
      CacheService.getScriptCache().put(sheetName, JSON.stringify(rows), 180);
    } catch (err) {}
  }

  return rows;
}

function getSettingsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.SETTING);
  if (!sheet) return { FiscalYears: [], FiscalQuarters: [], Sources: [], Currencies: [] };

  const data = sheet.getDataRange().getValues();
  let settings = {
    FiscalYears: [],
    FiscalQuarters: [],
    Sources: [],
    Currencies: []
  };

  if (data.length > 1) {
    for (let r = 1; r < data.length; r++) {
      if (data[r][0]) settings.FiscalYears.push(String(data[r][0]));
      if (data[r][1]) settings.FiscalQuarters.push(String(data[r][1]));
      if (data[r][2]) settings.Sources.push(String(data[r][2]));
      if (data[r][3]) settings.Currencies.push(String(data[r][3]));
    }
  }

  settings.FiscalYears = Array.from(new Set(settings.FiscalYears)).filter(Boolean);
  settings.FiscalQuarters = Array.from(new Set(settings.FiscalQuarters)).filter(Boolean);
  settings.Sources = Array.from(new Set(settings.Sources)).filter(Boolean);
  settings.Currencies = Array.from(new Set(settings.Currencies)).filter(Boolean);

  return settings;
}

function handleSaveRecord(record, user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.DATA);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.DATA);
    sheet.appendRow(['RecordID', 'Timestamp', 'ModifiedTime', 'FiscalYear', 'FiscalQuarter', 'Symbol', 'NetProfit', 'AdjustmentNote', 'Source', 'Currency']);
  }

  const nowStr = new Date().toLocaleString('th-TH');
  let isUpdate = false;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(record.RecordID)) {
      const oldVal = JSON.stringify(data[i]);
      sheet.getRange(i + 1, 3).setValue(nowStr); // ModifiedTime
      sheet.getRange(i + 1, 7).setValue(record.NetProfit);
      sheet.getRange(i + 1, 8).setValue(record.AdjustmentNote || '');
      sheet.getRange(i + 1, 9).setValue(record.Source || 'Manual');
      sheet.getRange(i + 1, 10).setValue(record.Currency || 'THB');
      logAudit(user, 'Update', 'Data', record.RecordID, oldVal, JSON.stringify(record));
      isUpdate = true;
      break;
    }
  }

  if (!isUpdate) {
    if (!record.RecordID) record.RecordID = 'REC-' + Date.now();
    if (!record.Timestamp) record.Timestamp = nowStr;
    record.ModifiedTime = nowStr;
    sheet.appendRow([
      record.RecordID,
      record.Timestamp,
      record.ModifiedTime,
      record.FiscalYear,
      record.FiscalQuarter,
      record.Symbol,
      record.NetProfit,
      record.AdjustmentNote || '',
      record.Source || 'Manual',
      record.Currency || 'THB'
    ]);
    logAudit(user, 'Create', 'Data', record.RecordID, '', JSON.stringify(record));
  }

  CacheService.getScriptCache().remove(SHEET_NAMES.DATA);
  return { status: 'success', record };
}

function handleBulkImport(records, user) {
  if (!Array.isArray(records) || records.length === 0) {
    return { status: 'error', message: 'No records provided for bulk import' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.DATA);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.DATA);
    sheet.appendRow(['RecordID', 'Timestamp', 'ModifiedTime', 'FiscalYear', 'FiscalQuarter', 'Symbol', 'NetProfit', 'AdjustmentNote', 'Source', 'Currency']);
  }

  const nowStr = new Date().toLocaleString('th-TH');
  const rowsToAdd = [];

  records.forEach(r => {
    const recId = r.RecordID || ('REC-BULK-' + Date.now() + '-' + Math.floor(Math.random() * 10000));
    rowsToAdd.push([
      recId,
      r.Timestamp || nowStr,
      r.ModifiedTime || nowStr,
      r.FiscalYear,
      r.FiscalQuarter,
      r.Symbol,
      r.NetProfit,
      r.AdjustmentNote || 'Bulk Import',
      r.Source || 'Import',
      r.Currency || 'THB'
    ]);
  });

  if (rowsToAdd.length > 0) {
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rowsToAdd.length, 10).setValues(rowsToAdd);
    logAudit(user, 'Import', 'Data', 'BULK-' + rowsToAdd.length, '', 'Imported ' + rowsToAdd.length + ' records');
  }

  CacheService.getScriptCache().remove(SHEET_NAMES.DATA);
  return { status: 'success', importedCount: rowsToAdd.length };
}

function handleUpdateStockMaster(stockMaster, user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.STOCK_MASTER);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.STOCK_MASTER);
    sheet.appendRow(['Symbol', 'CompanyName', 'Sector', 'Industry', 'Market', 'Currency', 'Active']);
  }

  let found = false;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toUpperCase() === String(stockMaster.Symbol).toUpperCase()) {
      const oldVal = JSON.stringify(data[i]);
      sheet.getRange(i + 1, 2).setValue(stockMaster.CompanyName);
      sheet.getRange(i + 1, 3).setValue(stockMaster.Sector);
      sheet.getRange(i + 1, 4).setValue(stockMaster.Industry || '');
      sheet.getRange(i + 1, 5).setValue(stockMaster.Market);
      sheet.getRange(i + 1, 6).setValue(stockMaster.Currency);
      sheet.getRange(i + 1, 7).setValue(stockMaster.Active ? true : false);
      logAudit(user, 'Update', 'StockMaster', stockMaster.Symbol, oldVal, JSON.stringify(stockMaster));
      found = true;
      break;
    }
  }

  if (!found) {
    sheet.appendRow([
      stockMaster.Symbol,
      stockMaster.CompanyName,
      stockMaster.Sector,
      stockMaster.Industry || '',
      stockMaster.Market,
      stockMaster.Currency,
      stockMaster.Active ? true : false
    ]);
    logAudit(user, 'Create', 'StockMaster', stockMaster.Symbol, '', JSON.stringify(stockMaster));
  }

  CacheService.getScriptCache().remove(SHEET_NAMES.STOCK_MASTER);
  return { status: 'success', stockMaster };
}

function handleUpdateSettings(settings, user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.SETTING);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.SETTING);
  } else {
    sheet.clearContents();
  }

  sheet.appendRow(['FiscalYears', 'FiscalQuarters', 'Sources', 'Currencies']);

  const maxLen = Math.max(
    (settings.FiscalYears || []).length,
    (settings.FiscalQuarters || []).length,
    (settings.Sources || []).length,
    (settings.Currencies || []).length
  );

  const rows = [];
  for (let i = 0; i < maxLen; i++) {
    rows.push([
      (settings.FiscalYears || [])[i] || '',
      (settings.FiscalQuarters || [])[i] || '',
      (settings.Sources || [])[i] || '',
      (settings.Currencies || [])[i] || ''
    ]);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 4).setValues(rows);
  }

  logAudit(user, 'Update', 'Setting', 'SETTINGS', '', JSON.stringify(settings));
  return { status: 'success', settings };
}

function logAudit(user, action, table, recordId, oldValue, newValue) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.AUDIT_LOG);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAMES.AUDIT_LOG);
      sheet.appendRow(['DateTime', 'User', 'Action', 'Table', 'RecordID', 'OldValue', 'NewValue']);
    }
    sheet.appendRow([new Date().toLocaleString('th-TH'), user, action, table, recordId, oldValue || '', newValue || '']);
  } catch (e) {}
}
`;
