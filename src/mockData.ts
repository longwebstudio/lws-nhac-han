/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, UserSettings } from './types';
import { DEFAULT_COMMISSION_MATRIX } from './lib/commission';

// Helper to calculate relative date string YYYY-MM-DD relative to today
export const getRelativeDateStr = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const INITIAL_SETTINGS: UserSettings = {
  agencyName: '',
  agentPhone: '',
  bhxhCommissionRate: 4.9, // 4.9%
  bhytCommissionRate: 2.64, // 2.64%
  commissionMatrix: DEFAULT_COMMISSION_MATRIX,
  smsTemplate: 'Kính gửi cô/chú [TEN_KHACH_HANG], thẻ BHYT của cô/chú sẽ hết hạn vào ngày [NGAY_HET_HAN]. Để tránh gián đoạn quyền lợi khám chữa bệnh (đặc biệt là hạn 5 năm liên tục), cô/chú vui lòng liên hệ NV thu [TEN_DAI_LY] ([SDT_DAI_LY]) để nộp tiền gia hạn nhé. Trân trọng!',
  zaloTemplate: '🔔 NHẮC GIA HẠN BẢO HIỂM Y TẾ (BHYT)\n\nKính gửi cô/chú *[TEN_KHACH_HANG]*,\n\nThẻ BHYT (Mã số: [MA_SO]) của Cô/Chú sắp hết hiệu lực vào ngày *[NGAY_HET_HAN]* (còn [SO_NGAY] ngày).\n\nCô/Chú vui lòng liên hệ Nhân viên thu *[TEN_DAI_LY]* qua số điện thoại *[SDT_DAI_LY]* để làm hồ sơ gia hạn sớm, tránh gián đoạn quyền lợi thẻ bảo hiểm y tế nhé.\n\nTrân trọng cảm ơn Cô/Chú!',
  smsTemplateBHXH: 'Kính gửi cô/chú [TEN_KHACH_HANG], sổ BHXH tự nguyện của cô/chú sẽ đến kỳ đóng phí vào ngày [NGAY_HET_HAN]. Để duy trì quá trình tích lũy thời gian hưởng lương hưu sau này, cô/chú vui lòng liên hệ NV thu [TEN_DAI_LY] ([SDT_DAI_LY]) để đóng tiếp nhé. Trân trọng!',
  zaloTemplateBHXH: '🔔 NHẮC ĐÓNG PHÍ BHXH TỰ NGUYỆN\n\nKính gửi cô/chú *[TEN_KHACH_HANG]*,\n\nSổ BHXH tự nguyện (Mã số: [MA_SO]) của Cô/Chú sắp đến kỳ đóng phí tiếp theo vào ngày *[NGAY_HET_HAN]* (còn [SO_NGAY] ngày).\n\nCô/Chú vui lòng liên hệ Nhân viên thu *[TEN_DAI_LY]* qua số điện thoại *[SDT_DAI_LY]* để nộp phí gia hạn đúng hạn, bảo đảm thời gian tích lũy lương hưu hưu trí.\n\nTrân trọng cảm ơn Cô/Chú!',
  baseSalaryBHYT: 2530000,
  povertyStandardBHXH: 1500000,
  supportOtherBHXH: 132000,
  autoBackupWordPress: false,
  lastAutoBackupDate: ''
};

export const INITIAL_CUSTOMERS: Customer[] = [];
