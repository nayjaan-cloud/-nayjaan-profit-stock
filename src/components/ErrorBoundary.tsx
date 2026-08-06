import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetData = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลใน Local Storage หรือไม่? (ใช้เมื่อพบปัญหาข้อมูลไม่สมบูรณ์)')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-8 h-8 flex-shrink-0 animate-bounce" />
              <div>
                <h2 className="text-base font-bold uppercase tracking-wider">พบข้อผิดพลาดในการแสดงผล</h2>
                <p className="text-xs text-slate-400">Application Error (React Exception)</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded font-mono text-[11px] text-red-300 max-h-40 overflow-auto border border-slate-800">
              {this.state.error?.toString() || 'Unknown error occurred'}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              อาจเกิดจากรูปแบบข้อมูลจาก Google Sheets หรือ Local Storage ไม่ตรงกับโครงสร้างระบบ
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <RefreshCw className="w-4 h-4" />
                โหลดหน้าใหม่ (Reload)
              </button>
              <button
                onClick={this.handleResetData}
                className="py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded transition flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                รีเซ็ตแคช
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
