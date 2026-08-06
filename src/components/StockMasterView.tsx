import React, { useState, useMemo } from 'react';
import { StockMasterItem } from '../types';
import { Building2, Plus, Edit2, CheckCircle, XCircle, Search, Save, CheckCircle2 } from 'lucide-react';

interface StockMasterViewProps {
  stockMasters: StockMasterItem[];
  onSaveStockMaster: (stock: StockMasterItem, isNew: boolean) => void;
}

export const StockMasterView: React.FC<StockMasterViewProps> = ({
  stockMasters,
  onSaveStockMaster
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');

  // Editing or Creating modal state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<StockMasterItem>({
    Symbol: '',
    CompanyName: '',
    Sector: 'ICT',
    Industry: 'Technology',
    Market: 'SET',
    Currency: 'THB',
    Active: true
  });

  const [snackbar, setSnackbar] = useState<string | null>(null);

  // Filtered & Sorted stock masters
  const filteredStocks = useMemo(() => {
    return stockMasters
      .filter(s => {
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          if (!s.Symbol.toLowerCase().includes(q) && !s.CompanyName.toLowerCase().includes(q)) {
            return false;
          }
        }
        if (selectedMarket && s.Market !== selectedMarket) return false;
        if (activeFilter === 'active' && !s.Active) return false;
        if (activeFilter === 'inactive' && s.Active) return false;
        return true;
      })
      .sort((a, b) => a.Symbol.localeCompare(b.Symbol));
  }, [stockMasters, searchTerm, selectedMarket, activeFilter]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      Symbol: '',
      CompanyName: '',
      Sector: 'ICT',
      Industry: 'Services',
      Market: 'SET',
      Currency: 'THB',
      Active: true
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (stock: StockMasterItem) => {
    setIsEditing(true);
    setFormData({ ...stock });
    setIsFormOpen(true);
  };

  const handleToggleActive = (stock: StockMasterItem) => {
    const updated = { ...stock, Active: !stock.Active };
    onSaveStockMaster(updated, false);
    triggerSnackbar(`อัปเดตสถานะ ${stock.Symbol} เป็น ${updated.Active ? 'Active' : 'Inactive'} แล้ว`);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Symbol.trim() || !formData.CompanyName.trim()) return;

    onSaveStockMaster(formData, !isEditing);
    setIsFormOpen(false);
    triggerSnackbar(isEditing ? `อัปเดตหุ้น ${formData.Symbol} สำเร็จ` : `เพิ่มหุ้น ${formData.Symbol} เข้า StockMaster สำเร็จ`);
  };

  const triggerSnackbar = (msg: string) => {
    setSnackbar(msg);
    setTimeout(() => setSnackbar(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {snackbar && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded shadow-lg flex items-center space-x-3 text-xs font-bold uppercase tracking-wider animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-4 h-4 text-blue-200" />
          <span>{snackbar}</span>
        </div>
      )}

      {/* Title */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            StockMaster Management (บริหารจัดการรายชื่อหุ้น)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            เพิ่ม แก้ไข และเปิด/ปิดสถานะหุ้น หุ้นที่เพิ่มใหม่สามารถนำไปเลือกใช้ใน Add Record ได้ทันที
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs transition flex items-center gap-2 uppercase tracking-wider self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          เพิ่มหุ้นใหม่ (Add Stock)
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาตาม Symbol หรือ ชื่อบริษัท..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded outline-none font-semibold"
          />
        </div>

        <div>
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded outline-none font-semibold"
          >
            <option value="">ทุกตลาด (SET / mai)</option>
            <option value="SET">SET</option>
            <option value="mai">mai</option>
          </select>
        </div>

        <div>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded outline-none font-semibold"
          >
            <option value="">สถานะทั้งหมด (Active / Inactive)</option>
            <option value="active">เฉพาะ Active</option>
            <option value="inactive">เฉพาะ Inactive</option>
          </select>
        </div>
      </div>

      {/* StockMaster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="p-3">Symbol</th>
                <th className="p-3">Company Name</th>
                <th className="p-3">Sector</th>
                <th className="p-3">Industry</th>
                <th className="p-3">Market</th>
                <th className="p-3">Currency</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredStocks.map((stock) => (
                <tr key={stock.Symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition border-b border-slate-100 dark:border-slate-800">
                  <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{stock.Symbol}</td>
                  <td className="p-3 font-semibold">{stock.CompanyName}</td>
                  <td className="p-3 text-slate-500">{stock.Sector}</td>
                  <td className="p-3 text-slate-400">{stock.Industry}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-[10px] text-slate-700 dark:text-slate-300">
                      {stock.Market}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-400 text-[11px]">{stock.Currency}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleToggleActive(stock)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition ${
                        stock.Active
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {stock.Active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {stock.Active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleOpenEdit(stock)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                      title="แก้ไขข้อมูลหุ้น"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog for Add / Edit StockMaster */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              {isEditing ? `แก้ไขหุ้น ${formData.Symbol}` : 'เพิ่มหุ้นใหม่ลง StockMaster'}
            </h3>

            <form onSubmit={handleSubmitForm} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Symbol (สัญลักษณ์หุ้น)</label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={formData.Symbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, Symbol: e.target.value.toUpperCase() }))}
                  placeholder="เช่น PTT, AOT, KBANK"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded outline-none font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Company Name (ชื่อบริษัท)</label>
                <input
                  type="text"
                  required
                  value={formData.CompanyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, CompanyName: e.target.value }))}
                  placeholder="เช่น PTT Public Company Limited"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sector</label>
                  <input
                    type="text"
                    value={formData.Sector}
                    onChange={(e) => setFormData(prev => ({ ...prev, Sector: e.target.value.toUpperCase() }))}
                    placeholder="ENERG, ICT, BANK"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Market</label>
                  <select
                    value={formData.Market}
                    onChange={(e) => setFormData(prev => ({ ...prev, Market: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded outline-none font-semibold"
                  >
                    <option value="SET">SET</option>
                    <option value="mai">mai</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold uppercase tracking-wider"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs uppercase tracking-wider"
                >
                  <Save className="w-4 h-4" /> บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
