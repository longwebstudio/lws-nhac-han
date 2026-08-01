/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, PaymentHistory } from '../types';

export const parseExpiryDateStr = (dateStr: string, isBHXH = false): string => {
  if (!dateStr) return '';
  const cleaned = String(dateStr).trim();
  if (!cleaned) return '';

  let year = 0;
  let month = 0;
  let day = 0;

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) {
    const parts = cleaned.split('/');
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  } else if (/^\d{1,2}\/\d{4}$/.test(cleaned)) {
    const parts = cleaned.split('/');
    month = parseInt(parts[0], 10);
    year = parseInt(parts[1], 10);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    const parts = cleaned.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else if (/^\d{4}-\d{2}$/.test(cleaned)) {
    const parts = cleaned.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  } else {
    return cleaned;
  }

  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
    return cleaned;
  }

  if (isBHXH) {
    // Với BHXH tự nguyện: Khách đóng đến tháng X -> Hạn đóng (chu kỳ đóng tiếp theo) là ngày cuối của tháng X + 1
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const lastDayOfNextMonth = new Date(nextYear, nextMonth, 0).getDate();
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(lastDayOfNextMonth).padStart(2, '0')}`;
  } else {
    // Với BHYT: Nếu truyền ngày cụ thể thì giữ ngày, nếu chỉ có tháng/năm thì lấy ngày cuối tháng X
    if (day > 0 && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    if (day > 0 && /^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  }
};

export const parseBirthdayStr = (birthdayStr: string): string => {
  if (!birthdayStr) return '';
  const cleaned = String(birthdayStr).trim();
  if (cleaned.includes('/') || cleaned.includes('-')) {
    const delimiter = cleaned.includes('/') ? '/' : '-';
    const parts = cleaned.split(delimiter);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }
  return cleaned;
};

export function parseJsonToCustomers(items: any[], bhxhRate = 4.9, bhytRate = 2.64): Customer[] {
  if (!Array.isArray(items)) return [];

  const validItems = items.filter(item => {
    if (!item || typeof item !== 'object') return false;
    // Skip canceled/failed records
    if (item.trang_thai_ho_so === 10 || item.LyDoHuy || String(item.trangThai || '').toLowerCase().includes('hủy')) {
      return false;
    }
    return true;
  });

  const list: Customer[] = [];

  validItems.forEach((item, index) => {
    const name = (item.ho_ten || item.hoTen || item.hoVaTen || item.name || item.ten || '').trim();
    if (!name) return;

    const phone = (item.so_dien_thoai || item.soDienThoai || item.sdt || item.phone || item.mobile || '').trim();
    const cccd = (item.So_cmt || item.cmnd || item.cccd || '').trim();
    const codeValue = (item.ma_so_bhxh || item.so_so_bhxh || item.maSoBHXH || item.insuranceCode || item.code || '').trim().toUpperCase();

    const ctu = String(item.ma_ctu || item.type || item.loaiHinh || item.tenThuTuc || '').toUpperCase();
    const isBHXH = ctu.includes('BHXH') || ctu.includes('XÃ HỘI');
    const isBHYT = !isBHXH;

    const expiryRaw = item.den_thang_nam || item.ngay_het_han_bhyt || item.ngayDenHan || item.expiryDate || '';
    const parsedExpiry = parseExpiryDateStr(expiryRaw, isBHXH);

    const birthdayRaw = item.ngay_sinh || item.birthday || item.ngaySinh || '';
    const parsedBirthday = parseBirthdayStr(birthdayRaw);

    const gRaw = String(item.gioi_tinh || item.gioiTinh || item.gender || item.gt || '').trim().toLowerCase();
    let gender: 'Nam' | 'Nữ' | undefined = undefined;
    if (['1', 'nam', 'male', 'm'].includes(gRaw)) gender = 'Nam';
    else if (['0', 'nữ', 'nu', 'female', 'f'].includes(gRaw)) gender = 'Nữ';

    const rawAddr = item.dia_chi_lh_ct || item.dia_chi_lh || item.diaChi || item.address || item.noiO || '';
    const address = String(rawAddr).split(';').map(s => s.trim()).filter(Boolean).join(', ');

    const receiptNo = item.so_bien_lai_dt || item.so_bien_lai || item.bienLaiId || item.maXacNhan || item.so_hsbhxh || '';
    const receiptDateRaw = item.ngay_bien_lai_dt || item.ngay_bien_lai || item.ngay_tao || item.ngayLap || '';
    const receiptDate = parseBirthdayStr(receiptDateRaw) || new Date().toISOString().split('T')[0];

    const periodMonths = Number((isBHYT ? item.So_thang_bhyt : item.so_thang_dong) || item.so_thang_dong || item.So_thang_bhyt || item.periodMonths || 1);

    let hgdRate = Number(item.muc_dong_hgd || item.muc_dong || 0);
    if (!hgdRate && item.ghi_chu) {
      const match = String(item.ghi_chu).match(/(\d+)\s*\[?%\]?/);
      if (match) {
        const parsedRate = Number(match[1]);
        if ([100, 70, 60, 50, 40].includes(parsedRate)) {
          hgdRate = parsedRate;
        }
      }
    }

    let amountPaid = 0;
    if (isBHYT) {
      const rawAmount = Number(item.sotien_dong_BHYT || item.tong_tien_NTG_dong || item.tong_tien_dong || item.muc_tien_dong || item.amountPaid || 0);
      
      if (hgdRate > 0 && hgdRate <= 100) {
        const base12Months = 2530000;
        const fullAmountForMonths = Math.round((base12Months / 12) * periodMonths);
        const fullAmountAltForMonths = Math.round((2340000 / 12) * periodMonths);

        if (rawAmount > 0) {
          const expectedDiscounted = Math.round(fullAmountForMonths * (hgdRate / 100));
          const expectedAltDiscounted = Math.round(fullAmountAltForMonths * (hgdRate / 100));

          if (Math.abs(rawAmount - expectedDiscounted) < 2000 || Math.abs(rawAmount - expectedAltDiscounted) < 2000) {
            // rawAmount is already the discounted rate
            amountPaid = rawAmount;
          } else if (Math.abs(rawAmount - fullAmountForMonths) < 2000 || Math.abs(rawAmount - fullAmountAltForMonths) < 2000) {
            // rawAmount is the 100% full rate, scale by hgdRate / 100
            amountPaid = Math.round(rawAmount * (hgdRate / 100));
          } else if (hgdRate < 100 && rawAmount >= 2000000 && periodMonths >= 12) {
            // rawAmount is 100% full rate, scale by hgdRate / 100
            amountPaid = Math.round(rawAmount * (hgdRate / 100));
          } else {
            amountPaid = rawAmount;
          }
        } else {
          amountPaid = Math.round(fullAmountForMonths * (hgdRate / 100));
        }
      } else {
        amountPaid = rawAmount;
      }
    } else {
      amountPaid = Number(item.tong_tien_NTG_dong || item.sotien_dong_BHYT || item.tong_tien_dong || item.muc_tien_dong || item.amountPaid || 0);
    }
    const urlBienLai = item.url_bienlai || '';

    const paymentHistory: PaymentHistory[] = [];
    if (amountPaid > 0 || receiptNo) {
      const commRate = isBHXH ? bhxhRate : bhytRate;
      const commAmount = Math.round(amountPaid * (commRate / 100));
      paymentHistory.push({
        id: `pay-${item.pr_key || Date.now()}-${index}`,
        bienLaiId: receiptNo ? (receiptNo as any) : undefined,
        paymentDate: receiptDate,
        amountPaid,
        periodMonths,
        commissionRate: commRate,
        commissionAmount: commAmount,
        category: isBHXH ? (item.noi_moi ? 'Tăng mới BHXH' : 'Gia hạn BHXH') : 'Gia hạn BHYT',
        type: isBHXH ? 'BHXH' : 'BHYT',
        note: urlBienLai ? `Biên lai e-PVI: ${urlBienLai}` : (item.ghi_chu || 'Nhập dữ liệu từ JSON BHXH/PVI')
      });
    }

    list.push({
      id: `cust-pvi-${item.pr_key || Date.now()}-${index}`,
      name,
      phone,
      cccd,
      insuranceCode: isBHYT ? codeValue : codeValue,
      insuranceCodeBHXH: isBHXH ? codeValue : undefined,
      type: isBHXH ? 'BHXH' : 'BHYT',
      hasBHYT: !isBHXH,
      hasBHXH: isBHXH,
      expiryDate: isBHYT ? parsedExpiry : '',
      expiryDateBHXH: isBHXH ? parsedExpiry : undefined,
      createdAt: receiptDate || new Date().toISOString().split('T')[0],
      notes: address || item.ghi_chu || 'Nhập từ dữ liệu JSON PVI/BHXH',
      status: 'active',
      birthday: parsedBirthday || undefined,
      gender,
      address: address || undefined,
      paymentHistory
    });
  });

  return list;
}
