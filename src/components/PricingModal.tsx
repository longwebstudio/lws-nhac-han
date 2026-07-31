/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Check, Zap, Cloud, ShieldCheck, Smartphone, Sparkles, HardDrive, RefreshCw, QrCode, Lock, Building2, Server, PhoneCall } from 'lucide-react';

interface PricingModalProps {
  currentPlan: 'offline' | 'online_pro';
  onSelectPlan: (plan: 'offline' | 'online_pro') => void;
  onClose: () => void;
}

export default function PricingModal({ currentPlan, onSelectPlan, onClose }: PricingModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [showPaymentQR, setShowPaymentQR] = useState(false);

  const monthlyPrice = 99000;
  const yearlyPrice = 1089000; // 11 tháng x 99.000đ = 1.089.000đ (Tiết kiệm 1 tháng sử dụng ~ 99.000đ)

  const handleChoosePro = () => {
    setShowPaymentQR(true);
  };

  const handleConfirmActivation = () => {
    onSelectPlan('online_pro');
    setShowPaymentQR(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div 
        id="pricing-modal-card"
        className="bg-slate-900 rounded-2xl max-w-6xl w-full shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 text-slate-100 my-auto"
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-b border-slate-850 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-base sm:text-lg font-bold font-sans text-white">Bảng Giá Dịch Vụ Sổ Thu Bảo Hiểm</h3>
            </div>
            <p className="text-xs text-emerald-300/80 mt-0.5">Miễn phí vĩnh viễn khi dùng Offline - Mức phí Online Pro ưu đãi tương đương Zalo Pro</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 min-h-0">
          {showPaymentQR ? (
            /* Payment QR step for Online Pro */
            <div className="max-w-md mx-auto bg-slate-950 border border-emerald-500/50 rounded-2xl p-6 text-center space-y-4 shadow-xl">
              <div className="inline-flex p-3 bg-emerald-500/10 rounded-full text-emerald-400 border border-emerald-500/30 mb-1">
                <QrCode className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white">Đăng Ký Gói Online Pro</h4>
              <p className="text-xs text-slate-300">
                Gói: <strong className="text-emerald-400 font-mono">{billingCycle === 'yearly' ? 'Pro 1 Năm (1.089.000đ - Tặng 1 tháng)' : 'Pro 1 Tháng (99.000đ/tháng)'}</strong>
              </p>

              {/* VietQR Mockup Card */}
              <div className="bg-white p-4 rounded-xl max-w-[240px] mx-auto shadow-md border border-slate-200">
                <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider mb-2">MB BANK - 0987654321</div>
                <div className="bg-slate-100 p-2 rounded-lg border border-slate-300 aspect-square flex flex-col items-center justify-center text-slate-800">
                  <QrCode className="w-32 h-32 text-slate-900" />
                  <span className="text-[9px] font-bold text-slate-600 mt-1">LONG WEB STUDIO CO., LTD</span>
                </div>
                <div className="text-[11px] font-black text-slate-900 font-mono mt-2">
                  {billingCycle === 'yearly' ? '1.089.000 VNĐ' : '99.000 VNĐ'}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">Nội dung: SOTHUBH ONPRO</div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-left space-y-1">
                <p className="font-semibold text-slate-300">💡 Quyền lợi kích hoạt ngay:</p>
                <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                  <li>Đồng bộ Cloud đa thiết bị điện thoại & máy tính</li>
                  <li>Bảo mật & quản lý dữ liệu tập trung cho tổ thu</li>
                  <li>Sao lưu an toàn chống mất dữ liệu 100%</li>
                </ul>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentQR(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer transition-colors"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleConfirmActivation}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/40 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Kích Hoạt Ngay
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Cycle Toggle */}
              <div className="flex items-center justify-center">
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      billingCycle === 'monthly'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Thanh toán Tháng (99k/tháng)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      billingCycle === 'yearly'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Thanh toán Năm (1.089k/năm)</span>
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                      Tặng 1 Tháng (Tiết kiệm 99k)
                    </span>
                  </button>
                </div>
              </div>

              {/* Pricing Cards Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {/* Plan 1: Offline (Free) */}
                <div className={`bg-slate-950 rounded-2xl border p-6 flex flex-col justify-between transition-all relative ${
                  currentPlan === 'offline' 
                    ? 'border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}>
                  {currentPlan === 'offline' && (
                    <div className="absolute -top-3 left-6 bg-slate-800 text-emerald-400 border border-emerald-500/60 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                      Đang sử dụng
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-300">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">Bản Offline</h4>
                        <p className="text-[11px] text-slate-400">Miễn Phí Vĩnh Viễn</p>
                      </div>
                    </div>

                    <div className="my-4 pb-4 border-b border-slate-850">
                      <div className="text-2xl font-black text-white font-mono">0 VNĐ</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Sử dụng độc lập trên thiết bị cá nhân</p>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Tự động tính hoa hồng BHYT & BHXH</strong> chuẩn định mức Hợp đồng</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Quản lý không giới hạn danh sách người dân & lịch sử đóng</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Xuất & Nhập file Excel dự phòng dữ liệu cá nhân</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Tạo tin nhắn nhắc nộp tiền BHYT/BHXH nhanh</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Lưu trữ dữ liệu an toàn trên bộ nhớ trình duyệt local</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectPlan('offline');
                    }}
                    disabled={currentPlan === 'offline'}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentPlan === 'offline'
                        ? 'bg-slate-900 text-emerald-400 border border-slate-800 cursor-default'
                        : 'bg-slate-900 hover:bg-slate-850 text-white border border-slate-700'
                    }`}
                  >
                    {currentPlan === 'offline' ? 'Đang Sử Dụng Bản Offline' : 'Chuyển Về Bản Offline (Miễn phí)'}
                  </button>
                </div>

                {/* Plan 2: Online Pro */}
                <div className={`bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl border p-6 flex flex-col justify-between transition-all relative ${
                  currentPlan === 'online_pro'
                    ? 'border-emerald-400 shadow-xl shadow-emerald-950/60 ring-2 ring-emerald-500'
                    : 'border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                }`}>
                  <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                    🔥 ƯU ĐÃI TƯƠNG ĐƯƠNG ZALO PRO
                  </div>

                  {currentPlan === 'online_pro' && (
                    <div className="absolute -top-3 left-6 bg-emerald-500 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider">
                      Đang kích hoạt Pro
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/40 text-emerald-400">
                        <Cloud className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                          <span>Bản Online Pro</span>
                          <Sparkles className="w-4 h-4 text-amber-400" />
                        </h4>
                        <p className="text-[11px] text-emerald-300/80">Đồng bộ Đám mây & Quản lý Thu phí Cá nhân</p>
                      </div>
                    </div>

                    <div className="my-4 pb-4 border-b border-slate-800">
                      <div className="text-2xl font-black text-emerald-400 font-mono flex items-baseline gap-1">
                        <span>{billingCycle === 'yearly' ? '1.089.000 VNĐ' : '99.000 VNĐ'}</span>
                        <span className="text-xs font-normal text-slate-400">
                          / {billingCycle === 'yearly' ? 'năm (Tính 11 tháng - Tặng 1 tháng)' : 'tháng'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {billingCycle === 'yearly'
                          ? '🎁 Đóng 11 tháng (1.089.000đ), được sử dụng trọn vẹn 12 tháng (Tiết kiệm 99.000đ)'
                          : 'Linh hoạt gia hạn từng tháng theo nhu cầu công việc'}
                      </p>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-200 mb-6">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Tất cả tính năng</strong> của Bản Offline Miễn phí</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Cloud className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <span><strong>Đồng bộ Cloud đa thiết bị</strong> (Điện thoại, Máy tính, Máy tính bảng)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Tự động sao lưu 100%</strong> an toàn chống mất dữ liệu khi hỏng máy</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span><strong>Tạo mẫu tin nhắn nhắc nộp tiền</strong> gửi nhanh qua Zalo & SMS</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Thống kê hoa hồng & báo cáo thu phí cá nhân</strong> chi tiết theo tháng và năm</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                        <span><strong>Hỗ trợ kỹ thuật 24/7 (1-1 qua Zalo)</strong>: Hướng dẫn cài đặt, hỗ trợ chuẩn hóa Excel & khôi phục dữ liệu</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <RefreshCw className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                        <span><strong>Cập nhật tính năng & chính sách BHYT/BHXH mới</strong> hoàn toàn miễn phí</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={handleChoosePro}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      currentPlan === 'online_pro'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/40'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{currentPlan === 'online_pro' ? 'Đang Dùng Online Pro (Gia hạn)' : 'Nâng Cấp Bản Online Pro (Áp Dụng Ngay)'}</span>
                  </button>
                </div>

                {/* Plan 3: Special Custom Private Deployment */}
                <div className="bg-slate-950 rounded-2xl border border-sky-500/60 p-6 flex flex-col justify-between transition-all relative hover:border-sky-400 shadow-lg shadow-sky-950/30">
                  <div className="absolute -top-3 right-6 bg-sky-500 text-slate-950 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                    👑 TRIỂN KHAI HỆ THỐNG RIÊNG
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-sky-500/20 rounded-lg border border-sky-500/40 text-sky-400">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                          <span>Gói Triển Khai Riêng</span>
                        </h4>
                        <p className="text-[11px] text-sky-300/80">Hạ Tầng & Thương Hiệu Độc Lập</p>
                      </div>
                    </div>

                    <div className="my-4 pb-4 border-b border-slate-850">
                      <div className="text-2xl font-black text-sky-400 font-mono">Thỏa Thuận</div>
                      <p className="text-[11px] text-slate-300 mt-0.5">Liên hệ trực tiếp để tư vấn & báo cáo dự toán theo quy mô</p>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-200 mb-6">
                      <li className="flex items-start gap-2">
                        <Server className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <span><strong>Cài đặt Máy chủ & Cơ sở dữ liệu Cloud riêng biệt</strong> bảo mật tuyệt đối</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <span><strong>Tùy chỉnh Tên miền thương hiệu riêng</strong> của Cơ quan / Đơn vị (VD: sothu.donvi.gov.vn)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <span><strong>Thiết kế mẫu in biên nhận, biểu mẫu & báo cáo</strong> theo đúng chuẩn mẫu đặc thù</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <span><strong>Phân quyền quản lý đa tài khoản</strong> cho tổ thu, ban ngành hoặc chi nhánh</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <PhoneCall className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <span><strong>Đào tạo hướng dẫn tận nơi & bảo trì 24/7</strong> trực tiếp bởi Kỹ sư phần mềm</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span><strong>Lập trình phát triển thêm tính năng riêng</strong> theo yêu cầu hợp đồng (Long Web Studio)</span>
                      </li>
                    </ul>
                  </div>

                  <a
                    href="https://zalo.me/0966570913"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-white border border-sky-800/80 shadow-md text-center"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Liên Hệ Tư Vấn Báo Giá (Zalo: 0966570913)</span>
                  </a>
                </div>
              </div>

              {/* FAQ Note */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs text-slate-400 space-y-1.5">
                <p className="font-bold text-slate-200">📌 Cam kết dịch vụ & Hỗ trợ kỹ thuật:</p>
                <p>• <strong>Bản Offline:</strong> Luôn <strong>Miễn phí vĩnh viễn</strong> cho nhân viên thu sử dụng cá nhân lưu trữ trên máy tính/điện thoại.</p>
                <p>• <strong>Hỗ trợ Gói Online Pro:</strong> Nhân viên kỹ thuật hỗ trợ 1-1 qua Zalo/Điện thoại 24/7, hướng dẫn cài đặt, hỗ trợ chuẩn hóa danh sách Excel ban đầu và bảo vệ dữ liệu chống mất 100%.</p>
                <p>• Mức phí Online Pro ưu đãi tiết kiệm (chỉ 99k/tháng hoặc 1.089k/năm - tặng 1 tháng) hỗ trợ nhân viên thu tối đa hóa lợi nhuận hoa hồng.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
