/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, InsuranceType, PaymentHistory, UserSettings } from '../types';
import { X, Save, Plus, Trash2, ShieldCheck, DollarSign, Calendar, Eye, FileText, Copy, Check, Sparkles, RefreshCw } from 'lucide-react';
import { getAutoCommissionRate } from '../lib/commission';

interface CustomerModalProps {
  customer?: Customer; // If undefined, we are creating a new customer
  customers: Customer[]; // All customers for overlap/link checking
  settings: UserSettings;
  onSave: (customer: Customer, parallelCustomer?: Customer) => void;
  onClose: () => void;
  onSwitchCustomer?: (customer: Customer) => void;
  onDelete?: (id: string) => void;
}

export default function CustomerModal({ customer, customers, settings, onSave, onClose, onSwitchCustomer, onDelete }: CustomerModalProps) {
  // main form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cccd, setCccd] = useState('');
  const [insuranceCode, setInsuranceCode] = useState(''); // BHYT/BHXH 10 số
  const [expiryDate, setExpiryDate] = useState(''); // BHYT Expiry
  const [hasBHYT, setHasBHYT] = useState(true); // Có tham gia BHYT hay không
  const [hasBHXH, setHasBHXH] = useState(false); // Có tham gia BHXH hay không
  const [insuranceCodeBHXH, setInsuranceCodeBHXH] = useState(''); // BHXH
  const [expiryDateBHXH, setExpiryDateBHXH] = useState(''); // BHXH Expiry
  const [type, setType] = useState<InsuranceType>('BHYT'); // Dùng cho loại hình đóng tiền hiện tại
  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<'Nam' | 'Nữ' | ''>('');

  const [copied, setCopied] = useState(false);

  // payment inputs
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [periodMonths, setPeriodMonths] = useState('12');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentCategory, setPaymentCategory] = useState<string>('Gia hạn BHYT');
  const autoRate = getAutoCommissionRate(type, paymentCategory, Number(periodMonths) || 12, settings.commissionMatrix);
  const [customCommissionRate, setCustomCommissionRate] = useState<number>(autoRate);
  const [isRateManuallyEdited, setIsRateManuallyEdited] = useState(false);

  // Automatically recalculate commission rate according to contract table
  useEffect(() => {
    if (!isRateManuallyEdited) {
      setCustomCommissionRate(autoRate);
    }
  }, [type, paymentCategory, periodMonths, autoRate, isRateManuallyEdited]);
  const [createParallel, setCreateParallel] = useState(false);

  // Quick Vietnamese BHYT & BHXH Premium Estimator states
  const [bhytMemberOrder, setBhytMemberOrder] = useState<number>(1); // 1 = 100%, 2 = 70%, 3 = 60%, 4 = 50%, 5 = 40%
  const [bhxhIncomeChoice, setBhxhIncomeChoice] = useState<number>(1500000); // poverty line 1.5M, base wage 2.34M, etc.
  const [bhxhSupportTier, setBhxhSupportTier] = useState<string>('other'); // 'none', 'other' (10%), 'near_poor' (25%), 'poor' (30%)
  const [deleteCustomerConfirm, setDeleteCustomerConfirm] = useState(false);
  const [deletePaymentConfirmId, setDeletePaymentConfirmId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const getSuggestedPremium = () => {
    const months = parseInt(periodMonths) || 12;
    if (type === 'BHYT') {
      // Vietnam BHYT Hộ gia đình (dynamic from settings, default 2,530,000 VND base salary)
      const baseSalary = settings.baseSalaryBHYT || 2530000;
      const baseMonthly = Math.round(baseSalary * 0.045);
      let multiplier = 1.0;
      let label = 'Thành viên thứ 1 (Mức đóng 100%)';
      
      if (bhytMemberOrder === 2) {
        multiplier = 0.7;
        label = 'Thành viên thứ 2 (Mức đóng 70%)';
      } else if (bhytMemberOrder === 3) {
        multiplier = 0.6;
        label = 'Thành viên thứ 3 (Mức đóng 60%)';
      } else if (bhytMemberOrder === 4) {
        multiplier = 0.5;
        label = 'Thành viên thứ 4 (Mức đóng 50%)';
      } else if (bhytMemberOrder >= 5) {
        multiplier = 0.4;
        label = 'Từ thành viên thứ 5+ (Mức đóng 40%)';
      }
      
      const monCost = Math.round(baseMonthly * multiplier);
      const totalCost = monCost * months;
      return {
        amount: totalCost,
        note: `BHYT Hộ gia đình - ${label} | Chu kỳ đóng: ${months} tháng`
      };
    } else {
      // Vietnam Voluntary BHXH
      let supportAmount = settings.supportOtherBHXH !== undefined ? settings.supportOtherBHXH : 132000;
      let supportLabel = `Đối tượng khác (${supportAmount.toLocaleString()}đ/tháng)`;
      
      if (bhxhSupportTier === 'none') {
        supportAmount = 0;
        supportLabel = 'Không nhận hỗ trợ';
      }
      
      const rawCostPerMonth = Math.round(bhxhIncomeChoice * 0.22);
      const monNetCost = rawCostPerMonth - supportAmount;
      const totalCost = Math.max(0, Math.round(monNetCost * months));
      
      return {
        amount: totalCost,
        note: `BHXH tự nguyện - Thu nhập lựa chọn: ${bhxhIncomeChoice.toLocaleString()}đ/tháng | Hỗ trợ: ${supportLabel} | Chu kỳ đóng: ${months} tháng`
      };
    }
  };

  const applySuggestedPremium = () => {
    const suggested = getSuggestedPremium();
    setPaymentAmount(suggested.amount.toString());
    setPaymentNote(suggested.note);
  };

  useEffect(() => {
    setCreateParallel(false);
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setCccd(customer.cccd);
      setInsuranceCode(customer.insuranceCode);
      setExpiryDate(customer.expiryDate || new Date().toISOString().split('T')[0]);
      setHasBHYT(customer.hasBHYT !== false);
      setHasBHXH(!!customer.hasBHXH);
      setInsuranceCodeBHXH(customer.insuranceCodeBHXH || '');
      setExpiryDateBHXH(customer.expiryDateBHXH || '');
      setNotes(customer.notes || '');
      setAddress(customer.address || '');
      setStatus(customer.status);
      setPaymentHistory(customer.paymentHistory || []);
      // default the estimator/payment selector type to BHXH if they only have BHXH, otherwise BHYT
      setType(customer.hasBHYT === false && customer.hasBHXH ? 'BHXH' : 'BHYT');
      setBirthday(customer.birthday || '');
      setGender(customer.gender || '');
    } else {
      setName('');
      setPhone('');
      setCccd('');
      setInsuranceCode('');
      setExpiryDate(new Date().toISOString().split('T')[0]);
      setHasBHYT(true);
      setHasBHXH(false);
      setInsuranceCodeBHXH('');
      setExpiryDateBHXH('');
      setNotes('');
      setAddress('');
      setStatus('active');
      setPaymentHistory([]);
      setType('BHYT');
      setBirthday('');
      setGender('');
    }
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setBhxhIncomeChoice(settings.povertyStandardBHXH || 1500000);
  }, [customer, settings.povertyStandardBHXH]);

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) {
      alert('Vui lòng nhập số tiền hợp lý');
      return;
    }

    // calculate commission using rate stored or edited
    const commissionRate = typeof customCommissionRate === 'number' && !isNaN(customCommissionRate) 
      ? customCommissionRate 
      : (type === 'BHXH' ? settings.bhxhCommissionRate : settings.bhytCommissionRate);
    const commissionAmount = Math.round(amount * (commissionRate / 100));

    const newPayment: PaymentHistory = {
      id: `pay-${Date.now()}`,
      paymentDate,
      amountPaid: amount,
      periodMonths: parseInt(periodMonths) || 12,
      commissionAmount,
      commissionRate,
      category: paymentCategory,
      type,
      note: paymentNote || `${paymentCategory} - Chu kỳ ${periodMonths} tháng`
    };

    const updatedHistory = [newPayment, ...paymentHistory];
    setPaymentHistory(updatedHistory);

    // auto-update expiry date based on selected period
    const baseDate = new Date(paymentDate);
    baseDate.setMonth(baseDate.getMonth() + parseInt(periodMonths));
    const newExpiry = baseDate.toISOString().split('T')[0];
    
    if (type === 'BHXH') {
      setExpiryDateBHXH(newExpiry);
      setHasBHXH(true);
    } else {
      setExpiryDate(newExpiry);
    }

    // Clear and toggle
    setPaymentAmount('');
    setPaymentNote('');
    setShowAddPayment(false);
  };

  const handleDeletePayment = (id: string) => {
    setPaymentHistory(prev => prev.filter(p => p.id !== id));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!name.trim()) {
      setModalError('Vui lòng điền đầy đủ họ tên khách hàng');
      return;
    }

    if (!hasBHYT && !hasBHXH) {
      setModalError('Vui lòng chọn ít nhất 1 loại hình bảo hiểm theo dõi (BHYT Hộ gia đình hoặc BHXH Tự nguyện)');
      return;
    }

    if (!insuranceCode.trim()) {
      setModalError('Vui lòng nhập Mã số BHXH (hoặc Mã thẻ BHYT) của người dân');
      return;
    }

    const cleanCode = insuranceCode.trim().toUpperCase();
    const extractedBHXHCode = cleanCode.length >= 10 ? cleanCode.slice(-10) : cleanCode;

    const savedCustomer: Customer = {
      id: customer?.id || `cust-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      cccd: cccd.trim(),
      insuranceCode: cleanCode,
      insuranceCodeBHXH: hasBHXH ? (insuranceCodeBHXH.trim() || extractedBHXHCode) : undefined,
      hasBHYT: hasBHYT,
      hasBHXH: hasBHXH,
      expiryDate: hasBHYT ? (expiryDate || new Date().toISOString().split('T')[0]) : '',
      expiryDateBHXH: hasBHXH ? (expiryDateBHXH || new Date().toISOString().split('T')[0]) : undefined,
      createdAt: customer?.createdAt || new Date().toISOString().split('T')[0],
      notes: notes.trim(),
      status,
      paymentHistory,
      birthday: birthday.trim() || undefined,
      gender: gender as 'Nam' | 'Nữ' || undefined,
      address: address.trim() || undefined
    };

    onSave(savedCustomer);
    onClose();
  };

  const handleCopyQuickDetails = () => {
    if (!customer) return;
    // Get social security code
    let codeBHXH = '';
    if (customer.insuranceCodeBHXH) {
      codeBHXH = customer.insuranceCodeBHXH.trim();
    } else {
      const bhyt = customer.insuranceCode || '';
      codeBHXH = bhyt.length >= 10 ? bhyt.slice(-10) : bhyt;
    }

    // Format birthday YYYY-MM-DD -> DD/MM/YYYY
    const formattedBirthday = customer.birthday
      ? (customer.birthday.includes('-') ? customer.birthday.split('-').reverse().join('/') : customer.birthday)
      : '';

    const details = [
      customer.name,
      codeBHXH,
      formattedBirthday,
      customer.notes || ''
    ].join(', ');

    navigator.clipboard.writeText(details);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div 
        id="customer-modal"
        className="bg-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 text-slate-100"
      >
        {/* Title view */}
        <div className="px-5 py-3 bg-gradient-to-r from-emerald-950 to-teal-900 border-b border-slate-850 text-white flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold font-sans text-white leading-tight flex items-center gap-1.5 flex-wrap">
                <span>{customer ? `Chi Tiết Sổ Thu: ${customer.name}` : 'Thêm Người Dân Mới'}</span>
                {customer && (
                  <button
                    type="button"
                    onClick={handleCopyQuickDetails}
                    className={`p-1 rounded-md border transition-all cursor-pointer inline-flex items-center justify-center shrink-0 ${
                      copied
                        ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400'
                        : 'bg-slate-950/40 text-slate-300 border-slate-800 hover:bg-slate-900 hover:text-emerald-400 hover:border-emerald-500/50'
                    }`}
                    title={copied ? 'Đã sao chép!' : 'Sao chép nhanh: Họ tên, Mã BHXH, Ngày sinh, Ghi chú'}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </h3>
            </div>
            <p className="text-[10px] text-emerald-300/80 mt-0.5">Sổ ghi chép thông tin thu phí BHXH, BHYT</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content columns */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* Left panel: Info form */}
          <form onSubmit={handleFormSubmit} className="lg:col-span-7 p-6 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Thông tin hành chính người tham gia
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Họ và tên người dân *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập chữ in hoa có dấu..."
                  required
                  className="w-full text-sm px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-emerald-500 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-emerald-500 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Giới tính</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full text-sm px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
                  >
                    <option className="bg-slate-900" value="">Chọn...</option>
                    <option className="bg-slate-900" value="Nam">Nam</option>
                    <option className="bg-slate-900" value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Số điện thoại liên hệ *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0912xxxxxx"
                  required
                  className="w-full text-sm px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-emerald-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Số CCCD hàng (12 số)</label>
                <input
                  type="text"
                  value={cccd}
                  onChange={(e) => setCccd(e.target.value)}
                  placeholder="Ví dụ: 03819xxxxxxx"
                  className="w-full text-sm px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-emerald-500 text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-emerald-400 mb-1">
                  Mã số BHXH / Mã thẻ BHYT *
                </label>
                <input
                  type="text"
                  value={insuranceCode}
                  onChange={(e) => setInsuranceCode(e.target.value.toUpperCase())}
                  placeholder="Nhập 10 chữ số Mã BHXH (hoặc 15 ký tự Mã thẻ BHYT)..."
                  required
                  className="w-full text-sm px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-emerald-500 text-white font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  💡 Mỗi người dân có một mã số BHXH duy nhất (gồm 10 chữ số, cũng chính là 10 chữ số cuối cùng trên mã thẻ BHYT 15 ký tự).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Trạng thái theo dõi</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full text-sm px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-emerald-500 text-white"
                >
                  <option className="bg-slate-900" value="active">Đang phục vụ (Bật nhắc lịch)</option>
                  <option className="bg-slate-900" value="inactive">Tạm ngưng (Tắt nhắc lịch)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Địa chỉ thường trú</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Xã/Phường, Quận/Huyện..."
                  className="w-full text-sm px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-emerald-500 text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Ghi chú thêm về hoàn cảnh</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Hạn đóng 5 năm liên tục, ghi chú liên hệ khác..."
                  className="w-full text-xs px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-emerald-500 text-white"
                />
              </div>
            </div>

            {/* Selection for Participating Insurance Types (BHYT / BHXH) */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Loại hình bảo hiểm tham gia theo dõi *
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* BHYT Box */}
                <div className={`p-3.5 rounded-xl border transition-all ${hasBHYT ? 'bg-emerald-950/20 border-emerald-800/60' : 'bg-slate-950/40 border-slate-850 opacity-60'} space-y-2.5`}>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-white flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasBHYT}
                        onChange={(e) => setHasBHYT(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                      />
                      Bảo hiểm Y tế (BHYT)
                    </label>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${hasBHYT ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                      {hasBHYT ? 'THEO DÕI BHYT' : 'BỎ QUA BHYT'}
                    </span>
                  </div>

                  {hasBHYT && (
                    <div className="pt-2 border-t border-emerald-900/40 animate-in fade-in duration-200">
                      <label className="block text-[11px] font-semibold text-emerald-300 mb-1">Hạn đóng BHYT *</label>
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        required={hasBHYT}
                        className="w-full text-xs px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-emerald-500 text-white font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* BHXH Box */}
                <div className={`p-3.5 rounded-xl border transition-all ${hasBHXH ? 'bg-indigo-950/25 border-indigo-900/60' : 'bg-slate-950/40 border-slate-850 opacity-60'} space-y-2.5`}>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-white flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasBHXH}
                        onChange={(e) => setHasBHXH(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                      />
                      Bảo hiểm Xã hội (BHXH) Tự nguyện
                    </label>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${hasBHXH ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-slate-900 text-slate-500'}`}>
                      {hasBHXH ? 'THEO DÕI BHXH' : 'BỎ QUA BHXH'}
                    </span>
                  </div>

                  {hasBHXH && (
                    <div className="pt-2 border-t border-indigo-900/40 animate-in fade-in duration-200 space-y-2">
                      <div className="text-[10px] text-indigo-300 flex items-center justify-between bg-slate-950 px-2 py-1 rounded border border-indigo-950">
                        <span>Mã BHXH áp dụng:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {insuranceCode.trim().length >= 10 ? insuranceCode.trim().slice(-10) : (insuranceCode.trim() || 'Dùng mã chung ở trên')}
                        </span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-indigo-300 mb-1">Hạn đóng BHXH Tự nguyện *</label>
                        <input
                          type="date"
                          value={expiryDateBHXH || new Date().toISOString().split('T')[0]}
                          onChange={(e) => setExpiryDateBHXH(e.target.value)}
                          required={hasBHXH}
                          className="w-full text-xs px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-indigo-500 text-white font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {modalError && (
              <div className="bg-rose-950/40 border border-rose-900 text-rose-400 px-4 py-3 rounded-lg text-xs leading-relaxed mb-4 flex items-center justify-between">
                <span>{modalError}</span>
                <button 
                  type="button" 
                  onClick={() => setModalError(null)}
                  className="text-slate-400 hover:text-white"
                >
                  X
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-slate-850 flex justify-between items-center gap-2">
              <div>
                {customer && onDelete && (
                  deleteCustomerConfirm ? (
                    <div className="flex items-center gap-1.5 bg-rose-950/60 border border-slate-800 rounded-lg p-1 animate-fade-in text-slate-300">
                      <span className="text-[10px] text-white font-bold px-1.5">Chắc chắn xóa?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(customer.id);
                          onClose();
                        }}
                        className="text-[10px] font-black text-white bg-rose-600 hover:bg-rose-500 px-2.5 py-1 rounded cursor-pointer transition-colors"
                      >
                        Có, Xóa!
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteCustomerConfirm(false)}
                        className="text-[10px] font-semibold text-slate-400 hover:text-white px-2 py-1 rounded cursor-pointer transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteCustomerConfirm(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-450 hover:text-white hover:bg-rose-950/40 border border-rose-900/40 hover:border-rose-900 px-3.5 py-2 rounded-lg transition-all cursor-pointer"
                      title="Xóa vĩnh viễn hồ sơ này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa hồ sơ
                    </button>
                  )
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm text-slate-300 bg-slate-950 border border-slate-800 hover:bg-slate-900 hover:text-white px-4 py-2 rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-5 py-2 rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Lưu Thay Đổi
                </button>
              </div>
            </div>
          </form>

          {/* Right panel: Payment history list & fast logging */}
          <div className="lg:col-span-5 p-6 bg-slate-950/40 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Lịch sử đóng bảo hiểm ({paymentHistory.length})
                </h4>
                
                <button
                  type="button"
                  onClick={() => setShowAddPayment(!showAddPayment)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 border border-emerald-900/60 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  {showAddPayment ? 'Đóng form' : 'Ghi biên nhận'}
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add Payment Panel Inside */}
              {showAddPayment && (
                <form onSubmit={handleAddPayment} className="bg-slate-900/40 border border-emerald-900/50 rounded-xl p-4 shadow-sm space-y-3 mb-4 animate-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-emerald-300 uppercase tracking-wide block">Ghi nhận biên lai đóng tiền:</span>
                    {hasBHXH && (
                      <span className="text-[10px] font-bold text-indigo-300">Hỗ trợ 2 loại hình</span>
                    )}
                  </div>
                  
                  {hasBHXH && (
                    <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold pb-1">
                      <button
                        type="button"
                        onClick={() => {
                          setType('BHYT');
                          setPaymentCategory('Gia hạn BHYT');
                          setIsRateManuallyEdited(false);
                        }}
                        className={`py-1.5 rounded-lg cursor-pointer border text-[11px] transition-colors ${
                          type === 'BHYT'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500 font-bold'
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}
                      >
                        Nộp phí BHYT Hộ gia đình
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setType('BHXH');
                          setPaymentCategory('Gia hạn BHXH');
                          setIsRateManuallyEdited(false);
                        }}
                        className={`py-1.5 rounded-lg cursor-pointer border text-[11px] transition-colors ${
                          type === 'BHXH'
                            ? 'bg-indigo-950/60 text-indigo-400 border-indigo-500 font-bold'
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}
                      >
                        Nộp phí BHXH Tự nguyện
                      </button>
                    </div>
                  )}

                  {/* Phân loại giao dịch: Tăng mới vs Gia hạn */}
                  <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                    <label className="block text-[10px] font-bold text-slate-300">Phân loại nghiệp vụ:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {type === 'BHYT' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentCategory('Gia hạn BHYT');
                              setIsRateManuallyEdited(false);
                            }}
                            className={`py-1 text-[10px] font-bold rounded cursor-pointer border transition-all ${
                              paymentCategory === 'Gia hạn BHYT'
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850'
                            }`}
                          >
                            🔄 Gia hạn BHYT
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentCategory('Tăng mới BHYT');
                              setIsRateManuallyEdited(false);
                            }}
                            className={`py-1 text-[10px] font-bold rounded cursor-pointer border transition-all ${
                              paymentCategory === 'Tăng mới BHYT'
                                ? 'bg-teal-600 text-white border-teal-500 shadow-xs'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850'
                            }`}
                          >
                            ✨ Tăng mới BHYT
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentCategory('Gia hạn BHXH');
                              setIsRateManuallyEdited(false);
                            }}
                            className={`py-1 text-[10px] font-bold rounded cursor-pointer border transition-all ${
                              paymentCategory === 'Gia hạn BHXH'
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850'
                            }`}
                          >
                            🔄 Gia hạn BHXH
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentCategory('Tăng mới BHXH');
                              setIsRateManuallyEdited(false);
                            }}
                            className={`py-1 text-[10px] font-bold rounded cursor-pointer border transition-all ${
                              paymentCategory === 'Tăng mới BHXH'
                                ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850'
                            }`}
                          >
                            ✨ Tăng mới BHXH
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Số tiền đóng thực tế (đ)</label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        required
                        placeholder="Ví dụ: 972000"
                        className="w-full text-xs p-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-emerald-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Chu kỳ (Tháng)</label>
                      <select
                        value={periodMonths}
                        onChange={(e) => setPeriodMonths(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-emerald-500 text-white"
                      >
                        <option className="bg-slate-900" value="1">1 tháng</option>
                        <option className="bg-slate-900" value="3">3 tháng</option>
                        <option className="bg-slate-900" value="6">6 tháng</option>
                        <option className="bg-slate-900" value="12">12 tháng</option>
                        <option className="bg-slate-900" value="24">24 tháng</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Ngày nhân viên thu tiền</label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        required
                        className="w-full text-xs p-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-emerald-500 text-white font-mono"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[10px] font-semibold text-slate-400">Tỷ lệ hoa hồng (%)</label>
                        {isRateManuallyEdited && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsRateManuallyEdited(false);
                              setCustomCommissionRate(autoRate);
                            }}
                            className="text-[9px] text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                            title="Áp dụng lại tỷ lệ tự động theo hợp đồng"
                          >
                            <RefreshCw size={10} /> Áp lại tự động
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={customCommissionRate}
                        onChange={(e) => {
                          setIsRateManuallyEdited(true);
                          setCustomCommissionRate(parseFloat(e.target.value) || 0);
                        }}
                        className="w-full text-xs p-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-emerald-500 text-emerald-400 font-bold font-mono"
                      />
                      <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                        <Sparkles size={10} className="text-amber-400 shrink-0" />
                        <span>Tự động theo HĐ: <strong className="text-emerald-400 font-bold font-mono">{autoRate}%</strong> ({paymentCategory}, {periodMonths}th)</span>
                      </p>
                    </div>

                    {/* Compact Live Commission Bar */}
                    <div className="col-span-2 bg-emerald-950/60 border border-emerald-500/40 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <DollarSign size={15} className="text-emerald-400 shrink-0" />
                        <span>Hoa hồng nhận được:</span>
                      </div>
                      <div className="text-sm font-black text-emerald-400 font-mono">
                        +{Math.round((parseFloat(paymentAmount) || 0) * (customCommissionRate / 100)).toLocaleString()}đ
                        <span className="text-[10px] text-emerald-500 font-normal ml-1.5">({customCommissionRate}%)</span>
                      </div>
                    </div>

                    {/* Interactive Vietnam Premium Rate Estimator */}
                    {type === 'BHYT' ? (
                      <div className="col-span-2 bg-slate-950/60 rounded-xl p-3 border border-slate-850 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">🧮 MÁY TÍNH ĐỊNH MỨC BHYT HỘ GIA ĐÌNH</span>
                          <span className="text-[9px] text-slate-500 font-medium">Lương cơ sở: {(settings.baseSalaryBHYT || 2530000).toLocaleString()}đ</span>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold text-slate-400">Thứ tự tham gia trong gia đình:</label>
                          <div className="grid grid-cols-5 gap-1">
                            {[1, 2, 3, 4, 5].map((order) => {
                              const labels = ['', 'Số 1 (100%)', 'Số 2 (70%)', 'Số 3 (60%)', 'Số 4 (50%)', 'Số 5+ (40%)'];
                              return (
                                <button
                                  key={order}
                                  type="button"
                                  onClick={() => setBhytMemberOrder(order)}
                                  className={`py-1 text-[9px] font-bold rounded transition-all cursor-pointer border text-center ${
                                    bhytMemberOrder === order
                                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                                      : 'bg-slate-900 text-slate-400 hover:bg-slate-850 border-slate-800'
                                  }`}
                                >
                                  {labels[order]}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between bg-slate-950 px-2.5 py-2 rounded-lg border border-slate-900">
                          <div className="text-[10px] text-slate-400">
                            Mức đúng định mức ({periodMonths} tháng): <span className="text-white font-bold font-mono">{(getSuggestedPremium().amount).toLocaleString()}đ</span>
                          </div>
                          <button
                            type="button"
                            onClick={applySuggestedPremium}
                            className="px-2.5 py-1 text-[10px] font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors cursor-pointer"
                          >
                            Áp dụng mức này ➔
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="col-span-2 bg-slate-950/60 rounded-xl p-3 border border-slate-850 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">🧮 MÁY TÍNH ĐỊNH MỨC BHXH TỰ NGUYỆN (22%)</span>
                          <span className="text-[9px] text-slate-500 font-medium">Hỗ trợ Nhà nước: {(settings.supportOtherBHXH || 132000).toLocaleString()}đ/tháng</span>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold text-slate-400">Chọn thu nhập làm căn cứ đóng (đ/tháng):</label>
                          <div className="grid grid-cols-4 gap-1">
                            {[
                              { label: `Chuẩn nghèo (${((settings.povertyStandardBHXH || 1500000)/1000000).toFixed(2).replace(/\.00$/, '')}M)`, value: settings.povertyStandardBHXH || 1500000 },
                              { label: `Lương cơ sở (${((settings.baseSalaryBHYT || 2530000)/1000000).toFixed(2).replace(/\.00$/, '')}M)`, value: settings.baseSalaryBHYT || 2530000 },
                              { label: 'Mức 3 triệu', value: 3000000 },
                              { label: 'Mức 5 triệu', value: 5000000 },
                            ].map((income) => (
                              <button
                                key={income.value}
                                type="button"
                                onClick={() => setBhxhIncomeChoice(income.value)}
                                className={`py-1 text-[9px] font-medium rounded transition-all cursor-pointer border text-center ${
                                  bhxhIncomeChoice === income.value
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                                    : 'bg-slate-900 text-slate-400 hover:bg-slate-850 border-slate-800'
                                }`}
                              >
                                {income.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold text-slate-400">Chọn nhóm nhận hỗ trợ của Nhà nước:</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { label: `Đối tượng khác (${(settings.supportOtherBHXH || 132000).toLocaleString()}đ/tháng)`, value: 'other' },
                              { label: 'Không nhận hỗ trợ (0đ)', value: 'none' },
                            ].map((tier) => (
                              <button
                                key={tier.value}
                                type="button"
                                onClick={() => setBhxhSupportTier(tier.value)}
                                className={`py-1.5 text-[10px] font-semibold rounded transition-all cursor-pointer border text-center ${
                                  bhxhSupportTier === tier.value
                                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                                    : 'bg-slate-900 text-slate-400 hover:bg-slate-850 border-slate-800'
                                }`}
                              >
                                {tier.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between bg-slate-950 px-2.5 py-2 rounded-lg border border-slate-900">
                          <div className="text-[10px] text-slate-400">
                            Mức đóng sau hỗ trợ ({periodMonths} tháng): <span className="text-white font-bold font-mono">{(getSuggestedPremium().amount).toLocaleString()}đ</span>
                          </div>
                          <button
                            type="button"
                            onClick={applySuggestedPremium}
                            className="px-2.5 py-1 text-[10px] font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors cursor-pointer"
                          >
                            Áp dụng mức này ➔
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Mô tả/Ghi chú thêm</label>
                    <input
                      type="text"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="Không bắt buộc..."
                      className="w-full text-xs p-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-emerald-500 text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddPayment(false)}
                      className="text-[11px] text-slate-400 hover:underline px-2 py-1"
                    >
                      Bỏ qua
                    </button>
                    <button
                      type="submit"
                      className="text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded cursor-pointer"
                    >
                      Nhận Tiền & Gia Hạn
                    </button>
                  </div>
                </form>
              )}

              {/* Payments List */}
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                {paymentHistory.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 bg-slate-950 border border-slate-850 rounded-xl">
                    <FileText className="w-6 h-6 mx-auto stroke-1 mb-1.5 text-slate-600" />
                    <p className="text-xs">Chưa có bản ghi thu tiền nào của người này.</p>
                  </div>
                ) : (
                  paymentHistory.map((pay) => (
                    <div key={pay.id} className="bg-slate-950/80 border border-slate-850 hover:border-slate-750 rounded-lg p-2 transition-all text-slate-300 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="text-[10px] text-slate-400 font-mono shrink-0 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {pay.paymentDate}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 ${
                            pay.category?.includes('Tăng mới')
                              ? 'bg-amber-950/50 border-amber-800/60 text-amber-300'
                              : (pay.type || type) === 'BHXH' 
                              ? 'bg-indigo-950/50 border-indigo-900/60 text-indigo-300' 
                              : 'bg-teal-950/50 border-teal-900/60 text-teal-300'
                          }`}>
                            {pay.category || ((pay.type || type) === 'BHXH' ? 'BHXH' : 'BHYT')} ({pay.periodMonths}th)
                          </span>
                          <span className="text-xs font-black text-white font-mono shrink-0">
                            {(pay.amountPaid).toLocaleString()}đ
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-bold text-emerald-400 font-mono" title={`Tỷ lệ: ${pay.commissionRate ?? (pay.type === 'BHXH' ? settings.bhxhCommissionRate : settings.bhytCommissionRate)}%`}>
                            +{pay.commissionAmount.toLocaleString()}đ
                          </span>
                          {deletePaymentConfirmId === pay.id ? (
                            <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-800 rounded px-1 py-0.5 animate-fade-in">
                              <button
                                type="button"
                                onClick={() => {
                                  handleDeletePayment(pay.id);
                                  setDeletePaymentConfirmId(null);
                                }}
                                className="text-[9px] font-bold text-white bg-rose-600 hover:bg-rose-500 px-1.5 py-0.2 rounded cursor-pointer"
                              >
                                Xóa
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletePaymentConfirmId(null)}
                                className="text-[9px] font-semibold text-slate-400 hover:text-white px-1 py-0.2 rounded cursor-pointer"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletePaymentConfirmId(pay.id)}
                              className="text-slate-500 hover:text-rose-400 p-0.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                              title="Xóa bản ghi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {(pay.note || pay.bienLaiId || pay.nguoiNop) && (
                        <div className="text-[9.5px] text-slate-400 truncate flex items-center gap-2 pt-0.5 border-t border-slate-900">
                          {pay.bienLaiId && <span className="font-mono text-amber-400 font-semibold">#{pay.bienLaiId}</span>}
                          {pay.nguoiNop && <span>Nộp: <strong className="text-slate-300 font-normal">{pay.nguoiNop}</strong></span>}
                          {pay.note && <span className="italic text-slate-400 truncate">"{pay.note}"</span>}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Hint Box bottom */}
            <div className="mt-4 bg-emerald-950/40 border border-emerald-900/40 rounded-xl p-3 text-xs text-emerald-300 leading-relaxed text-center">
              ⭐ Tải/Nhập biên lai thanh toán giúp tự động tích lũy doanh số doanh thu, từ đó tính chính xác bảng thống kê hoa hồng đại lý.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
