/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserSettings } from '../types';
import { X, Save, AlertCircle, RotateCcw } from 'lucide-react';
import { INITIAL_SETTINGS } from '../mockData';

interface SettingsModalProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onClose: () => void;
}

export default function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [formData, setFormData] = useState<UserSettings>({ ...settings });
  const [successMsg, setSuccessMsg] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'bhxhCommissionRate' || name === 'bhytCommissionRate') {
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
    onSave(formData);
    setSuccessMsg('Đã lưu cấu hình thành công!');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div 
        id="settings-modal-card"
        className="bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh] transition-transform duration-300 text-slate-100"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 to-teal-900 border-b border-slate-850 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold font-sans text-white">Cấu hình Hệ thống & Tin nhắn nháp</h3>
            <p className="text-xs text-emerald-400 mt-0.5">Tùy biến thương hiệu đại lý và tỷ lệ hoa học của riêng bạn</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {successMsg && (
            <div className="bg-emerald-950/50 border border-emerald-900 text-emerald-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              {successMsg}
            </div>
          )}

          {/* Agency Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white border-l-4 border-emerald-500 pl-2">Thông Tin Đại Lý Của Bạn</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tên Đại lý / Điểm thu *</label>
                <input
                  type="text"
                  name="agencyName"
                  value={formData.agencyName}
                  onChange={handleChange}
                  required
                  placeholder="Ví dụ: Đại lý BHXH Xã An Bình"
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

          {/* Commission Configuration */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-white border-l-4 border-teal-500 pl-2">Tỷ Lệ Hoa Hồng Thu Hộ (%)</h4>
            <p className="text-xs text-slate-400">Ước tính hoa hồng nhận được dựa trên tổng số tiền người dân đóng.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tỷ lệ hoa hồng BHYT (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    name="bhytCommissionRate"
                    value={formData.bhytCommissionRate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full text-sm px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-teal-500 focus:bg-slate-950 pr-8 transition-all text-white"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-500 text-sm font-medium">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tỷ lệ hoa hồng BHXH (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    name="bhxhCommissionRate"
                    value={formData.bhxhCommissionRate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full text-sm px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-teal-500 focus:bg-slate-950 pr-8 transition-all text-white"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-500 text-sm font-medium">%</span>
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
        <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-850 flex items-center justify-between">
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
