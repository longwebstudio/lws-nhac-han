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
  commissionRate?: number; // Tỉ lệ hoa hồng (%) e.g. 3.1, 4.5
  category?: 'Tăng mới BHYT' | 'Gia hạn BHYT' | 'Tăng mới BHXH' | 'Gia hạn BHXH' | string; // Phân loại giao dịch
  type?: InsuranceType; // 'BHYT' or 'BHXH'
  note?: string;
  nguoiNop?: string;         // Người nộp
  trangThaiHoSoName?: string; // Trạng thái hồ sơ (đã ẩn)
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  cccd: string;
  insuranceCode: string; // Mã số BHYT (hoặc 10 số BHXH)
  insuranceCodeBHXH?: string; // Mã số BHXH
  hasBHYT?: boolean; // Có tham gia BHYT hay không (mặc định true)
  hasBHXH: boolean; // Có tham gia BHXH tự nguyện hay không
  expiryDate: string; // Hạn đóng BHYT (YYYY-MM-DD, luôn có)
  expiryDateBHXH?: string; // Hạn đóng BHXH (YYYY-MM-DD, chỉ có khi hasBHXH = true)
  createdAt: string; // YYYY-MM-DD
  notes?: string;
  status: 'active' | 'inactive';
  paymentHistory: PaymentHistory[];
  lastRemindedDate?: string; // YYYY-MM-DD
  lastRemindedChannel?: 'Zalo' | 'SMS' | 'Call';
  hinhThucNhac?: 'Zalo' | 'SMS' | 'Call'; // Tùy chọn nhắc nhở: Zalo, SMS, hoặc Gọi điện thoại
  lastRemindedType?: 'BHYT' | 'BHXH';
  birthday?: string; // Ngày sinh YYYY-MM-DD
  gender?: 'Nam' | 'Nữ'; // Giới tính
  address?: string; // Địa chỉ
}

export interface BHYTCommissionRules {
  tangMoi3M: number;  // 3 tháng
  tangMoi6M: number;  // 6 tháng
  tangMoi12M: number; // 12 tháng
  giaHan: number;     // Thường kỳ (gia hạn)
}

export interface BHXHCommissionRules {
  tangMoi1M: number;  // 1 tháng
  tangMoi3M: number;  // 3 tháng
  tangMoi6M: number;  // 6 tháng
  tangMoi12M: number; // 12 tháng
  giaHan: number;     // Thường kỳ (gia hạn)
}

export interface CommissionMatrix {
  bhyt: BHYTCommissionRules;
  bhxh: BHXHCommissionRules;
}

export interface UserSettings {
  agencyName: string;
  agentPhone: string;
  bhxhCommissionRate: number; // e.g. 4.9%
  bhytCommissionRate: number; // e.g. 2.64%
  commissionMatrix?: CommissionMatrix;
  smsTemplate: string; // SMS BHYT
  zaloTemplate: string; // Zalo BHYT
  smsTemplateBHXH?: string; // SMS BHXH
  zaloTemplateBHXH?: string; // Zalo BHXH
  baseSalaryBHYT?: number; // Mức lương cơ sở đóng BHYT (đ) - 2.530.000đ
  povertyStandardBHXH?: number; // Mức chuẩn hộ nghèo tham gia BHXH (đ)
  supportOtherBHXH?: number; // Mức hỗ trợ đối tượng khác (đ/tháng) - 132.000đ
  autoBackupWordPress?: boolean; // Tự động sao lưu lên WordPress hàng ngày
  lastAutoBackupDate?: string; // Ngày cuối cùng đã tự động sao lưu (YYYY-MM-DD)
}
