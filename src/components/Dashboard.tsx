/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Customer, UserSettings } from '../types';
import { 
  Users, Bell, Calendar, DollarSign, Search, Plus, 
  Settings, Download, Upload, RefreshCw, LogOut, Check, Copy, X,
  Cloud, AlertTriangle, UserCheck, Trash2, TrendingUp, BellRing, Sparkles
} from 'lucide-react';
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
      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 leading-none">
        <p className="font-extrabold text-slate-300 border-b border-slate-800 pb-1 mb-1 font-mono text-center">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-5 font-mono">
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill || entry.color }} />
              {entry.name}:
            </span>
            <span className="font-extrabold text-white">
              {entry.value.toLocaleString()}đ
            </span>
          </div>
        ))}
        {payload.length > 1 && (
          <div className="flex items-center justify-between gap-5 font-mono border-t border-slate-800 pt-1.5 mt-1">
            <span className="text-slate-400 font-semibold">Cộng:</span>
            <span className="font-black text-emerald-400">
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
  const [filterReminder, setFilterReminder] = useState<'All' | 'NotReminded' | 'Reminded'>('All');
  const [filterPayer, setFilterPayer] = useState<string>('All');

  // local notification template generator states
  const [activeReminderCust, setActiveReminderCust] = useState<Customer | null>(null);
  const [activeReminderChannel, setActiveReminderChannel] = useState<'Zalo' | 'SMS'>('Zalo');
  const [reminderInsType, setReminderInsType] = useState<'BHYT' | 'BHXH'>('BHYT');
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);
  const [copiedCustId, setCopiedCustId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
  const [simulatedTodayCustId, setSimulatedTodayCustId] = useState<string | null>(null);
  const lastNotifiedCountRef = useRef(-1);

  // States for interactive monthly revenue chart
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [chartInsType, setChartInsType] = useState<'all' | 'BHYT' | 'BHXH'>('all');

  // current anchor date: 2026-06-12
  const ANCHOR_DATE = useMemo(() => new Date('2026-06-12'), []);

  // helper to calculate days difference relative to 2026-06-12
  const getDaysDiff = (expiryStr: string) => {
    if (!expiryStr) return 99999;
    const expDate = new Date(expiryStr);
    if (isNaN(expDate.getTime())) return 99999;
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
    let currentMonthCollected = 0;
    let upcomingExpiryCustomers = 0;

    customers.forEach(cust => {
      // Check if candidate is active and has upcoming BHYT/BHXH expiry within 7 days
      if (cust.status === 'active') {
        const diffBHYT = getDaysDiff(cust.expiryDate);
        const diffBHXH = cust.hasBHXH && cust.expiryDateBHXH ? getDaysDiff(cust.expiryDateBHXH) : null;
        
        const isBHYTUpcoming = diffBHYT >= 0 && diffBHYT <= 7;
        const isBHXHUpcoming = diffBHXH !== null && diffBHXH >= 0 && diffBHXH <= 7;
        
        if (isBHYTUpcoming || isBHXHUpcoming) {
          upcomingExpiryCustomers++;
        }
      }

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

  // Tổng hợp doanh thu nộp phí theo tháng cho biểu đồ
  const monthlyRevenueData = useMemo(() => {
    const monthlyMap: { [key: string]: { key: string; monthLabel: string; monthFull: string; bhyt: number; bhxh: number; total: number } } = {};
    
    customers.forEach(cust => {
      (cust.paymentHistory || []).forEach(pay => {
        if (!pay.paymentDate) return;
        // Trích xuất YYYY-MM
        const yearMonth = pay.paymentDate.substring(0, 7); 
        if (!yearMonth || yearMonth.length < 7) return;
        
        const type = pay.type || 'BHYT';
        const amount = pay.amountPaid || 0;
        
        if (!monthlyMap[yearMonth]) {
          const parts = yearMonth.split('-');
          const year = parts[0];
          const month = parts[1];
          monthlyMap[yearMonth] = {
            key: yearMonth,
            monthLabel: `T${month}/${year.substring(2)}`,
            monthFull: `Tháng ${month}/${year}`,
            bhyt: 0,
            bhxh: 0,
            total: 0
          };
        }
        
        if (type === 'BHXH') {
          monthlyMap[yearMonth].bhxh += amount;
        } else {
          monthlyMap[yearMonth].bhyt += amount;
        }
        monthlyMap[yearMonth].total += amount;
      });
    });
    
    // Sắp xếp các tháng theo thứ tự thời gian tăng dần
    return Object.keys(monthlyMap)
      .sort((a, b) => a.localeCompare(b))
      .map(key => monthlyMap[key]);
  }, [customers]);

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

  // Khách hàng cần đóng tiền bảo hiểm TRONG NGÀY HÔM NAY (relative to 2026-06-12)
  const todayCustomers = useMemo(() => {
    return customers.filter(cust => {
      if (cust.status !== 'active') return false;
      const isSimulatedToday = simulatedTodayCustId === cust.id;
      
      const diffBHYT = isSimulatedToday ? 0 : getDaysDiff(cust.expiryDate);
      const diffBHXH = cust.hasBHXH && cust.expiryDateBHXH 
        ? (isSimulatedToday ? 0 : getDaysDiff(cust.expiryDateBHXH))
        : null;
        
      return diffBHYT === 0 || diffBHXH === 0;
    });
  }, [customers, getDaysDiff, simulatedTodayCustId]);

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
        lastRemindedType: reminderInsType
      };
      
      // Update state immediately to reflect changes in UI
      setActiveReminderCust(updatedCustomer);
      // Persist values
      onUpdateCustomer(updatedCustomer);
    }
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

        {/* HỆ THỐNG THÔNG BÁO NHẮC HẠN TRÊN TRÌNH DUYỆT */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-amber-950/40 rounded-xl text-amber-400 border border-amber-900/40 mt-1 shrink-0">
                <BellRing className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                  Thông báo Nhắc gia hạn Bảo hiểm
                  <span className="text-[10px] bg-slate-950 border border-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-mono font-bold">
                    Hôm nay: 12/06/2026
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phát hiện khẩn cấp và đẩy thông báo nổi lên màn hình trình duyệt khi có thẻ tới hạn đóng phí trong ngày hôm nay.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              {/* Browser Notification Permission status button */}
              {notifPermission === 'default' && (
                <button
                  type="button"
                  onClick={handleRequestNotificationPermission}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Sparkles className="w-3 h-3" />
                  Bật thông báo trình duyệt
                </button>
              )}
              {notifPermission === 'granted' && (
                <span className="px-2.5 py-1.5 bg-emerald-950 text-emerald-400 border border-emerald-900/60 text-[10px] font-black rounded-lg uppercase flex items-center gap-1 shrink-0 select-none">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Đồng ý phát cảnh báo nổi
                </span>
              )}
              {notifPermission === 'denied' && (
                <span className="px-2.5 py-1.5 bg-rose-955/50 text-rose-300 border border-rose-900/45 text-[10px] font-bold rounded-lg uppercase shrink-0" title="Hãy nhấp biểu tượng ổ khóa cạnh địa chỉ web để cho phép lại thông báo">
                  ⚠️ Thông báo bị Chặn
                </span>
              )}

              {/* Test button */}
              <button
                type="button"
                onClick={handleTestNotificationResponse}
                className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer shrink-0"
                title="Gửi thử một thông báo trình duyệt hệ thống"
              >
                Gửi Test thử
              </button>

              {/* Simulation/Demo button */}
              {simulatedTodayCustId ? (
                <button
                  type="button"
                  onClick={() => {
                    setSimulatedTodayCustId(null);
                    lastNotifiedCountRef.current = -1;
                  }}
                  className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-905 rounded-lg text-[10px] font-black transition-all cursor-pointer shrink-0"
                >
                  🔴 Tắt Mô phỏng (today)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSimulatedTodayCustId('cust-1')}
                  className="px-2.5 py-1.5 bg-amber-955/40 hover:bg-amber-900/40 text-amber-300 border border-amber-905 rounded-lg text-[10px] font-black transition-all cursor-pointer shrink-0"
                  title="Giả lập Nguyễn Văn Hùng hết hạn hôm nay"
                >
                  ⚡ Giả lập hạn hôm nay
                </button>
              )}
            </div>
          </div>

          {/* Alert list section */}
          {todayCustomers.length > 0 ? (
            <div className="space-y-2.5">
              <div className="bg-amber-955/30 border border-amber-905 rounded-xl p-3 md:p-3.5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide">
                    PHÁT HIỆN CẢNH BÁO: CÓ {todayCustomers.length} NGƯỜI DÂN CẦN ĐÓNG PHÍ HÔM NAY!
                  </h4>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Vui lòng gửi tin nhắn gia hạn ngay lập tức thông qua các tùy chọn nhắn tin nhanh trên nền tảng Zalo hay SMS dưới đây để nhắc đóng bảo hiểm đúng hạn hôm nay.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todayCustomers.map(cust => {
                  const hasBHYTToday = simulatedTodayCustId === cust.id || getDaysDiff(cust.expiryDate) === 0;
                  const hasBHXHToday = cust.hasBHXH && cust.expiryDateBHXH && (simulatedTodayCustId === cust.id || getDaysDiff(cust.expiryDateBHXH) === 0);

                  return (
                    <div key={cust.id} className="bg-slate-950 border border-slate-850/60 p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-amber-900/40 transition-colors">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-sm text-white truncate max-w-[155px]">{cust.name}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyCustomerDetails(cust, e)}
                            className={`p-1 rounded transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                              copiedCustId === cust.id
                                ? 'text-emerald-400 bg-emerald-950/60 scale-90 border border-emerald-500/30'
                                : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-900'
                            }`}
                            title="Sao chép nhanh thông tin (Họ tên, Mã BHXH, Ngày sinh, Ghi chú)"
                          >
                            {copiedCustId === cust.id ? (
                              <Check className="w-3.5 h-3.5 animate-pulse" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {cust.gender && (
                            <span className={`text-[8px] px-1.5 py-0.2 rounded font-extrabold select-none ${cust.gender === 'Nam' ? 'bg-sky-950 text-sky-400 border border-sky-900/40' : 'bg-rose-950 text-rose-400 border border-rose-900/40'}`}>
                              {cust.gender}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-1.5 font-sans">
                          <span className="font-mono">SĐT: {cust.phone}</span>
                          {cust.birthday && (
                            <span className="text-[10px] text-slate-500 font-semibold bg-slate-900 border border-slate-850/40 px-1 py-0.2 rounded font-mono" title="Ngày tháng năm sinh">
                              📅 {cust.birthday.includes('-') ? cust.birthday.split('-').reverse().join('/') : cust.birthday}
                            </span>
                          )}
                          {cust.address && (
                            <span className="text-[10px] text-slate-500 font-semibold bg-slate-900 border border-slate-850/40 px-1 py-0.5 rounded flex items-center gap-0.5" title="Địa chỉ">
                              📍 {cust.address}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {hasBHYTToday && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-rose-950/40 text-rose-300 border border-rose-900/50 uppercase">
                              Hết hạn BHYT hôm nay
                            </span>
                          )}
                          {hasBHXHToday && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-955/40 text-amber-300 border border-amber-900/50 uppercase">
                              Kỳ đóng BHXH hôm nay
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasBHYTToday && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReminderCust(cust);
                              setActiveReminderChannel('Zalo');
                              setReminderInsType('BHYT');
                            }}
                            className="text-[10px] font-extrabold px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            Nhắc BHYT
                          </button>
                        )}
                        {hasBHXHToday && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReminderCust(cust);
                              setActiveReminderChannel('Zalo');
                              setReminderInsType('BHXH');
                            }}
                            className="text-[10px] font-extrabold px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            Nhắc BHXH
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(cust)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-lg transition-all cursor-pointer"
                          title="Sửa hồ sơ người dân"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 text-center">
              <div className="text-slate-400 text-xs flex items-center justify-center gap-2 select-none">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                <span>Không có thẻ gia hạn nào hết hạn vào ngày hôm nay. Hãy bấm nút <strong>Giả lập hạn hôm nay</strong> để kiểm chứng hoạt động.</span>
              </div>
            </div>
          )}
        </div>

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

          {/* Card 5: Dashboard tổng quan tháng hiện tại */}
          <div className="bg-[#111126] hover:bg-[#151532] text-indigo-200 rounded-2xl border border-indigo-900/60 p-4 shadow-md flex items-center gap-3 col-span-2 md:col-span-1 lg:col-span-1 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-900 animate-pulse">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider block whitespace-nowrap">Tổng Quan Tháng H.Tại</span>
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

        {/* THỐNG KÊ DOANH THU THU HỘ THEO THÁNG */}
        <div id="revenue-chart-section" className="bg-slate-900 border border-slate-850 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-indigo-950/40 rounded-xl text-indigo-400 border border-indigo-900/40 mt-1 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                  Biểu đồ Doanh thu nộp bảo hiểm theo tháng
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thống kê số tiền thu hộ đại lý tích lũy theo từng chu kỳ tháng cho BHYT và BHXH.
                </p>
              </div>
            </div>

            {/* Phím điều khiển biểu đồ */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Lọc loại bảo hiểm */}
              <div className="flex bg-slate-950 p-0.5 rounded-lg text-[10px] font-bold border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setChartInsType('all')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    chartInsType === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cả hai
                </button>
                <button
                  type="button"
                  onClick={() => setChartInsType('BHYT')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    chartInsType === 'BHYT' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  BHYT
                </button>
                <button
                  type="button"
                  onClick={() => setChartInsType('BHXH')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    chartInsType === 'BHXH' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  BHXH
                </button>
              </div>

              {/* Kiểu đồ thị */}
              <div className="flex bg-slate-950 p-0.5 rounded-lg text-[10px] font-bold border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setChartType('area')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    chartType === 'area' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Vùng
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    chartType === 'bar' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cột
                </button>
              </div>
            </div>
          </div>

          {/* Vùng hiển thị Biểu đồ */}
          {monthlyRevenueData.length > 0 ? (
            <div className="space-y-4">
              <div className="h-[220px] md:h-[260px] w-full select-none">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area' ? (
                    <AreaChart
                      data={monthlyRevenueData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
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
                        stroke="#64748b" 
                        fontSize={10}
                        fontWeight="bold"
                        tickLine={false} 
                        axisLine={false}
                        dy={8}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={9}
                        fontWeight="bold"
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(v) => `${(v / 1000).toLocaleString()}k`}
                        dx={-8}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="top" 
                        height={36} 
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
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
                  ) : (
                    <BarChart
                      data={monthlyRevenueData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.25} />
                      <XAxis 
                        dataKey="monthLabel" 
                        stroke="#64748b" 
                        fontSize={10}
                        fontWeight="bold"
                        tickLine={false} 
                        axisLine={false}
                        dy={8}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={9}
                        fontWeight="bold"
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(v) => `${(v / 1000).toLocaleString()}k`}
                        dx={-8}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="top" 
                        height={36} 
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                      />
                      {(chartInsType === 'all' || chartInsType === 'BHYT') && (
                        <Bar 
                          dataKey="bhyt" 
                          name="Bảo hiểm Y tế (BHYT)" 
                          fill="#10b981" 
                          radius={chartInsType === 'all' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                          maxBarSize={40}
                          stackId={chartInsType === 'all' ? "1" : undefined}
                        />
                      )}
                      {(chartInsType === 'all' || chartInsType === 'BHXH') && (
                        <Bar 
                          dataKey="bhxh" 
                          name="BHXH Tự nguyện (BHXH)" 
                          fill="#6366f1" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                          stackId={chartInsType === 'all' ? "1" : undefined}
                        />
                      )}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Chỉ số Phân tích */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-center space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase">Tháng cao điểm nhất</span>
                  <span className="text-xs font-black text-rose-455 block font-mono">
                    {(() => {
                      if (!monthlyRevenueData.length) return 'N/A';
                      const sorted = [...monthlyRevenueData].sort((a, b) => b.total - a.total);
                      return `${sorted[0].monthFull} (${sorted[0].total.toLocaleString()}đ)`;
                    })()}
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-center space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase">Trung bình / Tháng</span>
                  <span className="text-xs font-black text-emerald-450 block font-mono">
                    {(() => {
                      if (!monthlyRevenueData.length) return '0đ';
                      const sum = monthlyRevenueData.reduce((tot, d) => tot + d.total, 0);
                      return `${Math.round(sum / monthlyRevenueData.length).toLocaleString()}đ`;
                    })()}
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-center space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase">Tăng trưởng thu hộ</span>
                  <span className="text-xs font-black text-indigo-400 block font-mono flex items-center justify-center gap-1">
                    {(() => {
                      if (monthlyRevenueData.length < 2) return 'Ổn định 0%';
                      const last = monthlyRevenueData[monthlyRevenueData.length - 1].total;
                      const prev = monthlyRevenueData[monthlyRevenueData.length - 2].total;
                      if (!prev) return 'Mới';
                      const pct = Math.round(((last - prev) / prev) * 100);
                      return (
                        <>
                          <span className={pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {pct >= 0 ? '▲' : '▼'} {Math.abs(pct)}%
                          </span>
                          <span className="text-[9px] text-slate-500 font-normal">so tháng trước</span>
                        </>
                      );
                    })()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-8 text-center">
              <span className="text-slate-400 text-xs italic">Chưa có lịch sử giao dịch nộp tiền để thống kê biểu đồ doanh thu.</span>
            </div>
          )}
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

            {/* Last Reminded Status */}
            {activeReminderCust.lastRemindedDate ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/90 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Bell className="w-4 h-4 shrink-0 animate-bounce text-amber-400" />
                  <span>Lần nhắc gần nhất: Ngày {activeReminderCust.lastRemindedDate} qua {activeReminderCust.lastRemindedChannel} (Loại {activeReminderCust.lastRemindedType})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const cleared: Customer = {
                      ...activeReminderCust,
                    };
                    delete cleared.lastRemindedDate;
                    delete cleared.lastRemindedChannel;
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
                <span>Chính sách này chưa được nhắc đóng phí. Hệ thống sẽ tự động cập nhật là "Đã nhắc" ngay khi bạn bấm sao chép!</span>
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

              {/* Filter Reminder Status */}
              <select
                value={filterReminder}
                onChange={(e) => setFilterReminder(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none cursor-pointer focus:border-emerald-500"
              >
                <option value="All">Nhắc hạn: Tất cả trạng thái</option>
                <option value="NotReminded">🔔 Chưa gửi nhắc hạn</option>
                <option value="Reminded">✓ Đã gửi nhắc hạn</option>
              </select>

              {/* Filter Payer Selection */}
              <select
                value={filterPayer}
                onChange={(e) => setFilterPayer(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none cursor-pointer focus:border-emerald-500 max-w-[150px] truncate"
                title="Lọc theo người nộp tiền gần nhất"
              >
                <option value="All">Người nộp: Tất cả</option>
                <option value="None" className="bg-slate-900">❌ Chưa nộp</option>
                {uniquePayers.map((payer) => (
                  <option key={payer} className="bg-slate-900" value={payer}>
                    👤 {payer}
                  </option>
                ))}
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
                    <th className="px-6 py-3.5">Thông tin Người dân & Mã thẻ / CCCD</th>
                    <th className="px-6 py-3.5">Đóng gần nhất</th>
                    <th className="px-6 py-3.5">Ngày hết hạn đóng phí</th>
                    <th className="px-6 py-3.5">Ngày đếm ngược</th>
                    <th className="px-6 py-3.5 text-right">Tính năng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs bg-slate-900/.10 text-slate-300">
                  {filteredCustomers.map((cust) => {
                    const diffDaysBHYT = getDaysDiff(cust.expiryDate);
                    const diffDaysBHXH = cust.hasBHXH && cust.expiryDateBHXH ? getDaysDiff(cust.expiryDateBHXH) : null;
                    
                    // Find most recent BHYT and BHXH payments
                    const bhytPayments = (cust.paymentHistory || []).filter(p => !p.type || p.type === 'BHYT');
                    const bhxhPayments = (cust.paymentHistory || []).filter(p => p.type === 'BHXH');
                    
                    const latestBHYTPayment = bhytPayments.length > 0
                      ? bhytPayments.reduce((latest, current) => current.paymentDate > latest.paymentDate ? current : latest, bhytPayments[0])
                      : null;
                      
                    const latestBHXHPayment = bhxhPayments.length > 0
                      ? bhxhPayments.reduce((latest, current) => current.paymentDate > latest.paymentDate ? current : latest, bhxhPayments[0])
                      : null;
                    
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
                        
                        {/* Integrated Resident, Insurance Cards & CCCD cell */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            {/* Line 1: Gender Icon + Họ Tên + dual status */}
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
                                    ? 'text-emerald-400 bg-emerald-950/60 scale-90 border border-emerald-500/30'
                                    : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-900'
                                }`}
                                title="Sao chép nhanh thông tin (Họ tên, Mã BHXH, Ngày sinh, Ghi chú)"
                              >
                                {copiedCustId === cust.id ? (
                                  <Check className="w-3.5 h-3.5 animate-pulse" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {cust.hasBHXH && (
                                <span className="text-[7px] font-black tracking-wider uppercase bg-indigo-950/50 text-indigo-300 border border-indigo-900/40 px-1.5 py-0.2 rounded select-none">BHYT+BHXH</span>
                              )}
                            </div>

                             {/* Line 2: Birthday + Clickable SĐT link */}
                            <div className="text-slate-400 text-[11px] font-mono flex flex-wrap items-center gap-x-2.5 gap-y-1.5 font-sans">
                              {cust.birthday && (
                                <span className="text-[10px] text-slate-300 font-medium bg-slate-950/40 border border-slate-850/50 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono" title="Ngày tháng năm sinh">
                                  <span>📅</span>
                                  <span>{cust.birthday.includes('-') ? cust.birthday.split('-').reverse().join('/') : cust.birthday}</span>
                                </span>
                              )}

                              <a 
                                href={`tel:${cust.phone}`}
                                className="text-[10px] font-extrabold text-emerald-405 hover:text-emerald-350 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-900/40 px-2 py-0.5 rounded flex items-center gap-1 transition-all font-mono"
                                title={`Bấm để gọi điện cho số điện thoại ${cust.phone}`}
                              >
                                📞 <span className="underline select-all">{cust.phone}</span>
                              </a>

                              {cust.address && (
                                <span className="text-[10px] text-slate-300 font-medium bg-indigo-950/20 border border-indigo-900/40 px-1.5 py-0.5 rounded flex items-center gap-1" title="Địa chỉ thường trú">
                                  <span>📍</span>
                                  <span>{cust.address}</span>
                                </span>
                              )}
                            </div>

                            {/* Line 3: CCCD + Insurance Codes */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              {cust.cccd ? (
                                <span className="text-[10px] font-mono font-medium text-slate-300 bg-slate-950/45 border border-slate-850 px-1.5 py-0.5 rounded flex items-center gap-1" title="Số định danh cá nhân / CCCD">
                                  <span className="text-slate-500 font-bold select-none text-[9px]">CCCD:</span>
                                  <span className="select-all">{cust.cccd}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-500 italic bg-slate-950/30 border border-slate-900/30 px-1.5 py-0.5 rounded">
                                  ⚠️ Chưa ghi CCCD
                                </span>
                              )}

                              <span className="text-[10px] font-mono font-medium text-slate-300 bg-emerald-950/30 border border-emerald-900/35 px-1.5 py-0.5 rounded flex items-center gap-1" title="Mã thẻ BHYT">
                                <span className="text-[8px] font-black bg-emerald-955 text-emerald-300 border border-emerald-900 px-1 py-0.2 rounded scale-90 select-none">BHYT</span>
                                <span className="select-all">{cust.insuranceCode || 'Chưa ghi mã'}</span>
                              </span>

                              {cust.hasBHXH && (
                                <span className="text-[10px] font-mono font-medium text-slate-300 bg-indigo-950/30 border border-indigo-900/35 px-1.5 py-0.5 rounded flex items-center gap-1" title="Mã định danh BHXH">
                                  <span className="text-[8px] font-black bg-indigo-950 text-indigo-300 border border-indigo-900 px-1 py-0.2 rounded scale-90 select-none">BHXH</span>
                                  <span className="select-all">{cust.insuranceCodeBHXH || 'Chưa ghi mã'}</span>
                                </span>
                              )}
                            </div>

                            {/* Line 4: Reminder status log */}
                            {cust.lastRemindedDate ? (
                              <div className="flex items-center gap-1.5 text-[9px] text-amber-300/90 font-extrabold bg-amber-955/40 border border-amber-900/40 rounded px-1.5 py-0.5 w-fit">
                                <span className="relative flex h-1.5 w-1.5 shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                                </span>
                                <span>Đã nhắc: {cust.lastRemindedDate} ({cust.lastRemindedChannel}) - {cust.lastRemindedType}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold bg-slate-950/40 border border-slate-850/50 rounded px-1.5 py-0.5 w-fit select-none">
                                <span className="h-1.5 w-1.5 bg-slate-700 rounded-full shrink-0"></span>
                                <span>Chưa gửi nhắc hạn</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Đóng gần nhất */}
                        <td className="px-6 py-4">
                          <div className="space-y-2 text-xs">
                            {latestBHYTPayment ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5" title={`Ngày nộp: ${latestBHYTPayment.paymentDate}`}>
                                  <span className="px-1.5 py-0.2 rounded text-[7px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-900 select-none">BHYT</span>
                                  <span className="font-mono text-emerald-400 font-extrabold">{latestBHYTPayment.amountPaid.toLocaleString()}đ</span>
                                  <span className="text-[10px] text-slate-500 font-mono">({latestBHYTPayment.periodMonths}th)</span>
                                </div>
                                {latestBHYTPayment.nguoiNop && (
                                  <div className="text-[10px] text-slate-400 pl-1 font-medium truncate max-w-[170px]" title={`Người nộp: ${latestBHYTPayment.nguoiNop}`}>
                                    Nộp: <span className="text-slate-300 font-bold">{latestBHYTPayment.nguoiNop}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-500 italic select-none">BHYT: Chưa đóng</div>
                            )}
                            
                            {cust.hasBHXH ? (
                              latestBHXHPayment ? (
                                <div className="space-y-0.5 pt-1.5 border-t border-slate-800/40">
                                  <div className="flex items-center gap-1.5" title={`Ngày nộp: ${latestBHXHPayment.paymentDate}`}>
                                    <span className="px-1.5 py-0.2 rounded text-[7px] font-extrabold bg-indigo-950 text-indigo-300 border border-indigo-900 select-none">BHXH</span>
                                    <span className="font-mono text-indigo-400 font-extrabold">{latestBHXHPayment.amountPaid.toLocaleString()}đ</span>
                                    <span className="text-[10px] text-slate-500 font-mono">({latestBHXHPayment.periodMonths}th)</span>
                                  </div>
                                  {latestBHXHPayment.nguoiNop && (
                                    <div className="text-[10px] text-slate-400 pl-1 font-medium truncate max-w-[170px]" title={`Người nộp: ${latestBHXHPayment.nguoiNop}`}>
                                      Nộp: <span className="text-slate-300 font-bold">{latestBHXHPayment.nguoiNop}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-500 italic select-none pt-1 border-t border-slate-800/40">BHXH: Chưa đóng</div>
                              )
                            ) : null}
                          </div>
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

                            <button
                              type="button"
                              onClick={(e) => handleCopyCustomerDetails(cust, e)}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 border ${
                                copiedCustId === cust.id
                                  ? 'text-teal-300 bg-teal-950/50 border-teal-500/85 scale-95'
                                  : 'text-sky-300 bg-sky-950/50 border-sky-900/50 hover:bg-sky-900/40 hover:text-white'
                              }`}
                              title="Sao chép nhanh thông tin dưới dạng: Họ tên, Mã BHXH (10 số cuối BHYT hoặc mã BHXH), Ngày sinh, Ghi chú"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedCustId === cust.id ? 'Đã copy!' : 'Copy nhanh'}
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
