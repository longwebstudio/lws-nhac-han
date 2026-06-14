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
import { 
  getStoredWPUser, 
  clearWPAuth, 
  saveBackupToWordPress, 
  getBackupFromWordPress, 
  WPUser 
} from './lib/graphql';

export default function App() {
  // core reactive states
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);

  // WordPress backend alignment states
  const [wpUser, setWpUser] = useState<WPUser | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // modal visibility states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedEditCustomer, setSelectedEditCustomer] = useState<Customer | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // load state from LocalStorage on mount
  useEffect(() => {
    // Check if WordPress user is logged in
    const storedUser = getStoredWPUser();
    if (storedUser) {
      setWpUser(storedUser);
    }

    try {
      const storedCustomers = localStorage.getItem('lws_customers');
      if (storedCustomers) {
        setCustomers(JSON.parse(storedCustomers));
      } else {
        // Init with default realistic Vietnamese profiles
        setCustomers(INITIAL_CUSTOMERS);
        localStorage.setItem('lws_customers', JSON.stringify(INITIAL_CUSTOMERS));
      }

      const storedSettings = localStorage.getItem('lws_settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        // Migrate old default settings to current request
        const merged = {
          baseSalaryBHYT: INITIAL_SETTINGS.baseSalaryBHYT,
          povertyStandardBHXH: INITIAL_SETTINGS.povertyStandardBHXH,
          supportPoorBHXH: INITIAL_SETTINGS.supportPoorBHXH,
          supportNearPoorBHXH: INITIAL_SETTINGS.supportNearPoorBHXH,
          supportOtherBHXH: INITIAL_SETTINGS.supportOtherBHXH,
          autoBackupWordPress: INITIAL_SETTINGS.autoBackupWordPress,
          lastAutoBackupDate: INITIAL_SETTINGS.lastAutoBackupDate,
          ...parsed
        };
        if (parsed.agencyName === 'Bảo Hiểm An Bình - Đại Lý Long Web Studio' || parsed.agentPhone === '0987654321') {
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
  };

  const handleSaveSettings = (updatedSettings: UserSettings) => {
    setSettings(updatedSettings);
    localStorage.setItem('lws_settings', JSON.stringify(updatedSettings));
  };

  // customer actions
  const handleSaveCustomer = (customer: Customer, parallelCustomer?: Customer) => {
    let updated = [...customers];
    
    // Save/update first customer
    const exists1 = updated.some(c => c.id === customer.id);
    if (exists1) {
      updated = updated.map(c => c.id === customer.id ? customer : c);
    } else {
      updated = [customer, ...updated];
    }
    
    // Save/update parallel customer if provided
    if (parallelCustomer) {
      const exists2 = updated.some(c => c.id === parallelCustomer.id);
      if (exists2) {
        updated = updated.map(c => c.id === parallelCustomer.id ? parallelCustomer : c);
      } else {
        updated = [parallelCustomer, ...updated];
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

        // Update expiry dates (Do not overwrite existing non-empty expiry dates during import)
        let mergedExpiryDate = existing.expiryDate;
        let mergedExpiryDateBHXH = existing.expiryDateBHXH;
        
        if (!mergedExpiryDate && newCust.expiryDate) {
          mergedExpiryDate = newCust.expiryDate;
        }
        if (!mergedExpiryDateBHXH && newCust.expiryDateBHXH) {
          mergedExpiryDateBHXH = newCust.expiryDateBHXH;
        }

        updated[matchIndex] = {
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
    setCustomers(INITIAL_CUSTOMERS);
    setSettings(INITIAL_SETTINGS);
    localStorage.setItem('lws_customers', JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem('lws_settings', JSON.stringify(INITIAL_SETTINGS));
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
      await saveBackupToWordPress({ customers, settings });
      setSyncStatus({ type: 'success', message: 'Đã sao lưu đồng bộ toàn bộ cơ sở dữ liệu lên WordPress thành công!' });
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
        if (backup.customers) {
          setCustomers(backup.customers);
          localStorage.setItem('lws_customers', JSON.stringify(backup.customers));
        }
        if (backup.settings) {
          setSettings(backup.settings);
          localStorage.setItem('lws_settings', JSON.stringify(backup.settings));
        }
        setSyncStatus({ type: 'success', message: 'Đã tải & khôi phục toàn bộ dữ liệu từ WordPress Cloud thành công!' });
      } else {
        setSyncStatus({ type: 'error', message: 'Không tìm thấy bản sao lưu nào của Lws Nhắc Hạn trên tài khoản WordPress này.' });
      }
    } catch (err: any) {
      setSyncStatus({ type: 'error', message: err.message || 'Lỗi tải bản sao lưu từ WordPress.' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 transition-colors duration-200">
      
      {/* View routing router */}
      {view === 'landing' ? (
        <LandingPage onEnterApp={() => setView('dashboard')} />
      ) : (!wpUser && !isOfflineMode) ? (
        <WordPressAuth 
          onSuccess={(user) => {
            setWpUser(user);
            setSyncStatus({ type: 'success', message: `Chào mừng ${user.name || user.username}! Bạn đã đăng nhập thành công qua WordPress GraphQL.` });
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
        />
      )}

      {/* Settings Modal Configurator */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
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

    </div>
  );
}
