/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserSettings, CommissionMatrix } from '../types';
import { X, Save, AlertCircle, RotateCcw, Globe, Percent, Table, Sparkles, RefreshCcw, Download, Upload, Share2, FileSpreadsheet, HelpCircle, Database, Copy, Check, Code } from 'lucide-react';
import { INITIAL_SETTINGS } from '../mockData';
import { DEFAULT_COMMISSION_MATRIX } from '../lib/commission';
import { getStoredWordPressUrl, setStoredWordPressUrl, DEFAULT_ENDPOINT, WORDPRESS_PHP_CUSTOM_TABLE_CODE, WORDPRESS_SQL_CODE } from '../lib/graphql';

interface SettingsModalProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onClose: () => void;
  onExportData?: () => void;
  onOpenImport?: () => void;
  onOpenQuickGuide?: () => void;
  onOpenSEOShare?: () => void;
}

export default function SettingsModal({
  settings,
  onSave,
  onClose,
  onExportData,
  onOpenImport,
  onOpenQuickGuide,
  onOpenSEOShare
}: SettingsModalProps) {
  const [formData, setFormData] = useState<UserSettings>({
    ...settings,
    commissionMatrix: settings.commissionMatrix || DEFAULT_COMMISSION_MATRIX
  });
  const [wpGraphqlUrl, setWpGraphqlUrl] = useState(getStoredWordPressUrl());
  const [showWpCodeModal, setShowWpCodeModal] = useState(false);
  const [copiedType, setCopiedType] = useState<'php' | 'sql' | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleCopyCode = (text: string, type: 'php' | 'sql') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeCommissionTab, setActiveCommissionTab] = useState<'bhyt' | 'bhxh'>('bhyt');

  const currentMatrix = formData.commissionMatrix || DEFAULT_COMMISSION_MATRIX;

  const handleMatrixChange = (type: 'bhyt' | 'bhxh', field: string, value: string) => {
    const num = parseFloat(value) || 0;
    setFormData(prev => {
      const baseMatrix = prev.commissionMatrix || DEFAULT_COMMISSION_MATRIX;
      return {
        ...prev,
        commissionMatrix: {
          ...baseMatrix,
          [type]: {
            ...baseMatrix[type],
            [field]: num
          }
        }
      };
    });
  };

  const handleResetMatrix = () => {
    setFormData(prev => ({
      ...prev,
      commissionMatrix: { ...DEFAULT_COMMISSION_MATRIX }
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.currentTarget as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }
    const numericFields = [
      'bhxhCommissionRate', 
      'bhytCommissionRate', 
      'baseSalaryBHYT', 
      'povertyStandardBHXH', 
      'supportPoorBHXH', 
      'supportNearPoorBHXH', 
      'supportOtherBHXH'
    ];
    if (numericFields.includes(name)) {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleReset = () => {
    setFormData({ ...INITIAL_SETTINGS });
    setShowResetConfirm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredWordPressUrl(wpGraphqlUrl);
    onSave(formData);
    setSuccessMsg('Đã lưu cấu hình thành công!');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div 
        id="settings-modal-card"
        className="bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh] transition-transform duration-300 text-slate-100 my-auto"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-950 to-teal-900 border-b border-slate-850 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-semibold font-sans text-white">Cấu hình Hệ thống & Tin nhắn nháp</h3>
            <p className="text-xs text-emerald-400 mt-0.5">Tùy biến thông tin nhân viên thu và tỷ lệ hoa hồng của riêng bạn</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-0">
          {successMsg && (
            <div className="bg-emerald-950/50 border border-emerald-900 text-emerald-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              {successMsg}
            </div>
          )}

          {/* Quick Utilities / Menu Cài Đặt */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Tiện Ích & Thao Tác Nhanh (Menu Cài Đặt)</span>
              </h4>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                Menu Cài Đặt
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {onExportData && (
                <button
                  type="button"
                  onClick={() => {
                    onExportData();
                  }}
                  className="p-3 bg-slate-900 hover:bg-slate-850 text-emerald-300 border border-slate-800 hover:border-emerald-800/80 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer group text-left"
                  title="Tải file JSON sao lưu dự phòng về máy"
                >
                  <div className="p-1.5 bg-emerald-950 text-emerald-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-slate-200 group-hover:text-white leading-tight">Sao Lưu Dự Phòng</span>
                    <span className="block text-[9px] text-slate-400 font-normal mt-0.5">Tải file JSON sao lưu</span>
                  </div>
                </button>
              )}

              {onOpenImport && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenImport();
                  }}
                  className="p-3 bg-slate-900 hover:bg-slate-850 text-blue-300 border border-slate-800 hover:border-blue-800/80 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer group text-left"
                  title="Nhập dữ liệu danh sách người dân từ file Excel"
                >
                  <div className="p-1.5 bg-blue-950 text-blue-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-slate-200 group-hover:text-white leading-tight">Nhập Từ Excel</span>
                    <span className="block text-[9px] text-slate-400 font-normal mt-0.5">Nạp dữ liệu từ file Excel</span>
                  </div>
                </button>
              )}

              {onOpenQuickGuide && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQuickGuide();
                  }}
                  className="p-3 bg-slate-900 hover:bg-slate-850 text-amber-300 border border-slate-800 hover:border-amber-800/80 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer group text-left"
                  title="Xem hướng dẫn sử dụng nhanh 3 bước"
                >
                  <div className="p-1.5 bg-amber-950 text-amber-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-slate-200 group-hover:text-white leading-tight">Hướng Dẫn 3 Bước</span>
                    <span className="block text-[9px] text-slate-400 font-normal mt-0.5">Quy trình sử dụng</span>
                  </div>
                </button>
              )}

              {onOpenSEOShare && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSEOShare();
                  }}
                  className="p-3 bg-slate-900 hover:bg-slate-850 text-indigo-300 border border-slate-800 hover:border-indigo-800/80 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer group text-left col-span-2 sm:col-span-1"
                  title="Tối ưu SEO & Xem trước thẻ chia sẻ Open Graph"
                >
                  <div className="p-1.5 bg-indigo-950 text-indigo-400 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-slate-200 group-hover:text-white leading-tight">SEO & Chia Sẻ</span>
                    <span className="block text-[9px] text-slate-400 font-normal mt-0.5">Thẻ chia sẻ Zalo & FB</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Agency Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white border-l-4 border-emerald-500 pl-2">Thông Tin Nhân Viên Thu Của Bạn</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tên Nhân viên thu / Điểm thu *</label>
                <input
                  type="text"
                  name="agencyName"
                  value={formData.agencyName}
                  onChange={handleChange}
                  required
                  placeholder="Ví dụ: Nhân viên thu BHXH, BHYT Lỗ Văn Long"
                  className="w-full text-sm px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-slate-950 transition-all text-white placeholder-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Số điện thoại hỗ trợ khách hàng *</label>
                <input
                  type="text"
                  name="agentPhone"
                  value={formData.agentPhone}
                  onChange={handleChange}
                  required
                  placeholder="Ví dụ: 0987xxxxxx"
                  className="w-full text-sm px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-slate-950 transition-all text-white placeholder-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Detailed Commission Matrix Table Configuration */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-l-4 border-teal-500 pl-2">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-teal-400" />
                  <span>Cấu Hình Bảng Tỷ Lệ Hoa Hồng Thu Hộ (%)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Biểu tỷ lệ thù lao tự động theo Hợp đồng Đại lý thu BHXH, BHYT của bạn.</p>
              </div>
              <button
                type="button"
                onClick={handleResetMatrix}
                className="text-[11px] font-bold text-teal-400 hover:text-teal-300 bg-slate-950 hover:bg-slate-900 border border-teal-900/80 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                title="Khôi phục về bảng tỷ lệ hợp đồng chuẩn BHXH Việt Nam"
              >
                <RefreshCcw className="w-3 h-3" />
                <span>Khôi phục bảng chuẩn</span>
              </button>
            </div>

            {/* Fallback Rates Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tỷ lệ hoa hồng BHYT mặc định / dự phòng (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    name="bhytCommissionRate"
                    value={formData.bhytCommissionRate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-teal-500 text-white font-mono"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-xs font-bold">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tỷ lệ hoa hồng BHXH mặc định / dự phòng (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    name="bhxhCommissionRate"
                    value={formData.bhxhCommissionRate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-teal-500 text-white font-mono"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-xs font-bold">%</span>
                </div>
              </div>
            </div>

            {/* Matrix Tab Switcher */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-850 space-y-3">
              <div className="flex gap-2 border-b border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveCommissionTab('bhyt')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeCommissionTab === 'bhyt'
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1. Bảng BHYT Hộ Gia Đình</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCommissionTab('bhxh')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeCommissionTab === 'bhxh'
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>2. Bảng BHXH Tự Nguyện</span>
                </button>
              </div>

              {/* BHYT Table */}
              {activeCommissionTab === 'bhyt' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="text-[11px] text-teal-300/90 font-medium flex items-center gap-1">
                    <span>💡 Tỷ lệ thù lao BHYT hộ gia đình theo từng chu kỳ đóng và phân loại giao dịch:</span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="px-3 py-2">Phân Loại Khai Thác</th>
                          <th className="px-3 py-2">Phương Thức Đóng</th>
                          <th className="px-3 py-2 text-right">Tỷ Lệ Hoa Hồng (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 bg-slate-950/60 font-mono">
                        <tr>
                          <td className="px-3 py-2 text-emerald-400 font-sans font-semibold">Tăng mới BHYT</td>
                          <td className="px-3 py-2 text-slate-400 font-sans">03 Tháng</td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={currentMatrix.bhyt.tangMoi3M}
                                onChange={(e) => handleMatrixChange('bhyt', 'tangMoi3M', e.target.value)}
                                className="w-20 text-xs px-2 py-1 bg-slate-900 border border-slate-800 rounded text-right text-emerald-400 font-bold focus:border-teal-500"
                              />
                              <span className="text-slate-500 text-xs">%</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-emerald-400 font-sans font-semibold">Tăng mới BHYT</td>
                          <td className="px-3 py-2 text-slate-400 font-sans">06 Tháng</td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={currentMatrix.bhyt.tangMoi6M}
                                onChange={(e) => handleMatrixChange('bhyt', 'tangMoi6M', e.target.value)}
                                className="w-20 text-xs px-2 py-1 bg-slate-900 border border-slate-800 rounded text-right text-emerald-400 font-bold focus:border-teal-500"
                              />
                              <span className="text-slate-500 text-xs">%</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-emerald-400 font-sans font-semibold">Tăng mới BHYT</td>
                          <td className="px-3 py-2 text-slate-400 font-sans">12 Tháng</td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={currentMatrix.bhyt.tangMoi12M}
                                onChange={(e) => handleMatrixChange('bhyt', 'tangMoi12M', e.target.value)}
                                className="w-20 text-xs px-2 py-1 bg-slate-900 border border-slate-800 rounded text-right text-emerald-400 font-bold focus:border-teal-500"
                              />
                              <span className="text-slate-500 text-xs">%</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-teal-300 font-sans font-semibold">Gia hạn / Thường kỳ</td>
                          <td className="px-3 py-2 text-slate-400 font-sans">Tất cả chu kỳ (3, 6, 12 tháng)</td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={currentMatrix.bhyt.giaHan}
                                onChange={(e) => handleMatrixChange('bhyt', 'giaHan', e.target.value)}
                                className="w-20 text-xs px-2 py-1 bg-slate-900 border border-slate-800 rounded text-right text-teal-300 font-bold focus:border-teal-500"
                              />
                              <span className="text-slate-500 text-xs">%</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* BHXH Table */}
              {activeCommissionTab === 'bhxh' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="text-[11px] text-indigo-300/90 font-medium flex items-center gap-1">
                    <span>💡 Tỷ lệ thù lao BHXH Tự nguyện theo phương thức đóng hàng tháng, 3, 6, 12 tháng:</span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="px-3 py-2">Phân Loại Khai Thác</th>
                          <th className="px-3 py-2">Phương Thức Đóng</th>
                          <th className="px-3 py-2 text-right">Tỷ Lệ Hoa Hồng (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 bg-slate-950/60 font-mono">
                        <tr>
                          <td className="px-3 py-2 text-indigo-400 font-sans font-semibold">Tăng mới BHXH</td>
                          <td className="px-3 py-2 text-slate-400 font-sans">01 Tháng (Hằng tháng)</td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={currentMatrix.bhxh.tangMoi1M}
                                onChange={(e) => handleMatrixChange('bhxh', 'tangMoi1M', e.target.value)}
                                className="w-20 text-xs px-2 py-1 bg-slate-900 border border-slate-800 rounded text-right text-indigo-400 font-bold focus:border-indigo-500"
                              />
                              <span className="text-slate-500 text-xs">%</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-indigo-400 font-sans font-semibold">Tăng mới BHXH</td>
                          <td className="px-3 py-2 text-slate-400 font-sans">03 Tháng</td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={currentMatrix.bhxh.tangMoi3M}
                                onChange={(e) => handleMatrixChange('bhxh', 'tangMoi3M', e.target.value)}
                                className="w-20 text-xs px-2 py-1 bg-slate-900 border border-slate-800 rounded text-right text-indigo-400 font-bold focus:border-indigo-500"
                              />
                              <span className="text-slate-500 text-xs">%</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-indigo-400 font-sans font-semibold">Tăng mới BHXH</td>
                          <td className="px-3 py-2 text-slate-400 font-sans">06 Tháng</td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={currentMatrix.bhxh.tangMoi6M}
                                onChange={(e) => handleMatrixChange('bhxh', 'tangMoi6M', e.target.value)}
                                className="w-20 text-xs px-2 py-1 bg-slate-900 border border-slate-800 rounded text-right text-indigo-400 font-bold focus:border-indigo-500"
                              />
                              <span className="text-slate-500 text-xs">%</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-indigo-400 font-sans font-semibold">Tăng mới BHXH</td>
                          <td className="px-3 py-2 text-slate-400 font-sans">12 Tháng</td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={currentMatrix.bhxh.tangMoi12M}
                                onChange={(e) => handleMatrixChange('bhxh', 'tangMoi12M', e.target.value)}
                                className="w-20 text-xs px-2 py-1 bg-slate-900 border border-slate-800 rounded text-right text-indigo-400 font-bold focus:border-indigo-500"
                              />
                              <span className="text-slate-500 text-xs">%</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-indigo-300 font-sans font-semibold">Gia hạn / Thường kỳ</td>
                          <td className="px-3 py-2 text-slate-400 font-sans">Tất cả chu kỳ (1, 3, 6, 12 tháng)</td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={currentMatrix.bhxh.giaHan}
                                onChange={(e) => handleMatrixChange('bhxh', 'giaHan', e.target.value)}
                                className="w-20 text-xs px-2 py-1 bg-slate-900 border border-slate-800 rounded text-right text-indigo-300 font-bold focus:border-indigo-500"
                              />
                              <span className="text-slate-500 text-xs">%</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Automatic Daily Backup Option & WPGraphQL Server Config */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-white border-l-4 border-indigo-500 pl-2 flex items-center justify-between">
              <span>Sao Lưu Dữ Liệu & Máy Chủ WordPress</span>
            </h4>
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-4">
              <label id="auto-backup-checkbox" className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="autoBackupWordPress"
                  checked={!!formData.autoBackupWordPress}
                  onChange={handleChange}
                  className="mt-1 accent-indigo-500 rounded border-slate-800 bg-slate-950 text-indigo-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white">Tự động sao lưu dữ liệu lên WordPress hàng ngày</span>
                  <p className="text-xs text-slate-400">
                    Khi kích hoạt và đã đăng nhập tài khoản WordPress, ứng dụng sẽ tự động sao lưu đồng bộ dữ liệu lên cloud định kỳ mỗi ngày một lần khi bạn truy cập. Tránh rủi ro bị mất dữ liệu thiết bị.
                  </p>
                  <p className="text-[11px] text-amber-400 font-medium mt-1 flex items-center gap-1">
                    <span>💡</span> <strong>Lưu ý:</strong> Nếu dùng nhiều thiết bị thì tắt tự động này.
                  </p>
                </div>
              </label>
              
              {formData.lastAutoBackupDate && (
                <div className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded w-fit italic font-mono">
                  ● Lần tự động sao lưu gần nhất: {formData.lastAutoBackupDate}
                </div>
              )}

              <div className="pt-3 border-t border-slate-850 space-y-2">
                <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  Địa chỉ máy chủ WordPress GraphQL (Endpoint):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={wpGraphqlUrl}
                    onChange={(e) => setWpGraphqlUrl(e.target.value)}
                    placeholder={DEFAULT_ENDPOINT}
                    className="flex-1 text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-white font-mono"
                  />
                  {wpGraphqlUrl !== DEFAULT_ENDPOINT && (
                    <button
                      type="button"
                      onClick={() => setWpGraphqlUrl(DEFAULT_ENDPOINT)}
                      className="px-3 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-slate-950 border border-indigo-900/60 rounded-lg hover:bg-slate-900 transition-colors font-medium cursor-pointer shrink-0"
                      title="Đặt lại đường dẫn mặc định"
                    >
                      Mặc định
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Cấu hình URL kết nối WPGraphQL của máy chủ WordPress. Bạn có thể sử dụng máy chủ WordPress riêng hoặc dùng mặc định: <code className="text-emerald-400 font-mono break-all">{DEFAULT_ENDPOINT}</code>
                </p>
              </div>

              {/* WordPress Custom Table wp_lws_so_thu Info & Code Drawer */}
              <div className="pt-3 border-t border-slate-850 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300">Cấu hình Bảng Riêng WordPress (wp_lws_so_thu) & WPGraphQL</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWpCodeModal(!showWpCodeModal)}
                    className="px-2.5 py-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>{showWpCodeModal ? 'Ẩn mã Nguồn Plugin' : 'Xem Code Plugin & SQL'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Ứng dụng hỗ trợ tự động lưu dữ liệu bản online trực tiếp vào bảng MySQL riêng <code className="text-emerald-400 font-mono font-semibold">wp_lws_so_thu</code> (Mỗi user sở hữu 1 Sổ thu chứa danh sách khách hàng & cấu hình) thông qua WPGraphQL Mutation <code className="text-emerald-400 font-mono">saveLwsSoThuBackup</code>.
                </p>

                {showWpCodeModal && (
                  <div className="mt-3 p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5 text-amber-400" />
                          1. Mã PHP Plugin WordPress (Dành cho WPGraphQL)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(WORDPRESS_PHP_CUSTOM_TABLE_CODE, 'php')}
                          className="px-2.5 py-1 text-[10px] font-bold bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800/60 rounded flex items-center gap-1 cursor-pointer"
                        >
                          {copiedType === 'php' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedType === 'php' ? 'Đã Sao Chép!' : 'Sao Chép PHP'}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Sao chép đoạn mã bên dưới lưu thành file <code className="text-amber-300 font-mono">lws-so-thu.php</code> thả vào thư mục <code className="text-amber-300 font-mono">wp-content/plugins/lws-so-thu/</code> trên máy chủ WordPress và Kích hoạt plugin.
                      </p>
                      <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-emerald-400 max-h-48 overflow-y-auto whitespace-pre-wrap select-all">
                        {WORDPRESS_PHP_CUSTOM_TABLE_CODE}
                      </pre>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-300 flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-sky-400" />
                          2. Cấu Trúc Bảng MySQL (wp_lws_so_thu)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(WORDPRESS_SQL_CODE, 'sql')}
                          className="px-2.5 py-1 text-[10px] font-bold bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800/60 rounded flex items-center gap-1 cursor-pointer"
                        >
                          {copiedType === 'sql' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedType === 'sql' ? 'Đã Sao Chép!' : 'Sao Chép SQL'}</span>
                        </button>
                      </div>
                      <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-sky-300 max-h-32 overflow-y-auto whitespace-pre-wrap select-all">
                        {WORDPRESS_SQL_CODE}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Premium Pricing Standards & Government Support */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-white border-l-4 border-emerald-500 pl-2">Đinh Mức Đóng Bảo Hiểm & Hỗ Trợ Từ Nhà Nước</h4>
            <p className="text-xs text-slate-400">Thiết lập các mức định mức phục vụ cho tính toán phí thu BHYT hộ gia đình và BHXH tự nguyện.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
              {/* Định mức lương và chuẩn nghèo */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-emerald-400 block border-b border-slate-800 pb-1.5 uppercase tracking-wide">1. Định mức nền tảng</span>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Mức lương cơ sở đóng BHYT (đ)</label>
                  <input
                    type="number"
                    name="baseSalaryBHYT"
                    value={formData.baseSalaryBHYT || 2530000}
                    onChange={handleChange}
                    min="0"
                    className="w-full text-sm px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 text-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Mức lương cơ sở quy định: 2,530,000 đ</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Mức chuẩn hộ nghèo tham gia BHXH (đ)</label>
                  <input
                    type="number"
                    name="povertyStandardBHXH"
                    value={formData.povertyStandardBHXH || 1500000}
                    onChange={handleChange}
                    min="0"
                    className="w-full text-sm px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 text-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Chuẩn hộ nghèo khu vực nông thôn: 1,500,000 đ</span>
                </div>
              </div>

              {/* Mức hỗ trợ BHXH hàng tháng */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-indigo-400 block border-b border-slate-800 pb-1.5 uppercase tracking-wide">2. Mức hỗ trợ đóng BHXH (đ/tháng)</span>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Đối tượng khác hỗ trợ (đ/tháng)</label>
                  <input
                    type="number"
                    name="supportOtherBHXH"
                    value={formData.supportOtherBHXH || 132000}
                    onChange={handleChange}
                    min="0"
                    className="w-full text-sm px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Mức hỗ trợ đối tượng khác: 132,000 đ/tháng</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-850 text-[11px] text-slate-400 leading-relaxed">
                  💡 <em>Lưu ý: Đối tượng Hộ nghèo và Hộ cận nghèo không được quản lý bởi nhân viên thu nên đã được lược bỏ khỏi cấu hình.</em>
                </div>
              </div>
            </div>
          </div>

          {/* Message Templates */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-white border-l-4 border-cyan-500 pl-2">Thiết Lập Mẫu Tin Nhắn Nhắc Nợ</h4>
            <div className="bg-amber-955/30 rounded-xl p-3 border border-amber-900/60 text-xs text-amber-300 space-y-1">
              <span className="font-semibold flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-amber-500" /> Các từ khóa tự động thay thế:</span>
              <p className="pl-5 leading-relaxed">
                <code className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 font-mono text-emerald-400 text-[10px] inline-block mb-1">[TEN_KHACH_HANG]</code> : Tên người dân | <code className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 font-mono text-emerald-400 text-[10px] inline-block mb-1">[LOAI_BAO_HIEM]</code> : BHYT hoặc BHXH <br />
                <code className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 font-mono text-emerald-400 text-[10px] inline-block mb-1">[NGAY_HET_HAN]</code> : Ngày đến hạn đóng | <code className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 font-mono text-emerald-400 text-[10px] inline-block mb-1">[SO_NGAY]</code> : Số ngày còn lại <br />
                <code className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 font-mono text-emerald-400 text-[10px] inline-block mb-1">[MA_SO]</code> : Mã số thẻ | <code className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 font-mono text-emerald-400 text-[10px] inline-block mb-1">[TEN_DAI_LY]</code> : Tên đại lý | <code className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 font-mono text-emerald-400 text-[10px] inline-block mb-1">[SDT_DAI_LY]</code> : Số ĐT đại lý
              </p>
            </div>

            <div className="space-y-4">
              {/* BHYT Template box */}
              <div className="space-y-3 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">1. Nhắc gia hạn Bảo hiểm Y tế (BHYT)</span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Mẫu tin nhắn SMS (BHYT)</label>
                  <textarea
                    name="smsTemplate"
                    value={formData.smsTemplate}
                    onChange={handleChange}
                    rows={3}
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 text-slate-200 leading-relaxed"
                    placeholder="SMS BHYT..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Mẫu tin nhắn Zalo (BHYT)</label>
                  <textarea
                    name="zaloTemplate"
                    value={formData.zaloTemplate}
                    onChange={handleChange}
                    rows={3}
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 text-slate-200 leading-relaxed"
                    placeholder="Zalo BHYT..."
                  />
                </div>
              </div>

              {/* BHXH Template box */}
              <div className="space-y-3 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">2. Nhắc đóng phí BHXH Tự nguyện</span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Mẫu tin nhắn SMS (BHXH)</label>
                  <textarea
                    name="smsTemplateBHXH"
                    value={formData.smsTemplateBHXH || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-200 leading-relaxed"
                    placeholder="SMS BHXH..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Mẫu tin nhắn Zalo (BHXH)</label>
                  <textarea
                    name="zaloTemplateBHXH"
                    value={formData.zaloTemplateBHXH || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-200 leading-relaxed"
                    placeholder="Zalo BHXH..."
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-950/40 border-t border-slate-850 flex items-center justify-between shrink-0">
          {showResetConfirm ? (
            <div className="flex items-center gap-1.5 bg-rose-950/60 border border-slate-800 rounded-lg p-1 animate-fade-in text-slate-300">
              <span className="text-[10px] text-white font-bold px-1.5">Khôi phục?</span>
              <button
                type="button"
                onClick={handleReset}
                className="text-[10px] font-black text-white bg-rose-600 hover:bg-rose-500 px-2.5 py-1 rounded cursor-pointer transition-colors"
              >
                Đồng ý
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="text-[10px] font-semibold text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
              >
                Hủy
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-900 px-3 py-2 rounded-lg transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Khôi phục mặc định
            </button>
          )}
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-slate-300 bg-slate-950 border border-slate-800 hover:bg-slate-900 hover:text-white px-4 py-2 rounded-lg transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg transition-all cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
