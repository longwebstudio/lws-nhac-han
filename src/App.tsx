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
        if (parsed.agencyName === 'Bảo Hiểm An Bình - Đại Lý Long Web Studio' || parsed.agentPhone === '0987654321') {
          const updated = {
            ...parsed,
            agencyName: INITIAL_SETTINGS.agencyName,
            agentPhone: INITIAL_SETTINGS.agentPhone
          };
          setSettings(updated);
          localStorage.setItem('lws_settings', JSON.stringify(updated));
        } else {
          setSettings(parsed);
        }
      } else {
        setSettings(INITIAL_SETTINGS);
        localStorage.setItem('lws_settings', JSON.stringify(INITIAL_SETTINGS));
      }
    } catch (e) {
      console.error('Error loading data from local storage:', e);
    }
  }, []);

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
    
    newCustomers.forEach(newCust => {
      const matchIndex = updated.findIndex(c => {
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
        
        // Append history without duplicates
        const updatedHistory = [...(existing.paymentHistory || [])];
        if (newCust.paymentHistory && newCust.paymentHistory.length > 0) {
          newCust.paymentHistory.forEach(newPay => {
            const isDup = updatedHistory.some(oldPay => 
              oldPay.paymentDate === newPay.paymentDate && 
              Math.abs(oldPay.amountPaid - newPay.amountPaid) < 1 // check if same amount & date
            );
            if (!isDup) {
              updatedHistory.unshift(newPay); // Prepend new payments
            }
          });
        }

        // Sort paymentHistory descending by date
        updatedHistory.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

        // Update expiry dates
        let mergedExpiryDate = existing.expiryDate;
        let mergedExpiryDateBHXH = existing.expiryDateBHXH;
        
        if (newCust.expiryDate && newCust.expiryDate > existing.expiryDate) {
          mergedExpiryDate = newCust.expiryDate;
        }
        if (newCust.expiryDateBHXH) {
          if (!existing.expiryDateBHXH || newCust.expiryDateBHXH > existing.expiryDateBHXH) {
            mergedExpiryDateBHXH = newCust.expiryDateBHXH;
          }
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
