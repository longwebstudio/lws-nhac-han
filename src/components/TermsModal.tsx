/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShieldCheck, FileText, CheckCircle2, AlertCircle, Lock, Server, HelpCircle } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto animate-fade-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Điều Khoản Dịch Vụ (Terms of Service)
                <span className="text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded-full font-mono uppercase">Phiên bản 2026</span>
              </h3>
              <p className="text-xs text-slate-300">Quy định sử dụng phần mềm sổ thu "LWS - Sổ thu bảo hiểm" thuộc Freelancer Long Web Studio</p>
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-300 text-xs leading-relaxed">
          
          {/* Section 1 */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <FileText className="w-4 h-4" /> 1. Phạm Vi & Mục Đích Sử Dụng
            </h4>
            <p className="text-slate-300">
              <strong>LWS - Sổ thu bảo hiểm</strong> là công cụ công nghệ hỗ trợ các <strong>Nhân viên thu BHXH, BHYT</strong> (Bảo hiểm xã hội tự nguyện & Bảo hiểm y tế hộ gia đình) số hóa quy trình quản lý danh sách người dân, tính toán định mức và đôn đốc thu phí đúng hạn theo quy định từ BHXH Việt Nam.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
            <h4 className="text-sm font-bold text-teal-400 flex items-center gap-2">
              <Lock className="w-4 h-4" /> 2. Quyền Sở Hữu & Bảo Mật Dữ Liệu
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>
                <strong className="text-white">Lưu trữ bảo mật cục bộ:</strong> Toàn bộ dữ liệu danh sách người dân do Đại lý nhập được lưu trữ an toàn trong bộ nhớ thiết bị của người dùng (Local Storage).
              </li>
              <li>
                <strong className="text-white">Quyền sở hữu dữ liệu:</strong> Toàn bộ danh sách người dân, số điện thoại, mã thẻ BHYT/BHXH thuộc quyền sở hữu riêng biệt của Đại lý thu. Hệ thống không chia sẻ hay kinh doanh thông tin cho bất kỳ bên thứ ba nào.
              </li>
              <li>
                <strong className="text-white">Sao lưu tự động WordPress Cloud:</strong> Nếu kích hoạt sao lưu Cloud, dữ liệu được truyền tải qua cổng mã hóa bảo mật đến máy chủ WordPress của riêng Đại lý thu.
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
            <h4 className="text-sm font-bold text-sky-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> 3. Trách Nhiệm Của Người Sử Dụng (Đại Lý Thu)
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>Đảm bảo tính chính xác của thông tin mã số BHXH/BHYT, ngày hết hạn và số tiền thu của người dân.</li>
              <li>Tuân thủ các quy định hiện hành của Bảo hiểm xã hội Việt Nam về việc phát hành biên nhận và nộp tiền đúng hạn.</li>
              <li>Tự chủ động sao lưu (xuất file dự phòng) định kỳ để tránh rủi ro khi hỏng thiết bị hoặc xóa cache trình duyệt.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> 4. Giới Hạn Trách Nhiệm Pháp Lý
            </h4>
            <p className="text-slate-300">
              Phần mềm đóng vai trò là trợ lý đôn đốc nhắc hạn và sổ tay ghi chép. Long Web Studio không chịu trách nhiệm đối với các sai sót trong việc thu chi tiền mặt ngoài thực tế hoặc việc nộp muộn do đại lý quên liên hệ người dân.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
            <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
              <Server className="w-4 h-4" /> 5. Cập Nhật & Hỗ Trợ Kỹ Thuật
            </h4>
            <p className="text-slate-300">
              Chúng tôi liên tục cập nhật biểu mức đóng lương cơ sở mới và bổ sung tính năng tiện ích. Nếu cần hỗ trợ kỹ thuật, Nhân viên thu BHXH, BHYT vui lòng liên hệ trực tiếp đơn vị phát triển <strong>Freelancer Long Web Studio (LWS)</strong> qua hotline/Zalo: <strong className="text-white font-mono">0966570913</strong>, email: <strong className="text-white">contact@longwebstudio.io.vn</strong>, website: <strong className="text-white">longwebstudio.io.vn</strong>.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-850 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cập nhật mới nhất: <strong>Tháng 7/2026</strong> • Freelancer Long Web Studio (longwebstudio.io.vn)</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-950"
          >
            Tôi Đã Hiểu & Đồng Ý
          </button>
        </div>

      </div>
    </div>
  );
}
