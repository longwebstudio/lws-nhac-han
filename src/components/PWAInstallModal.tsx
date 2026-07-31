/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Download, Smartphone, WifiOff, X, CheckCircle2, Share, PlusSquare, ArrowDown, Sparkles, ShieldCheck } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PWAInstallModal({ isOpen, onClose }: PWAInstallModalProps) {
  const { canInstall, isInstalled, isIOS, installApp } = usePWA();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await installApp();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-5 border-b border-emerald-500/30 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Download className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold mb-1 uppercase tracking-wider">
                <WifiOff className="w-3 h-3 text-emerald-400" />
                Hỗ Trợ Offline 100%
              </div>
              <h3 className="text-lg font-bold text-white">
                Cài Đặt Ứng Dụng LWS Sổ Thu
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-1.5">
            <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              Tại sao nên cài đặt thành Ứng dụng (PWA)?
            </p>
            <ul className="space-y-1 text-slate-300 pl-1 text-xs">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <strong>Dùng bình thường khi mất mạng / không có Wifi/4G:</strong> Toàn bộ Sổ Thu vẫn mở được và tra cứu siêu tốc.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <strong>Truy cập 1 chạm từ màn hình chính:</strong> Không cần mở trình duyệt hay nhập địa chỉ web rườm rà.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <strong>An toàn tuyệt đối:</strong> Dữ liệu lưu an toàn trong thiết bị của bạn.
              </li>
            </ul>
          </div>

          {/* Conditional Instructions depending on Browser/Device */}
          {isInstalled ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">
                Ứng dụng LWS Sổ Thu đã được cài đặt trên thiết bị của bạn!
              </p>
              <p className="text-xs text-slate-300">
                Bạn có thể mở icon ứng dụng ngay trên Màn hình chính (Home Screen).
              </p>
            </div>
          ) : canInstall ? (
            <div className="text-center space-y-3">
              <p className="text-xs text-slate-300">
                Nhấn nút bên dưới để tiến hành cài đặt ngay vào thiết bị chỉ trong 2 giây:
              </p>
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>Cài Đặt Ngay Vào Màn Hình Chính</span>
              </button>
            </div>
          ) : isIOS ? (
            <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <p className="font-bold text-amber-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" /> Hướng dẫn cài đặt trên iPhone / iPad (Safari):
              </p>
              <ol className="space-y-2 text-slate-300 pl-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400 shrink-0">Bước 1:</span>
                  <span>Chạm vào biểu tượng <strong>Chia sẻ (Share)</strong> <Share className="w-3.5 h-3.5 inline text-sky-400 mx-0.5" /> ở thanh công cụ bên dưới Safari.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400 shrink-0">Bước 2:</span>
                  <span>Cuộn xuống chọn mục <strong>"Thêm vào MH chính" (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400 mx-0.5" />.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400 shrink-0">Bước 3:</span>
                  <span>Nhấn <strong>"Thêm" (Add)</strong> ở góc trên bên phải để hoàn tất.</span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" /> Hướng dẫn cài đặt thủ công trên Trình duyệt Mobile / PC:
              </p>
              <ol className="space-y-2 text-slate-300 pl-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400 shrink-0">1. Chrome/Edge Android & PC:</span>
                  <span>Nhấn vào menu <strong>3 chấm (⋮)</strong> ở góc trên bên phải trình duyệt → chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào màn hình chính"</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400 shrink-0">2. Cốc Cốc & Khác:</span>
                  <span>Chạm vào menu tùy chọn → chọn <strong>Thêm vào màn hình chính</strong>.</span>
                </li>
              </ol>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Phát triển bởi Freelancer Long Web Studio
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 text-xs hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
