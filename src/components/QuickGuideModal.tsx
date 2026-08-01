/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, UserCheck, FileSpreadsheet, Bell, Check, Sparkles, ChevronRight, Copy, Shield, HelpCircle, PhoneCall, HeartHandshake } from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterApp?: () => void;
}

export default function QuickGuideModal({ isOpen, onClose, onEnterApp }: QuickGuideModalProps) {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto animate-fade-in flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Hướng Dẫn Sử Dụng Nhanh 3 Bước
                <span className="text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded-full font-mono uppercase">Cho Nhân Viên Thu</span>
              </h3>
              <p className="text-xs text-slate-300">Dễ hiểu, đơn giản, giúp nhân viên thu BHXH, BHYT làm chủ sổ thu chỉ trong 1 phút</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Tabs Switcher */}
        <div className="bg-slate-950 border-b border-slate-850 p-2 sm:p-3 flex items-center justify-between gap-1.5 shrink-0 overflow-x-auto">
          
          <button
            type="button"
            onClick={() => setActiveTab(1)}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
              activeTab === 1
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/80 shadow-md shadow-emerald-950/40 scale-[1.02]'
                : 'bg-slate-900/60 text-slate-400 border-slate-850 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center font-mono ${activeTab === 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>1</span>
            <span className="truncate">Bước 1: Đăng ký</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 hidden sm:block" />

          <button
            type="button"
            onClick={() => setActiveTab(2)}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
              activeTab === 2
                ? 'bg-teal-950 text-teal-300 border-teal-500/80 shadow-md shadow-teal-950/40 scale-[1.02]'
                : 'bg-slate-900/60 text-slate-400 border-slate-850 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center font-mono ${activeTab === 2 ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>2</span>
            <span className="truncate">Bước 2: Nhập khách</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 hidden sm:block" />

          <button
            type="button"
            onClick={() => setActiveTab(3)}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
              activeTab === 3
                ? 'bg-indigo-950 text-indigo-300 border-indigo-500/80 shadow-md shadow-indigo-950/40 scale-[1.02]'
                : 'bg-slate-900/60 text-slate-400 border-slate-850 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center font-mono ${activeTab === 3 ? 'bg-indigo-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>3</span>
            <span className="truncate">Bước 3: Nhắc hạn</span>
          </button>

        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-200">
          
          {/* TAB 1: ĐĂNG KÝ & CẤU HÌNH CLOUD */}
          {activeTab === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-start gap-4 bg-emerald-950/30 border border-emerald-800/40 p-4 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    Bước 1: Đăng Ký Tài Khoản & Cấu Hình Đại Lý
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Khởi tạo môi trường làm việc an toàn, kết nối đám mây để không bao giờ bị mất sổ thu kể cả khi đổi máy hay lỡ tay xóa bộ nhớ trình duyệt.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Check className="w-4 h-4 text-emerald-400" /> 1.1 Phương Thức Sao Lưu Cloud & Google
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    • <strong className="text-white">WordPress Cloud:</strong> Bấm <strong className="text-white">Kết Nối WPGraphQL</strong> để sao lưu cơ sở dữ liệu vĩnh viễn lên máy chủ trang web WordPress của đại lý.<br />
                    • <strong className="text-white">Google Contacts:</strong> Bấm <strong className="text-sky-300">Google Contacts Backup</strong> để sao lưu dự phòng & đồng bộ 2 chiều liên hệ người dân sang Google Account.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Check className="w-4 h-4 text-emerald-400" /> 1.2 Thiết Lập Thông Tin Đại Lý
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Mở mục <strong className="text-white">Cài đặt (⚙️)</strong> để điền Tên Đại lý thu, Số điện thoại hỗ trợ, mức Lương cơ sở BHYT (2.530.000đ) và định mức hỗ trợ Nhà nước BHXH (132.000đ/tháng).
                  </p>
                </div>
              </div>

              <div className="bg-amber-950/40 border border-amber-800/50 p-3.5 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 block mb-0.5">💡 Mẹo nhỏ cho cô chú:</strong>
                  Nếu chưa có sẵn tài khoản WordPress, cô chú hoàn toàn có thể nhấn <strong className="text-white">Vào Sử Dụng Ngay</strong> để dùng bản miễn phí lưu trực tiếp trên thiết bị với đầy đủ tính năng!
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NHẬP DANH SÁCH KHÁCH HÀNG */}
          {activeTab === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-start gap-4 bg-teal-950/30 border border-teal-800/40 p-4 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    Bước 2: Nhập Danh Sách Khách Hàng (Người Dân)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Đưa toàn bộ danh sách người dân cần quản lý vào ứng dụng siêu tốc bằng cách dán từ Excel hoặc nhập từng hộ gia đình.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex items-center justify-between text-teal-400 font-bold text-xs">
                    <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-teal-400" /> Cách 1: Dán Từ Excel (Khuyên dùng)</span>
                    <span className="text-[9px] bg-teal-950 text-teal-300 border border-teal-800 px-1.5 py-0.5 rounded font-mono">SIÊU TỐC</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Nhấp nút <strong className="text-white">Excel Import</strong>. Mở file danh sách trên máy tính, quét chọn bảng dữ liệu (Ctrl+C) và dán trực tiếp (Ctrl+V) vào ô. Hệ thống tự tách tên, sđt, mã thẻ và ngày đáo hạn trong 3 giây.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                    <Check className="w-4 h-4 text-teal-400" /> Cách 2: Thêm Trực Tiếp Từng Người
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Nhấp <strong className="text-white">+ Thêm Người Dân</strong>. Điền Họ tên, Số điện thoại, Mã BHXH/BHYT, giới tính và ngày đến hạn. Hệ thống tự động tính tiền phải đóng theo đúng đối tượng.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-400" /> Nhận diện định dạng ngày thông minh:
                </div>
                <ul className="text-slate-400 space-y-1 pl-5 list-disc text-[11px] leading-relaxed">
                  <li>Hỗ trợ định dạng chuẩn <code className="text-teal-300 font-mono">dd/mm/yyyy</code> cho BHYT (ví dụ: <span className="text-white">15/07/2026</span>).</li>
                  <li>Tự động chuyển định dạng <code className="text-teal-300 font-mono">mm/yyyy</code> cho BHXH thành ngày cuối tháng (ví dụ: <span className="text-white">08/2026 → 31/08/2026</span>).</li>
                  <li>Cho phép bỏ trống ngày nếu chưa cập nhật thẻ chính xác, cập nhật sau bất cứ lúc nào.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: PHÂN NHÓM & NHẮC HẠN */}
          {activeTab === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-start gap-4 bg-indigo-950/30 border border-indigo-800/40 p-4 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                  <Bell className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    Bước 3: Tự Động Phân Nhóm & Gửi Lời Nhắc Đóng Phí
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Không bao giờ sợ trôi lịch đóng bảo hiểm của người dân. Tự động gom nhóm khách hàng theo thời gian hết hạn và tạo sẵn tin nhắn Zalo/SMS chuẩn hóa.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                    <Check className="w-4 h-4 text-indigo-400" /> 3.1 Bộ Lọc Gom Nhóm Đáo Hạn
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Chỉ cần chọn thanh bộ lọc: <strong className="text-white">Hôm nay</strong>, <strong className="text-amber-400">Đến hạn 3 ngày</strong>, <strong className="text-teal-400">Đến hạn 7 ngày</strong> hoặc <strong className="text-rose-400">Quá hạn</strong> để xem ngay danh sách cần đôn đốc thu phí.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                    <Copy className="w-4 h-4 text-indigo-400" /> 3.2 Nút Copy Nhanh Thông Tin
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Nhấp vào nút <strong className="text-sky-300">Copy nhanh</strong> ngay cạnh họ tên người dân. Hệ thống sẽ sao chép ngay nội dung dạng: <span className="text-white italic">"Nguyễn Văn A, 0123456789, 15/08/1975, BHXH tự nguyện"</span> để dán vào báo cáo.
                  </p>
                </div>
              </div>

              <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-800/50 space-y-2">
                <div className="text-xs font-bold text-indigo-300 flex items-center justify-between">
                  <span>📱 Nhắc Hạn Đa Kênh (Zalo / SMS / Gọi Điện) Trong 3 Giây:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bấm nút <strong className="text-emerald-400">Nhắc Hạn</strong> tại dòng của người dân để chọn gửi <strong className="text-emerald-400">Zalo</strong>, <strong className="text-sky-400">SMS</strong> hoặc <strong className="text-amber-400">Gọi điện</strong>. Hệ thống tự động điền sẵn Họ tên, Mã thẻ, Số tiền cần nộp, Hạn chót và Kịch bản lời thoại gọi điện chuẩn mực cho Đại lý!
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Hỗ trợ Freelancer Long Web Studio:</span>
            <span className="text-white font-mono font-bold">Zalo: 0966570913</span>
            <span className="hidden sm:inline">•</span>
            <span>contact@longwebstudio.io.vn</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeTab > 1 && (
              <button
                type="button"
                onClick={() => setActiveTab((prev) => (prev - 1) as 1 | 2 | 3)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Quay lại
              </button>
            )}

            {activeTab < 3 ? (
              <button
                type="button"
                onClick={() => setActiveTab((prev) => (prev + 1) as 1 | 2 | 3)}
                className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                Bước tiếp theo
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onEnterApp) onEnterApp();
                }}
                className="flex-1 sm:flex-none px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-950 flex items-center justify-center gap-1.5"
              >
                Mở Sổ Quản Lý Ngay
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
