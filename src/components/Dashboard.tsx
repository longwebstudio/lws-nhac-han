/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Customer, UserSettings } from '../types';
import { 
  Users, Bell, Calendar, DollarSign, Search, Plus, 
  Settings, Download, Upload, RefreshCw, LogOut, Check, Copy, X,
  Cloud, AlertTriangle, UserCheck, Trash2
} from 'lucide-react';

interface DashboardProps {
  customers: Customer[];
  settings: UserSettings;
  wpUser: { username: string; email: string; name?: string } | null;
  isSyncing: boolean;
  syncStatus: { type: 'success' | 'error'; message: string } | null;
  onLogoutWP: () => void;
  onSyncWP: () => void;
  onLoadBackupWP: () => void;
  onClearSyncStatus: () => void;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onBulkImport: (newCustomers: Customer[]) => void;
  onOpenSettings: () => void;
  onOpenImport: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (customer: Customer) => void;
  onResetDemoData: () => void;
  onGoBackLanding: () => void;
}

export default function Dashboard({
  customers,
  settings,
  wpUser,
  isSyncing,
  syncStatus,
  onLogoutWP,
  onSyncWP,
  onLoadBackupWP,
  onClearSyncStatus,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onBulkImport,
  onOpenSettings,
  onOpenImport,
  onOpenAddModal,
  onOpenEditModal,
  onResetDemoData,
  onGoBackLanding
}: DashboardProps) {

  // search, filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'BHYT' | 'BHXH'>('All');
  const [filterPeriod, setFilterPeriod] = useState<'All' | 'Expired' | '3Days' | '7Days' | 'Safe'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'active' | 'inactive'>('All');

  // local notification template generator states
  const [activeReminderCust, setActiveReminderCust] = useState<Customer | null>(null);
  const [activeReminderChannel, setActiveReminderChannel] = useState<'Zalo' | 'SMS'>('Zalo');
  const [reminderInsType, setReminderInsType] = useState<'BHYT' | 'BHXH'>('BHYT');
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showResetDemoConfirm, setShowResetDemoConfirm] = useState(false);

  // current anchor date: 2026-06-12
  const ANCHOR_DATE = useMemo(() => new Date('2026-06-12'), []);

  // helper to calculate days difference relative to 2026-06-12
  const getDaysDiff = (expiryStr: string) => {
    const expDate = new Date(expiryStr);
    const timeDiff = expDate.getTime() - ANCHOR_DATE.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  // derived statistics
  const stats = useMemo(() => {
    let expiredCount = 0;
    let in3DaysCount = 0;
    let in7DaysCount = 0;
    let totalCollectedAmount = 0;
    let totalEstimatedCommission = 0;
    let bhxhCollected = 0;
    let bhytCollected = 0;
    let bhxhCommission = 0;
    let bhytCommission = 0;

    customers.forEach(cust => {
      // 1. Check BHYT (Mandatory)
      const diffBHYT = getDaysDiff(cust.expiryDate);
      if (cust.status === 'active') {
        if (diffBHYT < 0) {
          expiredCount++;
        } else if (diffBHYT <= 3) {
          in3DaysCount++;
        } else if (diffBHYT <= 7) {
          in7DaysCount++;
        }
      }

      // 2. Check BHXH (Optional)
      if (cust.hasBHXH && cust.expiryDateBHXH && cust.status === 'active') {
        const diffBHXH = getDaysDiff(cust.expiryDateBHXH);
        if (diffBHXH < 0) {
          expiredCount++;
        } else if (diffBHXH <= 3) {
          in3DaysCount++;
        } else if (diffBHXH <= 7) {
          in7DaysCount++;
        }
      }

      // calculate payments stats
      cust.paymentHistory?.forEach(pay => {
        totalCollectedAmount += pay.amountPaid;
        totalEstimatedCommission += pay.commissionAmount;

        const payType = pay.type || 'BHYT';
        if (payType === 'BHXH') {
          bhxhCollected += pay.amountPaid;
          bhxhCommission += pay.commissionAmount;
        } else {
          bhytCollected += pay.amountPaid;
          bhytCommission += pay.commissionAmount;
        }
      });
    });

    return {
      expiredCount,
      in3DaysCount,
      in7DaysCount,
      totalCollectedAmount,
      totalEstimatedCommission,
      bhxhCollected,
      bhytCollected,
      bhxhCommission,
      bhytCommission
    };
  }, [customers, getDaysDiff]);

  // filter implementation
  const filteredCustomers = useMemo(() => {
    return customers.filter(cust => {
      // 1. Search Query
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        cust.name.toLowerCase().includes(query) ||
        cust.phone.includes(query) ||
        cust.cccd.includes(query) ||
        cust.insuranceCode.toLowerCase().includes(query) ||
        (cust.insuranceCodeBHXH && cust.insuranceCodeBHXH.toLowerCase().includes(query));

      // 2. Insurance type filter
      // 'All': show everyone (mandatory BHYT)
      // 'BHYT': show everyone (or those with active status), since everyone has BHYT
      // 'BHXH': only show those with hasBHXH = true
      let matchesType = true;
      if (filterType === 'BHXH') {
        matchesType = !!cust.hasBHXH;
      }

      // 3. Status filter
      const matchesStatus = filterStatus === 'All' || cust.status === filterStatus;

      // 4. Period Expiry filter
      // If filtering BHXH specifically, evaluate expiryDateBHXH. Otherwise evaluate general expiryDate (BHYT)
      const targetExpiryDate = (filterType === 'BHXH' && cust.hasBHXH && cust.expiryDateBHXH) 
        ? cust.expiryDateBHXH 
        : cust.expiryDate;
      const diff = getDaysDiff(targetExpiryDate);

      let matchesPeriod = true;
      if (filterPeriod === 'Expired') {
        matchesPeriod = diff < 0;
      } else if (filterPeriod === '3Days') {
        matchesPeriod = diff >= 0 && diff <= 3;
      } else if (filterPeriod === '7Days') {
        matchesPeriod = diff >= 4 && diff <= 7;
      } else if (filterPeriod === 'Safe') {
        matchesPeriod = diff > 7;
      }

      return matchesSearch && matchesType && matchesStatus && matchesPeriod;
    });
  }, [customers, searchQuery, filterType, filterStatus, filterPeriod, getDaysDiff]);

  // build custom message based on customer and settings templates
  const generateMessage = (customer: Customer, isZalo: boolean, insType: 'BHYT' | 'BHXH' = 'BHYT') => {
    let template = '';
    let typeLabel = '';
    let expDate = '';
    let code = '';
    
    if (insType === 'BHXH') {
      template = isZalo ? (settings.zaloTemplateBHXH || '') : (settings.smsTemplateBHXH || '');
      typeLabel = 'Bảo hiểm Xã hội tự nguyện';
      expDate = customer.expiryDateBHXH || '';
      code = customer.insuranceCodeBHXH || '';
    } else {
      template = isZalo ? settings.zaloTemplate : settings.smsTemplate;
      typeLabel = 'Bảo hiểm Y tế';
      expDate = customer.expiryDate;
      code = customer.insuranceCode || '';
    }
    
    const diff = getDaysDiff(expDate);
    const remainingDays = diff < 0 ? `Đã quá hạn ${Math.abs(diff)}` : diff;

    return template
      .replace(/\[TEN_KHACH_HANG\]/g, customer.name)
      .replace(/\[LOAI_BAO_HIEM\]/g, typeLabel)
      .replace(/\[NGAY_HET_HAN\]/g, expDate)
      .replace(/\[SO_NGAY\]/g, String(remainingDays))
      .replace(/\[MA_SO\]/g, code || 'Chưa ghi nhận')
      .replace(/\[TEN_DAI_LY\]/g, settings.agencyName)
      .replace(/\[SDT_DAI_LY\]/g, settings.agentPhone);
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopiedAlert(true);
    setTimeout(() => {
      setShowCopiedAlert(false);
    }, 1500);
  };

  // Backup exporter (Downloads a JSON string)
  const handleExportData = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customers, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `LwsNhacHan_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch {
      alert('Không xuất được file, vui lòng thử lại.');
    }
  };

  return (
    <div id="dashboard-root" className="bg-slate-950 min-h-screen text-slate-100 flex flex-col font-sans">
      
      {/* Mini warning sticky anchor */}
      <div className="bg-[#111126] text-slate-400 text-[10px] py-1.5 px-4 text-center font-bold font-mono tracking-wider border-b border-slate-900">
        📅 THỜI GIAN THỬ NGHIỆM GIẢ LẬP: 12/06/2026 (Cột đếm ngược lấy mốc hôm nay làm gốc)
      </div>

      {/* Modern Dashboard Header */}
      <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-900 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-emerald-600 rounded-lg text-white font-black text-sm">Lws</span>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block">Lws nhắc hạn</span>
              <span className="text-[9px] text-slate-400 block font-semibold">{settings.agencyName}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Action Button */}
            {showResetDemoConfirm ? (
              <div className="flex items-center gap-1 bg-rose-950/60 border border-slate-800 rounded-lg p-1 animate-fade-in text-[10px]">
                <span className="text-white font-medium px-1 text-[9px] hidden lg:inline">Xóa hết để nạp mẫu?</span>
                <button
                  onClick={() => {
                    onResetDemoData();
                    setShowResetDemoConfirm(false);
                  }}
                  className="bg-rose-600 hover:bg-rose-500 font-extrabold text-[10px] text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  Có
                </button>
                <button
                  onClick={() => setShowResetDemoConfirm(false)}
                  className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowResetDemoConfirm(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-all cursor-pointer hidden md:flex items-center gap-1 text-[11px] font-bold"
                title="Khôi phục 5 khách hàng mẫu ban đầu"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Khôi phục mẫu
              </button>
            )}

            <button
              onClick={handleExportData}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-all cursor-pointer hidden sm:flex items-center gap-1 text-[11px] font-bold"
              title="Tải flie JSON dự phòng về máy"
            >
              <Download className="w-3.5 h-3.5" />
              Sao lưu dự phòng
            </button>

            <button
              onClick={onOpenImport}
              className="p-2 text-blue-400 bg-blue-950/40 border border-blue-900/60 hover:bg-blue-900/40 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
            >
              <Upload className="w-3.5 h-3.5" />
              Nhập từ Excel
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
              title="Cài đặt tin nhắn và hoa hồng"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden lg:inline">Cài đặt</span>
            </button>

            <button
              onClick={onGoBackLanding}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
              title="Về Trang Landing Page"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              Về Trang Chủ
            </button>
          </div>

        </div>
      </header>

      {/* App Main Containers */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        
        {/* WordPress Real-Time Sync HUD */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl border shrink-0 ${wpUser ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400 font-bold' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
              <Cloud className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-extrabold text-white">WordPress Cloud Sync</h3>
                {wpUser ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-900/60 uppercase">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                    Đã Đồng Bộ Hóa
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-955 text-amber-300 border border-amber-900/40 uppercase">
                    Ngoại tuyến (Offline)
                  </span>
                )}
              </div>
              
              {wpUser ? (
                <p className="text-xs text-slate-300">
                  Đã đăng nhập WordPress: <strong className="text-white font-mono">{wpUser.username}</strong> | Email: <span className="font-mono text-slate-400">{wpUser.email}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Bạn đang lưu trữ dữ liệu cục bộ trên Trình duyệt. Hãy kết nối WordPress GraphQL để nâng cấp đồng bộ đám mây vĩnh viễn.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {wpUser ? (
              <>
                <button
                  type="button"
                  onClick={onSyncWP}
                  disabled={isSyncing}
                  className="px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Đang gửi...' : 'Đẩy lên Cloud'}
                </button>
                <button
                  type="button"
                  onClick={onLoadBackupWP}
                  disabled={isSyncing}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-950 hover:bg-slate-850 hover:text-white border border-slate-800 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  title="Tìm kiếm và nạp sảo lưu từ WordPress"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải từ Cloud
                </button>
                <button
                  type="button"
                  onClick={onLogoutWP}
                  className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-950/40 border border-transparent hover:border-rose-900/60 rounded-xl transition-all cursor-pointer"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onLogoutWP}
                className="px-4 py-2 text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-900/60 hover:bg-emerald-900/50 hover:text-white rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                🔗 Kết Nối WPGraphQL Đám Mây
              </button>
            )}
          </div>
        </div>

        {/* Sync alert banner */}
        {syncStatus && (
          <div className={`px-4 py-3 border rounded-xl text-xs flex items-start justify-between gap-3 animate-fade-in ${
            syncStatus.type === 'success' 
              ? 'bg-emerald-950/50 border-emerald-900/60 text-emerald-300' 
              : 'bg-rose-950/50 border-rose-900/60 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className="font-extrabold uppercase tracking-wider text-[9px] px-1.5 py-0.5 bg-slate-950 border border-slate-850 rounded">
                {syncStatus.type === 'success' ? 'XÁC NHẬN' : 'CẢNH BÁO'}
              </span>
              <p className="font-medium">{syncStatus.message}</p>
            </div>
            <button
              onClick={onClearSyncStatus}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total population */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-slate-400 flex items-center justify-center shrink-0 border border-slate-850">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng người dân</span>
              <span className="text-xl font-black text-white font-mono block">{customers.length}</span>
            </div>
          </div>

          {/* Card 2: Expired block */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xs flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stats.expiredCount > 0 ? 'bg-rose-950/60 border border-rose-900 text-rose-400 animate-pulse' : 'bg-slate-950 text-slate-500 border border-slate-850'}`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Đã quá hạn đóng</span>
              <span className={`text-xl font-black font-mono block ${stats.expiredCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>{stats.expiredCount}</span>
            </div>
          </div>

          {/* Card 3: Expiring soon (3-7 days) */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xs flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stats.in3DaysCount + stats.in7DaysCount > 0 ? 'bg-amber-955/60 border border-amber-900/60 text-amber-400' : 'bg-slate-950 text-slate-500 border border-slate-850'}`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Hạn trong tuần (3-7d)</span>
              <span className="text-xl font-black font-mono text-white block">
                {stats.in3DaysCount + stats.in7DaysCount}
              </span>
            </div>
          </div>

          {/* Card 4: Estimated Monthly Commission */}
          <div className="bg-emerald-950 text-emerald-300 rounded-2xl border border-emerald-900 p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-805">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest block">Hoa hồng đại lý</span>
              <span className="text-sm font-extrabold text-white font-mono block">
                {stats.totalEstimatedCommission.toLocaleString()}đ
              </span>
              <p className="text-[8px] text-emerald-405">Từ {stats.totalCollectedAmount.toLocaleString()}đ phí thu hộ</p>
              
              <div className="flex gap-2 border-t border-emerald-900/40 pt-1 mt-1 text-[8px] text-emerald-300/80 whitespace-nowrap">
                <div>
                  <span className="font-semibold text-teal-400">BHYT:</span> <span className="font-mono">{stats.bhytCommission.toLocaleString()}đ</span>
                </div>
                <div className="border-l border-emerald-900/40 pl-2">
                  <span className="font-semibold text-indigo-400">BHXH:</span> <span className="font-mono">{stats.bhxhCommission.toLocaleString()}đ</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Dynamic reminder generation pane if clicked */}
        {activeReminderCust && (
          <div className="bg-slate-900 border border-emerald-900/60 rounded-2xl p-4 sm:p-5 relative animate-in slide-in-from-top-3 duration-200 space-y-3 shadow-md">
            <button
              onClick={() => setActiveReminderCust(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 bg-slate-950 rounded-full shadow-xs border border-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full uppercase">Đang soạn mẫu nhanh</span>
                <h3 className="text-sm font-extrabold text-white mt-1">
                  Nhắc hạn đóng tiền: {activeReminderCust.name} ({activeReminderCust.phone})
                </h3>
              </div>

              {/* Toggle Zalo / SMS */}
              <div className="flex gap-1 bg-slate-950/80 p-0.5 rounded-lg text-xs font-semibold border border-slate-850">
                <button
                  type="button"
                  onClick={() => setActiveReminderChannel('Zalo')}
                  className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    activeReminderChannel === 'Zalo' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Gửi Zalo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReminderChannel('SMS')}
                  className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    activeReminderChannel === 'SMS' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Gửi SMS
                </button>
              </div>
            </div>

            {/* Optional Dual reminder type toggle */}
            {activeReminderCust.hasBHXH && (
              <div className="flex flex-wrap gap-2 items-center bg-indigo-950/20 border border-indigo-900/40 p-2.5 rounded-xl">
                <span className="text-xs text-indigo-300 font-bold">Nội dung nhắc:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReminderInsType('BHYT')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      reminderInsType === 'BHYT'
                        ? 'bg-emerald-600 text-white border border-emerald-500' 
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    BHYT Hộ gia đình ({activeReminderCust.expiryDate})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderInsType('BHXH')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      reminderInsType === 'BHXH'
                        ? 'bg-indigo-600 text-white border border-indigo-500' 
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    BHXH Tự nguyện ({activeReminderCust.expiryDateBHXH})
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                Bản nháp được hệ thống điền tự động:
              </label>
              
              <div className="relative">
                <textarea
                  readOnly
                  rows={4}
                  value={generateMessage(activeReminderCust, activeReminderChannel === 'Zalo', reminderInsType)}
                  className="w-full text-xs font-sans p-3 border border-slate-800 rounded-xl bg-slate-950 text-slate-200 leading-relaxed shadow-xs focus:outline-none focus:border-emerald-500"
                />
                
                <button
                  type="button"
                  onClick={() => handleCopyMessage(generateMessage(activeReminderCust, activeReminderChannel === 'Zalo', reminderInsType))}
                  className="absolute bottom-3 right-3 shrink-0 flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg transition-transform active:scale-95 cursor-pointer shadow-md"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Sao chép tin nhắn
                </button>
              </div>
            </div>

            {showCopiedAlert && (
              <p className="text-xs text-emerald-400 font-semibold animate-pulse flex items-center gap-1.5 pl-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                Đã sao chép! Bạn chỉ việc dán (Ctrl+V hoặc giữ tay và chọn Paste) vào khung chát Zalo hoặc SMS để gửi ngay cho người ấy!
              </p>
            )}

            <p className="text-[10px] text-slate-400">
              💡 Hướng dẫn: Đầy đủ các biến số quan trọng như tên, ngày hết hạn, mã số thẻ và thông tin tổng thầu của {settings.agencyName} đã được điền sẵn khớp chuẩn 100%.
            </p>
          </div>
        )}

        {/* Filtering & Roster Row Section */}
        <div className="bg-slate-900 rounded-2xl border border-slate-850 shadow-xs overflow-hidden">
          
          {/* Filtering bar inside */}
          <div className="p-4 bg-slate-950/40 border-b border-slate-850 flex flex-col md:flex-row items-center gap-3 justify-between">
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-xs">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Tìm khách hàng (Tên, SĐT, CCCD)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-white placeholder-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer bg-slate-900 hover:bg-slate-800 p-0.5 rounded-md transition-colors"
                  title="Xóa từ khóa tìm kiếm"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Filters Group */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              
              {/* Filter Type BHYT/BHXH */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none cursor-pointer focus:border-emerald-500"
              >
                <option value="All">Loại hình: Tất cả</option>
                <option value="BHYT">Bảo hiểm Y tế (BHYT)</option>
                <option value="BHXH">Bảo hiểm Xã hội (BHXH)</option>
              </select>

              {/* Filter Expiry window list */}
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none cursor-pointer focus:border-emerald-500"
              >
                <option value="All">Nhắc hạn: Tất cả mốc</option>
                <option value="Expired">⌛ Đã quá hạn</option>
                <option value="3Days">⚠️ Sắp hết hạn trong 3 ngày</option>
                <option value="7Days">🗓️ Sắp hết hạn trong 7 ngày</option>
                <option value="Safe">✓ Trạng thái an toàn</option>
              </select>

              {/* Filter Status active/inactive */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none cursor-pointer focus:border-emerald-500"
              >
                <option value="All">Theo dõi: Tất cả</option>
                <option value="active">Đang phục vụ</option>
                <option value="inactive">Tạm dừng theo dõi</option>
              </select>

              <button
                onClick={onOpenAddModal}
                className="ml-auto md:ml-0 inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-xl cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                Thêm Người Dân
              </button>
            </div>

          </div>

          {/* Roster table view */}
          <div className="overflow-x-auto">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <div className="w-12 h-12 bg-slate-955 rounded-full flex items-center justify-center mx-auto text-slate-600 border border-slate-850">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-200">Không tìm thấy người dân nào phù hợp</h3>
                  <p className="text-xs text-slate-400">Hãy thử xóa bộ lọc tìm kiếm hoặc nhấp "Thêm người dân" để tạo mới.</p>
                </div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-800 text-left table-auto">
                <thead className="bg-slate-950/40 text-[10px] text-slate-400 uppercase font-black tracking-wider border-b border-slate-850">
                  <tr>
                    <th className="px-6 py-3.5">Họ tên & SĐT người dân</th>
                    <th className="px-6 py-3.5">Mã số thẻ & Loại</th>
                    <th className="px-6 py-3.5">Số CCCD</th>
                    <th className="px-6 py-3.5">Ngày hết hạn đóng phí</th>
                    <th className="px-6 py-3.5">Ngày đếm ngược</th>
                    <th className="px-6 py-3.5 text-right">Tính năng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs bg-slate-900/.10 text-slate-300">
                  {filteredCustomers.map((cust) => {
                    const diffDaysBHYT = getDaysDiff(cust.expiryDate);
                    const diffDaysBHXH = cust.hasBHXH && cust.expiryDateBHXH ? getDaysDiff(cust.expiryDateBHXH) : null;
                    
                    // Determine which insurance is being focused for countdown display
                    const focalDiffDays = (filterType === 'BHXH' && diffDaysBHXH !== null) ? diffDaysBHXH : diffDaysBHYT;
                    
                    // visual countdown badge
                    let badge = null;
                    if (cust.status === 'inactive') {
                      badge = <span className="bg-slate-950 text-slate-500 border border-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-full select-none">Tạm ngưng</span>;
                    } else if (focalDiffDays < 0) {
                      badge = <span className="bg-rose-955/55 text-rose-300 border border-rose-900/40 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">Quá hạn {-focalDiffDays} ngày</span>;
                    } else if (focalDiffDays === 0) {
                      badge = <span className="bg-rose-955/55 text-rose-300 border border-rose-900/40 text-[10px] font-black px-2 py-0.5 rounded-full">Hết hạn hôm nay</span>;
                    } else if (focalDiffDays <= 3) {
                      badge = <span className="bg-amber-955/50 text-amber-300 border border-amber-900/40 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">Còn {focalDiffDays} ngày (Sắp hết)</span>;
                    } else if (focalDiffDays <= 7) {
                      badge = <span className="bg-yellow-50/10 text-yellow-300 border border-yellow-700/30 text-[10px] font-bold px-2 py-0.5 rounded-full">Còn {focalDiffDays} ngày</span>;
                    } else {
                      badge = <span className="bg-emerald-950/50 text-emerald-300 border border-emerald-900/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">Còn {focalDiffDays} ngày</span>;
                    }

                    return (
                      <tr key={cust.id} className="hover:bg-slate-950/40 transition-colors">
                        
                        {/* Name & phone */}
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-white text-sm hover:text-emerald-400 cursor-pointer transition-all animate-fade-in" onClick={() => onOpenEditModal(cust)}>
                            {cust.name}
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5 font-mono flex items-center gap-1.5">
                            <span>{cust.phone}</span>
                            {cust.hasBHXH && (
                              <span className="text-[8px] font-extrabold bg-indigo-950/50 text-indigo-300 border border-indigo-900/40 px-1 py-0.1 rounded select-none">BHYT + BHXH</span>
                            )}
                          </div>
                        </td>

                        {/* Insurance profile */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-900 select-none">BHYT</span>
                              <span className="text-[11px] text-slate-300 font-mono select-all font-semibold">{cust.insuranceCode || 'Chưa ghi mã'}</span>
                            </div>
                            {cust.hasBHXH && (
                              <div className="flex items-center gap-1.5 pt-0.5 animate-in fade-in duration-250">
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-indigo-950 text-indigo-300 border border-indigo-900 select-none">BHXH</span>
                                <span className="text-[11px] text-indigo-300 font-mono select-all font-semibold">{cust.insuranceCodeBHXH || 'Chưa ghi mã'}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* ID card card */}
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-400 tracking-tight">
                          {cust.cccd || '—'}
                        </td>

                        {/* Relative Expiry Dates */}
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-[11px]">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-400 text-[10px]">Hạn BHYT:</span>
                              <span className="font-mono text-slate-300 font-bold">{cust.expiryDate}</span>
                            </div>
                            {cust.hasBHXH && cust.expiryDateBHXH && (
                              <div className="flex items-center justify-between gap-2 pt-0.5 animate-fade-in">
                                <span className="text-indigo-400 text-[10px]">Hạn BHXH:</span>
                                <span className="font-mono text-indigo-300 font-bold">{cust.expiryDateBHXH}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Real countdown indicator */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div>{badge}</div>
                            {cust.hasBHXH && filterType === 'All' && (
                              <div className="text-[9px] text-slate-500 font-mono leading-none">
                                (Đếm ngược theo {focalDiffDays === diffDaysBHXH ? 'BHXH' : 'BHYT'})
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions block list */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {cust.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReminderCust(cust);
                                  setReminderInsType(filterType === 'BHXH' && cust.hasBHXH ? 'BHXH' : 'BHYT');
                                  // Scroll automatically to reminder box
                                  window.scrollTo({ top: 120, behavior: 'smooth' });
                                }}
                                className="text-[10px] font-black text-amber-300 bg-amber-955/50 border border-amber-900 hover:bg-amber-900/40 px-2 py-1 rounded-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
                                title="Soạn tin nhắn nhắc nhở"
                              >
                                🔔 Nhắc đóng phí
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => onOpenEditModal(cust)}
                              className="text-[10px] font-bold text-emerald-300 bg-emerald-950/50 border border-emerald-900/60 hover:bg-emerald-900/40 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                              title="Xem chi tiết, gộp biên nhận và chỉnh sửa"
                            >
                              📁 Biên nhận / Sửa
                            </button>
                            
                            {deleteConfirmId === cust.id ? (
                              <div className="flex items-center gap-1 bg-rose-950/60 border border-slate-800 rounded-lg p-1 animate-fade-in">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteCustomer(cust.id);
                                    setDeleteConfirmId(null);
                                  }}
                                  className="text-[9px] font-extrabold text-white bg-rose-600 hover:bg-rose-500 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                                >
                                  Xóa
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(null);
                                  }}
                                  className="text-[9px] font-bold text-slate-400 hover:text-white px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(cust.id);
                                }}
                                className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 p-1.5 rounded-lg border border-transparent hover:border-rose-900/40 transition-colors cursor-pointer"
                                title="Xóa vĩnh viễn"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Table footer stats summary info */}
          <div className="px-6 py-3.5 bg-slate-950/50 border-t border-slate-850 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2">
            <p>
              Hiển thị <strong className="text-slate-200">{filteredCustomers.length}</strong> trên{' '}
              <strong className="text-slate-200">{customers.length}</strong> tài liệu người dân.
            </p>
            <div className="flex gap-4">
              <span>Đại lý: <strong className="text-emerald-400">{settings.agencyName}</strong></span>
              <span>Hotline liên hệ: <strong className="text-emerald-400 font-mono">{settings.agentPhone}</strong></span>
            </div>
          </div>

        </div>

      </main>

      {/* Tiny clean footer workspace branding */}
      <footer className="bg-slate-950 border-t border-slate-900 mt-12 py-6 text-center text-xs text-slate-500">
        <p>Phần mềm quản lý "Lws nhắc hạn" phát triển bởi <strong>Long Web Studio</strong>.</p>
        <p className="text-[10px] text-slate-400 mt-1">Hệ thống bảo mật dữ liệu lưu cục bộ trong trình duyệt của bạn (Local Storage) • Không thu thập dữ liệu nội bộ.</p>
      </footer>

    </div>
  );
}
