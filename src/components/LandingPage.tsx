/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Bell, FileSpreadsheet, Search, BarChart3, ChevronRight, Check, Star, ExternalLink, UserCheck, Sparkles, Copy, HelpCircle } from 'lucide-react';
import QuickGuideModal from './QuickGuideModal';
import TermsModal from './TermsModal';

interface LandingPageProps {
  onEnterApp: () => void;
}

export default function LandingPage({ onEnterApp }: LandingPageProps) {
  const [showQuickGuideModal, setShowQuickGuideModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <div id="landing-page" className="bg-slate-950 min-h-screen text-slate-100 flex flex-col font-sans">
      <QuickGuideModal 
        isOpen={showQuickGuideModal} 
        onClose={() => setShowQuickGuideModal(false)} 
        onEnterApp={onEnterApp}
      />
      
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
      
      {/* Top Notification Bar */}
      <div className="bg-emerald-950 text-emerald-300 text-xs py-2 px-4 text-center font-medium select-none">
        🎉 Sổ thu công nghệ chuyên nghiệp dành cho nhân viên thu BHXH, BHYT từ <a href="https://longwebstudio.io.vn" target="_blank" rel="noreferrer" className="underline hover:text-white font-semibold">Freelancer Long Web Studio</a>
      </div>

      {/* Header element */}
      <header className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 z-40 transition-shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-950">
              <span className="font-extrabold text-base leading-none">LWS</span>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block">LWS - Sổ thu bảo hiểm</span>
              <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-semibold block">Phần mềm cho nhân viên thu BHXH, BHYT</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Tính năng</a>
            <a href="#workflow" className="hover:text-emerald-400 transition-colors">Quy trình</a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">Bảng phí</a>
            <a href="#trust" className="hover:text-emerald-400 transition-colors font-medium">Cô chú tin dùng</a>
          </nav>

          {/* Action Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onEnterApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-950 cursor-pointer flex items-center gap-1.5"
            >
              Mở Sổ Quản Lý
              <ExternalLink className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-slate-950 to-slate-900 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero text */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 bg-emerald-950/40 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-900/50">
              <Shield className="w-3.5 h-3.5" /> 🛡️ Thay thế sổ tay đóng bảo hiểm truyền thống
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight font-sans leading-tight">
              Sổ Thu Công Nghệ <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                Tự Động Nhắc Hạn
              </span> BHYT & BHXH
            </h1>
            
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
              Ứng dụng do <strong>Freelancer Long Web Studio</strong> phát triển giúp các <strong>nhân viên thu BHXH, BHYT</strong> tự động gom nhóm, tra cứu siêu tốc và nhắc đóng tiền đúng thời điểm. Giảm tỷ lệ quên lịch của người dân về 0% chỉ với 1 cú nhấp chuột.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={onEnterApp}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-base px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-950/50 text-center cursor-pointer flex items-center justify-center gap-2"
              >
                Vào Sử Dụng Ngay (Miễn Phí)
                <ChevronRight className="w-5 h-5" />
              </button>
              <a
                href="#features"
                className="text-slate-300 hover:text-emerald-400 text-sm font-semibold border border-slate-850 hover:bg-slate-900 py-3 px-6 rounded-xl text-center transition-all"
              >
                Xem tính năng chính
              </a>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <Check className="w-4 h-4 text-emerald-400" /> Không cần cài đặt (mở trên điện thoại/máy tính là chạy)
              </div>
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <Check className="w-4 h-4 text-emerald-400" /> Miễn phí trọn đời cho 50 người dân đầu tiên
              </div>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="lg:col-span-5 relative">
            <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-6 space-y-4 max-w-sm mx-auto relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-900/20 rounded-full blur-2xl mt-[-20px] mr-[-20px] pointer-events-none"></div>

              {/* Mock App Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400 font-mono">📅 HÔM NAY: 12/06/2026</span>
                <span className="text-[10px] bg-amber-955 text-amber-300 border border-amber-900/40 font-bold px-2 py-0.5 rounded-full">
                  ⚠️ 3 Người sắp hết hạn
                </span>
              </div>

              {/* Custom mock item */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Danh sách nhắc hôm nay:</p>
                
                {/* Visual Card 1 */}
                <div className="bg-rose-950/30 border border-rose-900/40 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-white">Nguyễn Văn Hùng</h4>
                    <p className="text-[10px] text-slate-400">Thẻ BHYT • Còn 3 ngày</p>
                  </div>
                  <button 
                    onClick={onEnterApp}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-transform cursor-pointer shadow-xs active:scale-95"
                  >
                    Copy tin Zalo
                  </button>
                </div>

                {/* Visual Card 2 */}
                <div className="bg-amber-950/30 border border-amber-900/40 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-white">Phạm Thị Mai</h4>
                    <p className="text-[10px] text-slate-400">Thẻ BHYT • Còn 7 ngày</p>
                  </div>
                  <button 
                    onClick={onEnterApp}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-transform cursor-pointer shadow-xs active:scale-95"
                  >
                    Copy tin Zalo
                  </button>
                </div>
              </div>

              {/* Benefit stats overlay */}
              <div className="bg-slate-950 text-white rounded-xl border border-slate-850 p-3 text-center space-y-1">
                <span className="text-[10px] text-teal-400 font-bold tracking-wider uppercase">Báo cáo doanh số tự động</span>
                <div className="text-base font-black font-mono">1.031.500 VNĐ</div>
                <p className="text-[9px] text-slate-400">Tổng hoa hồng đại lý ước tính trong tháng</p>
              </div>

              <p className="text-center text-[10px] text-slate-400 leading-relaxed italic">
                “Gặp đúng phần mềm này mừng quá, tôi bấm sao chép rồi dán thẳng qua Zalo, chỉ 3 giây là gửi xong lời nhắc đóng phí.”
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Core Features list (Ứng dụng làm được gì?) */}
      <section id="features" className="py-16 bg-slate-900 px-4 border-t border-slate-950">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          
          <div className="space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">MỜI ANH LONG & ĐẠI LÝ THAM KHẢO</span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight font-sans">
              Các Tính Năng Cốt Lõi Vượt Trội
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Lws Nhắc Hạn ra đời nhằm tháo gỡ hoàn toàn các khó khăn lộn xộn từ khâu quản lý người dân của các tổ thu khu vực.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 hover:border-emerald-500/50 transition-all text-left space-y-3 group hover:shadow-lg hover:shadow-emerald-950/10">
              <div className="w-12 h-12 rounded-xl bg-orange-950/40 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">🔔 Tự động gom nhóm & nhắc hạn</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Hệ thống tự động phân loại những khách hàng sắp hết hạn đóng tiền bảo hiểm (trước 7 ngày, 3 ngày hoặc đã quá hạn) và hiện thông báo trực tiếp. Đại lý không bao giờ sợ trôi lịch của bà con.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 hover:border-emerald-500/50 transition-all text-left space-y-3 group hover:shadow-lg hover:shadow-emerald-950/10">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/40 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">📂 Quản lý thông tin khoa học</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Lưu trữ ngăn nắp: Họ tên, Số điện thoại, CCCD, Mã số thẻ BHYT/BHXH, loại hình tham gia bảo hiểm hộ gia đình hay tự nguyện và theo dõi đầy đủ lịch sử của từng lần đóng tiền trước đó.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 hover:border-emerald-500/50 transition-all text-left space-y-3 group hover:shadow-lg hover:shadow-emerald-950/10">
              <div className="w-12 h-12 rounded-xl bg-blue-950/40 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">🔍 Tra cứu siêu tốc trong 3 giây</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Quên đi việc lật tìm từng mặt giấy viết tay vất vả. Chỉ cần nhập tên, mã bảo hiểm hoặc vài số điện thoại là hệ thống sẽ hiển thị toàn bộ hồ sơ khách hàng ngay lập tức.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 hover:border-emerald-500/50 transition-all text-left space-y-3 group hover:shadow-lg hover:shadow-emerald-950/10">
              <div className="w-12 h-12 rounded-xl bg-teal-950/40 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">📈 Báo cáo thu chi tự động</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Tự động thống kê minh bạch số tiền đã thu trong tuần/tháng/quý, tổng số hồ sơ đóng tiền thành công và ước tính luôn tiền công tác phí/hoa hồng đại lý nhận được cực nhanh gọn.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 hover:border-emerald-500/50 transition-all text-left space-y-3 group hover:shadow-lg hover:shadow-emerald-950/10">
              <div className="w-12 h-12 rounded-xl bg-indigo-950/40 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">📥 Nhập dữ liệu nhanh từ Excel</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Đại lý không cần phải lạch cạch gõ tay thông tin từng người dân lại từ đầu. Chỉ cần dán (paste) hoặc tải bảng danh sách khách hàng sẵn có từ Excel lên hệ thống siêu đơn giản trong một nốt nhạc.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 hover:border-emerald-500/50 transition-all text-left space-y-3 group hover:shadow-lg hover:shadow-emerald-950/10 flex flex-col justify-between">
              <div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-900/50 font-bold px-2.5 py-1 rounded-full uppercase">CÔNG NGHỆ WEB 4.0</span>
                <h3 className="text-base font-bold text-white mt-2">💻 Không cần cài đặt ứng dụng</h3>
                <p className="text-slate-400 text-xs leading-relaxed mt-1">
                  Chạy mượt mà trực tiếp trên mọi thiết bị: Điện thoại, Máy tính bảng, PC hay Laptop. Toàn bộ dữ liệu được lưu trữ tự động, đổi máy không sợ mất thông tin khách hàng.
                </p>
              </div>
              <button
                onClick={onEnterApp}
                className="mt-4 text-xs font-bold text-emerald-400 hover:text-emerald-300 text-left flex items-center gap-1 cursor-pointer"
              >
                Mở dùng thử ngay <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* Step Guide (Hướng dẫn sử dụng nhanh 3 bước) */}
      <section id="workflow" className="py-16 bg-slate-950 border-y border-slate-900 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center space-y-12 relative z-10">
          
          <div className="space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-900/60 inline-block">
              ✨ ĐƠN GIẢN DỄ HỌC CHO CẢ CÁC CÔ CHÚ LỚN TUỔI
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Hướng Dẫn Sử Dụng Nhanh 3 Bước
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Chưa đầy 1 phút để làm quen và chuyển đổi hoàn toàn sổ tay giấy truyền thống sang sổ thu công nghệ tự động hóa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            
            {/* Step 1: Đăng ký & Kết nối Cloud */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-6 border border-slate-800/90 shadow-xl relative space-y-4 hover:border-emerald-500/50 transition-all group">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800/60 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-6 h-6" />
                </div>
                <span className="text-3xl font-black text-emerald-500/30 font-mono">BƯỚC 01</span>
              </div>

              <div>
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block mb-1">KHỞI TẠO TÀI KHOẢN</span>
                <h3 className="text-lg font-extrabold text-white">1. Đăng Ký & Kết Nối Cloud</h3>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed">
                Mở ứng dụng trực tiếp trên điện thoại hay máy tính mà không cần tải hay cài đặt.
              </p>

              <ul className="text-xs text-slate-400 space-y-2 border-t border-slate-800/80 pt-3">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Đăng nhập Cloud</strong>: Nhấp Đăng nhập WordPress để tự động sao lưu dữ liệu mỗi ngày.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Cài đặt Đại lý</strong>: Điền Tên điểm thu, SĐT Zalo, mức hỗ trợ BHXH và tỷ lệ hoa hồng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Sử dụng ngay</strong>: Hoàn toàn miễn phí, có thể bấm 'Mở sổ' dùng ngay không cần đăng ký tài khoản.</span>
                </li>
              </ul>
            </div>

            {/* Step 2: Nhập danh sách khách hàng */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-6 border border-slate-800/90 shadow-xl relative space-y-4 hover:border-teal-500/50 transition-all group">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-teal-950 text-teal-400 flex items-center justify-center border border-teal-800/60 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <span className="text-3xl font-black text-teal-500/30 font-mono">BƯỚC 02</span>
              </div>

              <div>
                <span className="text-[10px] font-extrabold text-teal-400 uppercase tracking-widest block mb-1">NẠP DỮ LIỆU BÀ CON</span>
                <h3 className="text-lg font-extrabold text-white">2. Nhập Danh Sách Khách Hàng</h3>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed">
                Lưu trữ đầy đủ Họ tên, Mã BHXH/BHYT, SĐT và Hạn đóng phí của từng hộ dân cư.
              </p>

              <ul className="text-xs text-slate-400 space-y-2 border-t border-slate-800/80 pt-3">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Excel Import (Khuyên dùng)</strong>: Sao chép bảng dữ liệu từ Excel và dán trực tiếp trong 5 giây.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Thêm thủ công</strong>: Nhấp '+ Thêm Người Dân' để nhập thông tin từng người khi có phát sinh mới.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Xử lý ngày thông minh</strong>: Hỗ trợ định dạng `dd/mm/yyyy` hoặc `mm/yyyy`, linh hoạt để trống ngày nếu cần.</span>
                </li>
              </ul>
            </div>

            {/* Step 3: Phân nhóm & Nhắc hạn */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-6 border border-slate-800/90 shadow-xl relative space-y-4 hover:border-indigo-500/50 transition-all group">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-indigo-400 flex items-center justify-center border border-indigo-800/60 group-hover:scale-110 transition-transform">
                  <Bell className="w-6 h-6" />
                </div>
                <span className="text-3xl font-black text-indigo-500/30 font-mono">BƯỚC 03</span>
              </div>

              <div>
                <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block mb-1">GỬI LỜI NHẮC ĐỐN ĐỐC THU</span>
                <h3 className="text-lg font-extrabold text-white">3. Tự Động Lọc & Nhắc Hạn</h3>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed">
                Tự động gom nhóm ai sắp hết hạn đóng tiền và tạo sẵn nội dung tin nhắn đôn đốc.
              </p>

              <ul className="text-xs text-slate-400 space-y-2 border-t border-slate-800/80 pt-3">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Lọc đáo hạn</strong>: Lọc nhanh khách hàng còn 3 ngày, 7 ngày hoặc đã quá hạn chỉ bằng 1 cú nhấp.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Copy Nhanh (⚡)</strong>: Nhấp biểu tượng copy ngay cạnh họ tên để trích xuất thông tin gửi báo cáo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Nhắc Zalo / SMS</strong>: Hệ thống soạn sẵn tin nhắn chuẩn, cô chú chỉ việc dán gửi cho người dân trong 3s!</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setShowQuickGuideModal(true)}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-800/80 font-bold text-sm px-6 py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Xem Hướng Dẫn Chi Tiết Chi Tiết Bằng Hình Ảnh
            </button>

            <button
              onClick={onEnterApp}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-950/50 cursor-pointer flex items-center justify-center gap-2"
            >
              Tôi Đã Hiểu - Mở Sổ Thu Ngay
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      </section>

      {/* Pricing packages (Mô hình sử dụng) */}
      <section id="pricing" className="py-16 bg-slate-900/40 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">DỊCH VỤ LINH HOẠT</span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Mô Hình Dịch Vụ & Sử Dụng</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">Ứng dụng hoàn toàn miễn phí cho nhân viên thu. Gói triển khai riêng dành cho các đơn vị có nhu cầu cài đặt hệ thống độc lập.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            
            {/* Free Plan */}
            <div className="bg-slate-950 rounded-2xl border-2 border-emerald-500/80 p-8 space-y-6 flex flex-col justify-between text-left relative hover:border-emerald-400 transition-all shadow-xl shadow-emerald-950/20">
              <div className="absolute -top-3 left-6 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full">
                MIỄN PHÍ DÙNG NGAY
              </div>

              <div className="space-y-4 pt-1">
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full">GÓI SỬ DỤNG MIỄN PHÍ</span>
                <div className="text-3xl font-black font-sans text-white">0 VNĐ <span className="text-xs font-normal text-slate-400">/ Mãi mãi</span></div>
                <p className="text-xs text-slate-300 leading-relaxed">Phần mềm cung cấp miễn phí toàn bộ tính năng hỗ trợ công việc của Nhân viên thu BHXH, BHYT.</p>
                <ul className="text-xs text-slate-300 space-y-3 pt-2">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Quản lý <strong>không giới hạn</strong> người dân & dữ liệu</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Tự động phân nhóm & tạo lời nhắn Zalo/SMS</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Sao chép dán từ Excel, xuất file dự phòng</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Cấu hình biên nhận, hoa hồng & định mức thu</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Đồng bộ sao lưu đám mây an toàn</li>
                </ul>
              </div>
              <button
                onClick={onEnterApp}
                className="w-full font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl transition-all cursor-pointer text-center shadow-md font-sans"
              >
                Mở Sổ Sử Dụng Miễn Phí Ngay
              </button>
            </div>

            {/* Custom Deployment Plan */}
            <div className="bg-slate-950 text-white rounded-2xl border-2 border-slate-800 p-8 space-y-6 flex flex-col justify-between text-left relative overflow-hidden hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <span className="text-xs font-extrabold text-blue-400 uppercase tracking-widest bg-blue-950/60 border border-blue-800/80 px-3 py-1 rounded-full">HỆ TRIỂN KHAI RIÊNG</span>
                <div className="text-3xl font-black font-sans text-white">Liên hệ <span className="text-xs font-normal text-slate-400">/ Có phí triển khai</span></div>
                <p className="text-xs text-slate-300 leading-relaxed">Dành cho đơn vị, cơ quan hoặc điểm thu lớn cần triển khai hệ thống máy chủ & tên miền riêng.</p>
                <ul className="text-xs text-slate-300 space-y-3 pt-2">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Cài đặt hệ thống & cơ sở dữ liệu riêng biệt</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Tùy chỉnh giao diện, mẫu in & biểu mẫu theo yêu cầu</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Tích hợp tên miền thương hiệu riêng của cơ quan</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Đào tạo & bảo trì kỹ thuật tận nơi 24/7</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Phát triển bởi Freelancer Long Web Studio</li>
                </ul>
              </div>
              
              <a
                href="https://zalo.me/0966570913"
                target="_blank"
                rel="noreferrer"
                className="w-full font-extrabold text-xs bg-slate-900 hover:bg-slate-800 text-blue-400 hover:text-white py-3.5 rounded-xl transition-all cursor-pointer text-center border border-blue-900/60 block"
              >
                Liên Hệ Báo Giá Triển Khai (Zalo: 0966570913)
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* Customer Trust (Cô chú tin dùng) */}
      <section id="trust" className="py-16 bg-slate-950 border-t border-slate-900 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Ý KIẾN ĐẠI LÝ THỰC TẾ</span>
            <h2 className="text-3xl font-extrabold text-white">Hàng Ngàn Đại Lý Đã Thay Thế Sổ Tay</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">Nghe chia sẻ từ những cô chú đang trực tiếp phụ trách các tổ thu dân cư và khu phố.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            
            {/* Review 1 */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 space-y-3 shadow-xs">
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current text-amber-500" />)}
              </div>
              <p className="text-slate-300 text-xs italic leading-relaxed">
                "Trước đây viết sổ gạch đi xóa lại suốt, mấy lần mưa dột làm mờ hết ngày hết hạn của bà con rồi bị mắng vì quá hạn không báo trước. Có phần mềm này tôi yên tâm hẳn, cứ vài ngày liếc xem danh sách là biết ai sắp hết tiền để nhắc sớm."
              </p>
              <div>
                <h4 className="text-xs font-bold text-white">Cô Nguyễn Thị Xuân</h4>
                <p className="text-[10px] text-slate-500">Ủy nhiệm thu BHXH Xã Bình Dương</p>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 space-y-3 shadow-xs">
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current text-amber-500" />)}
              </div>
              <p className="text-slate-300 text-xs italic leading-relaxed">
                "Tôi lớn tuổi rồi, gõ bàn phím chậm nhưng cháu Long hướng dẫn làm 3 bước đơn giản lắm. Từ ngày đổi sang dùng web Lws tôi không lật tìm mỏi mắt nữa. Ai gọi tới gõ 3 chữ là ra hết mã thẻ, ngày hết hạn luôn."
              </p>
              <div>
                <h4 className="text-xs font-bold text-white">Chú Lê Văn Minh</h4>
                <p className="text-[10px] text-slate-500">Tổ Trưởng Tổ Thu Phố Thanh Xuân, Hà Nội</p>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 space-y-3 shadow-xs md:col-span-2 lg:col-span-1">
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current text-amber-500" />)}
              </div>
              <p className="text-slate-300 text-xs italic leading-relaxed">
                "Cầm file Excel từ trên phường đổ về dán một cái là hệ thống tạo xong ngay danh sách mấy chục hộ. Tính hoa hồng tự động minh bạch báo cáo tiền thu hàng ngày nên đỡ cực khâu sổ sách đáng kể."
              </p>
              <div>
                <h4 className="text-xs font-bold text-white">Chị Đặng Minh Hằng</h4>
                <p className="text-[10px] text-slate-500">Đại lý bảo hiểm tự nguyện Khu vực Cầu Giấy</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Footer information */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-4 border-t border-slate-900 text-xs text-center">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-neutral-800 pb-8">
            <div className="text-left space-y-1">
              <div className="text-white font-bold text-sm tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                LWS - Sổ thu bảo hiểm
              </div>
              <p className="max-w-md text-[11px] text-neutral-400">
                Phần mềm quản lý sổ thu chuyên nghiệp dành cho nhân viên thu BHXH, BHYT. Phát triển bởi Freelancer Long Web Studio.
              </p>
              <div className="text-[11px] text-slate-300 pt-1 space-y-0.5">
                <p>📞 Zalo / SĐT: <strong className="text-emerald-400 font-mono">0966570913</strong></p>
                <p>✉️ Email: <strong className="text-emerald-400">contact@longwebstudio.io.vn</strong></p>
                <p>🌐 Website: <a href="https://longwebstudio.io.vn" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">longwebstudio.io.vn</a></p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 text-[11px]">
              <button 
                type="button" 
                onClick={() => setShowTermsModal(true)} 
                className="hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Điều khoản sử dụng
              </button>
              <span>•</span>
              <button 
                type="button" 
                onClick={() => setShowTermsModal(true)} 
                className="hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Chính sách bảo mật
              </button>
              <span>•</span>
              <a href="https://longwebstudio.io.vn" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline font-semibold">
                longwebstudio.io.vn
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500">
            <p>© 2026 Freelancer Long Web Studio (LWS). Đã đăng ký bản quyền thương hiệu Sổ Thu Bảo Hiểm.</p>
            <p>Trực thuộc hệ thống giải pháp công nghệ nâng cấp cho Nhân viên thu BHXH, BHYT.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
