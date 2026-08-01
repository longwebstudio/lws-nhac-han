import React, { useState, useMemo } from 'react';
import { Customer, UserSettings } from '../types';
import {
  BellRing,
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  Copy,
  MessageSquare,
  Send,
  Check,
  Calendar,
  MapPin,
  X,
  FileText,
  UserCheck,
  Zap,
  ChevronRight,
  Filter,
  Sparkles
} from 'lucide-react';

interface Expiring7DaysListProps {
  customers: Customer[];
  settings: UserSettings;
  onUpdateCustomer: (cust: Customer) => void;
  onMarkAsReminded: (cust: Customer, e?: React.MouseEvent) => void;
  onOpenReminderPanel?: (cust: Customer, channel: 'Zalo' | 'SMS' | 'Call', insType: 'BHYT' | 'BHXH') => void;
}

export default function Expiring7DaysList({
  customers,
  settings,
  onUpdateCustomer,
  onMarkAsReminded,
  onOpenReminderPanel
}: Expiring7DaysListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREMINDED' | 'BHYT' | 'BHXH' | 'REMINDED'>('ALL');
  const [copiedCustId, setCopiedCustId] = useState<string | null>(null);
  const [copiedMsgCustId, setCopiedMsgCustId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal preview state
  const [selectedCustForPreview, setSelectedCustForPreview] = useState<{
    cust: Customer;
    insType: 'BHYT' | 'BHXH';
    channel: 'Zalo' | 'SMS' | 'Call';
  } | null>(null);

  // Helper for date calculation
  const getDaysDiff = (expiryStr?: string) => {
    if (!expiryStr) return 99999;
    const parts = expiryStr.split('-');
    let expYear: number, expMonth: number, expDay: number;
    if (parts.length === 3) {
      expYear = parseInt(parts[0], 10);
      expMonth = parseInt(parts[1], 10) - 1;
      expDay = parseInt(parts[2], 10);
    } else {
      const expDate = new Date(expiryStr);
      if (isNaN(expDate.getTime())) return 99999;
      expYear = expDate.getFullYear();
      expMonth = expDate.getMonth();
      expDay = expDate.getDate();
    }

    const expMidnight = new Date(expYear, expMonth, expDay);
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const timeDiff = expMidnight.getTime() - todayMidnight.getTime();
    return Math.round(timeDiff / (1000 * 3600 * 24));
  };

  // Toast auto-hide
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Generate reminder message text
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

  // Get all expiring customers in 7 days
  const expiringData = useMemo(() => {
    const list: Array<{
      cust: Customer;
      diffBHYT: number | null;
      diffBHXH: number | null;
      isBHYTExpiring: boolean;
      isBHXHExpiring: boolean;
      minDiff: number;
      isReminded: boolean;
    }> = [];

    const todayStr = new Date().toISOString().split('T')[0];

    customers.forEach(cust => {
      const diffBHYT = cust.hasBHYT !== false && cust.expiryDate ? getDaysDiff(cust.expiryDate) : null;
      const diffBHXH = cust.hasBHXH && cust.expiryDateBHXH ? getDaysDiff(cust.expiryDateBHXH) : null;

      const isBHYTExpiring = diffBHYT !== null && diffBHYT <= 7;
      const isBHXHExpiring = diffBHXH !== null && diffBHXH <= 7;

      if (isBHYTExpiring || isBHXHExpiring) {
        const validDiffs = [diffBHYT, diffBHXH].filter((d): d is number => d !== null && d <= 7);
        const minDiff = Math.min(...validDiffs);
        const isReminded = cust.lastRemindedDate === todayStr;

        list.push({
          cust,
          diffBHYT,
          diffBHXH,
          isBHYTExpiring,
          isBHXHExpiring,
          minDiff,
          isReminded
        });
      }
    });

    // Sort by urgent days left (ascending)
    return list.sort((a, b) => a.minDiff - b.minDiff);
  }, [customers]);

  // Counts for tabs
  const totalCount = expiringData.length;
  const unremindedCount = expiringData.filter(item => !item.isReminded).length;
  const bhytCount = expiringData.filter(item => item.isBHYTExpiring).length;
  const bhxhCount = expiringData.filter(item => item.isBHXHExpiring).length;
  const remindedCount = expiringData.filter(item => item.isReminded).length;

  // Filtered list by active tab and search
  const filteredList = useMemo(() => {
    return expiringData.filter(item => {
      // Tab filter
      if (activeFilter === 'UNREMINDED' && item.isReminded) return false;
      if (activeFilter === 'REMINDED' && !item.isReminded) return false;
      if (activeFilter === 'BHYT' && !item.isBHYTExpiring) return false;
      if (activeFilter === 'BHXH' && !item.isBHXHExpiring) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const c = item.cust;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.cccd?.includes(q) ||
        c.insuranceCode?.includes(q) ||
        c.insuranceCodeBHXH?.includes(q) ||
        c.address?.toLowerCase().includes(q)
      );
    });
  }, [expiringData, activeFilter, searchQuery]);

  // Handle Quick Zalo Send
  const handleQuickSendZalo = (cust: Customer, insType: 'BHYT' | 'BHXH', e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      alert('Người dân này chưa có số điện thoại hợp lệ để mở Zalo.');
      return;
    }

    const msg = generateMessage(cust, true, insType);
    navigator.clipboard.writeText(msg);

    const todayStr = new Date().toISOString().split('T')[0];
    const updatedCust: Customer = {
      ...cust,
      lastRemindedDate: todayStr,
      lastRemindedChannel: 'Zalo',
      hinhThucNhac: 'Zalo',
      lastRemindedType: insType
    };
    onUpdateCustomer(updatedCust);

    showToast(`Đã chép tin nhắn BHYT/BHXH & mở ZaloChat cho ${cust.name}!`);
    window.open(`https://zalo.me/${cleanPhone}`, '_blank', 'noopener,noreferrer');
  };

  // Handle Quick SMS Send
  const handleQuickSendSMS = (cust: Customer, insType: 'BHYT' | 'BHXH', e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      alert('Người dân này chưa có số điện thoại hợp lệ để gửi SMS.');
      return;
    }

    const msg = generateMessage(cust, false, insType);
    navigator.clipboard.writeText(msg);

    const todayStr = new Date().toISOString().split('T')[0];
    const updatedCust: Customer = {
      ...cust,
      lastRemindedDate: todayStr,
      lastRemindedChannel: 'SMS',
      hinhThucNhac: 'SMS',
      lastRemindedType: insType
    };
    onUpdateCustomer(updatedCust);

    showToast(`Đã sao chép tin nhắn SMS cho ${cust.name}!`);
    window.open(`sms:${cleanPhone}?body=${encodeURIComponent(msg)}`, '_self');
  };

  // Handle Copy Customer Info
  const handleCopyDetails = (cust: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    const infoLines = [
      `Họ và tên: ${cust.name}`,
      `SĐT: ${cust.phone}`,
      cust.cccd ? `CCCD: ${cust.cccd}` : '',
      cust.birthday ? `Ngày sinh: ${cust.birthday}` : '',
      cust.insuranceCode ? `Mã BHYT: ${cust.insuranceCode}` : '',
      cust.insuranceCodeBHXH ? `Mã BHXH: ${cust.insuranceCodeBHXH}` : '',
      cust.expiryDate ? `Hạn BHYT: ${cust.expiryDate}` : '',
      cust.expiryDateBHXH ? `Hạn BHXH: ${cust.expiryDateBHXH}` : '',
      cust.address ? `Địa chỉ: ${cust.address}` : '',
      cust.notes ? `Ghi chú: ${cust.notes}` : ''
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(infoLines);
    setCopiedCustId(cust.id);
    setTimeout(() => setCopiedCustId(null), 2000);
    showToast(`Đã sao chép thông tin người dân ${cust.name}!`);
  };

  // Handle Copy Message
  const handleCopyMessageOnly = (cust: Customer, insType: 'BHYT' | 'BHXH', e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = generateMessage(cust, true, insType);
    navigator.clipboard.writeText(msg);
    setCopiedMsgCustId(cust.id);
    setTimeout(() => setCopiedMsgCustId(null), 2000);
    showToast(`Đã sao chép nội dung tin nhắn nhắc hạn!`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 text-slate-100 relative overflow-hidden">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="absolute top-3 right-3 z-30 bg-emerald-500 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-400 rounded-xl shrink-0 shadow-inner">
            <BellRing className="w-5 h-5 animate-pulse text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-white tracking-wide">
                Khách Hàng Hết Hạn Trong 7 Ngày Tới
              </h3>
              <span className="px-2.5 py-0.5 text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full font-mono">
                {unremindedCount} cần nhắc khẩn cấp
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Danh sách tự động cập nhật các thẻ BHYT & BHXH sắp hết hạn. Nhấn <strong className="text-sky-300">Gửi Zalo</strong> hoặc <strong className="text-emerald-300">SMS</strong> để nhắc hạn chỉ với 1 cú nhấp chuột.
            </p>
          </div>
        </div>

        {/* Quick search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, SĐT, mã BH, CCCD..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'ALL', label: 'Tất cả', count: totalCount, icon: Filter },
            { id: 'UNREMINDED', label: 'Chưa gửi nhắc', count: unremindedCount, color: 'text-rose-400', activeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
            { id: 'BHYT', label: 'Thẻ BHYT', count: bhytCount, activeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
            { id: 'BHXH', label: 'Thẻ BHXH', count: bhxhCount, activeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
            { id: 'REMINDED', label: 'Đã nhắc', count: remindedCount, activeBg: 'bg-slate-800 text-slate-300 border-slate-700' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                activeFilter === tab.id
                  ? tab.activeBg || 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 text-[10px] bg-slate-950 rounded-full font-mono font-black">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="text-[11px] text-slate-400 font-mono px-2">
          Hiển thị: <strong className="text-amber-400">{filteredList.length}</strong> / {totalCount}
        </div>
      </div>

      {/* List Content */}
      {filteredList.length === 0 ? (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-8 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
          <h4 className="text-sm font-bold text-slate-200">Không có dữ liệu phù hợp</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {totalCount === 0
              ? 'Tuyệt vời! Hiện tại không có người dân nào cần gia hạn thẻ BHYT hoặc BHXH trong vòng 7 ngày tới.'
              : 'Không tìm thấy người dân nào khớp với tiêu chí lọc hoặc tìm kiếm hiện tại.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredList.map(({ cust, diffBHYT, diffBHXH, isBHYTExpiring, isBHXHExpiring, minDiff, isReminded }) => {
            const urgentInsType: 'BHYT' | 'BHXH' = isBHYTExpiring ? 'BHYT' : 'BHXH';

            return (
              <div
                key={cust.id}
                className={`bg-slate-950 border rounded-xl p-3.5 transition-all flex flex-col justify-between gap-3 hover:border-slate-700 ${
                  isReminded
                    ? 'border-slate-800/60 opacity-80'
                    : minDiff <= 0
                    ? 'border-rose-900/80 bg-rose-955/10 shadow-lg shadow-rose-950/20'
                    : 'border-amber-900/60 bg-amber-955/10'
                }`}
              >
                {/* Top Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-white">{cust.name}</span>
                      
                      {cust.gender && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${
                          cust.gender === 'Nam'
                            ? 'bg-sky-950 text-sky-400 border border-sky-900/40'
                            : 'bg-rose-950 text-rose-400 border border-rose-900/40'
                        }`}>
                          {cust.gender}
                        </span>
                      )}

                      {/* Reminded Badge */}
                      {isReminded ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Đã nhắc hôm nay ({cust.lastRemindedChannel || 'Zalo'})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full animate-pulse">
                          <Clock className="w-3 h-3" />
                          Chưa gửi nhắc
                        </span>
                      )}
                    </div>

                    {/* Copy customer details button */}
                    <button
                      onClick={(e) => handleCopyDetails(cust, e)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                        copiedCustId === cust.id
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
                      }`}
                      title="Sao chép nhanh họ tên, SĐT, mã BHXH, CCCD, ngày sinh"
                    >
                      {copiedCustId === cust.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px]">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Copy TT</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Customer Meta Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="font-mono text-slate-200">{cust.phone || 'Chưa có SĐT'}</span>
                    </div>

                    {cust.birthday && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Sinh: {cust.birthday.includes('-') ? cust.birthday.split('-').reverse().join('/') : cust.birthday}</span>
                      </div>
                    )}

                    {cust.address && (
                      <div className="flex items-center gap-1.5 sm:col-span-2 truncate text-[11px] text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{cust.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Expiry Cards / Badges */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {/* BHYT Expiry status */}
                    {isBHYTExpiring && diffBHYT !== null && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        diffBHYT < 0
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                          : diffBHYT === 0
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                          : 'bg-amber-950/60 text-amber-300 border-amber-800'
                      }`}>
                        <Zap className="w-3.5 h-3.5 shrink-0" />
                        <span>BHYT ({cust.insuranceCode || 'Chưa mã'}):</span>
                        <strong className="underline decoration-dotted">
                          {diffBHYT < 0 ? `Quá hạn ${Math.abs(diffBHYT)} ngày` : diffBHYT === 0 ? 'Hết hạn hôm nay' : `Còn ${diffBHYT} ngày`}
                        </strong>
                      </div>
                    )}

                    {/* BHXH Expiry status */}
                    {isBHXHExpiring && diffBHXH !== null && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        diffBHXH < 0
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                          : diffBHXH === 0
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                          : 'bg-indigo-950/60 text-indigo-300 border-indigo-800'
                      }`}>
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>BHXH ({cust.insuranceCodeBHXH || cust.insuranceCode || 'Chưa mã'}):</span>
                        <strong className="underline decoration-dotted">
                          {diffBHXH < 0 ? `Quá hạn ${Math.abs(diffBHXH)} ngày` : diffBHXH === 0 ? 'Hết hạn hôm nay' : `Còn ${diffBHXH} ngày`}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Toolbar */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Quick Zalo button */}
                    <button
                      type="button"
                      onClick={(e) => handleQuickSendZalo(cust, urgentInsType, e)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-lg transition-transform active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                      title="Chép tin nhắn & mở Zalo Chat ngay lập tức"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Gửi Zalo</span>
                    </button>

                    {/* Quick SMS button */}
                    <button
                      type="button"
                      onClick={(e) => handleQuickSendSMS(cust, urgentInsType, e)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-transform active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                      title="Chép tin nhắn & mở trình nhắn tin SMS"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi SMS</span>
                    </button>

                    {/* Copy Message text button */}
                    <button
                      type="button"
                      onClick={(e) => handleCopyMessageOnly(cust, urgentInsType, e)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        copiedMsgCustId === cust.id
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                      title="Sao chép nội dung tin nhắn đính kèm mã BHXH và hạn đóng"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>{copiedMsgCustId === cust.id ? 'Đã chép tin' : 'Chép tin'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Mark as Reminded toggle */}
                    <button
                      type="button"
                      onClick={(e) => onMarkAsReminded(cust, e)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                        isReminded
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                      }`}
                      title="Đánh dấu đã nhắc hạn để phân loại"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isReminded ? 'Đã nhắc' : 'Đánh dấu'}</span>
                    </button>

                    {/* Full Preview Modal Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenReminderPanel) {
                          onOpenReminderPanel(cust, 'Zalo', urgentInsType);
                        } else {
                          setSelectedCustForPreview({ cust, insType: urgentInsType, channel: 'Zalo' });
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all cursor-pointer"
                      title="Xem kịch bản tin nhắn / Gọi điện chi tiết"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Internal Preview Modal if no outer panel callback */}
      {selectedCustForPreview && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                Xem trước tin nhắn nhắc hạn
              </h3>
              <button
                onClick={() => setSelectedCustForPreview(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <p><strong>Người nhận:</strong> {selectedCustForPreview.cust.name}</p>
                <p><strong>SĐT:</strong> {selectedCustForPreview.cust.phone}</p>
                <p><strong>Thẻ:</strong> {selectedCustForPreview.insType}</p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nội dung tin nhắn:</label>
                <textarea
                  readOnly
                  rows={6}
                  value={generateMessage(selectedCustForPreview.cust, true, selectedCustForPreview.insType)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedCustForPreview(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={(e) => {
                  handleQuickSendZalo(selectedCustForPreview.cust, selectedCustForPreview.insType, e);
                  setSelectedCustForPreview(null);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
              >
                Gửi Zalo Ngay
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
