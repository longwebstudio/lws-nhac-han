import { CommissionMatrix } from '../types';

export interface CommissionRuleInput {
  type: 'BHYT' | 'BHXH';
  category: string;
  periodMonths: number;
}

/**
 * Bảng tỷ lệ hoa hồng (thù lao) mặc định theo Hợp đồng Đại lý thu BHXH, BHYT.
 */
export const DEFAULT_COMMISSION_MATRIX: CommissionMatrix = {
  bhyt: {
    tangMoi3M: 5.28,
    tangMoi6M: 6.34,
    tangMoi12M: 7.04,
    giaHan: 3.02,
  },
  bhxh: {
    tangMoi1M: 8.64,
    tangMoi3M: 10.80,
    tangMoi6M: 12.96,
    tangMoi12M: 14.40,
    giaHan: 5.60,
  },
};

/**
 * Tính tỷ lệ hoa hồng (thù lao) tự động theo Hợp đồng Đại lý thu BHXH, BHYT hoặc theo Bảng cấu hình tùy chỉnh.
 */
export function getAutoCommissionRate(
  type: 'BHYT' | 'BHXH',
  category: string,
  periodMonths: number,
  customMatrix?: CommissionMatrix
): number {
  const months = Number(periodMonths) || 12;
  const isTangMoi = category ? category.includes('Tăng mới') : false;
  const matrix = customMatrix || DEFAULT_COMMISSION_MATRIX;

  if (type === 'BHYT') {
    if (isTangMoi) {
      if (months <= 3) return matrix.bhyt.tangMoi3M ?? DEFAULT_COMMISSION_MATRIX.bhyt.tangMoi3M;
      if (months <= 6) return matrix.bhyt.tangMoi6M ?? DEFAULT_COMMISSION_MATRIX.bhyt.tangMoi6M;
      return matrix.bhyt.tangMoi12M ?? DEFAULT_COMMISSION_MATRIX.bhyt.tangMoi12M;
    } else {
      return matrix.bhyt.giaHan ?? DEFAULT_COMMISSION_MATRIX.bhyt.giaHan;
    }
  } else {
    // BHXH
    if (isTangMoi) {
      if (months <= 1) return matrix.bhxh.tangMoi1M ?? DEFAULT_COMMISSION_MATRIX.bhxh.tangMoi1M;
      if (months <= 3) return matrix.bhxh.tangMoi3M ?? DEFAULT_COMMISSION_MATRIX.bhxh.tangMoi3M;
      if (months <= 6) return matrix.bhxh.tangMoi6M ?? DEFAULT_COMMISSION_MATRIX.bhxh.tangMoi6M;
      return matrix.bhxh.tangMoi12M ?? DEFAULT_COMMISSION_MATRIX.bhxh.tangMoi12M;
    } else {
      return matrix.bhxh.giaHan ?? DEFAULT_COMMISSION_MATRIX.bhxh.giaHan;
    }
  }
}
