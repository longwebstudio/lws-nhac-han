/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, UserSettings } from './types';
import { DEFAULT_COMMISSION_MATRIX } from './lib/commission';

// Anchor date: 2026-06-12
export const INITIAL_SETTINGS: UserSettings = {
  agencyName: 'Lỗ Văn Long',
  agentPhone: '0374638603',
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
  autoBackupWordPress: true,
  lastAutoBackupDate: ''
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Nguyễn Văn Hùng',
    phone: '0912345678',
    cccd: '001085002931',
    insuranceCode: 'DK9721389211',
    hasBHYT: true,
    hasBHXH: false,
    expiryDate: '2026-06-15', // Expires in 3 days (relative to 2026-06-12)
    createdAt: '2025-06-15',
    notes: 'Khách hàng đóng tiền qua chuyển khoản thường kỳ. Có bệnh nền cần bảo hiểm liên tục.',
    status: 'active',
    birthday: '1975-04-12',
    gender: 'Nam',
    hinhThucNhac: 'Zalo',
    paymentHistory: [
      {
        id: 'pay-1-1',
        paymentDate: '2025-06-15',
        amountPaid: 972000,
        periodMonths: 12,
        commissionRate: 3.02,
        commissionAmount: 29354,
        type: 'BHYT',
        note: 'Gia hạn BHYT hộ gia đình 1 năm.'
      }
    ]
  },
  {
    id: 'cust-2',
    name: 'Phạm Thị Mai',
    phone: '0981122334',
    cccd: '038190002141',
    insuranceCode: 'GD0192849102',
    hasBHYT: true,
    hasBHXH: false,
    expiryDate: '2026-06-19', // Expires in 7 days (relative to 2026-06-12)
    createdAt: '2025-12-19',
    notes: 'Liên hệ qua con gái tên Hương để đóng tiền.',
    status: 'active',
    birthday: '1982-11-23',
    gender: 'Nữ',
    hinhThucNhac: 'Call',
    paymentHistory: [
      {
        id: 'pay-2-1',
        paymentDate: '2025-12-19',
        amountPaid: 486000,
        periodMonths: 6,
        commissionRate: 3.02,
        commissionAmount: 14677,
        type: 'BHYT',
        note: 'Gia hạn 6 tháng.'
      }
    ]
  },
  {
    id: 'cust-3',
    name: 'Trần Minh Quân',
    phone: '0945566778',
    cccd: '025078001922',
    insuranceCode: 'GD0192839123',
    hasBHYT: true,
    hasBHXH: true,
    insuranceCodeBHXH: 'BH6091239841',
    expiryDate: '2026-12-10', // Long term BHYT active
    expiryDateBHXH: '2026-06-10', // BHXH expired 2 days ago (relative to 2026-06-12)
    createdAt: '2025-06-10',
    notes: 'Tham gia BHXH tự nguyện mức thu nhập lựa chọn 3.000.000đ. Đóng song hành cả BHYT và BHXH.',
    status: 'active',
    birthday: '1989-08-05',
    gender: 'Nam',
    hinhThucNhac: 'Zalo',
    paymentHistory: [
      {
        id: 'pay-3-1',
        paymentDate: '2025-06-10',
        amountPaid: 7920000,
        periodMonths: 12,
        commissionRate: 14.40,
        commissionAmount: 1140480,
        type: 'BHXH',
        note: 'Đóng Tăng mới BHXH tự nguyện 1 năm.'
      },
      {
        id: 'pay-3-2',
        paymentDate: '2025-12-10',
        amountPaid: 972000,
        periodMonths: 12,
        commissionRate: 3.02,
        commissionAmount: 29354,
        type: 'BHYT',
        note: 'Gia hạn BHYT hộ gia đình 1 năm.'
      }
    ]
  },
  {
    id: 'cust-4',
    name: 'Đặng Văn Long',
    phone: '0977889900',
    cccd: '036087002199',
    insuranceCode: '7912384910',
    hasBHYT: false,
    hasBHXH: true,
    insuranceCodeBHXH: '7912384910',
    expiryDate: '',
    expiryDateBHXH: '2026-06-14', // BHXH sắp hết hạn trong 2 ngày
    createdAt: '2025-06-14',
    notes: 'Lao động tự do, chỉ tham gia đóng BHXH Tự Nguyện để tích lũy lương hưu (BHYT được hưởng theo diện hộ nghèo/thân nhân).',
    status: 'active',
    birthday: '1980-03-18',
    gender: 'Nam',
    hinhThucNhac: 'Call',
    paymentHistory: [
      {
        id: 'pay-4-1',
        paymentDate: '2025-06-14',
        amountPaid: 3960000,
        periodMonths: 12,
        commissionRate: 5.60,
        commissionAmount: 221760,
        type: 'BHXH',
        note: 'Gia hạn BHXH Tự nguyện kỳ 1 năm.'
      }
    ]
  },
  {
    id: 'cust-5',
    name: 'Lê Hoàng Yến',
    phone: '0372233445',
    cccd: '019082001222',
    insuranceCode: 'GD3910248102',
    hasBHYT: true,
    hasBHXH: false,
    expiryDate: '2026-09-30', // Long term active
    createdAt: '2025-09-30',
    notes: 'Khách hàng thân thiết của tổ xã.',
    status: 'active',
    birthday: '1995-02-14',
    gender: 'Nữ',
    hinhThucNhac: 'Zalo',
    paymentHistory: [
      {
        id: 'pay-5-1',
        paymentDate: '2025-09-30',
        amountPaid: 972000,
        periodMonths: 12,
        commissionRate: 3.02,
        commissionAmount: 29354,
        type: 'BHYT',
        note: 'Gia hạn BHYT trọn gói 1 năm.'
      }
    ]
  },
  {
    id: 'cust-6',
    name: 'Bùi Xuân Trường',
    phone: '0901234455',
    cccd: '079092001142',
    insuranceCode: 'GD3919241029',
    hasBHYT: true,
    hasBHXH: true,
    insuranceCodeBHXH: 'BH3910294102',
    expiryDate: '2026-11-20', // BHYT active
    expiryDateBHXH: '2026-06-25', // BHXH next 13 days
    createdAt: '2025-06-25',
    notes: 'Kinh doanh tạp hóa nhỏ tại nhà. Tham gia cả BHYT và BHXH tự nguyện.',
    status: 'active',
    birthday: '1968-06-30',
    gender: 'Nam',
    hinhThucNhac: 'Call',
    paymentHistory: [
      {
        id: 'pay-6-1',
        paymentDate: '2025-06-25',
        amountPaid: 3960000,
        periodMonths: 6,
        commissionRate: 5.60,
        commissionAmount: 221760,
        type: 'BHXH',
        note: 'Gia hạn BHXH tự nguyện 6 tháng.'
      },
      {
        id: 'pay-6-2',
        paymentDate: '2025-11-20',
        amountPaid: 972000,
        periodMonths: 12,
        commissionRate: 3.02,
        commissionAmount: 29354,
        type: 'BHYT',
        note: 'Gia hạn BHYT 1 năm.'
      }
    ]
  }
];
