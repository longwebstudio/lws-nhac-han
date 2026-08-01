/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Customer, UserSettings } from '../types';
import { 
  Users, Bell, Calendar, DollarSign, Search, Plus, 
  Settings, Download, Upload, RefreshCw, LogOut, Check, Copy, X,
  Cloud, AlertTriangle, UserCheck, Trash2, TrendingUp, BellRing, Sparkles, HelpCircle,
  LayoutGrid, List, Share2, PhoneCall, Phone, HardDrive, Zap, ChevronDown, Clock, WifiOff, Smartphone, BarChart3,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit3, ExternalLink
} from 'lucide-react';
import QuickGuideModal from './QuickGuideModal';
import TermsModal from './TermsModal';
import PWAInstallModal from './PWAInstallModal';
import Expiring7DaysList from './Expiring7DaysList';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 p-2.5 sm:p-3 rounded-xl shadow-2xl text-[11px] sm:text-xs space-y-1.5 leading-none max-w-[85vw] pointer-events-none">
        <p className="font-extrabold text-slate-300 border-b border-slate-800 pb-1 mb-1 font-mono text-center truncate">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-3 sm:gap-5 font-mono">
            <span className="flex items-center gap-1.5 truncate max-w-[140px] sm:max-w-none" style={{ color: entry.color }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.stroke || entry.fill || entry.color }} />
              <span className="truncate">{entry.name}:</span>
            </span>
            <span className="font-extrabold text-white shrink-0">
              {entry.value.toLocaleString()}đ
            </span>
          </div>
        ))}
        {payload.length > 1 && (
          <div className="flex items-center justify-between gap-3 sm:gap-5 font-mono border-t border-slate-800 pt-1.5 mt-1">
            <span className="text-slate-400 font-semibold shrink-0">Cộng:</span>
            <span className="font-black text-emerald-400 shrink-0">
              {payload.reduce((sum: number, entry: any) => sum + entry.value, 0).toLocaleString()}đ
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const renderGenderIcon = (gender?: string) => {
  if (!gender) return null;
  if (gender === 'Nam') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sky-950/80 border border-sky-800 text-sky-400 font-extrabold text-[10px] shrink-0" title="Nam">
        ♂️
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-950/80 border border-rose-800 text-rose-400 font-extrabold text-[10px] shrink-0" title="Nữ">
        ♀️
      </span>
    );
  }
};

interface DashboardProps {
  customers: Customer[];
  settings: UserSettings;
  wpUser: { username: string; email: string; name?: string } | null;
  isSyncing: boolean;
  syncStatus: { type: 'success' | 'error'; message: string } | null;
  currentPlan?: 'offline' | 'online_pro';
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
  onOpenGoogleContacts?: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (customer: Customer) => void;
  onResetDemoData?: () => void;
  onGoBackLanding: () => void;
  onOpenSEOShare?: () => void;
  onOpenPricing?: () => void;
  onCheckCloudVersion?: () => void;
}

