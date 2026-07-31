/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  CloudDownload, 
  CloudUpload, 
  Clock, 
  Users, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { Customer, UserSettings } from '../types';

export interface CloudBackupInfo {
  customers: Customer[];
  settings: UserSettings;
  updatedAt: string;
  agentName?: string;
  agentPhone?: string;
}

interface VersionSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  cloudBackup: CloudBackupInfo;
  localCustomers: Customer[];
  localSettings: UserSettings;
  onDownloadCloud: (backup: CloudBackupInfo) => Promise<void>;
  onUploadLocal: () => Promise<void>;
  isSyncing: boolean;
}

export default function VersionSyncModal({
  isOpen,
  onClose,
  cloudBackup,
  localCustomers,
  localSettings,
  onDownloadCloud,
  onUploadLocal,
  isSyncing,
}: VersionSyncModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Chưa có thông tin';
    try {
      const d = new Date(dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const cloudCount = cloudBackup.customers?.length || 0;
  const localCount = localCustomers?.length || 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto flex items-start sm:items-center justify-center animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-auto flex flex-col max-h-[85vh] sm:max-h-[90vh]">
        
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 p-3.5 sm:p-5 border-b border-emerald-500/30 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 shrink-0">
              <CloudDownload className="w-5 h-5 sm:w-7 sm:h-7 animate-bounce" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-xs font-bold mb-0.5 sm:mb-1">
                <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                So Sánh Phiên Bản Sổ Thu trên Cloud & Thiết Bị
              </div>
              <h3 className="text-xs sm:text-lg font-bold text-white leading-tight">
                Phát Hiện Bản Sao Lưu Sổ Thu Trên WordPress Cloud
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors shrink-0 cursor-pointer ml-1"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-5 flex-1 overflow-y-auto min-h-0 overscroll-contain touch-pan-y">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Hệ thống phát hiện phiên bản <strong className="text-emerald-400 font-semibold">Sổ Thu</strong> lưu trữ trên máy chủ WordPress Cloud. Bạn có thể nhấn nút <strong className="text-emerald-400">"Tải Về Ngay"</strong> để đồng bộ toàn bộ dữ liệu người dân và cấu hình về thiết bị này:
          </p>

          {/* Version comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            
            {/* Cloud Version Card (RECOMMENDED) */}
            <div className="relative p-3 sm:p-4 rounded-xl border-2 border-emerald-500/80 bg-emerald-950/40 space-y-2.5 sm:space-y-3 shadow-xl">
              <div className="absolute -top-2.5 right-2 sm:right-3 px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider shadow flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-slate-950" />
                Phiên Bản Máy Chủ
              </div>

              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm pt-1 sm:pt-0">
                <CloudDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Bản Cloud (WordPress)</span>
              </div>

              <div className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs text-slate-200">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" /> Thời gian lưu:
                  </span>
                  <span className="font-mono font-bold text-emerald-300 text-[10px] sm:text-xs">
                    {formatDate(cloudBackup.updatedAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" /> Số người dân:
                  </span>
                  <span className="font-bold text-white text-xs sm:text-sm bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">
                    {cloudCount} hồ sơ
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" /> Đại lý / Nhân viên:
                  </span>
                  <span className="font-semibold text-slate-200 truncate max-w-[120px] sm:max-w-[140px]">
                    {cloudBackup.agentName || cloudBackup.settings?.agencyName || 'Đã cấu hình'}
                  </span>
                </div>
              </div>

              {/* Direct Download Action inside Cloud Card */}
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={() => onDownloadCloud(cloudBackup)}
                  disabled={isSyncing}
                  className="w-full py-2 sm:py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CloudDownload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950" />
                  <span>TẢI VỀ & KHÔI PHỤC NGAY</span>
                </button>
              </div>
            </div>

            {/* Local Version Card */}
            <div className="p-3 sm:p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2.5 sm:space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs sm:text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                  <span>Bản Cục Bộ (Thiết Bị Này)</span>
                </div>

                <div className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400" /> Lưu gần nhất:
                    </span>
                    <span className="font-mono font-semibold text-slate-300 text-[10px] sm:text-xs">
                      {formatDate(localSettings.lastSyncedVersion || localSettings.lastLocalUpdate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400" /> Số người dân:
                    </span>
                    <span className="font-bold text-white text-xs sm:text-sm bg-slate-800 px-1.5 py-0.5 rounded">
                      {localCount} hồ sơ
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400" /> Đại lý / Nhân viên:
                    </span>
                    <span className="font-semibold text-slate-300 truncate max-w-[120px] sm:max-w-[140px]">
                      {localSettings.agencyName || 'Chưa đặt'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={onUploadLocal}
                  disabled={isSyncing}
                  className="w-full py-2 sm:py-2.5 px-2.5 rounded-xl border border-slate-700 hover:border-amber-500/60 bg-slate-900 hover:bg-amber-950/30 text-slate-300 hover:text-amber-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Ghi đè bản hiện tại trên thiết bị này lên WordPress Cloud"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>Ghi Đè Bản Này Lên Cloud</span>
                </button>
              </div>
            </div>

          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Lưu ý:</strong> Khi chọn <em>Tải Về & Khôi Phục Ngay</em>, hệ thống sẽ khôi phục <strong>{cloudCount} hồ sơ người dân</strong> từ WordPress Cloud vào máy này mà không làm ảnh hưởng đến tài khoản đăng nhập.
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="p-3 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing}
            className="w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer order-2 sm:order-1"
          >
            Để Sau (Đóng)
          </button>

          <button
            type="button"
            onClick={() => onDownloadCloud(cloudBackup)}
            disabled={isSyncing}
            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-extrabold shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer order-1 sm:order-2"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang Tải Về Dữ Liệu...</span>
              </>
            ) : (
              <>
                <CloudDownload className="w-4 h-4" />
                <span>TẢI VỀ & KHÔI PHỤC NGAY ({cloudCount} NGƯỜI DÂN)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
