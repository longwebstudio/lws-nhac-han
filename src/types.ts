/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type InsuranceType = 'BHYT' | 'BHXH';

export interface PaymentHistory {
  id: string;
  paymentDate: string; // YYYY-MM-DD
  amountPaid: number;
  periodMonths: number; // e.g. 3, 6, 12 months
  commissionAmount: number;
  type?: InsuranceType; // 'BHYT' or 'BHXH'
  note?: string;
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
}