export default function Dashboard({
  customers,
  settings,
  wpUser,
  isSyncing,
  syncStatus,
  currentPlan = 'offline',
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
  onOpenGoogleContacts,
  onOpenAddModal,
  onOpenEditModal,
  onResetDemoData,
  onGoBackLanding,
  onOpenSEOShare,
  onOpenPricing,
  onCheckCloudVersion
}: DashboardProps) {

  // search, filters & view layout
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'BHYT' | 'BHXH'>('All');
  const [filterPeriod, setFilterPeriod] = useState<'All' | 'Expired' | '3Days' | '7Days' | '30Days' | 'Safe'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'active' | 'inactive'>('All');
  const [filterReminder, setFilterReminder] = useState<'All' | 'NotReminded' | 'Reminded'>('All');
  const [filterPayer, setFilterPayer] = useState<string>('All');
  const [viewLayout, setViewLayout] = useState<'card' | 'table'>('card');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(12);

  // Tự động về trang 1 khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterPeriod, filterStatus, filterReminder, filterPayer]);

  // Quick payment amount editing state & link rendering helper
  const [quickEditPayment, setQuickEditPayment] = useState<{
    customer: Customer;
    payment: any;
    amountStr: string;
  } | null>(null);

  const handleSaveQuickEditAmount = () => {
    if (!quickEditPayment) return;
    const newAmount = Number(quickEditPayment.amountStr);
    if (isNaN(newAmount) || newAmount < 0) {
      setQuickEditPayment(null);
      return;
    }

    const { customer, payment } = quickEditPayment;
    const updatedHistory = (customer.paymentHistory || []).map(p => {
      if (p.id === payment.id) {
        const commRate = p.commissionRate ?? ((p.type || 'BHYT') === 'BHXH' ? settings.bhxhCommissionRate : settings.bhytCommissionRate);
        const newComm = Math.round(newAmount * (commRate / 100));
        return {
          ...p,
          amountPaid: newAmount,
          commissionAmount: newComm
        };
      }
      return p;
    });

    const updatedCustomer = {
      ...customer,
      paymentHistory: updatedHistory
    };

    onUpdateCustomer(updatedCustomer);
    setQuickEditPayment(null);
  };

  const renderTextWithLinks = (text?: string, customLinkClass?: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    if (parts.length === 1) return text;

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={customLinkClass || "text-sky-400 hover:text-sky-300 underline font-semibold transition-colors cursor-pointer inline-flex items-center gap-0.5 break-all"}
            title={`Mở trang biên lai e-PVI: ${part}`}
          >
            <span>{part}</span>
            <span className="text-[9px] no-underline">↗</span>
          </a>
        );
      }
      return part;
    });
  };

  // local notification template generator states
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [showQuickGuideModal, setShowQuickGuideModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [activeReminderCust, setActiveReminderCust] = useState<Customer | null>(null);
  const [activeReminderChannel, setActiveReminderChannel] = useState<'Zalo' | 'SMS' | 'Call'>('Zalo');
  const [reminderInsType, setReminderInsType] = useState<'BHYT' | 'BHXH'>('BHYT');
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);
  const [copiedCustId, setCopiedCustId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const reminderPanelRef = useRef<HTMLDivElement | null>(null);

  const scrollToReminderPanel = () => {
    setTimeout(() => {
      const el = reminderPanelRef.current || document.getElementById('lws-reminder-panel');
      if (el) {
        const yOffset = -90; // offset for sticky header bar
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }, 100);
  };

  useEffect(() => {
    if (activeReminderCust) {
      scrollToReminderPanel();
    }
  }, [activeReminderCust?.id]);

  const handleCopyCustomerDetails = (cust: Customer, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Get social security code
    let codeBHXH = '';
    if (cust.insuranceCodeBHXH) {
      codeBHXH = cust.insuranceCodeBHXH.trim();
    } else {
      const bhyt = cust.insuranceCode || '';
      codeBHXH = bhyt.length >= 10 ? bhyt.slice(-10) : bhyt;
    }

    // Format birthday YYYY-MM-DD -> DD/MM/YYYY
    const formattedBirthday = cust.birthday
      ? (cust.birthday.includes('-') ? cust.birthday.split('-').reverse().join('/') : cust.birthday)
      : '';

    const details = [
      cust.name,
      codeBHXH,
      formattedBirthday,
      cust.notes || ''
    ].join(', ');

    navigator.clipboard.writeText(details);
    
    setCopiedCustId(cust.id);
    setTimeout(() => {
      setCopiedCustId(null);
    }, 2000);
  };
  const [showResetDemoConfirm, setShowResetDemoConfirm] = useState(false);

  // browser push notifications & simulation states
  const [notifPermission, setNotifPermission] = useState<'default' | 'granted' | 'denied'>('default');
  const lastNotifiedCountRef = useRef(-1);

  // States for interactive monthly revenue chart
  const [chartType, setChartType] = useState<'area' | 'bar'>('bar');
  const [chartInsType, setChartInsType] = useState<'all' | 'BHYT' | 'BHXH'>('all');
  const [selectedChartYear, setSelectedChartYear] = useState<number>(() => new Date().getFullYear());

  // Today's formatted date string (DD/MM/YYYY) for display
  const todayFormatted = useMemo(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  // Helper to calculate days difference relative to current date (Hôm nay)
  const getDaysDiff = useCallback((expiryStr: string) => {
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
  }, []);

  // derived statistics
  const stats = useMemo(() => {
    let expiredCount = 0;
    let in3DaysCount = 0;
    let in7DaysCount = 0;
    let in30DaysCount = 0;
    let warning7DaysCount = 0;
    let totalCollectedAmount = 0;
    let totalEstimatedCommission = 0;
    let bhxhCollected = 0;
    let bhytCollected = 0;
    let bhxhCommission = 0;
    let bhytCommission = 0;
    let currentMonthCollected = 0;
    let upcomingExpiryCustomers = 0;

    customers.forEach(cust => {
      const isReminded = !!cust.lastRemindedDate;

      // Check if candidate is active and has upcoming BHYT/BHXH expiry within 7 days
      if (cust.status === 'active') {
        const diffBHYT = (cust.hasBHYT !== false && cust.expiryDate) ? getDaysDiff(cust.expiryDate) : null;
        const diffBHXH = cust.hasBHXH && cust.expiryDateBHXH ? getDaysDiff(cust.expiryDateBHXH) : null;
        
        const isBHYTWarning = diffBHYT !== null && diffBHYT <= 7;
        const isBHXHWarning = diffBHXH !== null && diffBHXH <= 7;
        
        // Cảnh báo hết hạn trước 7 ngày - Nếu đã nhắc hạn thì bỏ cảnh báo
        if ((isBHYTWarning || isBHXHWarning) && !isReminded) {
          warning7DaysCount++;
          upcomingExpiryCustomers++;
        }
      }

      // 1. Check BHYT (if participating)
      if (cust.hasBHYT !== false && cust.expiryDate && cust.status === 'active') {
        const diffBHYT = getDaysDiff(cust.expiryDate);
        const isReminded = !!cust.lastRemindedDate;
        if (diffBHYT < 0) {
          if (!isReminded) expiredCount++;
        } else {
          if (diffBHYT <= 3 && !isReminded) in3DaysCount++;
          if (diffBHYT <= 7 && !isReminded) in7DaysCount++;
          if (diffBHYT <= 30) in30DaysCount++;
        }
      }

      // 2. Check BHXH (if participating)
      if (cust.hasBHXH && cust.expiryDateBHXH && cust.status === 'active') {
        const diffBHXH = getDaysDiff(cust.expiryDateBHXH);
        const isReminded = !!cust.lastRemindedDate;
        if (diffBHXH < 0) {
          if (!isReminded) expiredCount++;
        } else {
          if (diffBHXH <= 3 && !isReminded) in3DaysCount++;
          if (diffBHXH <= 7 && !isReminded) in7DaysCount++;
          if (diffBHXH <= 30) in30DaysCount++;
        }
      }

      // calculate payments stats
      cust.paymentHistory?.forEach(pay => {
        totalCollectedAmount += pay.amountPaid;
        totalEstimatedCommission += pay.commissionAmount;

        // check if paid in June 2026 (current month)
        if (pay.paymentDate && pay.paymentDate.startsWith('2026-06')) {
          currentMonthCollected += pay.amountPaid;
        }

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
      in30DaysCount,
      warning7DaysCount,
      totalCollectedAmount,
      totalEstimatedCommission,
      bhxhCollected,
      bhytCollected,
      bhxhCommission,
      bhytCommission,
      currentMonthCollected,
      upcomingExpiryCustomers
    };
  }, [customers, getDaysDiff]);

  // Trích xuất tất cả các người nộp gần nhất từ lịch sử giao dịch để làm bộ lọc động
  const uniquePayers = useMemo(() => {
    const payersSet = new Set<string>();
    customers.forEach(cust => {
      const bhytPayments = (cust.paymentHistory || []).filter(p => !p.type || p.type === 'BHYT');
      const bhxhPayments = (cust.paymentHistory || []).filter(p => p.type === 'BHXH');
      
      const latestBHYT = bhytPayments.length > 0
        ? bhytPayments.reduce((latest, current) => current.paymentDate > latest.paymentDate ? current : latest, bhytPayments[0])
        : null;
        
      const latestBHXH = bhxhPayments.length > 0
        ? bhxhPayments.reduce((latest, current) => current.paymentDate > latest.paymentDate ? current : latest, bhxhPayments[0])
        : null;

      if (latestBHYT?.nguoiNop) {
        payersSet.add(latestBHYT.nguoiNop.trim());
      }
      if (latestBHXH?.nguoiNop) {
        payersSet.add(latestBHXH.nguoiNop.trim());
      }
    });
    return Array.from(payersSet).filter(Boolean).sort();
  }, [customers]);

  // Danh sách các năm có trong dữ liệu giao dịch nộp phí
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    const currentYear = new Date().getFullYear();
    yearsSet.add(currentYear);
    customers.forEach(cust => {
      (cust.paymentHistory || []).forEach(pay => {
        if (pay.paymentDate) {
          const y = parseInt(pay.paymentDate.substring(0, 4), 10);
          if (!isNaN(y) && y > 2000) {
            yearsSet.add(y);
          }
        }
      });
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [customers]);

  // Tổng hợp doanh thu nộp phí 12 tháng trong năm được chọn cho biểu đồ cột
  const monthlyRevenueData = useMemo(() => {
    const yearStr = String(selectedChartYear);
    
    // Khởi tạo đầy đủ 12 tháng từ T1 đến T12
    const monthsData = Array.from({ length: 12 }, (_, i) => {
      const mNum = i + 1;
      const monthStr = String(mNum).padStart(2, '0');
      return {
        key: `${yearStr}-${monthStr}`,
        monthLabel: `T${mNum}`,
        monthFull: `Tháng ${monthStr}/${yearStr}`,
        bhyt: 0,
        bhxh: 0,
        total: 0
      };
    });

    const monthMap = new Map(monthsData.map(m => [m.key, m]));

    customers.forEach(cust => {
      (cust.paymentHistory || []).forEach(pay => {
        if (!pay.paymentDate) return;
        const yearMonth = pay.paymentDate.substring(0, 7);
        if (monthMap.has(yearMonth)) {
          const item = monthMap.get(yearMonth)!;
          const amount = pay.amountPaid || 0;
          const type = pay.type || 'BHYT';
          if (type === 'BHXH') {
            item.bhxh += amount;
          } else {
            item.bhyt += amount;
          }
          item.total += amount;
        }
      });
    });

    return monthsData;
  }, [customers, selectedChartYear]);

  // Tổng doanh thu năm được chọn
  const totalYearRevenue = useMemo(() => {
    return monthlyRevenueData.reduce((sum, item) => sum + item.total, 0);
  }, [monthlyRevenueData]);

  // filter implementation
  const filteredCustomers = useMemo(() => {
    return customers.filter(cust => {
      // Find most recent BHYT and BHXH payments
      const bhytPayments = (cust.paymentHistory || []).filter(p => !p.type || p.type === 'BHYT');
      const bhxhPayments = (cust.paymentHistory || []).filter(p => p.type === 'BHXH');
      
      const latestBHYT = bhytPayments.length > 0
        ? bhytPayments.reduce((latest, current) => current.paymentDate > latest.paymentDate ? current : latest, bhytPayments[0])
        : null;
        
      const latestBHXH = bhxhPayments.length > 0
        ? bhxhPayments.reduce((latest, current) => current.paymentDate > latest.paymentDate ? current : latest, bhxhPayments[0])
        : null;

      // 1. Search Query
      const query = searchQuery.toLowerCase().trim();
      let matchesSearch = true;
      if (query) {
        const tokens = query.split(/\s+/);
        matchesSearch = tokens.every(token => {
          return cust.name.toLowerCase().includes(token) ||
            cust.phone.includes(token) ||
            cust.cccd.toLowerCase().includes(token) ||
            cust.insuranceCode.toLowerCase().includes(token) ||
            (cust.insuranceCodeBHXH && cust.insuranceCodeBHXH.toLowerCase().includes(token)) ||
            (cust.address && cust.address.toLowerCase().includes(token)) ||
            (cust.birthday && cust.birthday.toLowerCase().includes(token)) ||
            (cust.notes && cust.notes.toLowerCase().includes(token)) ||
            (latestBHYT?.nguoiNop && latestBHYT.nguoiNop.toLowerCase().includes(token)) ||
            (latestBHXH?.nguoiNop && latestBHXH.nguoiNop.toLowerCase().includes(token));
        });
      }

      // 2. Insurance type filter
      let matchesType = true;
      if (filterType === 'BHYT') {
        matchesType = cust.hasBHYT !== false;
      } else if (filterType === 'BHXH') {
        matchesType = !!cust.hasBHXH;
      }

      // 3. Status filter
      const matchesStatus = filterStatus === 'All' || cust.status === filterStatus;

      // 4. Period Expiry filter
      let matchesPeriod = true;
      if (filterPeriod !== 'All') {
        const diffBHYT = (cust.hasBHYT !== false && cust.expiryDate) ? getDaysDiff(cust.expiryDate) : null;
        const diffBHXH = (cust.hasBHXH && cust.expiryDateBHXH) ? getDaysDiff(cust.expiryDateBHXH) : null;
        const isReminded = !!cust.lastRemindedDate;

        const checkDiff = (diff: number | null) => {
          if (diff === null) return false;
          if (filterPeriod === 'Expired') return diff < 0 && !isReminded;
          if (filterPeriod === '3Days') return diff >= 0 && diff <= 3 && !isReminded;
          if (filterPeriod === '7Days') return diff <= 7 && !isReminded;
          if (filterPeriod === '30Days') return diff >= 0 && diff <= 30;
          if (filterPeriod === 'Safe') return diff > 30;
          return true;
        };

        if (filterType === 'BHYT') {
          matchesPeriod = checkDiff(diffBHYT);
        } else if (filterType === 'BHXH') {
          matchesPeriod = checkDiff(diffBHXH);
        } else {
          if (filterPeriod === 'Safe') {
            const bhytSafe = diffBHYT === null || diffBHYT > 30;
            const bhxhSafe = diffBHXH === null || diffBHXH > 30;
            matchesPeriod = (diffBHYT !== null || diffBHXH !== null) && bhytSafe && bhxhSafe;
          } else {
            matchesPeriod = checkDiff(diffBHYT) || checkDiff(diffBHXH);
          }
        }
      }

      // 5. Reminder status filter
      const matchesReminder = filterReminder === 'All' || 
        (filterReminder === 'Reminded' && !!cust.lastRemindedDate) ||
        (filterReminder === 'NotReminded' && !cust.lastRemindedDate);

      // 6. Latest Payer filter
      let matchesPayer = true;
      if (filterPayer === 'None') {
        const payerBHYT = latestBHYT?.nguoiNop?.trim() || '';
        const payerBHXH = latestBHXH?.nguoiNop?.trim() || '';
        if (filterType === 'BHXH') {
          matchesPayer = payerBHXH === '';
        } else if (filterType === 'BHYT') {
          matchesPayer = payerBHYT === '';
        } else {
          matchesPayer = payerBHYT === '' && (!cust.hasBHXH || payerBHXH === '');
        }
      } else if (filterPayer !== 'All') {
        const payerBHYT = latestBHYT?.nguoiNop?.trim() || '';
        const payerBHXH = latestBHXH?.nguoiNop?.trim() || '';
        matchesPayer = (payerBHYT === filterPayer) || (payerBHXH === filterPayer);
      }

      return matchesSearch && matchesType && matchesStatus && matchesPeriod && matchesReminder && matchesPayer;
    });
  }, [customers, searchQuery, filterType, filterStatus, filterPeriod, filterReminder, filterPayer, getDaysDiff]);

  // Phân trang danh sách người dân
  const totalItems = filteredCustomers.length;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedCustomers = useMemo(() => {
    if (pageSize === 'all') return filteredCustomers;
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, safeCurrentPage, pageSize]);

  // Dãy số trang hiển thị thông minh
  const getPageNumbers = (current: number, total: number) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // Khách hàng phát CẢNH BÁO HẾT HẠN TRONG 7 NGÀY (hoặc quá hạn) CHƯA ĐƯỢC NHẮC HẠN
  const todayCustomers = useMemo(() => {
    return customers.filter(cust => {
      if (cust.status !== 'active') return false;
      
      // Nếu đã nhắc hạn thì BỎ CẢNH BÁO
      if (cust.lastRemindedDate) return false;

      const diffBHYT = cust.hasBHYT !== false && cust.expiryDate ? getDaysDiff(cust.expiryDate) : null;
      const diffBHXH = cust.hasBHXH && cust.expiryDateBHXH ? getDaysDiff(cust.expiryDateBHXH) : null;
        
      const isBHYTWarning = diffBHYT !== null && diffBHYT <= 7;
      const isBHXHWarning = diffBHXH !== null && diffBHXH <= 7;

      return isBHYTWarning || isBHXHWarning;
    });
  }, [customers, getDaysDiff]);

  // Kiểm tra quyền nhận thông báo trên trình duyệt
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  // Tự động bắn thông báo khi có người hết hạn hôm nay và có quyền thông báo
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (notifPermission === 'granted' && todayCustomers.length > 0) {
        if (lastNotifiedCountRef.current !== todayCustomers.length) {
          lastNotifiedCountRef.current = todayCustomers.length;
          
          const namesStr = todayCustomers.map(c => c.name).join(', ');
          try {
            new Notification('🔔 LWS Nhắc Hạn - Có Hạn Đóng Phí Hôm Nay!', {
              body: `Hôm nay có ${todayCustomers.length} người dân cần đóng phí bảo hiểm: ${namesStr}. Hãy kiểm tra để gửi tin nhắn nhắc nhở.`,
              icon: '/favicon.ico',
              tag: 'lws-today-payment-reminder'
            });
          } catch (e) {
            console.warn('Không thể gửi thông báo hệ thống do giới hạn iFrame hoặc cài đặt trình duyệt:', e);
          }
        }
      }
    }
  }, [todayCustomers, notifPermission]);

  // Yêu cầu quyền thông báo
  const handleRequestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Trình duyệt của bạn hiện tại chưa hỗ trợ API thông báo hệ thống.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === 'granted') {
        new Notification('🔔 LWS Nhắc Hạn', {
          body: 'Tuyệt vời! Bạn đã kích hoạt thành công tính năng thông báo thúc đóng bảo hiểm trên trình duyệt.',
          icon: '/favicon.ico'
        });
      } else if (permission === 'denied') {
        alert('Thông báo bị chặn! Bạn vui lòng nâng cấp quyền Thông báo (Notifications) trong cài đặt trang web của trình duyệt (bấm biểu tượng ổ khóa cạnh thanh địa chỉ).');
      }
    } catch (err) {
      console.warn('Yêu cầu cấp quyền bị chặn bởi trình duyệt:', err);
      alert('Yêu cầu cấp thông báo bị trình duyệt từ chối. Hãy thử mở ứng dụng ở một tab mới độc lập để nhận quyền thông báo đầy đủ nhé!');
    }
  };

  // Trực tiếp bắn thử thông báo hệ thống test
  const handleTestNotificationResponse = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Trình duyệt của bạn chưa hỗ trợ API thông báo hệ thống.');
      return;
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        setNotifPermission(perm);
        if (perm === 'granted') {
          triggerTestNotif();
        }
      });
    } else if (Notification.permission === 'granted') {
      triggerTestNotif();
    } else {
      alert('Quyền thông báo đang bị chặn. Nhấp biểu tượng ổ khóa cạnh địa chỉ trang web để cho phép và thử lại.');
    }

    function triggerTestNotif() {
      try {
        new Notification('🔔 LWS Nhắc Hạn - KIỂM TRA THỬ', {
          body: 'Chào đại lý! Tính năng nhắc việc nộp phí bảo hiểm hàng ngày trên trình duyệt đã hoạt động trơn tru!',
          icon: '/favicon.ico',
          tag: 'lws-test-bell'
        });
      } catch (err) {
        alert('Đã tạo thông báo thử nghiệm! Để nhận thông báo nổi hệ điều hành ngoài iFrame, bạn cũng có thể mở liên kết phiên bản trong một Tab trình duyệt mới.');
      }
    }
  };

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

  const generateCallScript = (customer: Customer, insType: 'BHYT' | 'BHXH' = 'BHYT') => {
    const isBHXH = insType === 'BHXH';
    const typeLabel = isBHXH ? 'Bảo hiểm Xã hội tự nguyện' : 'Bảo hiểm Y tế Hộ gia đình';
    const expDate = isBHXH ? (customer.expiryDateBHXH || '') : customer.expiryDate;
    const code = isBHXH ? (customer.insuranceCodeBHXH || customer.insuranceCode) : customer.insuranceCode;
    const diff = getDaysDiff(expDate);
    const statusText = diff < 0 ? `đã hết hạn ${Math.abs(diff)} ngày` : `sẽ hết hạn vào ngày ${expDate} (còn ${diff} ngày nữa)`;

    return `KỊCH BẢN GỌI ĐIỆN NHẮC HẠN TÁI TỤC:
📞 Người nhận: ${customer.name} - SĐT: ${customer.phone}

• Lời chào: "Alo, xin chào ${customer.name} ạ! Em/Cháu là cán bộ đại lý thu BHXH-BHYT ${settings.agencyName} (${settings.agentPhone})."
• Thông báo: "Em gọi điện thông báo thẻ ${typeLabel} (Mã số: ${code || 'chưa ghi nhận'}) của ${customer.name} ${statusText}."
• Đề xuất: "Để đảm bảo quyền lợi ${isBHXH ? 'tích lũy số tháng đóng BHXH hưởng lương hưu' : 'khám chữa bệnh BHYT liên tục 100%'}, ${customer.name} vui lòng thu xếp nộp phí gia hạn sớm nhé ạ."
• Hướng dẫn: "Cháu sẽ gửi thông tin tài khoản thu nộp chính thức qua Zalo/SMS hoặc qua trực tiếp hỗ trợ ${customer.name} ạ!"`;
  };

  const handleMakeCallReminder = () => {
    if (activeReminderCust) {
      const todayStr = new Date().toISOString().split('T')[0];
      const updatedCustomer: Customer = {
        ...activeReminderCust,
        lastRemindedDate: todayStr,
        lastRemindedChannel: 'Call',
        hinhThucNhac: 'Call',
        lastRemindedType: reminderInsType
      };
      setActiveReminderCust(updatedCustomer);
      onUpdateCustomer(updatedCustomer);

      const cleanPhone = activeReminderCust.phone.replace(/[^0-9]/g, '');
      if (cleanPhone) {
        window.location.href = `tel:${cleanPhone}`;
      } else {
        alert('Người dân chưa có số điện thoại hợp lệ để thực hiện cuộc gọi.');
      }
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopiedAlert(true);
    setTimeout(() => {
      setShowCopiedAlert(false);
    }, 2500);

    // Automatically update last reminder status for this customer
    if (activeReminderCust) {
      const todayStr = new Date().toISOString().split('T')[0];
      const updatedCustomer: Customer = {
        ...activeReminderCust,
        lastRemindedDate: todayStr,
        lastRemindedChannel: activeReminderChannel,
        hinhThucNhac: activeReminderChannel,
        lastRemindedType: reminderInsType
      };
      
      // Update state immediately to reflect changes in UI
      setActiveReminderCust(updatedCustomer);
      // Persist values
      onUpdateCustomer(updatedCustomer);
    }
  };

  // Quick mark customer as reminded (clears warning)
  const handleMarkAsReminded = (cust: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedCustomer: Customer = {
      ...cust,
      lastRemindedDate: todayStr,
      lastRemindedChannel: cust.hinhThucNhac || 'Zalo',
      lastRemindedType: cust.hasBHYT !== false ? 'BHYT' : 'BHXH'
    };
    onUpdateCustomer(updatedCustomer);
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
      
      {/* Realtime Date Sticky Anchor */}
      <div className="bg-[#111126] text-emerald-400 text-[10px] py-1.5 px-4 text-center font-bold font-mono tracking-wider border-b border-slate-900 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
        <span>📅 HÔM NAY: {todayFormatted} (Cột đếm ngược & nhắc hạn tự động lấy theo ngày hiện tại)</span>
      </div>

      {/* Modern Dashboard Header */}
      <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-900 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2 min-w-0 shrink max-w-[160px] sm:max-w-[260px] md:max-w-md">
            <span className="p-1 px-2.5 bg-emerald-600 rounded-lg text-white font-black text-sm shrink-0">LWS</span>
            <div className="min-w-0">
              <span className="font-extrabold text-sm tracking-tight text-white block truncate">LWS - Sổ thu bảo hiểm</span>
              <span className="text-[9px] text-slate-400 block font-semibold truncate" title={settings.agencyName}>
                {settings.agencyName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Main Add Button */}
            <button
              onClick={onOpenAddModal}
              className="px-2.5 sm:px-3 py-2 text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-bold shadow-sm"
              title="Thêm người dân đóng bảo hiểm mới"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Thêm Người Dân</span>
            </button>

            {onOpenPricing && (
              <button
                onClick={onOpenPricing}
                className={`px-2 sm:px-2.5 py-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                  currentPlan === 'online_pro'
                    ? 'bg-gradient-to-r from-emerald-950 to-teal-950 text-emerald-300 border-emerald-500/80 hover:border-emerald-400'
                    : 'bg-slate-900 text-slate-300 border-slate-750 hover:bg-slate-850 hover:text-white'
                }`}
                title="Bảng giá dịch vụ: Bản Offline (Miễn phí) & Bản Online Pro (Gói Pro 99k/tháng)"
              >
                {currentPlan === 'online_pro' ? (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400" />
                    <span className="hidden sm:inline">Online Pro</span>
                    <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-1 py-0.2 rounded">Pro</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="hidden sm:inline">Bản Offline</span>
                    <span className="bg-slate-800 text-emerald-400 text-[9px] font-extrabold px-1 py-0.2 rounded">0đ</span>
                  </>
                )}
              </button>
            )}

            {/* Menu Cài Đặt Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
                className={`px-2.5 sm:px-3 py-2 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-bold shadow-xs ${
                  isSettingsMenuOpen
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-slate-900 text-slate-200 border-slate-750 hover:bg-slate-850 hover:text-white'
                }`}
                title="Menu Cài Đặt: Cấu hình, Khôi phục mẫu, Sao lưu, Excel, Hướng dẫn & SEO"
              >
                <Settings className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Menu Cài Đặt</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSettingsMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSettingsMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsSettingsMenuOpen(false)} 
                  />

                  {/* Dropdown Card */}
                  <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Menu Cài Đặt & Tiện Ích</p>
                      <p className="text-[11px] text-slate-400 font-medium">Sổ Thu Bảo Hiểm LWS</p>
                    </div>

                    {/* 1. Cấu hình hệ thống & Hoa hồng */}
                    <button
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-850 transition-colors flex items-center gap-2.5 text-xs font-bold text-white group cursor-pointer"
                    >
                      <div className="p-1.5 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-slate-200 group-hover:text-white">Cấu Hình Hệ Thống</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Tỉ lệ hoa hồng, thông tin đại lý & SMS</span>
                      </div>
                    </button>

                    {/* 2. Sao lưu dự phòng */}
                    <button
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        handleExportData();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-850 transition-colors flex items-center gap-2.5 text-xs font-bold text-white group cursor-pointer"
                    >
                      <div className="p-1.5 bg-teal-950 border border-teal-800 rounded-lg text-teal-400 group-hover:scale-105 transition-transform shrink-0">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-slate-200 group-hover:text-white">Sao Lưu Dự Phòng</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Tải file JSON sao lưu về máy</span>
                      </div>
                    </button>

                    {/* 4. Nhập từ Excel */}
                    <button
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        onOpenImport();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-850 transition-colors flex items-center gap-2.5 text-xs font-bold text-white group cursor-pointer"
                    >
                      <div className="p-1.5 bg-blue-950 border border-blue-800 rounded-lg text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-slate-200 group-hover:text-white">Nhập Từ Excel</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Nạp danh sách đóng BHYT/BHXH</span>
                      </div>
                    </button>

                    {/* 4.5. Đồng bộ Danh bạ Google */}
                    {onOpenGoogleContacts && (
                      <button
                        onClick={() => {
                          setIsSettingsMenuOpen(false);
                          onOpenGoogleContacts();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-850 transition-colors flex items-center gap-2.5 text-xs font-bold text-white group cursor-pointer"
                      >
                        <div className="p-1.5 bg-sky-950 border border-sky-800 rounded-lg text-sky-400 group-hover:scale-105 transition-transform shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-slate-200 group-hover:text-white">Danh Bạ Google</span>
                          <span className="block text-[10px] text-slate-400 font-normal">Đồng bộ liên hệ Google Contacts</span>
                        </div>
                      </button>
                    )}

                    {/* 5. Cài đặt Ứng Dụng PWA (Dùng Offline) */}
                    <button
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        setShowPwaModal(true);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-850 transition-colors flex items-center gap-2.5 text-xs font-bold text-white group cursor-pointer"
                    >
                      <div className="p-1.5 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-slate-200 group-hover:text-white flex items-center gap-1">
                          Cài App PWA (Offline)
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px]">Hot</span>
                        </span>
                        <span className="block text-[10px] text-slate-400 font-normal">Sử dụng ngay cả khi không có mạng</span>
                      </div>
                    </button>

                    {/* 6. Hướng dẫn 3 bước */}
                    <button
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        setShowQuickGuideModal(true);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-850 transition-colors flex items-center gap-2.5 text-xs font-bold text-white group cursor-pointer"
                    >
                      <div className="p-1.5 bg-amber-950 border border-amber-800 rounded-lg text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-slate-200 group-hover:text-white">Hướng Dẫn 3 Bước</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Quy trình sử dụng nhanh</span>
                      </div>
                    </button>

                    {/* 6. SEO & Chia Sẻ */}
                    {onOpenSEOShare && (
                      <button
                        onClick={() => {
                          setIsSettingsMenuOpen(false);
                          onOpenSEOShare();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-850 transition-colors flex items-center gap-2.5 text-xs font-bold text-white group cursor-pointer"
                      >
                        <div className="p-1.5 bg-indigo-950 border border-indigo-800 rounded-lg text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                          <Share2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-slate-200 group-hover:text-white">SEO & Chia Sẻ</span>
                          <span className="block text-[10px] text-slate-400 font-normal">Xem trước thẻ Open Graph Zalo</span>
                        </div>
                      </button>
                    )}

                  </div>
                </>
              )}
            </div>

            <button
              onClick={onGoBackLanding}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
              title="Về Trang Landing Page"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="hidden sm:inline">Trang Chủ</span>
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-900/60 uppercase">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                      Đã Đồng Bộ Hóa
                    </span>
                    {settings.autoBackupWordPress ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase" title="Tự động sao lưu LocalStorage lên WordPress mỗi ngày">
                        🛡️ Sao Lưu Hàng Ngày: BẬT {settings.lastAutoBackupDate ? `(${settings.lastAutoBackupDate})` : ''}
                      </span>
                    ) : (
                      <button 
                        type="button"
                        onClick={onOpenSettings}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 uppercase cursor-pointer"
                        title="Bật tự động sao lưu trong Cài đặt"
                      >
                        ⚡ Sao Lưu Hàng Ngày: TẮT (Bật ngay)
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-955 text-amber-300 border border-amber-900/40 uppercase">
                    Ngoại tuyến (Offline)
                  </span>
                )}
              </div>
              
              {wpUser ? (
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-300">
                    Đã đăng nhập WordPress: <strong className="text-white font-mono">{wpUser.username}</strong> | Email: <span className="font-mono text-slate-400">{wpUser.email}</span>
                  </p>
                  {settings.lastSyncedVersion && (
                    <p className="text-[11px] text-emerald-400 font-mono">
                      📌 Phiên bản đồng bộ gần nhất: <span className="font-bold">{settings.lastSyncedVersion}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Bạn đang lưu trữ dữ liệu cục bộ trên Trình duyệt. Hãy kết nối WordPress GraphQL để nâng cấp đồng bộ đám mây vĩnh viễn.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenGoogleContacts && (
              <button
                type="button"
                onClick={onOpenGoogleContacts}
                className="px-3.5 py-2 text-xs font-bold text-sky-300 bg-sky-950/60 hover:bg-sky-900/80 border border-sky-800/80 hover:border-sky-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                title="Sao lưu dự phòng & Đồng bộ 2 chiều danh bạ qua Google Contacts API"
              >
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Google Contacts Backup</span>
              </button>
            )}

            {wpUser ? (
              <>
                {onCheckCloudVersion && (
                  <button
                    type="button"
                    onClick={onCheckCloudVersion}
                    disabled={isSyncing}
                    className="px-3 py-2 text-xs font-semibold text-sky-300 bg-sky-950/60 hover:bg-sky-900/80 border border-sky-800 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    title="So sánh phiên bản Sổ Thu hiện tại với phiên bản mới nhất trên WordPress Cloud"
                  >
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>So Sánh Version</span>
                  </button>
                )}
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

        {/* DANH SÁCH KHÁCH HÀNG HẾT HẠN TRONG 7 NGÀY TỚI (CÓ NÚT BẤM NHANH GỬI ZALO/SMS) */}
        <Expiring7DaysList
          customers={customers}
          settings={settings}
          onUpdateCustomer={onUpdateCustomer}
          onMarkAsReminded={handleMarkAsReminded}
          onOpenReminderPanel={(cust, channel, insType) => {
            setActiveReminderCust(cust);
            setActiveReminderChannel(channel);
            setReminderInsType(insType);
            scrollToReminderPanel();
          }}
        />

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
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
          <div 
            onClick={() => setFilterPeriod(filterPeriod === 'Expired' ? 'All' : 'Expired')}
            className={`bg-slate-900 rounded-2xl border p-4 shadow-xs flex items-center gap-3 cursor-pointer transition-all hover:border-rose-700/80 ${
              filterPeriod === 'Expired' ? 'border-rose-500 bg-rose-955/20' : 'border-slate-800'
            }`}
            title="Nhấp để lọc danh sách người dân đã quá hạn đóng"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stats.expiredCount > 0 ? 'bg-rose-950/60 border border-rose-900 text-rose-400 animate-pulse' : 'bg-slate-950 text-slate-500 border border-slate-850'}`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Đã quá hạn đóng</span>
              <span className={`text-xl font-black font-mono block ${stats.expiredCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>{stats.expiredCount}</span>
            </div>
          </div>

          {/* Card 3: Expiring soon (30 days) */}
          <div 
            onClick={() => setFilterPeriod(filterPeriod === '30Days' ? 'All' : '30Days')}
            className={`bg-slate-900 rounded-2xl border p-4 shadow-xs flex items-center gap-3 cursor-pointer transition-all hover:border-amber-700/80 ${
              filterPeriod === '30Days' ? 'border-amber-500 bg-amber-955/20' : 'border-slate-800'
            }`}
            title="Nhấp để lọc danh sách người dân có BHYT hoặc BHXH sắp hết hạn trong 30 ngày tới"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stats.in30DaysCount > 0 ? 'bg-amber-955/60 border border-amber-900/60 text-amber-400' : 'bg-slate-950 text-slate-500 border border-slate-850'}`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sắp hết hạn (30 ngày)</span>
              <span className="text-xl font-black font-mono text-white block">
                {stats.in30DaysCount}
              </span>
            </div>
          </div>

          {/* Card 4: Estimated Monthly Commission */}
          <div className="bg-emerald-950 text-emerald-300 rounded-2xl border border-emerald-900 p-3.5 sm:p-4 shadow-sm flex items-start sm:items-center gap-3 col-span-2 sm:col-span-1 min-w-0 overflow-hidden">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-900 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-805 mt-0.5 sm:mt-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block truncate">Hoa hồng đại lý</span>
              <span className="text-sm sm:text-base font-extrabold text-white font-mono block truncate">
                {stats.totalEstimatedCommission.toLocaleString()}đ
              </span>
              <p className="text-[9px] text-emerald-300/80 truncate">Từ {stats.totalCollectedAmount.toLocaleString()}đ phí thu hộ</p>
              
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-emerald-900/40 pt-1 mt-1 text-[9px] text-emerald-300/90">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-teal-400">BHYT:</span> <span className="font-mono font-bold">{stats.bhytCommission.toLocaleString()}đ</span>
                </div>
                <div className="flex items-center gap-1 border-l border-emerald-900/40 pl-2">
                  <span className="font-semibold text-indigo-400">BHXH:</span> <span className="font-mono font-bold">{stats.bhxhCommission.toLocaleString()}đ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Dashboard tổng quan tháng hiện tại */}
          <div className="bg-[#111126] hover:bg-[#151532] text-indigo-200 rounded-2xl border border-indigo-900/60 p-3.5 sm:p-4 shadow-md flex items-start sm:items-center gap-3 col-span-2 sm:col-span-1 min-w-0 overflow-hidden transition-all">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-900 animate-pulse mt-0.5 sm:mt-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider block">Tổng Quan Tháng H.Tại</span>
              <div className="mt-1 space-y-1">
                <div className="flex items-center justify-between text-[11px] gap-1">
                  <span className="text-slate-400 shrink-0">Đã thu:</span>
                  <span className="text-emerald-400 font-bold font-mono text-[11px] truncate">{stats.currentMonthCollected.toLocaleString()}đ</span>
                </div>
                <div className="flex items-center justify-between text-[11px] gap-1">
                  <span className="text-slate-400 shrink-0">Sắp hết hạn:</span>
                  <span className={`font-black font-mono text-[11px] shrink-0 truncate ${stats.upcomingExpiryCustomers > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-300'}`}>
                    {stats.upcomingExpiryCustomers} người
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* THỐNG KÊ DOANH THU THU HỘ THEO THÁNG - BIỂU ĐỒ CỘT (RECHARTS) */}
        <div id="revenue-chart-section" className="bg-slate-900 border border-slate-850 rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-4 max-w-full overflow-hidden min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60 min-w-0">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="p-2 bg-emerald-950/50 rounded-xl text-emerald-400 border border-emerald-800/50 mt-0.5 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 flex-wrap leading-tight">
                    Biểu đồ Cột Doanh Thu Thu Hộ Theo Tháng ({selectedChartYear})
                  </h3>
                  <span className="text-[11px] font-black text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-lg font-mono">
                    Tổng năm: {totalYearRevenue.toLocaleString()}đ
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                  Thống kê tổng số tiền thu được theo từng tháng trong năm giúp theo dõi hiệu quả kinh doanh đại lý.
                </p>
              </div>
            </div>

            {/* Phím điều khiển biểu đồ */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Select Year */}
              <div className="flex items-center bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0 gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold">Năm:</span>
                <select
                  value={selectedChartYear}
                  onChange={(e) => setSelectedChartYear(Number(e.target.value))}
                  className="bg-transparent text-[11px] font-extrabold text-white font-mono focus:outline-none cursor-pointer"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year} className="bg-slate-900 text-white font-mono">
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lọc loại bảo hiểm */}
              <div className="flex bg-slate-950 p-0.5 rounded-lg text-[10px] font-bold border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setChartInsType('all')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    chartInsType === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cả hai
                </button>
                <button
                  type="button"
                  onClick={() => setChartInsType('BHYT')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    chartInsType === 'BHYT' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  BHYT
                </button>
                <button
                  type="button"
                  onClick={() => setChartInsType('BHXH')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    chartInsType === 'BHXH' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  BHXH
                </button>
              </div>

              {/* Kiểu đồ thị */}
              <div className="flex bg-slate-950 p-0.5 rounded-lg text-[10px] font-bold border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    chartType === 'bar' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cột
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('area')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    chartType === 'area' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Vùng
                </button>
              </div>
            </div>
          </div>

          {/* Vùng hiển thị Biểu đồ */}
          <div className="space-y-4 min-w-0">
            <div className="h-[230px] md:h-[270px] w-full select-none min-w-0 overflow-hidden relative">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart
                    data={monthlyRevenueData}
                    margin={{ top: 12, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                    <XAxis 
                      dataKey="monthLabel" 
                      stroke="#94a3b8" 
                      fontSize={11}
                      fontWeight="bold"
                      tickLine={false} 
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={10}
                      fontWeight="bold"
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`}
                      dx={-4}
                    />
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 50, outline: 'none' }} allowEscapeViewBox={{ x: false, y: false }} />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    />
                    {(chartInsType === 'all' || chartInsType === 'BHYT') && (
                      <Bar 
                        dataKey="bhyt" 
                        name="Bảo hiểm Y tế (BHYT)" 
                        fill="#10b981" 
                        radius={chartInsType === 'all' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                        maxBarSize={32}
                        stackId={chartInsType === 'all' ? "1" : undefined}
                      />
                    )}
                    {(chartInsType === 'all' || chartInsType === 'BHXH') && (
                      <Bar 
                        dataKey="bhxh" 
                        name="BHXH Tự nguyện (BHXH)" 
                        fill="#6366f1" 
                        radius={[6, 6, 0, 0]}
                        maxBarSize={32}
                        stackId={chartInsType === 'all' ? "1" : undefined}
                      />
                    )}
                  </BarChart>
                ) : (
                  <AreaChart
                    data={monthlyRevenueData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorBHYT" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorBHXH" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.25} />
                    <XAxis 
                      dataKey="monthLabel" 
                      stroke="#94a3b8" 
                      fontSize={11}
                      fontWeight="bold"
                      tickLine={false} 
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={10}
                      fontWeight="bold"
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`}
                      dx={-4}
                    />
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 50, outline: 'none' }} allowEscapeViewBox={{ x: false, y: false }} />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    />
                    {(chartInsType === 'all' || chartInsType === 'BHYT') && (
                      <Area 
                        type="monotone" 
                        dataKey="bhyt" 
                        name="Bảo hiểm Y tế (BHYT)" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#colorBHYT)" 
                        strokeWidth={2}
                        stackId={chartInsType === 'all' ? "1" : undefined}
                      />
                    )}
                    {(chartInsType === 'all' || chartInsType === 'BHXH') && (
                      <Area 
                        type="monotone" 
                        dataKey="bhxh" 
                        name="BHXH Tự nguyện (BHXH)" 
                        stroke="#6366f1" 
                        fillOpacity={1} 
                        fill="url(#colorBHXH)" 
                        strokeWidth={2}
                        stackId={chartInsType === 'all' ? "1" : undefined}
                      />
                    )}
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Chỉ số Phân tích Kinh doanh theo tháng */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-center space-y-0.5 min-w-0 overflow-hidden">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase block truncate">Tháng cao điểm nhất ({selectedChartYear})</span>
                <span className="text-xs font-black text-rose-400 block font-mono truncate">
                  {(() => {
                    const withRev = monthlyRevenueData.filter(d => d.total > 0);
                    if (!withRev.length) return 'N/A';
                    const sorted = [...withRev].sort((a, b) => b.total - a.total);
                    return `${sorted[0].monthFull} (${sorted[0].total.toLocaleString()}đ)`;
                  })()}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-center space-y-0.5 min-w-0 overflow-hidden">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase block truncate">Trung bình / Tháng</span>
                <span className="text-xs font-black text-emerald-400 block font-mono truncate">
                  {(() => {
                    const sum = monthlyRevenueData.reduce((tot, d) => tot + d.total, 0);
                    return `${Math.round(sum / 12).toLocaleString()}đ`;
                  })()}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-center space-y-0.5 min-w-0 overflow-hidden">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase block truncate">Tổng thu năm {selectedChartYear}</span>
                <span className="text-xs font-black text-indigo-400 block font-mono truncate">
                  {totalYearRevenue.toLocaleString()}đ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic reminder generation pane if clicked */}
        {activeReminderCust && (
          <div 
            ref={reminderPanelRef}
            id="lws-reminder-panel"
            className="bg-slate-900 border border-emerald-900/60 rounded-2xl p-4 sm:p-5 relative animate-in slide-in-from-top-3 duration-200 space-y-3 shadow-md scroll-mt-24"
          >
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

              {/* Toggle Zalo / SMS / Gọi điện */}
              <div className="flex gap-1 bg-slate-950/80 p-0.5 rounded-lg text-xs font-semibold border border-slate-850">
                <button
                  type="button"
                  onClick={() => setActiveReminderChannel('Zalo')}
                  className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    activeReminderChannel === 'Zalo' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  💬 Gửi Zalo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReminderChannel('SMS')}
                  className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    activeReminderChannel === 'SMS' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  ✉️ Gửi SMS
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReminderChannel('Call')}
                  className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    activeReminderChannel === 'Call' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  📞 Gọi điện
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

            {/* Last Reminded Status */}
            {activeReminderCust.lastRemindedDate ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/90 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Bell className="w-4 h-4 shrink-0 animate-bounce text-amber-400" />
                  <span>
                    Lần nhắc gần nhất: Ngày {activeReminderCust.lastRemindedDate} qua {(activeReminderCust.hinhThucNhac || activeReminderCust.lastRemindedChannel) === 'Call' ? 'Gọi điện thoại' : (activeReminderCust.hinhThucNhac || activeReminderCust.lastRemindedChannel)} (Loại {activeReminderCust.lastRemindedType})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const cleared: Customer = {
                      ...activeReminderCust,
                    };
                    delete cleared.lastRemindedDate;
                    delete cleared.lastRemindedChannel;
                    delete cleared.hinhThucNhac;
                    delete cleared.lastRemindedType;
                    setActiveReminderCust(cleared);
                    onUpdateCustomer(cleared);
                  }}
                  className="text-[10px] text-rose-450 hover:text-rose-400 font-bold hover:underline cursor-pointer transition-colors shrink-0 text-left"
                >
                  Xóa trạng thái nhắc
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-850 text-xs text-slate-500 italic">
                <Bell className="w-3.5 h-3.5 text-slate-650 shrink-0" />
                <span>Chính sách này chưa được nhắc đóng phí. Hệ thống sẽ tự động ghi nhận "Đã nhắc" ngay khi bạn bấm gọi hoặc sao chép!</span>
              </div>
            )}

            {activeReminderChannel === 'Call' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-amber-300 uppercase flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5" />
                    Kịch bản lời thoại gọi điện trực tiếp:
                  </label>
                  <span className="text-[10px] text-amber-400 font-semibold">
                    Kênh: Gọi điện thoại
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    readOnly
                    rows={6}
                    value={generateCallScript(activeReminderCust, reminderInsType)}
                    className="w-full text-xs font-sans p-3 border border-amber-900/60 rounded-xl bg-slate-950 text-amber-100/90 leading-relaxed shadow-xs focus:outline-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleMakeCallReminder}
                      className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-500 px-3.5 py-2 rounded-xl transition-transform active:scale-95 cursor-pointer shadow-md w-full sm:w-auto"
                      title={`Thực hiện cuộc gọi trực tiếp tới ${activeReminderCust.phone}`}
                    >
                      <PhoneCall className="w-4 h-4 shrink-0" />
                      <span>Thực hiện cuộc gọi ({activeReminderCust.phone})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyMessage(generateCallScript(activeReminderCust, reminderInsType))}
                      className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl transition-transform active:scale-95 cursor-pointer border border-slate-700 shadow-md w-full sm:w-auto"
                      title="Sao chép kịch bản lời thoại vào bộ nhớ tạm"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span>Sao chép kịch bản</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-400 leading-normal">
                    💡 Bấm "Thực hiện cuộc gọi" để máy tự gọi thoại tới SĐT người dân và tự động cập nhật "Đã nhắc qua Gọi điện".
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">
                    Bản nháp tin nhắn {reminderInsType === 'BHXH' ? 'BHXH Tự nguyện' : 'BHYT Hộ gia đình'} điền tự động:
                  </label>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    Mẫu: {reminderInsType === 'BHXH' ? 'Nhắc BHXH tự nguyện' : 'Nhắc BHYT'}
                  </span>
                </div>
                
                <div className="relative">
                  <textarea
                    readOnly
                    rows={4}
                    value={generateMessage(activeReminderCust, activeReminderChannel === 'Zalo', reminderInsType)}
                    className="w-full text-xs font-sans p-3 pb-14 sm:pb-12 border border-slate-800 rounded-xl bg-slate-950 text-slate-200 leading-relaxed shadow-xs focus:outline-none focus:border-emerald-500"
                  />
                  
                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2 max-w-[calc(100%-1.25rem)] flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(generateMessage(activeReminderCust, activeReminderChannel === 'Zalo', reminderInsType))}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-transform active:scale-95 cursor-pointer shadow-md border border-slate-700"
                      title="Sao chép văn bản vào bộ nhớ tạm"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                      Sao chép
                    </button>

                    {activeReminderChannel === 'Zalo' && (
                      <button
                        type="button"
                        onClick={() => {
                          const msg = generateMessage(activeReminderCust, true, reminderInsType);
                          handleCopyMessage(msg);
                          const cleanPhone = activeReminderCust.phone.replace(/[^0-9]/g, '');
                          if (cleanPhone) {
                            window.open(`https://zalo.me/${cleanPhone}`, '_blank', 'noopener,noreferrer');
                          } else {
                            alert('Người dân chưa có số điện thoại hợp lệ để mở Zalo Chat.');
                          }
                        }}
                        className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 rounded-lg transition-transform active:scale-95 cursor-pointer shadow-md"
                        title="Sao chép tin nhắn và mở thẳng hội thoại ZaloChat với số điện thoại này"
                      >
                        <span>💬 Mở Chat Zalo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

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
        <div id="lws-roster-section" className="bg-slate-900 rounded-2xl border border-slate-850 shadow-xs overflow-hidden scroll-mt-20">
          
          {/* Filtering bar inside */}
          <div className="p-4 bg-slate-950/40 border-b border-slate-850 flex flex-col md:flex-row items-center gap-3 justify-between">
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-xs">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Tìm nhanh nhiều tiêu chí (Tên, SĐT, CCCD, Mã BHXH...)"
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
              
              {/* Checkbox Filter: Chỉ tham gia BHXH */}
              <label 
                className={`text-xs px-2.5 py-1.5 border rounded-lg flex items-center gap-1.5 cursor-pointer select-none transition-colors font-medium ${
                  filterType === 'BHXH'
                    ? 'bg-indigo-950/80 border-indigo-700 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Lọc danh sách chỉ hiển thị những người tham gia BHXH tự nguyện"
              >
                <input
                  type="checkbox"
                  checked={filterType === 'BHXH'}
                  onChange={(e) => setFilterType(e.target.checked ? 'BHXH' : 'All')}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Chỉ tham gia BHXH</span>
              </label>

              {/* Filter Expiry window list */}
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none cursor-pointer focus:border-emerald-500 font-medium"
              >
                <option value="All">Nhắc hạn: Tất cả mốc</option>
                <option value="Expired">⌛ Đã quá hạn ({stats.expiredCount})</option>
                <option value="3Days">⚠️ Sắp hết hạn trong 3 ngày ({stats.in3DaysCount})</option>
                <option value="7Days">🗓️ Sắp hết hạn trong 7 ngày ({stats.in7DaysCount})</option>
                <option value="30Days">📅 Sắp hết hạn trong 30 ngày ({stats.in30DaysCount})</option>
                <option value="Safe">✓ Trạng thái an toàn</option>
              </select>

              {/* Quick Filter Pill: Hạn 30 ngày */}
              <button
                type="button"
                onClick={() => setFilterPeriod(filterPeriod === '30Days' ? 'All' : '30Days')}
                className={`text-xs px-2.5 py-1.5 border rounded-lg flex items-center gap-1.5 cursor-pointer select-none transition-all font-medium ${
                  filterPeriod === '30Days'
                    ? 'bg-amber-950/80 border-amber-700 text-amber-300 shadow-xs'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Lọc nhanh danh sách người dân có BHYT hoặc BHXH sắp hết hạn trong vòng 30 ngày tới"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Sắp hết hạn 30 ngày</span>
                {stats.in30DaysCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-amber-900/80 text-amber-300 text-[10px] font-mono font-bold rounded-full border border-amber-700/60">
                    {stats.in30DaysCount}
                  </span>
                )}
              </button>

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

              {/* View Layout Switcher */}
              <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewLayout('card')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewLayout === 'card'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Giao diện dạng thẻ - Tối ưu tra cứu & nhắn tin Zalo"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Dạng Thẻ
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('table')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewLayout === 'table'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Giao diện dạng bảng chi tiết"
                >
                  <List className="w-3.5 h-3.5" />
                  Dạng Bảng
                </button>
              </div>

              <button
                onClick={onOpenAddModal}
                className="ml-auto md:ml-0 inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-xl cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                Thêm Người Dân
              </button>
            </div>

          </div>

          {/* Roster Container (Card layout or Table layout) */}
          {totalItems === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-12 h-12 bg-slate-955 rounded-full flex items-center justify-center mx-auto text-slate-600 border border-slate-850">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-200">Không tìm thấy người dân nào phù hợp</h3>
                <p className="text-xs text-slate-400">Hãy thử xóa bộ lọc tìm kiếm hoặc nhấp "Thêm người dân" để tạo mới.</p>
              </div>
            </div>
          ) : viewLayout === 'card' ? (
            /* Card Grid Layout */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 p-4 bg-slate-950/20">
              {paginatedCustomers.map((cust) => {
                const diffDaysBHYT = getDaysDiff(cust.expiryDate);
                const diffDaysBHXH = cust.hasBHXH && cust.expiryDateBHXH ? getDaysDiff(cust.expiryDateBHXH) : null;

                const bhytPayments = (cust.paymentHistory || []).filter(p => !p.type || p.type === 'BHYT');
                const bhxhPayments = (cust.paymentHistory || []).filter(p => p.type === 'BHXH');

                const latestBHYTPayment = bhytPayments.length > 0
                  ? bhytPayments.reduce((latest, current) => current.paymentDate > latest.paymentDate ? current : latest, bhytPayments[0])
                  : null;

                const latestBHXHPayment = bhxhPayments.length > 0
                  ? bhxhPayments.reduce((latest, current) => current.paymentDate > latest.paymentDate ? current : latest, bhxhPayments[0])
                  : null;

                const focalDiffDays = (filterType === 'BHXH' && diffDaysBHXH !== null) ? diffDaysBHXH : diffDaysBHYT;

                let badge = null;
                if (cust.status === 'inactive') {
                  badge = <span className="bg-slate-950 text-slate-500 border border-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-full select-none">Tạm ngưng</span>;
                } else if (focalDiffDays < 0) {
                  badge = <span className="bg-rose-955/60 text-rose-300 border border-rose-900/50 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">Quá hạn {-focalDiffDays} ngày</span>;
                } else if (focalDiffDays === 0) {
                  badge = <span className="bg-rose-955/60 text-rose-300 border border-rose-900/50 text-[10px] font-black px-2 py-0.5 rounded-full">Hết hạn hôm nay</span>;
                } else if (focalDiffDays <= 3) {
                  badge = <span className="bg-amber-955/60 text-amber-300 border border-amber-900/50 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">Còn {focalDiffDays} ngày</span>;
                } else if (focalDiffDays <= 7) {
                  badge = <span className="bg-yellow-50/10 text-yellow-300 border border-yellow-700/40 text-[10px] font-bold px-2 py-0.5 rounded-full">Còn {focalDiffDays} ngày</span>;
                } else {
                  badge = <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-900/40 text-[10px] font-semibold px-2 py-0.5 rounded-full">Còn {focalDiffDays} ngày</span>;
                }

                return (
                  <div 
                    key={cust.id} 
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between shadow-xs transition-all relative overflow-hidden group"
                  >
                    <div className="space-y-3">
                      
                      {/* Top Row: Gender + Name + Badge & Reminder Method */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          {renderGenderIcon(cust.gender)}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 
                                onClick={() => onOpenEditModal(cust)}
                                className="font-extrabold text-white text-sm hover:text-emerald-400 cursor-pointer transition-colors line-clamp-1"
                                title="Bấm để xem/chỉnh sửa"
                              >
                                {cust.name}
                              </h4>

                              {/* Hình thức nhắc hạn ngay tiêu đề thẻ */}
                              {(cust.hinhThucNhac || cust.lastRemindedChannel) && (
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${
                                  (cust.hinhThucNhac || cust.lastRemindedChannel) === 'Call' 
                                    ? 'bg-amber-955/80 text-amber-300 border-amber-800/80' 
                                    : (cust.hinhThucNhac || cust.lastRemindedChannel) === 'SMS'
                                    ? 'bg-sky-955/80 text-sky-300 border-sky-800/80'
                                    : 'bg-emerald-955/80 text-emerald-300 border-emerald-800/80'
                                }`}>
                                  {(cust.hinhThucNhac || cust.lastRemindedChannel) === 'Call' ? '📞 Gọi điện thoại' : (cust.hinhThucNhac || cust.lastRemindedChannel) === 'SMS' ? '💬 SMS' : '📱 Zalo'}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5 flex-wrap">
                              {cust.birthday && (
                                <span>📅 {cust.birthday.includes('-') ? cust.birthday.split('-').reverse().join('/') : cust.birthday}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {badge}
                          {cust.hasBHYT !== false && cust.hasBHXH && (
                            <span className="text-[7px] font-black tracking-wider uppercase bg-indigo-950/60 text-indigo-300 border border-indigo-900/50 px-1.5 py-0.2 rounded">BHYT+BHXH</span>
                          )}
                          {cust.hasBHYT === false && cust.hasBHXH && (
                            <span className="text-[7px] font-black tracking-wider uppercase bg-indigo-950/60 text-indigo-300 border border-indigo-900/50 px-1.5 py-0.2 rounded">Chỉ BHXH</span>
                          )}
                        </div>
                      </div>

                      {/* Contact & IDs Box */}
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 space-y-2">
                        
                        {/* Phone & CCCD */}
                        <div className="flex items-center justify-between text-xs">
                          <a 
                            href={`tel:${cust.phone}`}
                            className="font-mono text-emerald-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
                            title="Bấm để gọi điện"
                          >
                            📞 <span className="select-all">{cust.phone}</span>
                          </a>

                          {cust.cccd ? (
                            <span className="text-[10px] text-slate-400 font-mono">
                              CCCD: <span className="text-slate-200 select-all">{cust.cccd}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Chưa ghi CCCD</span>
                          )}
                        </div>

                        {/* Insurance Cards & Dates */}
                        <div className="space-y-1.5 pt-1.5 border-t border-slate-850/60 text-[11px]">
                          {cust.hasBHYT !== false && (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 text-slate-300 font-medium">
                                <span className="text-[8px] font-black bg-emerald-955 text-emerald-300 border border-emerald-900 px-1 py-0.2 rounded select-none">BHYT</span>
                                <span className="font-mono text-[10px] select-all">{cust.insuranceCode || 'Chưa có mã'}</span>
                              </span>
                              <span className="font-mono font-bold text-slate-200">Hạn: {cust.expiryDate || '---'}</span>
                            </div>
                          )}

                          {cust.hasBHXH && (
                            <div className={`flex items-center justify-between ${cust.hasBHYT !== false ? 'pt-1 border-t border-slate-850/40' : ''}`}>
                              <span className="flex items-center gap-1 text-indigo-300 font-medium">
                                <span className="text-[8px] font-black bg-indigo-950 text-indigo-300 border border-indigo-900 px-1 py-0.2 rounded select-none">BHXH</span>
                                <span className="font-mono text-[10px] select-all">{cust.insuranceCodeBHXH || (cust.insuranceCode.length >= 10 ? cust.insuranceCode.slice(-10) : cust.insuranceCode) || 'Chưa có mã'}</span>
                              </span>
                              <span className="font-mono font-bold text-indigo-300">Hạn: {cust.expiryDateBHXH || '---'}</span>
                            </div>
                          )}
                        </div>

                        {/* Recent Payment & Address */}
                        {(latestBHYTPayment || latestBHXHPayment || cust.address || cust.notes) && (
                          <div className="pt-1.5 border-t border-slate-850/40 space-y-1 text-[10px] text-slate-400">
                            {cust.hasBHYT !== false && (
                              latestBHYTPayment ? (
                                <div className="flex items-center justify-between text-slate-300 font-mono">
                                  <span>Nộp BHYT gần nhất ({latestBHYTPayment.paymentDate}):</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQuickEditPayment({
                                        customer: cust,
                                        payment: latestBHYTPayment,
                                        amountStr: String(latestBHYTPayment.amountPaid)
                                      });
                                    }}
                                    className="font-bold text-emerald-400 hover:text-amber-300 flex items-center gap-1 bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/60 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                                    title="Bấm vào đây để sửa số tiền thu"
                                  >
                                    <span>{latestBHYTPayment.amountPaid.toLocaleString()}đ</span>
                                    <Edit3 className="w-2.5 h-2.5 text-slate-500 hover:text-amber-400" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between text-slate-500 italic font-mono text-[9.5px]">
                                  <span>Nộp BHYT:</span>
                                  <span>Chưa ghi nhận</span>
                                </div>
                              )
                            )}

                            {cust.hasBHXH && (
                              latestBHXHPayment ? (
                                <div className="flex items-center justify-between text-slate-300 font-mono">
                                  <span>Nộp BHXH gần nhất ({latestBHXHPayment.paymentDate}):</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQuickEditPayment({
                                        customer: cust,
                                        payment: latestBHXHPayment,
                                        amountStr: String(latestBHXHPayment.amountPaid)
                                      });
                                    }}
                                    className="font-bold text-indigo-300 hover:text-amber-300 flex items-center gap-1 bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/60 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                                    title="Bấm vào đây để sửa số tiền thu"
                                  >
                                    <span>{latestBHXHPayment.amountPaid.toLocaleString()}đ</span>
                                    <Edit3 className="w-2.5 h-2.5 text-slate-500 hover:text-amber-400" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between text-slate-500 italic font-mono text-[9.5px]">
                                  <span>Nộp BHXH:</span>
                                  <span>Chưa ghi nhận</span>
                                </div>
                              )
                            )}

                            {cust.address && (
                              <p className="truncate">📍 {cust.address}</p>
                            )}
                            {cust.notes && (
                              <p className="italic text-slate-400">📝 {renderTextWithLinks(cust.notes)}</p>
                            )}
                          </div>
                        )}

                      </div>

                      {/* Reminder status log */}
                      <div className="flex items-center justify-between text-[10px]">
                        {cust.lastRemindedDate ? (
                          <span className="text-amber-300 font-semibold bg-amber-955/40 border border-amber-900/40 px-2 py-0.5 rounded-lg">
                            ✓ Đã nhắc: {cust.lastRemindedDate} ({(cust.hinhThucNhac || cust.lastRemindedChannel) === 'Call' ? 'Gọi điện' : (cust.hinhThucNhac || cust.lastRemindedChannel)})
                          </span>
                        ) : (
                          <span className="text-slate-500 italic bg-slate-950/40 px-2 py-0.5 rounded-lg border border-slate-850">
                            Chưa gửi nhắc hạn
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleCopyCustomerDetails(cust, e)}
                          className="text-slate-400 hover:text-emerald-400 font-mono flex items-center gap-1 hover:underline cursor-pointer"
                          title="Sao chép họ tên, mã BHXH, ngày sinh"
                        >
                          {copiedCustId === cust.id ? (
                            <span className="text-emerald-400 font-bold">✓ Đã copy</span>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy thông tin</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-3 pt-2.5 border-t border-slate-850 flex items-center justify-between gap-1.5">
                      {cust.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReminderCust(cust);
                            const defaultType: 'BHYT' | 'BHXH' = 
                              (cust.hasBHYT === false && cust.hasBHXH) ? 'BHXH'
                              : (filterType === 'BHXH' && cust.hasBHXH) ? 'BHXH'
                              : (!cust.insuranceCode && cust.hasBHXH) ? 'BHXH'
                              : 'BHYT';
                            setReminderInsType(defaultType);
                            scrollToReminderPanel();
                          }}
                          className="flex-1 py-1.5 px-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-transform active:scale-95"
                          title="Soạn tin nhắn Zalo/SMS hoặc gọi điện nhắc hạn tái tục"
                        >
                          🔔 Nhắc hạn
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenEditModal(cust)}
                        className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 cursor-pointer transition-colors"
                        title="Chỉnh sửa hoặc xem lịch sử biên nhận"
                      >
                        📁 Sửa
                      </button>

                      {deleteConfirmId === cust.id ? (
                        <div className="flex items-center gap-1 bg-rose-950 border border-rose-800 rounded-xl p-0.5 animate-fade-in">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteCustomer(cust.id);
                              setDeleteConfirmId(null);
                            }}
                            className="text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-500 px-2 py-1 rounded-lg cursor-pointer"
                          >
                            Xóa
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-[10px] text-slate-400 hover:text-white px-1.5 py-1 rounded cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(cust.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-900/40"
                          title="Xóa hồ sơ người dân"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View Fallback */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-left table-auto">
                <thead className="bg-slate-950/40 text-[10px] text-slate-400 uppercase font-black tracking-wider border-b border-slate-850">
                  <tr>
                    <th className="px-6 py-3.5">Thông tin Người dân & Mã thẻ / CCCD</th>
                    <th className="px-6 py-3.5">Đóng gần nhất</th>
                    <th className="px-6 py-3.5">Ngày hết hạn đóng phí</th>
                    <th className="px-6 py-3.5">Ngày đếm ngược</th>
                    <th className="px-6 py-3.5 text-right">Tính năng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs bg-slate-900/.10 text-slate-300">
                  {paginatedCustomers.map((cust) => {
                    const diffDaysBHYT = getDaysDiff(cust.expiryDate);
                    const diffDaysBHXH = cust.hasBHXH && cust.expiryDateBHXH ? getDaysDiff(cust.expiryDateBHXH) : null;
                    
                    const bhytPayments = (cust.paymentHistory || []).filter(p => !p.type || p.type === 'BHYT');
                    const bhxhPayments = (cust.paymentHistory || []).filter(p => p.type === 'BHXH');
                    
                    const latestBHYTPayment = bhytPayments.length > 0
                      ? bhytPayments.reduce((latest, current) => current.paymentDate > latest.paymentDate ? current : latest, bhytPayments[0])
                      : null;
                      
                    const latestBHXHPayment = bhxhPayments.length > 0
                      ? bhxhPayments.reduce((latest, current) => current.paymentDate > latest.paymentDate ? current : latest, bhxhPayments[0])
                      : null;
                    
                    const focalDiffDays = (filterType === 'BHXH' && diffDaysBHXH !== null) ? diffDaysBHXH : diffDaysBHYT;
                    
                    let badge = null;
                    if (cust.status === 'inactive') {
                      badge = <span className="bg-slate-955 text-slate-500 border border-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-full select-none">Tạm ngưng</span>;
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
                      <tr key={cust.id} className="hover:bg-slate-955/40 transition-colors">
                        
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {renderGenderIcon(cust.gender)}
                              <span 
                                onClick={() => onOpenEditModal(cust)} 
                                className="font-extrabold text-white text-[13px] hover:text-emerald-400 hover:underline cursor-pointer transition-all truncate"
                                title="Bấm để sửa hồ sơ người dân"
                              >
                                {cust.name}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyCustomerDetails(cust, e)}
                                className={`p-1 rounded transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                                  copiedCustId === cust.id
                                    ? 'text-emerald-400 bg-emerald-955/60 scale-90 border border-emerald-500/30'
                                    : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-900'
                                }`}
                                title="Sao chép nhanh thông tin"
                              >
                                {copiedCustId === cust.id ? (
                                  <Check className="w-3.5 h-3.5 animate-pulse" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {cust.hasBHYT !== false && cust.hasBHXH && (
                                <span className="text-[7px] font-black tracking-wider uppercase bg-indigo-950/50 text-indigo-300 border border-indigo-900/40 px-1.5 py-0.2 rounded select-none">BHYT+BHXH</span>
                              )}
                              {cust.hasBHYT === false && cust.hasBHXH && (
                                <span className="text-[7px] font-black tracking-wider uppercase bg-indigo-950/50 text-indigo-300 border border-indigo-900/40 px-1.5 py-0.2 rounded select-none">Chỉ BHXH</span>
                              )}
                            </div>

                            <div className="text-slate-400 text-[11px] font-mono flex flex-wrap items-center gap-x-2.5 gap-y-1.5 font-sans">
                              {cust.birthday && (
                                <span className="text-[10px] text-slate-300 font-medium bg-slate-955/40 border border-slate-850/50 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                                  <span>📅</span>
                                  <span>{cust.birthday.includes('-') ? cust.birthday.split('-').reverse().join('/') : cust.birthday}</span>
                                </span>
                              )}

                              <a 
                                href={`tel:${cust.phone}`}
                                className="text-[10px] font-extrabold text-emerald-405 hover:text-emerald-350 bg-emerald-955/30 hover:bg-emerald-955/50 border border-emerald-900/40 px-2 py-0.5 rounded flex items-center gap-1 transition-all font-mono"
                              >
                                📞 <span className="underline select-all">{cust.phone}</span>
                              </a>

                              {cust.address && (
                                <span className="text-[10px] text-slate-300 font-medium bg-indigo-950/20 border border-indigo-900/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <span>📍</span>
                                  <span>{cust.address}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {cust.cccd ? (
                                <span className="text-[10px] font-mono font-medium text-slate-300 bg-slate-955/45 border border-slate-850 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <span className="text-slate-500 font-bold select-none text-[9px]">CCCD:</span>
                                  <span className="select-all">{cust.cccd}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-500 italic bg-slate-955/30 border border-slate-900/30 px-1.5 py-0.5 rounded">
                                  ⚠️ Chưa ghi CCCD
                                </span>
                              )}

                              {cust.hasBHYT !== false && (
                                <span className="text-[10px] font-mono font-medium text-slate-300 bg-emerald-955/30 border border-emerald-900/35 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <span className="text-[8px] font-black bg-emerald-955 text-emerald-300 border border-emerald-900 px-1 py-0.2 rounded scale-90 select-none">BHYT</span>
                                  <span className="select-all">{cust.insuranceCode || 'Chưa ghi mã'}</span>
                                </span>
                              )}

                              {cust.hasBHXH && (
                                <span className="text-[10px] font-mono font-medium text-slate-300 bg-indigo-950/30 border border-indigo-900/35 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <span className="text-[8px] font-black bg-indigo-950 text-indigo-300 border border-indigo-900 px-1 py-0.2 rounded scale-90 select-none">BHXH</span>
                                  <span className="select-all">{cust.insuranceCodeBHXH || (cust.insuranceCode.length >= 10 ? cust.insuranceCode.slice(-10) : cust.insuranceCode) || 'Chưa ghi mã'}</span>
                                </span>
                              )}
                            </div>

                            {cust.lastRemindedDate ? (
                              <div className="flex items-center gap-1.5 text-[9px] text-amber-300/90 font-extrabold bg-amber-955/40 border border-amber-900/40 rounded px-1.5 py-0.5 w-fit">
                                <span>Đã nhắc: {cust.lastRemindedDate} ({(cust.hinhThucNhac || cust.lastRemindedChannel) === 'Call' ? 'Gọi điện' : (cust.hinhThucNhac || cust.lastRemindedChannel)}) - {cust.lastRemindedType}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold bg-slate-955/40 border border-slate-850/50 rounded px-1.5 py-0.5 w-fit select-none">
                                <span>Chưa gửi nhắc hạn</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1.5 text-xs">
                            {cust.hasBHYT !== false && (
                              latestBHYTPayment ? (
                                <div className="flex items-center gap-1.5 font-mono">
                                  <span className="px-1.5 py-0.2 rounded text-[7px] font-extrabold bg-emerald-955 text-emerald-300 border border-emerald-900 select-none">BHYT</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQuickEditPayment({
                                        customer: cust,
                                        payment: latestBHYTPayment,
                                        amountStr: String(latestBHYTPayment.amountPaid)
                                      });
                                    }}
                                    className="font-mono text-emerald-400 hover:text-amber-300 font-extrabold flex items-center gap-1 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/60 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                                    title="Bấm vào đây để sửa số tiền thu"
                                  >
                                    <span>{latestBHYTPayment.amountPaid.toLocaleString()}đ</span>
                                    <Edit3 className="w-2.5 h-2.5 text-slate-500 hover:text-amber-400" />
                                  </button>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-500 italic font-mono">BHYT: Chưa đóng</div>
                              )
                            )}

                            {cust.hasBHXH && (
                              latestBHXHPayment ? (
                                <div className="flex items-center gap-1.5 font-mono">
                                  <span className="px-1.5 py-0.2 rounded text-[7px] font-extrabold bg-indigo-950 text-indigo-300 border border-indigo-900 select-none">BHXH</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQuickEditPayment({
                                        customer: cust,
                                        payment: latestBHXHPayment,
                                        amountStr: String(latestBHXHPayment.amountPaid)
                                      });
                                    }}
                                    className="font-mono text-indigo-300 hover:text-amber-300 font-extrabold flex items-center gap-1 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/60 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                                    title="Bấm vào đây để sửa số tiền thu"
                                  >
                                    <span>{latestBHXHPayment.amountPaid.toLocaleString()}đ</span>
                                    <Edit3 className="w-2.5 h-2.5 text-slate-500 hover:text-amber-400" />
                                  </button>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-500 italic font-mono">BHXH: Chưa đóng</div>
                              )
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1 text-[11px]">
                            {cust.hasBHYT !== false && (
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-400 text-[10px]">Hạn BHYT:</span>
                                <span className="font-mono text-slate-300 font-bold">{cust.expiryDate || '---'}</span>
                              </div>
                            )}
                            {cust.hasBHXH && cust.expiryDateBHXH && (
                              <div className="flex items-center justify-between gap-2 pt-0.5">
                                <span className="text-indigo-400 text-[10px]">Hạn BHXH:</span>
                                <span className="font-mono text-indigo-300 font-bold">{cust.expiryDateBHXH}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div>{badge}</div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {cust.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReminderCust(cust);
                                  const defaultType: 'BHYT' | 'BHXH' = 
                                    (cust.hasBHYT === false && cust.hasBHXH) ? 'BHXH'
                                    : (filterType === 'BHXH' && cust.hasBHXH) ? 'BHXH'
                                    : (!cust.insuranceCode && cust.hasBHXH) ? 'BHXH'
                                    : 'BHYT';
                                  setReminderInsType(defaultType);
                                  scrollToReminderPanel();
                                }}
                                className="text-[10px] font-black text-amber-300 bg-amber-955/50 border border-amber-900 hover:bg-amber-900/40 px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1"
                                title="Soạn tin Zalo/SMS hoặc gọi điện nhắc hạn"
                              >
                                🔔 Nhắc hạn
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => onOpenEditModal(cust)}
                              className="text-[10px] font-bold text-emerald-300 bg-emerald-955/50 border border-emerald-900/60 hover:bg-emerald-900/40 px-2 py-1 rounded-lg cursor-pointer"
                            >
                              📁 Sửa
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleCopyCustomerDetails(cust, e)}
                              className="text-[10px] font-bold text-sky-300 bg-sky-955/50 border border-sky-900/50 hover:bg-sky-900/40 px-2 py-1 rounded-lg cursor-pointer"
                            >
                              Copy
                            </button>

                            {deleteConfirmId === cust.id ? (
                              <div className="flex items-center gap-1 bg-slate-900 border border-rose-800 rounded-lg p-1 animate-fade-in">
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
            </div>
          )}

          {/* Table footer stats summary info & Pagination */}
          <div className="px-3 sm:px-6 py-4 bg-slate-950/80 border-t border-slate-850 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 gap-3 min-w-0 max-w-full">
            
            {/* Left: Filter count & Page size select */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full md:w-auto">
              <p className="text-center md:text-left">
                Hiển thị <strong className="text-slate-100 font-mono">{totalItems === 0 ? 0 : (pageSize === 'all' ? 1 : (safeCurrentPage - 1) * pageSize + 1)}</strong> - <strong className="text-slate-100 font-mono">{pageSize === 'all' ? totalItems : Math.min(safeCurrentPage * pageSize, totalItems)}</strong> trong tổng <strong className="text-emerald-400 font-mono">{totalItems}</strong> người dân
                {totalItems !== customers.length && <span className="text-slate-500"> (lọc từ {customers.length})</span>}
              </p>

              <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-medium">Hiển thị/trang:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-[11px] font-bold text-emerald-400 focus:outline-none cursor-pointer font-mono"
                >
                  <option value={12} className="bg-slate-900 text-white">12 người</option>
                  <option value={24} className="bg-slate-900 text-white">24 người</option>
                  <option value={50} className="bg-slate-900 text-white">50 người</option>
                  <option value={100} className="bg-slate-900 text-white">100 người</option>
                  <option value="all" className="bg-slate-900 text-white">Tất cả</option>
                </select>
              </div>
            </div>

            {/* Center/Right: Pagination Navigation Controls */}
            {pageSize !== 'all' && totalPages > 1 && (
              <div className="flex items-center gap-1 my-1 md:my-0 flex-wrap justify-center">
                <button
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() => {
                    setCurrentPage(1);
                    document.getElementById('lws-roster-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Trang đầu"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    document.getElementById('lws-roster-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 mx-1">
                  {getPageNumbers(safeCurrentPage, totalPages).map((p, idx) => (
                    p === '...' ? (
                      <span key={`dots-${idx}`} className="px-1.5 py-1 text-slate-500 font-mono text-xs">...</span>
                    ) : (
                      <button
                        key={`page-${p}`}
                        type="button"
                        onClick={() => {
                          setCurrentPage(Number(p));
                          document.getElementById('lws-roster-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                          safeCurrentPage === p
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  ))}
                </div>

                <button
                  type="button"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => {
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                    document.getElementById('lws-roster-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Trang tiếp"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => {
                    setCurrentPage(totalPages);
                    document.getElementById('lws-roster-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Trang cuối"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-4 text-center sm:text-left min-w-0">
              <span className="truncate max-w-[280px] sm:max-w-md" title={settings.agencyName}>
                Đại lý: <strong className="text-emerald-400">{settings.agencyName}</strong>
              </span>
            </div>
          </div>

        </div>

      </main>

      {/* Tiny clean footer workspace branding */}
      <footer className="bg-slate-950 border-t border-slate-900 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto space-y-1.5 px-4">
          <p>
            Phần mềm <strong>"LWS - Sổ thu bảo hiểm"</strong> dành cho nhân viên thu BHXH, BHYT. Phát triển bởi{' '}
            <a href="https://longwebstudio.io.vn" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline font-semibold">
              Freelancer Long Web Studio
            </a>{' '}
            (Zalo: <strong className="text-white font-mono">0966570913</strong> • Email: <strong className="text-white">contact@longwebstudio.io.vn</strong> • Website: <strong className="text-white">longwebstudio.io.vn</strong>)
          </p>
          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
            <button 
              type="button" 
              onClick={() => setShowTermsModal(true)} 
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Điều khoản dịch vụ
            </button>
            <span>•</span>
            <button 
              type="button" 
              onClick={() => setShowTermsModal(true)} 
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Chính sách bảo mật
            </button>
          </div>
          <p className="text-[10px] text-slate-500">Hệ thống bảo mật dữ liệu lưu cục bộ trong trình duyệt của bạn (Local Storage) • Không thu thập dữ liệu nội bộ.</p>
        </div>
      </footer>

      <QuickGuideModal 
        isOpen={showQuickGuideModal} 
        onClose={() => setShowQuickGuideModal(false)} 
      />

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />

      <PWAInstallModal
        isOpen={showPwaModal}
        onClose={() => setShowPwaModal(false)}
      />

      {/* Quick Payment Amount Edit Modal */}
      {quickEditPayment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setQuickEditPayment(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 text-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-800/60">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Sửa Số Tiền Thu</h3>
                  <p className="text-xs text-slate-400">{quickEditPayment.customer.fullName} - {quickEditPayment.payment.type || 'BHYT'} ({quickEditPayment.payment.paymentDate})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditPayment(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Số tiền thu mới (VNĐ):</label>
              <div className="relative">
                <input
                  type="number"
                  value={quickEditPayment.amountStr}
                  onChange={(e) => setQuickEditPayment({ ...quickEditPayment, amountStr: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveQuickEditAmount();
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none"
                  placeholder="Nhập số tiền..."
                  autoFocus
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-500 font-bold">VNĐ</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Tự động tính lại hoa hồng đại lý dựa trên tỷ lệ phần trăm đã cài đặt.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setQuickEditPayment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveQuickEditAmount}
                className="px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Lưu Số Tiền</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
