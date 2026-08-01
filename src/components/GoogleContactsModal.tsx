import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import {
  X,
  Users,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  ExternalLink,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Check,
  UserCheck,
  UserPlus,
  Info,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

interface GoogleContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCustomers: Customer[];
  onImport: (newCustomers: Customer[]) => void;
}

interface GoogleContactItem {
  resourceName?: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  birthday: string;
  notes: string;
}

export default function GoogleContactsModal({
  isOpen,
  onClose,
  existingCustomers,
  onImport
}: GoogleContactsModalProps) {
  const [syncMode, setSyncMode] = useState<'IMPORT' | 'EXPORT'>('IMPORT');

  const [tokens, setTokens] = useState<any>(() => {
    const saved = localStorage.getItem('google_contacts_tokens');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [contacts, setContacts] = useState<GoogleContactItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Selection states
  const [selectedImportIndices, setSelectedImportIndices] = useState<Set<number>>(new Set());
  const [selectedExportCustomerIds, setSelectedExportCustomerIds] = useState<Set<string>>(new Set());

  const [defaultType, setDefaultType] = useState<'BHYT' | 'BHXH' | 'BOTH'>('BHYT');
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Listen for OAuth postMessage callback from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        const newTokens = event.data.tokens;
        setTokens(newTokens);
        localStorage.setItem('google_contacts_tokens', JSON.stringify(newTokens));
        setConnecting(false);
        fetchGoogleContacts(newTokens);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Fetch contacts if token exists
  const fetchGoogleContacts = async (authToken = tokens) => {
    if (!authToken) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/google/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: authToken })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Lỗi khi tải danh bạ Google');
      }

      const data = await res.json();
      const loadedContacts: GoogleContactItem[] = data.contacts || [];
      setContacts(loadedContacts);

      // Select all non-empty phone/name contacts by default for import
      const initialSelected = new Set<number>();
      loadedContacts.forEach((c, idx) => {
        if (c.fullName || c.phone) {
          initialSelected.add(idx);
        }
      });
      setSelectedImportIndices(initialSelected);

      // Also select all local customers for export initially
      const initialExportIds = new Set<string>();
      existingCustomers.forEach(cust => {
        if (cust.name || cust.phone) {
          initialExportIds.add(cust.id);
        }
      });
      setSelectedExportCustomerIds(initialExportIds);

    } catch (err: any) {
      console.error('Fetch contacts error:', err);
      setError(err.message || 'Không thể kết nối đến danh bạ Google');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tokens && contacts.length === 0) {
      fetchGoogleContacts(tokens);
    }
  }, [isOpen, tokens]);

  // Handle Google OAuth login popup
  const handleConnectGoogle = async () => {
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google/url');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Không thể lấy liên kết xác thực Google');
      }
      const { url } = await res.json();

      const width = 500;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        url,
        'google_oauth',
        `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
      );

      if (!popup) {
        throw new Error('Trình duyệt đã chặn cửa sổ bật lên (popup). Vui lòng cho phép popup để đăng nhập Google.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi mở xác thực Google');
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setTokens(null);
    setContacts([]);
    localStorage.removeItem('google_contacts_tokens');
  };

  // Helper check if google contact is duplicate in local customers
  const isDuplicateCustomer = (cItem: GoogleContactItem) => {
    if (!cItem.phone && !cItem.fullName) return false;
    const cleanPhone = cItem.phone.replace(/\D/g, '');
    return existingCustomers.some(cust => {
      const existingPhone = cust.phone.replace(/\D/g, '');
      if (cleanPhone && existingPhone && cleanPhone === existingPhone) return true;
      if (cItem.fullName && cust.name.toLowerCase().trim() === cItem.fullName.toLowerCase().trim()) return true;
      return false;
    });
  };

  // Helper check if local customer is already in Google contacts
  const isCustomerInGoogle = (cust: Customer) => {
    const cleanPhone = cust.phone.replace(/\D/g, '');
    return contacts.some(gc => {
      const gcPhone = gc.phone.replace(/\D/g, '');
      if (cleanPhone && gcPhone && cleanPhone === gcPhone) return true;
      if (cust.name && gc.fullName && cust.name.toLowerCase().trim() === gc.fullName.toLowerCase().trim()) return true;
      return false;
    });
  };

  // Helper extract birth year from birthday string or 12-digit CCCD
  const extractBirthYear = (birthday?: string, cccd?: string): string | null => {
    if (birthday) {
      const str = String(birthday).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str.substring(0, 4);
      }
      const match = str.match(/\b(19\d\d|20\d\d)\b/);
      if (match) return match[1];
    }
    if (cccd) {
      const cleanCCCD = String(cccd).trim().replace(/\D/g, '');
      if (cleanCCCD.length === 12) {
        const genderCenturyDigit = parseInt(cleanCCCD[3], 10);
        const yy = cleanCCCD.substring(4, 6);
        let century = 1900;
        if (genderCenturyDigit === 0 || genderCenturyDigit === 1) century = 1900;
        else if (genderCenturyDigit === 2 || genderCenturyDigit === 3) century = 2000;
        else if (genderCenturyDigit === 4 || genderCenturyDigit === 5) century = 2100;
        const year = century + parseInt(yy, 10);
        if (year >= 1920 && year <= 2030) return String(year);
      }
    }
    return null;
  };

  // Filter contacts by search for IMPORT
  const filteredImportContacts = contacts.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  // Filter customers by search for EXPORT
  const filteredExportCustomers = existingCustomers.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.cccd?.includes(q) ||
      c.insuranceCode?.includes(q)
    );
  });

  const toggleSelectAllImport = () => {
    if (selectedImportIndices.size === filteredImportContacts.length) {
      setSelectedImportIndices(new Set());
    } else {
      const next = new Set<number>();
      filteredImportContacts.forEach((_, idx) => next.add(idx));
      setSelectedImportIndices(next);
    }
  };

  const toggleSelectOneImport = (idx: number) => {
    const next = new Set(selectedImportIndices);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedImportIndices(next);
  };

  const toggleSelectAllExport = () => {
    if (selectedExportCustomerIds.size === filteredExportCustomers.length) {
      setSelectedExportCustomerIds(new Set());
    } else {
      const next = new Set<string>();
      filteredExportCustomers.forEach(c => next.add(c.id));
      setSelectedExportCustomerIds(next);
    }
  };

  const toggleSelectOneExport = (id: string) => {
    const next = new Set(selectedExportCustomerIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedExportCustomerIds(next);
  };

  // Handle Import from Google Contacts to App
  const handleImportSelected = () => {
    const today = new Date().toISOString().split('T')[0];
    const newCusts: Customer[] = [];

    contacts.forEach((cItem, idx) => {
      if (!selectedImportIndices.has(idx)) return;
      if (skipDuplicates && isDuplicateCustomer(cItem)) return;

      const hasBHYT = defaultType === 'BHYT' || defaultType === 'BOTH';
      const hasBHXH = defaultType === 'BHXH' || defaultType === 'BOTH';

      const customer: Customer = {
        id: `google-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: cItem.fullName || 'Người dân chưa tên',
        phone: cItem.phone || '',
        cccd: '',
        insuranceCode: '',
        hasBHYT: hasBHYT,
        hasBHXH: hasBHXH,
        expiryDate: today,
        expiryDateBHXH: hasBHXH ? today : undefined,
        createdAt: today,
        notes: [cItem.notes, cItem.email ? `Email: ${cItem.email}` : ''].filter(Boolean).join(' | '),
        status: 'active',
        paymentHistory: [],
        address: cItem.address || '',
        birthday: cItem.birthday || ''
      };

      newCusts.push(customer);
    });

    if (newCusts.length === 0) {
      alert('Không có danh bạ mới nào được nhập (có thể do trùng lặp hoặc chưa chọn).');
      return;
    }

    onImport(newCusts);
    onClose();
  };

  // Handle Export (Reverse sync) from App to Google Contacts
  const handleExportSelected = async () => {
    if (!tokens) return;
    const toExport = existingCustomers.filter(c => selectedExportCustomerIds.has(c.id));
    if (toExport.length === 0) {
      alert('Vui lòng chọn ít nhất một người dân để xuất lên Google Contacts.');
      return;
    }

    setExporting(true);
    setError(null);
    setExportSuccessMsg(null);

    try {
      const res = await fetch('/api/google/contacts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens,
          customers: toExport
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Lỗi khi xuất danh bạ lên Google Contacts');
      }

      const data = await res.json();
      setExportSuccessMsg(data.message || `Đã xuất thành công ${data.successCount} liên hệ lên Google Contacts!`);
      // Refresh Google Contacts list
      fetchGoogleContacts(tokens);
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || 'Không thể đồng bộ ngược lên Google Contacts');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-950/80 border border-sky-800/80 text-sky-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Đồng bộ Danh bạ Google
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                  Official Google API
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Đồng bộ hai chiều giữa Google Contacts và danh sách người dân trong hệ thống Sổ Thu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Direction Mode Tabs */}
        <div className="bg-slate-950/60 border-b border-slate-800 p-2.5 px-4 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSyncMode('IMPORT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              syncMode === 'IMPORT'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Tải về từ Google Contacts</span>
          </button>

          <button
            type="button"
            onClick={() => setSyncMode('EXPORT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              syncMode === 'EXPORT'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Đồng bộ ngược lên Google Contacts</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Step 1: Authentication Box if not logged in */}
          {!tokens ? (
            <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/30 border border-sky-900/40 rounded-2xl p-6 text-center space-y-4 shadow-lg">
              <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center mx-auto text-sky-400">
                <Users className="w-8 h-8" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-bold text-white">Kết nối Tài khoản Google</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ủy quyền đăng nhập Google để tải liên hệ về hoặc đẩy danh sách người dân trực tiếp lên tài khoản Google Contacts của bạn.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2 max-w-md mx-auto">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleConnectGoogle}
                  disabled={connecting}
                  className="px-6 py-3 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2.5 mx-auto cursor-pointer disabled:opacity-50"
                >
                  {connecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang mở cửa sổ Google OAuth...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Kết nối & Ủy quyền Google Contacts</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2">
                <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Bảo mật tuyệt đối thông qua Google OAuth 2.0 API chính thức.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Connected Token Bar */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block">Đã kết nối Google Contacts</span>
                    <span className="text-[11px] text-slate-400">
                      Hiện có {contacts.length} liên hệ trên Google & {existingCustomers.length} người dân trong hệ thống Sổ Thu
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchGoogleContacts(tokens)}
                    disabled={loading}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Làm mới danh bạ</span>
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Ngắt kết nối
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {exportSuccessMsg && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{exportSuccessMsg}</span>
                </div>
              )}

              {/* ================= MODE 1: IMPORT FROM GOOGLE ================= */}
              {syncMode === 'IMPORT' && (
                <div className="space-y-4">
                  {/* Import Options */}
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Loại bảo hiểm mặc định gán cho danh bạ:
                      </label>
                      <div className="flex items-center gap-2">
                        {[
                          { id: 'BHYT', label: 'Chỉ BHYT' },
                          { id: 'BHXH', label: 'Chỉ BHXH' },
                          { id: 'BOTH', label: 'Cả BHYT & BHXH' },
                        ].map(type => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setDefaultType(type.id as any)}
                            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              defaultType === type.id
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col justify-center">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={skipDuplicates}
                          onChange={(e) => setSkipDuplicates(e.target.checked)}
                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-sky-500"
                        />
                        <span>Bỏ qua những người dân đã có sẵn (trùng SĐT hoặc Họ tên)</span>
                      </label>
                      <p className="text-[11px] text-slate-500 mt-1 pl-6">
                        Tránh tạo trùng lặp với danh sách người dân đang quản lý trong hệ thống.
                      </p>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm danh bạ theo tên, SĐT, email..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <button
                        onClick={toggleSelectAllImport}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-750 rounded-xl text-slate-300 transition-all cursor-pointer font-medium"
                      >
                        {selectedImportIndices.size === filteredImportContacts.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      </button>
                      <span className="text-slate-400 font-mono">
                        Đã chọn: <strong className="text-sky-400">{selectedImportIndices.size}</strong>/{filteredImportContacts.length}
                      </span>
                    </div>
                  </div>

                  {/* Contacts Table */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-[360px] overflow-y-auto">
                    {loading ? (
                      <div className="p-12 text-center text-slate-400 space-y-3">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-400" />
                        <p className="text-xs">Đang tải dữ liệu từ Google Contacts...</p>
                      </div>
                    ) : filteredImportContacts.length === 0 ? (
                      <div className="p-12 text-center text-slate-500">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs">Không tìm thấy danh bạ nào phù hợp.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10 text-slate-400 font-semibold">
                          <tr>
                            <th className="p-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={selectedImportIndices.size > 0 && selectedImportIndices.size === filteredImportContacts.length}
                                onChange={toggleSelectAllImport}
                                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-sky-500"
                              />
                            </th>
                            <th className="p-3">Họ và tên</th>
                            <th className="p-3">Số điện thoại</th>
                            <th className="p-3">Email / Địa chỉ</th>
                            <th className="p-3 text-right">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {filteredImportContacts.map((c, idx) => {
                            const isDup = isDuplicateCustomer(c);
                            const isSelected = selectedImportIndices.has(idx);

                            return (
                              <tr
                                key={idx}
                                onClick={() => toggleSelectOneImport(idx)}
                                className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                                  isSelected ? 'bg-sky-950/20' : ''
                                } ${isDup && skipDuplicates ? 'opacity-50' : ''}`}
                              >
                                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelectOneImport(idx)}
                                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-sky-500"
                                  />
                                </td>
                                <td className="p-3 font-semibold text-white">
                                  <div className="flex items-center gap-2">
                                    <span>{c.fullName || 'Chưa có tên'}</span>
                                    {c.birthday && (
                                      <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                        <Calendar className="w-3 h-3 text-amber-400" />
                                        {c.birthday}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-slate-300">
                                  {c.phone ? (
                                    <span className="flex items-center gap-1.5 text-sky-300">
                                      <Phone className="w-3 h-3 text-sky-400" />
                                      {c.phone}
                                    </span>
                                  ) : (
                                    <span className="text-slate-600 font-sans italic">Chưa có SĐT</span>
                                  )}
                                </td>
                                <td className="p-3 text-slate-400 truncate max-w-[200px]">
                                  {c.email && (
                                    <div className="truncate flex items-center gap-1 text-[11px] text-slate-300">
                                      <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                                      <span>{c.email}</span>
                                    </div>
                                  )}
                                  {c.address && (
                                    <div className="truncate flex items-center gap-1 text-[10px] text-slate-400">
                                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                      <span>{c.address}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  {isDup ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                                      <UserCheck className="w-3 h-3" />
                                      Đã có trong hệ thống
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                                      <UserPlus className="w-3 h-3" />
                                      Mới
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* ================= MODE 2: EXPORT TO GOOGLE ================= */}
              {syncMode === 'EXPORT' && (
                <div className="space-y-4">
                  <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3.5 text-xs text-emerald-300/90 leading-relaxed flex items-start gap-3">
                    <ArrowUpRight className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Tính năng Đồng bộ ngược:</strong> Đẩy danh sách người dân trong Sổ Thu lên Google Contacts. 
                      Hệ thống tự động gắn thêm năm sinh sau Họ tên (ví dụ: "Nguyễn Văn A 1988"), kèm Số điện thoại, Địa chỉ, Ngày sinh và ghi chú Mã BHYT/BHXH/CCCD.
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm người dân theo tên, SĐT, CCCD, Mã BH..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <button
                        onClick={toggleSelectAllExport}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-750 rounded-xl text-slate-300 transition-all cursor-pointer font-medium"
                      >
                        {selectedExportCustomerIds.size === filteredExportCustomers.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      </button>
                      <span className="text-slate-400 font-mono">
                        Đã chọn: <strong className="text-emerald-400">{selectedExportCustomerIds.size}</strong>/{filteredExportCustomers.length}
                      </span>
                    </div>
                  </div>

                  {/* Export Customers Table */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-[360px] overflow-y-auto">
                    {filteredExportCustomers.length === 0 ? (
                      <div className="p-12 text-center text-slate-500">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs">Không có người dân nào để hiển thị.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10 text-slate-400 font-semibold">
                          <tr>
                            <th className="p-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={selectedExportCustomerIds.size > 0 && selectedExportCustomerIds.size === filteredExportCustomers.length}
                                onChange={toggleSelectAllExport}
                                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                              />
                            </th>
                            <th className="p-3">Họ và tên</th>
                            <th className="p-3">Số điện thoại</th>
                            <th className="p-3">CCCD / Mã BH</th>
                            <th className="p-3 text-right">Trên Google Contacts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {filteredExportCustomers.map((cust) => {
                            const isSelected = selectedExportCustomerIds.has(cust.id);
                            const existsOnGoogle = isCustomerInGoogle(cust);

                            return (
                              <tr
                                key={cust.id}
                                onClick={() => toggleSelectOneExport(cust.id)}
                                className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                                  isSelected ? 'bg-emerald-950/20' : ''
                                }`}
                              >
                                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelectOneExport(cust.id)}
                                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                                  />
                                </td>
                                <td className="p-3 font-semibold text-white">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span>{cust.name}</span>
                                    {extractBirthYear(cust.birthday, cust.cccd) && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20" title="Năm sinh sẽ đồng bộ vào sau tên trên Google Contacts">
                                        {extractBirthYear(cust.birthday, cust.cccd)}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-slate-300">
                                  {cust.phone ? (
                                    <span className="flex items-center gap-1.5 text-emerald-300">
                                      <Phone className="w-3 h-3 text-emerald-400" />
                                      {cust.phone}
                                    </span>
                                  ) : (
                                    <span className="text-slate-600 font-sans italic">Chưa có SĐT</span>
                                  )}
                                </td>
                                <td className="p-3 text-slate-400 font-mono text-[11px]">
                                  {cust.insuranceCode && <div>BHYT: {cust.insuranceCode}</div>}
                                  {cust.insuranceCodeBHXH && <div>BHXH: {cust.insuranceCodeBHXH}</div>}
                                </td>
                                <td className="p-3 text-right">
                                  {existsOnGoogle ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Đã có trên Google
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">
                                      Chưa có
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            {tokens && syncMode === 'IMPORT' && (
              <span>
                Sẽ nhập <strong className="text-sky-400">{selectedImportIndices.size}</strong> người dân vào hệ thống.
              </span>
            )}
            {tokens && syncMode === 'EXPORT' && (
              <span>
                Sẽ xuất <strong className="text-emerald-400">{selectedExportCustomerIds.size}</strong> người dân lên Google Contacts.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Đóng
            </button>

            {tokens && syncMode === 'IMPORT' && (
              <button
                onClick={handleImportSelected}
                disabled={selectedImportIndices.size === 0}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Nhập người dân đã chọn ({selectedImportIndices.size})</span>
              </button>
            )}

            {tokens && syncMode === 'EXPORT' && (
              <button
                onClick={handleExportSelected}
                disabled={selectedExportCustomerIds.size === 0 || exporting}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang xuất lên Google...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Đồng bộ ngược lên Google ({selectedExportCustomerIds.size})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
