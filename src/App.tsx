/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, UserSettings } from './types';
import { INITIAL_CUSTOMERS, INITIAL_SETTINGS } from './mockData';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import SettingsModal from './components/SettingsModal';
import ImportExcelModal from './components/ImportExcelModal';
import CustomerModal from './components/CustomerModal';
import WordPressAuth from './components/WordPressAuth';
import VersionSyncModal, { CloudBackupInfo } from './components/VersionSyncModal';
import { 
  getStoredWPUser, 
  clearWPAuth, 
  saveBackupToWordPress, 
  getBackupFromWordPress, 
  WPUser 
} from './lib/graphql';
import { updateSEOTags } from './lib/seo';
import SEOShareModal from './components/SEOShareModal';
import PricingModal from './components/PricingModal';

import { getAutoCommissionRate } from './lib/commission';
import { parseJsonToCustomers } from './lib/jsonParser';
import { INITIAL_PVI_JSON } from './data/initialData';

const normalizeDateParam = (val: string | null): string => {
  if (!val) return '';
  const trimmed = val.trim();
  if (!trimmed) return '';
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
};

const normalizeGenderParam = (val: string | null): 'Nam' | 'Nữ' | undefined => {
  if (!val) return undefined;
  const lower = val.trim().toLowerCase();
  if (['nam', 'male', 'm', '1'].includes(lower)) return 'Nam';
  if (['nữ', 'nu', 'female', 'f', '0'].includes(lower)) return 'Nữ';
  return undefined;
};

