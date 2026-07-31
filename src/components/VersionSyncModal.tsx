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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-auto">
        
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 p-5 border-b border-emerald-500/30 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <CloudDownload className="w-7 h-7 animate-bounce" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Phát Hiện Phiên Bản Sổ Thu Mới Hơn Trên Cloud
              </div>
              <h3 className="text-lg font-bold text-white">
                Có Bản Sao Lưu Sổ Thu Mới Trên Máy Chủ WordPress
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors"
            title="Để sau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-5">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Hệ thống phát hiện phiên bản dữ liệu <strong className="text-emerald-400 font-semibold">Sổ Thu</strong> trên WordPress Cloud có thời gian cập nhật mới hơn dữ liệu đang lưu cục bộ trên thiết bị này. Bạn vui lòng chọn cách đồng bộ mong muốn:
          </p>

          {/* Version comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Cloud Version Card (RECOMMENDED) */}
            <div className="relative p-4 rounded-xl border-2 border-emerald-500/60 bg-emerald-950/30 space-y-3 shadow-lg">
              <div className="absolute -top-3 right-3 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow">
                Khuyên Dùng
              </div>

              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CloudDownload className="w-4 h-4" />
                <span>Bản Cloud (Máy Chủ)</span>
              </div>

              <div className="space-y-2 text-xs text-slate-200">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" /> Thời gian lưu:
                  </span>
                  <span className="font-mono font-semibold text-emerald-300">
                    {formatDate(cloudBackup.updatedAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-400" /> Số người dân:
                  </span>
                  <span className="font-bold text-white text-sm">
                    {cloudCount} hồ sơ
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Đại lý / Nhân viên:
                  </span>
                  <span className="font-semibold text-slate-200 truncate max-w-[140px]">
                    {cloudBackup.agentName || cloudBackup.settings?.agencyName || 'Đã cấu hình'}
                  </span>
                </div>
              </div>
            </div>

            {/* Local Version Card */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
              <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                <span>Bản Cục Bộ (Thiết Bị Này)</span>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-400" /> Lưu gần nhất:
                  </span>
                  <span className="font-mono font-semibold text-slate-300">
                    {formatDate(localSettings.lastSyncedVersion || localSettings.lastLocalUpdate)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-sky-400" /> Số người dân:
                  </span>
                  <span className="font-bold text-white text-sm">
                    {localCount} hồ sơ
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Đại lý / Nhân viên:
                  </span>
                  <span className="font-semibold text-slate-300 truncate max-w-[140px]">
                    {localSettings.agencyName || 'Chưa đặt'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Lưu ý quan trọng:</strong> Nếu chọn <em>Tải Về & Khôi Phục</em>, toàn bộ danh sách khách hàng và cấu hình trên thiết bị này sẽ được cập nhật đồng bộ hoàn toàn theo phiên bản Cloud mới nhất.
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Để Sau (Giữ Dữ Liệu Hiện Tại)
          </button>

          <button
            type="button"
            onClick={onUploadLocal}
            disabled={isSyncing}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-950/40 text-amber-300 text-xs font-semibold hover:bg-amber-900/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CloudUpload className="w-4 h-4" />
            <span>Ghi Đè Dữ Liệu Thiết Bị Lên Cloud</span>
          </button>

          <button
            type="button"
            onClick={() => onDownloadCloud(cloudBackup)}
            disabled={isSyncing}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang Tải Về...</span>
              </>
            ) : (
              <>
                <CloudDownload className="w-4 h-4" />
                <span>Tải Về & Khôi Phục Bản Cloud</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
