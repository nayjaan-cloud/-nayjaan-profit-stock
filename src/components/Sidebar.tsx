import React from 'react';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  PlusCircle,
  Edit3,
  Search,
  BarChart3,
  Building2,
  Settings,
  ClipboardPaste,
  Download,
  History,
  HardDriveDownload,
  Code
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'หน้าแรก (Dashboard)', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'addRecord', label: 'เพิ่มข้อมูล (Add Record)', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'editRecord', label: 'แก้ไขข้อมูล (Edit Record)', icon: <Edit3 className="w-4 h-4" /> },
    { id: 'search', label: 'ค้นหา (Search / Table)', icon: <Search className="w-4 h-4" /> },
    { id: 'analytics', label: 'กราฟวิเคราะห์ (Analytics)', icon: <BarChart3 className="w-4 h-4 text-blue-500" /> },
    { id: 'stockMaster', label: 'จัดการหุ้น (StockMaster)', icon: <Building2 className="w-4 h-4" /> },
    { id: 'setting', label: 'ตั้งค่าระบบ (Setting)', icon: <Settings className="w-4 h-4" /> },
    { id: 'bulkPaste', label: 'วางข้อมูลหลายรายการ (Bulk Paste)', icon: <ClipboardPaste className="w-4 h-4 text-amber-500" /> },
    { id: 'export', label: 'ส่งออกข้อมูล (Export)', icon: <Download className="w-4 h-4" /> },
    { id: 'auditLog', label: 'บันทึกการทำงาน (Audit Log)', icon: <History className="w-4 h-4" /> },
    { id: 'backup', label: 'สำรองข้อมูล (Backup / Restore)', icon: <HardDriveDownload className="w-4 h-4" /> },
    { id: 'gasCode', label: 'Google Apps Script (GAS)', icon: <Code className="w-4 h-4 text-blue-500" /> },
  ];

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 md:min-h-[calc(100vh-4rem)] shadow-xs flex flex-col py-3">
      <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        Menu Navigation
      </div>
      <nav className="flex-1 space-y-0.5">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition-all border-l-4 ${
                isActive
                  ? 'border-blue-600 bg-slate-50 dark:bg-slate-800/80 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