export default function App() {
  // core reactive states
  const [view, setView] = useState<'landing' | 'dashboard'>(() => {
    try {
      if (window.location.hash.includes('dashboard')) return 'dashboard';
      const hasOpened = localStorage.getItem('lws_has_opened_book');
      if (hasOpened === 'true') return 'dashboard';
      const storedCustomers = localStorage.getItem('lws_customers');
      if (storedCustomers !== null) {
        const parsed = JSON.parse(storedCustomers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return 'dashboard';
        }
      }
    } catch (e) {
      console.error('Error checking initial view:', e);
    }
    return 'landing';
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);

  // Pricing & Subscription state
  const [currentPlan, setCurrentPlan] = useState<'offline' | 'online_pro'>(() => {
    try {
      const saved = localStorage.getItem('lws_current_plan');
      return saved === 'online_pro' ? 'online_pro' : 'offline';
    } catch {
      return 'offline';
    }
  });

  // WordPress backend alignment states
  const [wpUser, setWpUser] = useState<WPUser | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Cloud backup version alert states
  const [cloudBackupNotice, setCloudBackupNotice] = useState<CloudBackupInfo | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  // modal visibility states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedEditCustomer, setSelectedEditCustomer] = useState<Customer | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isSEOModalOpen, setIsSEOModalOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  const handleSelectPlan = (plan: 'offline' | 'online_pro') => {
    setCurrentPlan(plan);
    try {
      localStorage.setItem('lws_current_plan', plan);
    } catch (e) {
      console.error('Failed to save plan to localStorage:', e);
    }
  };

  // Dynamic SEO & Open Graph Meta Tags Synchronizer
  useEffect(() => {
    if (view === 'landing') {
      updateSEOTags({
        title: 'LWS Sổ Thu Bảo Hiểm Online - Ứng Dụng Miễn Phí Nhắc Hạn BHYT & BHXH | Long Web Studio',
        description: 'Sổ thu bảo hiểm online tiện lợi dành cho Nhân viên thu BHXH, BHYT. Tự động tính định mức BHYT hộ gia đình (lương cơ sở 2.530.000đ), gửi tin nhắn Zalo/SMS nhắc đáo hạn 3 giây.',
        ogUrl: 'https://sothu.longwebstudio.io.vn/',
        canonicalUrl: 'https://sothu.longwebstudio.io.vn/',
      });
    } else {
      const agency = settings.agencyName || 'Đại Lý Thu BHXH, BHYT';
      updateSEOTags({
        title: `LWS Sổ Thu Bảo Hiểm Online - ${agency}`,
        description: `Sổ thu bảo hiểm online quản lý ${customers.length} người dân đóng BHYT Hộ gia đình và BHXH Tự nguyện tại ${agency}. Tự động tạo tin nhắn Zalo nhắc hạn, tính định mức hỗ trợ chính xác.`,
        ogUrl: 'https://sothu.longwebstudio.io.vn/#dashboard',
        canonicalUrl: 'https://sothu.longwebstudio.io.vn/',
      });
    }
  }, [view, settings.agencyName, customers.length]);

  // Check Cloud Backup Version vs Local Version
  const checkCloudVersion = async (userParam?: WPUser | null, isManualCheck: boolean = false) => {
    const activeUser = userParam || wpUser;
    if (!activeUser) return;

    try {
      const backup = await getBackupFromWordPress();
      if (backup && backup.updatedAt) {
        const cloudDateStr = backup.updatedAt.includes(' ') ? backup.updatedAt.replace(' ', 'T') : backup.updatedAt;
        const cloudTs = new Date(cloudDateStr).getTime() || 0;

        const localSyncedStr = settings.lastSyncedVersion;
        let localSyncedTs = 0;
        if (localSyncedStr) {
          const localDateStr = localSyncedStr.includes(' ') ? localSyncedStr.replace(' ', 'T') : localSyncedStr;
          localSyncedTs = new Date(localDateStr).getTime() || 0;
        }

        // Determine if Cloud version is newer or has different record count
        const isCloudNewer = (cloudTs > localSyncedTs + 3000) || (!localSyncedStr && (backup.customers?.length || 0) > 0);

        if (isCloudNewer) {
          // ONLY open modal if cloud has a newer / different version
          setCloudBackupNotice(backup as CloudBackupInfo);
          setIsVersionModalOpen(true);
          if (isManualCheck) {
            setSyncStatus({
              type: 'success',
              message: `Phát hiện phiên bản Sổ Thu mới trên Cloud (${backup.updatedAt})! Cửa sổ khôi phục đã hiển thị.`
            });
          }
        } else {
          // Cloud version is same or older: DO NOT show modal
          setIsVersionModalOpen(false);
          setSyncStatus({
            type: 'success',
            message: `Dữ liệu Sổ Thu hiện tại trên thiết bị đã khớp hoàn toàn với phiên bản mới nhất trên Cloud (${backup.updatedAt}).`
          });
        }
      } else if (isManualCheck) {
        setIsVersionModalOpen(false);
        setSyncStatus({
          type: 'success',
          message: 'Tài khoản này chưa có dữ liệu sao lưu trên Cloud. Bạn có thể nhấn "Lưu & Đồng Bộ WordPress" để tải dữ liệu đầu tiên lên máy chủ.'
        });
      }
    } catch (err: any) {
      console.warn('Không thể kiểm tra phiên bản Sổ Thu trên Cloud:', err);
      if (isManualCheck) {
        setSyncStatus({
          type: 'error',
          message: 'Không thể kết nối máy chủ WordPress để kiểm tra phiên bản. Vui lòng kiểm tra lại mạng.'
        });
      }
    }
  };

  // load state from LocalStorage on mount
  useEffect(() => {
    // Check if WordPress user is logged in
    const storedUser = getStoredWPUser();
    if (storedUser) {
      setWpUser(storedUser);
      // Check cloud version after startup delay
      setTimeout(() => {
        checkCloudVersion(storedUser);
      }, 1500);
    }

    try {
      let loadedCustomers: Customer[] = [];
      const storedCustomers = localStorage.getItem('lws_customers');
      const hasOpenedBook = localStorage.getItem('lws_has_opened_book');

      if (storedCustomers !== null) {
        const parsed: Customer[] = JSON.parse(storedCustomers);
        // Filter out sample customer records if present from previous sessions
        loadedCustomers = parsed.filter((c: Customer) => !['cust-1', 'cust-2', 'cust-3', 'cust-4', 'cust-5', 'cust-6'].includes(c.id));
      } else {
        // Seed with PVI customers ONLY if first time ever (storedCustomers is null)
        loadedCustomers = parseJsonToCustomers(INITIAL_PVI_JSON);
      }

      setCustomers(loadedCustomers);
      localStorage.setItem('lws_customers', JSON.stringify(loadedCustomers));

      // Auto-enter dashboard if data exists or book was opened previously
      if (hasOpenedBook === 'true' || loadedCustomers.length > 0 || storedCustomers !== null) {
        setView('dashboard');
        localStorage.setItem('lws_has_opened_book', 'true');
      }

      // Check URL query parameters to add customer via URL (e.g. ?name=...&phone=...&code=...&expiryDate=...)
      try {
        const searchParams = new URLSearchParams(window.location.search);
        if (window.location.hash.includes('?')) {
          const hashQuery = window.location.hash.substring(window.location.hash.indexOf('?'));
          const hashParams = new URLSearchParams(hashQuery);
          hashParams.forEach((v, k) => {
            if (!searchParams.has(k)) searchParams.set(k, v);
          });
        }

        const nameParam = searchParams.get('name') || searchParams.get('ten') || searchParams.get('fullName') || searchParams.get('hoTen') || searchParams.get('n');
        const phoneParam = searchParams.get('phone') || searchParams.get('sdt') || searchParams.get('mobile') || searchParams.get('p');
        const codeParam = searchParams.get('insuranceCode') || searchParams.get('code') || searchParams.get('maSo') || searchParams.get('maBhyt') || searchParams.get('maBhxh') || searchParams.get('ma');
        const actionParam = searchParams.get('action') || searchParams.get('add');

        if (nameParam || phoneParam || codeParam || actionParam === 'add' || actionParam === 'true') {
          setView('dashboard');

          const typeParam = searchParams.get('type') || searchParams.get('loai') || searchParams.get('loaiHinh');
          let type: 'BHYT' | 'BHXH' = 'BHYT';
          let hasBHYT = true;
          let hasBHXH = false;

          if (typeParam) {
            const upper = typeParam.toUpperCase();
            if (upper.includes('BHXH')) {
              type = 'BHXH';
              hasBHXH = true;
              if (!upper.includes('BHYT')) hasBHYT = false;
            }
            if (upper.includes('BHYT')) {
              hasBHYT = true;
            }
          }

          const expiryBHXHParam = normalizeDateParam(searchParams.get('expiryDateBHXH') || searchParams.get('hanBhxh'));
          if (expiryBHXHParam) hasBHXH = true;

          const expiryBHYTParam = normalizeDateParam(
            searchParams.get('expiryDate') ||
            searchParams.get('expiry') ||
            searchParams.get('han') ||
            searchParams.get('hanBhyt') ||
            searchParams.get('ngayHetHan')
          );

          const queryCustomer: Customer = {
            id: `cust-${Date.now()}`,
            name: (nameParam || '').trim(),
            phone: (phoneParam || '').trim(),
            cccd: (searchParams.get('cccd') || searchParams.get('cmnd') || '').trim(),
            insuranceCode: (codeParam || '').trim().toUpperCase(),
            hasBHYT,
            hasBHXH,
            expiryDate: expiryBHYTParam || new Date().toISOString().split('T')[0],
            expiryDateBHXH: expiryBHXHParam || (hasBHXH ? new Date().toISOString().split('T')[0] : undefined),
            createdAt: new Date().toISOString().split('T')[0],
            status: searchParams.get('status') === 'inactive' ? 'inactive' : 'active',
            gender: normalizeGenderParam(searchParams.get('gender') || searchParams.get('gioiTinh')),
            birthday: normalizeDateParam(searchParams.get('birthday') || searchParams.get('ngaySinh') || searchParams.get('ns')) || undefined,
            address: (searchParams.get('address') || searchParams.get('diaChi') || '').trim() || undefined,
            notes: (searchParams.get('notes') || searchParams.get('ghiChu') || '').trim() || undefined,
            paymentHistory: []
          };

          const isAutoSave = searchParams.get('autoSave') === 'true' || searchParams.get('save') === 'true' || searchParams.get('auto') === '1' || actionParam === 'save';

          if (isAutoSave && queryCustomer.name) {
            const currentList = loadedCustomers;
            const existingIndex = currentList.findIndex(c => 
              (queryCustomer.insuranceCode && c.insuranceCode === queryCustomer.insuranceCode) ||
              (queryCustomer.phone && c.phone === queryCustomer.phone) ||
              (queryCustomer.name && c.name.toLowerCase() === queryCustomer.name.toLowerCase())
            );

            let updatedList: Customer[];
            if (existingIndex >= 0) {
              const existing = currentList[existingIndex];
              const merged: Customer = {
                ...existing,
                ...queryCustomer,
                id: existing.id,
                paymentHistory: existing.paymentHistory || []
              };
              delete merged.lastRemindedDate;
              delete merged.lastRemindedChannel;
              delete merged.hinhThucNhac;
              delete merged.lastRemindedType;
              updatedList = [...currentList];
              updatedList[existingIndex] = merged;
            } else {
              updatedList = [queryCustomer, ...currentList];
            }

            setCustomers(updatedList);
            localStorage.setItem('lws_customers', JSON.stringify(updatedList));

            setSyncStatus({
              type: 'success',
              message: `✅ Đã tự động thêm/cập nhật người dân "${queryCustomer.name}" từ URL query parameter!`
            });
          } else {
            setSelectedEditCustomer(queryCustomer);
            setIsAddCustomerOpen(true);
            setSyncStatus({
              type: 'success',
              message: `📥 Đã nhận thông tin người dân "${queryCustomer.name || 'mới'}" từ URL. Vui lòng kiểm tra và bấm "Lưu thông tin"!`
            });
          }

          try {
            const cleanUrl = window.location.origin + window.location.pathname + '#dashboard';
            window.history.replaceState({}, document.title, cleanUrl);
          } catch (e) {
            console.warn('Could not clean query URL:', e);
          }
        }
      } catch (err) {
        console.error('Error parsing URL query parameters:', err);
      }

      const storedSettings = localStorage.getItem('lws_settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        // Migrate old default settings to current request
        const merged = {
          ...parsed,
          baseSalaryBHYT: (!parsed.baseSalaryBHYT || parsed.baseSalaryBHYT === 2340000) ? INITIAL_SETTINGS.baseSalaryBHYT : parsed.baseSalaryBHYT,
          povertyStandardBHXH: parsed.povertyStandardBHXH || INITIAL_SETTINGS.povertyStandardBHXH,
          supportOtherBHXH: (!parsed.supportOtherBHXH || parsed.supportOtherBHXH === 33000) ? INITIAL_SETTINGS.supportOtherBHXH : parsed.supportOtherBHXH,
          autoBackupWordPress: parsed.autoBackupWordPress !== undefined ? parsed.autoBackupWordPress : INITIAL_SETTINGS.autoBackupWordPress,
          lastAutoBackupDate: parsed.lastAutoBackupDate || INITIAL_SETTINGS.lastAutoBackupDate,
        };
        if (
          parsed.agencyName === 'Bảo Hiểm An Bình - Đại Lý Long Web Studio' ||
          parsed.agencyName === 'Hồ Thị Thắm - Nhân viên thu BHXH, BHYT bưu điện VHX Tự Lập' ||
          parsed.agencyName === 'Lỗ Văn Long' ||
          parsed.agentPhone === '0987654321' ||
          parsed.agentPhone === '0978333963' ||
          parsed.agentPhone === '0374638603'
        ) {
          merged.agencyName = INITIAL_SETTINGS.agencyName;
          merged.agentPhone = INITIAL_SETTINGS.agentPhone;
        }
        setSettings(merged);
        localStorage.setItem('lws_settings', JSON.stringify(merged));
      } else {
        setSettings(INITIAL_SETTINGS);
        localStorage.setItem('lws_settings', JSON.stringify(INITIAL_SETTINGS));
      }
    } catch (e) {
      console.error('Error loading data from local storage:', e);
    }
  }, []);

  // Daily auto backup to WordPress
  useEffect(() => {
    if (!wpUser || !settings.autoBackupWordPress) return;

    const today = new Date().toISOString().split('T')[0];
    if (settings.lastAutoBackupDate === today) return;

    const isRunning = sessionStorage.getItem('lws_auto_backing_up');
    if (isRunning === 'true') return;
    sessionStorage.setItem('lws_auto_backing_up', 'true');

    const runAutoBackup = async () => {
      try {
        const updatedSettings: UserSettings = {
          ...settings,
          lastAutoBackupDate: today,
        };
        // Update state and storage immediately to block other triggers
        setSettings(updatedSettings);
        localStorage.setItem('lws_settings', JSON.stringify(updatedSettings));

        await saveBackupToWordPress({ customers, settings: updatedSettings });
        console.log('Daily automatic backup to WordPress completed successfully.');
      } catch (err) {
        console.error('Daily automatic backup to WordPress failed:', err);
      } finally {
        sessionStorage.removeItem('lws_auto_backing_up');
      }
    };

    // Delay slightly to let resources settle on startup
    const timer = setTimeout(runAutoBackup, 4000);
    return () => clearTimeout(timer);
  }, [wpUser, settings.autoBackupWordPress, settings.lastAutoBackupDate, customers]);

  // helpers to persist changes
  const saveCustomersToStorage = (updatedCustomers: Customer[]) => {
    setCustomers(updatedCustomers);
    localStorage.setItem('lws_customers', JSON.stringify(updatedCustomers));
    const now = new Date().toISOString();
    setSettings(prev => {
      const updated = { ...prev, lastLocalUpdate: now };
      localStorage.setItem('lws_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSaveSettings = (updatedSettings: UserSettings) => {
    setSettings(updatedSettings);
    localStorage.setItem('lws_settings', JSON.stringify(updatedSettings));
  };

  // customer actions
  const handleSaveCustomer = (customer: Customer, parallelCustomer?: Customer) => {
    let updated = [...customers];
    
    const processCustomer = (cToSave: Customer, cExisting?: Customer): Customer => {
      if (!cExisting) return cToSave;

      const isExpiryChanged = (cToSave.expiryDate && cToSave.expiryDate !== cExisting.expiryDate) ||
                             (cToSave.expiryDateBHXH && cToSave.expiryDateBHXH !== cExisting.expiryDateBHXH);
      const isPaymentAdded = (cToSave.paymentHistory?.length || 0) > (cExisting.paymentHistory?.length || 0);

      if (isExpiryChanged || isPaymentAdded) {
        const cleaned = { ...cToSave };
        delete cleaned.lastRemindedDate;
        delete cleaned.lastRemindedChannel;
        delete cleaned.hinhThucNhac;
        delete cleaned.lastRemindedType;
        return cleaned;
      }
      return cToSave;
    };

    // Save/update first customer
    const existing1 = updated.find(c => c.id === customer.id);
    const processed1 = processCustomer(customer, existing1);
    if (existing1) {
      updated = updated.map(c => c.id === customer.id ? processed1 : c);
    } else {
      updated = [processed1, ...updated];
    }
    
    // Save/update parallel customer if provided
    if (parallelCustomer) {
      const existing2 = updated.find(c => c.id === parallelCustomer.id);
      const processed2 = processCustomer(parallelCustomer, existing2);
      if (existing2) {
        updated = updated.map(c => c.id === parallelCustomer.id ? processed2 : c);
      } else {
        updated = [processed2, ...updated];
      }
    }
    
    saveCustomersToStorage(updated);
  };

  const handleDeleteCustomer = (id: string) => {
    const updated = customers.filter(c => c.id !== id);
    saveCustomersToStorage(updated);
  };

  const handleBulkImport = (newCustomers: Customer[]) => {
    const updated = [...customers];
    
    const get10DigitKey = (cust: Customer) => {
      const bhxh = cust.insuranceCodeBHXH ? cust.insuranceCodeBHXH.trim().replace(/\s/g, '') : '';
      if (bhxh && bhxh.length >= 10) return bhxh.slice(-10);
      const bhyt = cust.insuranceCode ? cust.insuranceCode.trim().replace(/\s/g, '') : '';
      if (bhyt && bhyt.length >= 10) return bhyt.slice(-10);
      return bhxh || bhyt;
    };

    // Loại bỏ toàn bộ biên lai cũ có cùng bienLaiId trước khi import biên lai mới (Tính duy nhất và ghi đè)
    newCustomers.forEach(newCust => {
      if (newCust.paymentHistory && newCust.paymentHistory.length > 0) {
        newCust.paymentHistory.forEach(newPay => {
          if (newPay.bienLaiId) {
            updated.forEach(c => {
              if (c.paymentHistory) {
                c.paymentHistory = c.paymentHistory.filter(oldPay => oldPay.bienLaiId !== newPay.bienLaiId);
              }
            });
          }
        });
      }
    });

    newCustomers.forEach(newCust => {
      const matchIndex = updated.findIndex(c => {
        const new10 = get10DigitKey(newCust);
        const existing10 = get10DigitKey(c);
        if (new10 && existing10 && new10 === existing10) {
          return true;
        }
        if (newCust.cccd && c.cccd && newCust.cccd.trim() === c.cccd.trim()) {
          return true;
        }
        if (newCust.insuranceCode && c.insuranceCode && newCust.insuranceCode.trim() === c.insuranceCode.trim()) {
          return true;
        }
        if (newCust.insuranceCodeBHXH && c.insuranceCodeBHXH && newCust.insuranceCodeBHXH.trim() === c.insuranceCodeBHXH.trim()) {
          return true;
        }
        if (newCust.name && c.name && newCust.name.trim().toLowerCase() === c.name.trim().toLowerCase()) {
          return true;
        }
        return false;
      });

      if (matchIndex !== -1) {
        // Merge customer data
        const existing = updated[matchIndex];
        
        // Merge unique identifiers if missing
        const mergedPhone = existing.phone || newCust.phone;
        const mergedCccd = existing.cccd || newCust.cccd;
        const mergedInsuranceCode = existing.insuranceCode || newCust.insuranceCode;
        const mergedInsuranceCodeBHXH = existing.insuranceCodeBHXH || newCust.insuranceCodeBHXH;
        const mergedHasBHXH = existing.hasBHXH || newCust.hasBHXH;
        const mergedBirthday = existing.birthday || newCust.birthday;
        const mergedGender = existing.gender || newCust.gender;
        const mergedAddress = existing.address || newCust.address;
        
        // Append history without duplicates
        const updatedHistory = [...(existing.paymentHistory || [])];
        if (newCust.paymentHistory && newCust.paymentHistory.length > 0) {
          newCust.paymentHistory.forEach(newPay => {
            const isDup = updatedHistory.some(oldPay => {
              if (newPay.bienLaiId && oldPay.bienLaiId) {
                return oldPay.bienLaiId === newPay.bienLaiId;
              }
              return oldPay.paymentDate === newPay.paymentDate && 
                Math.abs(oldPay.amountPaid - newPay.amountPaid) < 1; // check if same amount & date
            });
            if (!isDup) {
              updatedHistory.unshift(newPay); // Prepend new payments
            }
          });
        }

        // Sort paymentHistory descending by date
        updatedHistory.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

        // Update expiry dates (use newer date if available)
        let mergedExpiryDate = existing.expiryDate;
        let mergedExpiryDateBHXH = existing.expiryDateBHXH;
        
        if (!mergedExpiryDate || (newCust.expiryDate && newCust.expiryDate > mergedExpiryDate)) {
          mergedExpiryDate = newCust.expiryDate;
        }
        if (!mergedExpiryDateBHXH || (newCust.expiryDateBHXH && newCust.expiryDateBHXH > mergedExpiryDateBHXH)) {
          mergedExpiryDateBHXH = newCust.expiryDateBHXH;
        }

        const isExpiryChanged = (mergedExpiryDate && mergedExpiryDate !== existing.expiryDate) ||
                               (mergedExpiryDateBHXH && mergedExpiryDateBHXH !== existing.expiryDateBHXH);
        const isPaymentAdded = updatedHistory.length > (existing.paymentHistory?.length || 0);

        const mergedCust: Customer = {
          ...existing,
          phone: mergedPhone,
          cccd: mergedCccd,
          insuranceCode: mergedInsuranceCode,
          insuranceCodeBHXH: mergedInsuranceCodeBHXH,
          hasBHXH: mergedHasBHXH,
          expiryDate: mergedExpiryDate,
          expiryDateBHXH: mergedExpiryDateBHXH,
          birthday: mergedBirthday,
          gender: mergedGender,
          address: mergedAddress,
          paymentHistory: updatedHistory,
          status: 'active',
          notes: existing.notes 
            ? (existing.notes.includes(newCust.notes || '') ? existing.notes : `${existing.notes}\n${newCust.notes || ''}`).substring(0, 500)
            : newCust.notes
        };

        if (isExpiryChanged || isPaymentAdded) {
          delete mergedCust.lastRemindedDate;
          delete mergedCust.lastRemindedChannel;
          delete mergedCust.hinhThucNhac;
          delete mergedCust.lastRemindedType;
        }

        updated[matchIndex] = mergedCust;
      } else {
        // Add as new customer
        updated.unshift({
          ...newCust,
          id: `cust-excel-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        });
      }
    });

    saveCustomersToStorage(updated);
  };

  const handleResetDemoData = () => {
    setCustomers([]);
    setSettings(INITIAL_SETTINGS);
    localStorage.setItem('lws_customers', JSON.stringify([]));
    localStorage.setItem('lws_settings', JSON.stringify(INITIAL_SETTINGS));
    localStorage.removeItem('lws_has_opened_book');
    setSyncStatus({
      type: 'success',
      message: '🗑️ Đã xóa toàn bộ dữ liệu danh sách người dân trên thiết bị về danh sách trống thành công!'
    });
  };

  const handleLogoutWP = () => {
    clearWPAuth();
    setWpUser(null);
    setIsOfflineMode(false);
    setSyncStatus(null);
  };

  const handleSyncWP = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await saveBackupToWordPress({ customers, settings });
      const updatedVer = res?.updatedAt || new Date().toISOString();
      const updatedSettings: UserSettings = {
        ...settings,
        lastSyncedVersion: updatedVer,
      };
      setSettings(updatedSettings);
      localStorage.setItem('lws_settings', JSON.stringify(updatedSettings));

      setSyncStatus({ type: 'success', message: `Đã sao lưu đồng bộ toàn bộ cơ sở dữ liệu Sổ Thu lên WordPress thành công! (Phiên bản: ${updatedVer})` });
    } catch (err: any) {
      setSyncStatus({ type: 'error', message: err.message || 'Lỗi đồng bộ dữ liệu lên WordPress.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadBackupWP = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const backup = await getBackupFromWordPress();
      if (backup) {
        const updatedVer = backup.updatedAt || new Date().toISOString();
        if (backup.customers) {
          setCustomers(backup.customers);
          localStorage.setItem('lws_customers', JSON.stringify(backup.customers));
        }
        const mergedSettings: UserSettings = {
          ...settings,
          ...(backup.settings || {}),
          lastSyncedVersion: updatedVer,
        };
        setSettings(mergedSettings);
        localStorage.setItem('lws_settings', JSON.stringify(mergedSettings));

        setSyncStatus({ type: 'success', message: `Đã tải & khôi phục toàn bộ Sổ Thu từ WordPress Cloud thành công! (Phiên bản: ${updatedVer})` });
      } else {
        setSyncStatus({ type: 'error', message: 'Không tìm thấy bản sao lưu Sổ Thu nào trên tài khoản WordPress này.' });
      }
    } catch (err: any) {
      setSyncStatus({ type: 'error', message: err.message || 'Lỗi tải bản sao lưu từ WordPress.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadCloudVersion = async (backup: CloudBackupInfo) => {
    setIsSyncing(true);
    try {
      const updatedVer = backup.updatedAt || new Date().toISOString();
      const mergedSettings: UserSettings = {
        ...settings,
        ...(backup.settings || {}),
        lastSyncedVersion: updatedVer,
      };

      if (backup.customers) {
        setCustomers(backup.customers);
        localStorage.setItem('lws_customers', JSON.stringify(backup.customers));
      }
      setSettings(mergedSettings);
      localStorage.setItem('lws_settings', JSON.stringify(mergedSettings));

      setIsVersionModalOpen(false);
      setSyncStatus({
        type: 'success',
        message: `Đã khôi phục & đồng bộ phiên bản Sổ Thu mới nhất từ Cloud (${backup.customers?.length || 0} người dân, cập nhật ${updatedVer}) thành công!`
      });
    } catch (err: any) {
      setSyncStatus({ type: 'error', message: 'Lỗi khôi phục dữ liệu từ Cloud.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUploadLocalVersion = async () => {
    setIsSyncing(true);
    try {
      const res = await saveBackupToWordPress({ customers, settings });
      const updatedVer = res?.updatedAt || new Date().toISOString();
      const updatedSettings: UserSettings = {
        ...settings,
        lastSyncedVersion: updatedVer,
      };
      setSettings(updatedSettings);
      localStorage.setItem('lws_settings', JSON.stringify(updatedSettings));

      setIsVersionModalOpen(false);
      setSyncStatus({
        type: 'success',
        message: `Đã sao lưu ghi đè dữ liệu thiết bị hiện tại lên WordPress Cloud thành công! (Phiên bản: ${updatedVer})`
      });
    } catch (err: any) {
      setSyncStatus({ type: 'error', message: err.message || 'Lỗi ghi đè dữ liệu lên Cloud.' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 transition-colors duration-200">
      
      {/* View routing router */}
      {view === 'landing' ? (
        <LandingPage onEnterApp={() => {
          localStorage.setItem('lws_has_opened_book', 'true');
          setView('dashboard');
        }} />
      ) : (!wpUser && !isOfflineMode) ? (
        <WordPressAuth 
          onSuccess={(user) => {
            setWpUser(user);
            setSyncStatus({ type: 'success', message: `Chào mừng ${user.name || user.username}! Bạn đã đăng nhập thành công qua WordPress GraphQL.` });
            setTimeout(() => {
              checkCloudVersion(user);
            }, 800);
          }}
          onBypass={() => setIsOfflineMode(true)}
        />
      ) : (
        <Dashboard
          customers={customers}
          settings={settings}
          wpUser={wpUser}
          isSyncing={isSyncing}
          syncStatus={syncStatus}
          onLogoutWP={handleLogoutWP}
          onSyncWP={handleSyncWP}
          onLoadBackupWP={handleLoadBackupWP}
          onCheckCloudVersion={() => checkCloudVersion(undefined, true)}
          onClearSyncStatus={() => setSyncStatus(null)}
          onAddCustomer={handleSaveCustomer}
          onUpdateCustomer={handleSaveCustomer}
          onDeleteCustomer={handleDeleteCustomer}
          onBulkImport={handleBulkImport}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenImport={() => setIsImportOpen(true)}
          onOpenAddModal={() => setIsAddCustomerOpen(true)}
          onOpenEditModal={(cust) => setSelectedEditCustomer(cust)}
          onResetDemoData={handleResetDemoData}
          onGoBackLanding={() => setView('landing')}
          onOpenSEOShare={() => setIsSEOModalOpen(true)}
          currentPlan={currentPlan}
          onOpenPricing={() => setIsPricingOpen(true)}
        />
      )}

      {/* Pricing Modal Overlay */}
      {isPricingOpen && (
        <PricingModal
          currentPlan={currentPlan}
          onSelectPlan={handleSelectPlan}
          onClose={() => setIsPricingOpen(false)}
        />
      )}

      {/* SEO & Open Graph Share Modal */}
      {isSEOModalOpen && (
        <SEOShareModal
          agencyName={settings.agencyName}
          customerCount={customers.length}
          onClose={() => setIsSEOModalOpen(false)}
        />
      )}

      {/* Settings Modal Configurator */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
          onExportData={() => {
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
          }}
          onOpenImport={() => setIsImportOpen(true)}
          onOpenSEOShare={() => setIsSEOModalOpen(true)}
        />
      )}

      {/* Spreadsheet Import Simulator */}
      {isImportOpen && (
        <ImportExcelModal
          onImport={handleBulkImport}
          onClose={() => setIsImportOpen(false)}
        />
      )}

      {/* Add Customer Modal Overlay */}
      {isAddCustomerOpen && (
        <CustomerModal
          customers={customers}
          settings={settings}
          onSave={handleSaveCustomer}
          onClose={() => setIsAddCustomerOpen(false)}
        />
      )}

      {/* Modify/Inspect Customer Modal Overlay */}
      {selectedEditCustomer && (
        <CustomerModal
          customer={selectedEditCustomer}
          customers={customers}
          settings={settings}
          onSave={handleSaveCustomer}
          onClose={() => setSelectedEditCustomer(null)}
          onSwitchCustomer={(cust) => setSelectedEditCustomer(cust)}
          onDelete={handleDeleteCustomer}
        />
      )}

      {/* Cloud Backup Version Alert Modal */}
      {isVersionModalOpen && cloudBackupNotice && (
        <VersionSyncModal
          isOpen={isVersionModalOpen}
          onClose={() => setIsVersionModalOpen(false)}
          cloudBackup={cloudBackupNotice}
          localCustomers={customers}
          localSettings={settings}
          onDownloadCloud={handleDownloadCloudVersion}
          onUploadLocal={handleUploadLocalVersion}
          isSyncing={isSyncing}
        />
      )}

    </div>
  );
}
