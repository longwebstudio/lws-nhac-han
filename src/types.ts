/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type InsuranceType = 'BHYT' | 'BHXH';

export interface PaymentHistory {
  id: string;
  bienLaiId?: number;  // ID biên lai từ JSON
  paymentDate: string; // YYYY-MM-DD
  amountPaid: number;
  periodMonths: number; // e.g. 3, 6, 12 months
  commissionAmount: number;
  type?: InsuranceType; // 'BHYT' or 'BHXH'
  note?: string;
  nguoiNop?: string;         // Người nộp
  trangThaiHoSoName?: string; // Trạng thái hồ sơ
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  cccd: string;
  insuranceCode: string; // Mã số BHYT (luôn có)
  insuranceCodeBHXH?: string; // Mã số BHXH (chỉ có khi tham gia BHXH)
  hasBHXH: boolean; // Có tham gia BHXH tự nguyện hay không
  expiryDate: string; // Hạn đóng BHYT (YYYY-MM-DD, luôn có)
  expiryDateBHXH?: string; // Hạn đóng BHXH (YYYY-MM-DD, chỉ có khi hasBHXH = true)
  createdAt: string; // YYYY-MM-DD
  notes?: string;
  status: 'active' | 'inactive';
  paymentHistory: PaymentHistory[];
  lastRemindedDate?: string; // YYYY-MM-DD
  lastRemindedChannel?: 'Zalo' | 'SMS';
  lastRemindedType?: 'BHYT' | 'BHXH';
  birthday?: string; // Ngày sinh YYYY-MM-DD
  gender?: 'Nam' | 'Nữ'; // Giới tính
  address?: string; // Địa chỉ
}

export interface UserSettings {
  agencyName: string;
  agentPhone: string;
  bhxhCommissionRate: number; // e.g. 4.5%
  bhytCommissionRate: number; // e.g. 3.1%
  smsTemplate: string; // SMS BHYT
  zaloTemplate: string; // Zalo BHYT
  smsTemplateBHXH?: string; // SMS BHXH
  zaloTemplateBHXH?: string; // Zalo BHXH
  baseSalaryBHYT?: number; // Mức lương cơ sở đóng BHYT (đ)
  povertyStandardBHXH?: number; // Mức chuẩn hộ nghèo tham gia BHXH (đ)
  supportPoorBHXH?: number; // Mức hỗ trợ hộ nghèo (đ/tháng)
  supportNearPoorBHXH?: number; // Mức hỗ trợ hộ cận nghèo (đ/tháng)
  supportOtherBHXH?: number; // Mức hỗ trợ đối tượng khác (đ/tháng)
  autoBackupWordPress?: boolean; // Tự động sao lưu lên WordPress hàng ngày
  lastAutoBackupDate?: string; // Ngày cuối cùng đã tự động sao lưu (YYYY-MM-DD)
}
