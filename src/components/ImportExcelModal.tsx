/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, InsuranceType } from '../types';
import { X, FileText, Upload, Copy, AlertCircle, CheckCircle, Database, Download } from 'lucide-react';

interface ImportExcelModalProps {
  onImport: (newCustomers: Customer[]) => void;
  onClose: () => void;
}

// Sample copy-paste content adapted to match standard export columns
const SAMPLE_EXCEL_PASTE = `Mã số BHXH\tHọ tên\tNgày sinh\tGiới tính\tĐịa chỉ\tSố điện thoại\tNgày đến hạn
0123429358\tNguyễn Thị Hải Yến\t17/12/2004\tNữ\tThành phố Hà Nội\t0863380181\t04/06/2026
0123527579\tNguyễn Thị Ngọc\t29/01/1961\tNữ\tThành phố Hà Nội\t0987048436\t04/06/2026
0123582700\tĐỗ Đăng Ty\t06/07/1977\tNam\tThành phố Hà Nội\t0982415347\t05/06/2026
0123182559\tNguyễn Danh Long\t25/09/1985\tNam\tThành phố Hà Nội\t0334522334\t06/2026`;

// CSV Template matching user's image exactly with BOM for correct Vietnamese encoding in Excel
const EXCEL_TEMPLATE_CSV = `STT,Mã số BHXH,Họ tên,Ngày sinh,Giới tính,Địa chỉ,Số điện thoại,Phương thức đóng,Số tháng đóng,Số phải đóng,Thừa tiền,Thiếu tiền,Ngày đến hạn
1,0123429358,Nguyễn Thị Hải Yến,17/12/2004,Nữ,Thành phố Hà Nội,0863380181,12,12,0,0,0,04/06/2026
2,0123527579,Nguyễn Thị Ngọc,29/01/1961,Nữ,Thành phố Hà Nội,0987048436,12,12,0,0,0,04/06/2026
3,0123582700,Đỗ Đăng Ty,06/07/1977,Nam,Thành phố Hà Nội,0982415347,12,12,0,0,0,05/06/2026
4,0123182556,Đỗ Thị Nguyệt,31/08/1985,Nữ,Thành phố Hà Nội,0354780086,12,12,0,0,0,06/06/2026
5,0123182559,Nguyễn Danh Long,25/09/1985,Nam,Thành phố Hà Nội,0334522334,12,12,583000,0,0,06/2026`;

const formatBirthdayToYYYYMMDD = (birthdayStr: string): string => {
  if (!birthdayStr) return '';
  const cleaned = birthdayStr.trim();
  if (cleaned.includes('/') || cleaned.includes('-')) {
    const delimiter = cleaned.includes('/') ? '/' : '-';
    const parts = cleaned.split(delimiter);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        // DD/MM/YYYY
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }
  return cleaned;
};

export default function ImportExcelModal({ onImport, onClose }: ImportExcelModalProps) {
  const [pasteData, setPasteData] = useState('');
  const [parsedCustomers, setParsedCustomers] = useState<Partial<Customer>[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleCopySample = () => {
    navigator.clipboard.writeText(SAMPLE_EXCEL_PASTE);
    setInfoMessage('Đã sao chép nội dung Excel mẫu! Hãy dán vào ô nhập liệu bên dưới.');
    setTimeout(() => setInfoMessage(''), 3000);
  };

  const handleDownloadTemplate = () => {
    const csvContent = "\uFEFF" + EXCEL_TEMPLATE_CSV;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Mau_Danh_Sach_Nguoi_Dan_BHXH.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setInfoMessage('Đã tải xuống file mẫu Excel "Mau_Danh_Sach_Nguoi_Dan_BHXH.csv"! Bạn có thể mở trực tiếp bằng Excel.');
    setTimeout(() => setInfoMessage(''), 4000);
  };

  const handleParseText = (text: string) => {
    setPasteData(text);
    if (!text.trim()) {
      setParsedCustomers([]);
      setErrorMessage('');
      return;
    }

    const trimmedText = text.trim();
    // Check if input is a JSON string
    if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmedText);
        let items: any[] = [];
        if (Array.isArray(parsed)) {
          items = parsed;
        } else if (parsed && Array.isArray(parsed.items)) {
          items = parsed.items;
        } else {
          setErrorMessage('JSON hợp lệ nhưng không tìm thấy danh sách khách hàng hoặc biên lai.');
          return;
        }

        const storedSettings = localStorage.getItem('lws_settings');
        let bhxhRate = 4.9;
        let bhytRate = 2.64;
        if (storedSettings) {
          try {
            const parsedS = JSON.parse(storedSettings);
            if (parsedS.bhxhCommissionRate !== undefined) bhxhRate = Number(parsedS.bhxhCommissionRate);
            if (parsedS.bhytCommissionRate !== undefined) bhytRate = Number(parsedS.bhytCommissionRate);
          } catch {}
        }

        const list: any[] = [];
        const firstItem = items[0];
        const isReceiptFormat = firstItem && (firstItem.bienLaiId !== undefined || firstItem.mathuTuc !== undefined || firstItem.ngayLap !== undefined);

        if (isReceiptFormat) {
          // RECEIPT FORMAT PARSING
          items.forEach((item: any, index: number) => {
            const name = item.hoTen || item.hoVaTen || '';
            if (!name) return;

            // Bỏ lọc trạng thái theo yêu cầu của người dùng để nạp tất cả mọi trạng thái làm dữ liệu ghi nhận
            const isBHYT = Number(item.mathuTuc) === 1 || 
                           String(item.tenThuTuc || '').includes('603') || 
                           String(item.tenThuTuc || '').toLowerCase().includes('bhyt') || 
                           String(item.tenThuTuc || '').toLowerCase().includes('y tế') ||
                           !(String(item.tenThuTuc || '').toLowerCase().includes('bhxh') || String(item.tenThuTuc || '').toLowerCase().includes('xã hội'));
            
            const codeValue = (item.maSoBHXH || '').trim().replace(/\s/g, '');
            const cccd = (item.cmnd || item.cccd || '').trim();
            
            // extract ngayLap as payment date
            const paymentDateVal = item.ngayLap ? String(item.ngayLap).substring(0, 10) : new Date().toISOString().split('T')[0];
            
            // Bỏ tính ngày hết hạn khi import ghi nhận đóng theo yêu cầu của người dùng
            const collectionNote = `Người nộp: ${item.nguoiNop || 'N/A'} | Trạng thái HS: ${item.trangThaiHoSoName || 'Chưa xác định'} | Hình thức: ${item.hinhThuc || 'N/A'}`;
            const amount = Number(item.tongTien) || 0;
            const commission = isBHYT 
              ? Math.round(amount * (bhytRate / 100)) 
              : Math.round(amount * (bhxhRate / 100));

            const paymentHistItem = {
              id: `pay-json-${item.bienLaiId || index}-${Date.now()}`,
              bienLaiId: item.bienLaiId ? Number(item.bienLaiId) : undefined,
              paymentDate: paymentDateVal,
              amountPaid: amount,
              periodMonths: isBHYT ? 12 : 1,
              commissionAmount: commission,
              type: (isBHYT ? 'BHYT' : 'BHXH') as InsuranceType,
              note: collectionNote,
              nguoiNop: item.nguoiNop || undefined,
              trangThaiHoSoName: item.trangThaiHoSoName || undefined
            };

            // Parse additional fields: gender, address, birthday
            const genderRaw = item.gioiTinh || item.gender || item.gt || '';
            let finalGender: 'Nam' | 'Nữ' | undefined = undefined;
            if (genderRaw) {
              const gLower = String(genderRaw).toLowerCase();
              if (gLower === 'nam' || gLower === 'm' || gLower === '1') {
                finalGender = 'Nam';
              } else if (gLower === 'nữ' || gLower === 'nu' || gLower === 'f' || gLower === '0' || gLower === 'nư') {
                finalGender = 'Nữ';
              }
            }

            const rawAddress = item.diaChi || item.address || item.thuongTru || item.noiO || '';
            const birthdayRaw = item.ngaySinh || item.birthday || item.ngSinh || '';
            const formattedBirthday = birthdayRaw ? formatBirthdayToYYYYMMDD(birthdayRaw) : undefined;

            list.push({
              id: `temp-receipt-${Date.now()}-${index}`,
              name,
              phone: item.soDienThoai || item.sdt || item.phone || '',
              cccd,
              insuranceCode: isBHYT ? codeValue : codeValue, // Set both to the 10-digit code to allow search matches
              type: isBHYT ? 'BHYT' : 'BHXH',
              hasBHXH: !isBHYT,
              insuranceCodeBHXH: codeValue, // maSoBHXH is 10-digit code of the resident
              expiryDate: '',
              expiryDateBHXH: undefined,
              createdAt: paymentDateVal,
              notes: rawAddress ? rawAddress : `Nhập biên nhận từ file JSON. ${collectionNote}`,
              status: 'active',
              paymentHistory: [paymentHistItem],
              birthday: formattedBirthday || undefined,
              gender: finalGender,
              address: rawAddress || undefined
            });
          });

          setParsedCustomers(list);
          if (list.length === 0) {
            setErrorMessage('Không nhận diện được biên lai nào từ dữ liệu JSON.');
          } else {
            setErrorMessage('');
          }
          return;
        }

        // ORIGINAL CUSTOMER LIST FORMAT PARSING
        items.forEach((item: any, index: number) => {
          const name = item.hoVaTen || item.name || '';
          if (!name) return;

          const phone = item.soDienThoai || item.phone || '';
          const cccd = item.cccd || '';
          const codeValue = item.maSoBHXH || item.insuranceCode || '';
          const ngayDenHan = item.ngayDenHan || item.ngayDenHanStr || item.expiryDate || '';
          const rawDateStr = String(ngayDenHan).trim();

          // Check if "ngayDenHan" is present and determine type
          let isBHYT = true; // default to BHYT
          const itemTypeStr = String(item.type || item.loaiHinh || item.loaiBaoHiem || item.tenThuTuc || '').toLowerCase();
          if (itemTypeStr.includes('bhxh') || itemTypeStr.includes('xã hội')) {
            isBHYT = false;
          } else if (itemTypeStr.includes('bhyt') || itemTypeStr.includes('y tế')) {
            isBHYT = true;
          } else if (rawDateStr) {
            const parts = rawDateStr.split('/');
            if (parts.length === 2) {
              isBHYT = false; // mm/yyyy format -> BHXH
            } else if (parts.length === 3) {
              isBHYT = true; // dd/mm/yyyy format -> BHYT
            }
          }

          let parsedDate = '';
          if (rawDateStr) {
            const parts = rawDateStr.split('/');
            if (parts.length === 3) {
              const day = parts[0].padStart(2, '0');
              const month = parts[1].padStart(2, '0');
              const year = parts[2];
              parsedDate = `${year}-${month}-${day}`;
            } else if (parts.length === 2) {
              const month = parseInt(parts[0], 10);
              const year = parseInt(parts[1], 10);
              if (!isNaN(month) && !isNaN(year)) {
                // Get the last day of the month
                const lastDay = new Date(year, month, 0).getDate();
                parsedDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
              }
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDateStr)) {
              parsedDate = rawDateStr;
            }
          }

          const notes = item.diaChi || item.notes || 'Nhập từ file JSON';

          list.push({
            id: `temp-json-${Date.now()}-${index}`,
            name,
            phone,
            cccd,
            insuranceCode: isBHYT ? codeValue : '',
            type: isBHYT ? 'BHYT' : 'BHXH',
            hasBHXH: !isBHYT,
            insuranceCodeBHXH: !isBHYT ? codeValue : undefined,
            expiryDate: isBHYT ? parsedDate : '',
            expiryDateBHXH: !isBHYT ? parsedDate : undefined,
            createdAt: new Date().toISOString().split('T')[0],
            notes,
            status: 'active',
            paymentHistory: []
          });
        });

        setParsedCustomers(list);
        if (list.length === 0) {
          setErrorMessage('Không nhận diện được khách hàng nào từ dữ liệu JSON.');
        } else {
          setErrorMessage('');
        }
        return;
      } catch (err: any) {
        setErrorMessage('Dữ liệu dạng JSON lỗi cú pháp: ' + err.message);
        return;
      }
    }

    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length < 1) {
        setErrorMessage('Dữ liệu trống.');
        return;
      }

      // Read columns of first line to test if headers exist
      const firstLineCols = lines[0].split('\t').length > 1 
        ? lines[0].split('\t') 
        : (lines[0].split(',').length > 1 ? lines[0].split(',') : lines[0].split(';'));
      
      const headers = firstLineCols.map(c => c.trim().toLowerCase());
      
      // Look for matched column indexes dynamically:
      let nameIdx = headers.findIndex(h => h.includes('họ tên') || h.includes('họ và tên') || h === 'tên');
      let phoneIdx = headers.findIndex(h => h.includes('điện thoại') || h.includes('sđt') || h === 'sđt' || h === 'đt' || h.startsWith('đt') || h.includes('sdt') || h.includes('sđt'));
      let cccdIdx = headers.findIndex(h => h.includes('cccd') || h.includes('cmnd') || h.includes('căn cước') || h.includes('số định danh') || h.includes('định danh'));
      let codeIdx = headers.findIndex(h => h.includes('mã số bhxh') || h.includes('mã số bh') || h.includes('mã bhxh') || h.includes('mã số bảo hiểm') || h.includes('mã bh') || h.includes('mã thẻ') || h.includes('số thẻ') || h.includes('bảo hiểm'));
      let expiryIdx = headers.findIndex(h => h.includes('đến hạn') || h.includes('ngày hết hạn') || h.includes('hết hạn') || h.includes('hạn đóng') || h.includes('ngày đến hạn') || h.includes('hạn bh'));
      let birthdayIdx = headers.findIndex(h => h.includes('ngày sinh') || h.includes('năm sinh') || h.includes('ngsinh'));
      let genderIdx = headers.findIndex(h => h.includes('giới tính') || h.includes('gt') || h.includes('g.tính'));
      let addressIdx = headers.findIndex(h => h.includes('địa chỉ') || h.includes('thường trú') || h.includes('nơi ở') || h.includes('tạm trú'));

      // If we found some valid matches, we treat first line as header
      const hasHeaders = nameIdx !== -1 || phoneIdx !== -1 || codeIdx !== -1;
      
      let startIndex = 0;
      if (hasHeaders) {
        startIndex = 1;
      } else {
        // Default position based fallback (compatibility fallback)
        nameIdx = 0;
        phoneIdx = 1;
        cccdIdx = 2;
        codeIdx = 3;
        expiryIdx = 5;
        addressIdx = 6;
      }

      const list: any[] = [];

      for (let i = startIndex; i < lines.length; i++) {
        // split by tab (for excel sheet copy) or comma/semicolon
        let cols = lines[i].split('\t');
        if (cols.length <= 1) {
          cols = lines[i].split(',');
        }
        if (cols.length <= 1) {
          cols = lines[i].split(';');
        }

        if (cols.length < 2) {
          continue;
        }

        const name = nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx].trim() : (cols[0] || '').trim();
        if (!name) continue;

        const phone = phoneIdx !== -1 && cols[phoneIdx] ? cols[phoneIdx].trim() : (cols[1] || '').trim();
        const cccd = cccdIdx !== -1 && cols[cccdIdx] ? cols[cccdIdx].trim() : '';
        const insuranceCodeRaw = codeIdx !== -1 && cols[codeIdx] ? cols[codeIdx].trim() : '';
        
        let birthdayStr = birthdayIdx !== -1 && cols[birthdayIdx] ? cols[birthdayIdx].trim() : '';
        const formattedBirthday = birthdayStr ? formatBirthdayToYYYYMMDD(birthdayStr) : undefined;

        const genderRaw = genderIdx !== -1 && cols[genderIdx] ? cols[genderIdx].trim() : '';
        let finalGender: 'Nam' | 'Nữ' | undefined = undefined;
        if (genderRaw) {
          const gLower = genderRaw.toLowerCase();
          if (gLower === 'nam' || gLower === 'm' || gLower === '1') {
            finalGender = 'Nam';
          } else if (gLower === 'nữ' || gLower === 'nu' || gLower === 'f' || gLower === '0' || gLower === 'nư') {
            finalGender = 'Nữ';
          }
        }

        const rawAddress = addressIdx !== -1 && cols[addressIdx] ? cols[addressIdx].trim() : '';

        // "Mã số thẻ BHYT (10 số cuối là mã số BHXH). Mỗi người dân chỉ có duy nhất một mã 10 số cuối của BHYT hoặc mã số BHXH."
        let finalBHYT = '';
        let finalBHXH = '';

        if (insuranceCodeRaw) {
          const codeValue = insuranceCodeRaw.replace(/\s/g, '');
          if (codeValue.length >= 10) {
            const last10 = codeValue.slice(-10);
            if (codeValue.length > 10) {
              finalBHYT = codeValue;
              finalBHXH = last10;
            } else {
              // exactly 10 characters or digits
              finalBHXH = codeValue;
              finalBHYT = codeValue; // Both share the same unique 10-digit number
            }
          } else {
            finalBHYT = codeValue;
            finalBHXH = codeValue;
          }
        }

        // Determine if it is BHYT or BHXH
        let isBHXH = false;
        const typeIdx = headers.findIndex(h => h.includes('loại hình') || h.includes('loại bh') || h.includes('loại'));
        const rawExpiryTest = expiryIdx !== -1 && cols[expiryIdx] ? cols[expiryIdx].trim() : '';
        const mmyyyyRegex = /^\d{1,2}\/\d{4}$/;

        if (typeIdx !== -1 && cols[typeIdx]) {
          const typeStr = cols[typeIdx].trim().toUpperCase();
          if (typeStr.includes('BHXH') || typeStr.includes('XÃ HỘI')) {
            isBHXH = true;
          }
        } else if (mmyyyyRegex.test(rawExpiryTest)) {
          isBHXH = true;
        } else if (insuranceCodeRaw.startsWith('BH') || insuranceCodeRaw.includes('BHXH')) {
          isBHXH = true;
        }

        let rawExpiry = expiryIdx !== -1 && cols[expiryIdx] ? cols[expiryIdx].trim() : '';
        let parsedDate = '';

        if (rawExpiry) {
          if (rawExpiry.includes('/')) {
            const parts = rawExpiry.split('/');
            if (parts.length === 3) {
              const day = parts[0].padStart(2, '0');
              const month = parts[1].padStart(2, '0');
              const year = parts[2];
              parsedDate = `${year}-${month}-${day}`;
            } else if (parts.length === 2) {
              // mm/yyyy format
              const month = parseInt(parts[0], 10);
              const year = parseInt(parts[1], 10);
              if (!isNaN(month) && !isNaN(year)) {
                const lastDay = new Date(year, month, 0).getDate();
                parsedDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
              }
            }
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawExpiry)) {
            parsedDate = rawExpiry;
          }
        }

        list.push({
          id: `temp-${Date.now()}-${i}`,
          name,
          phone,
          cccd,
          gender: finalGender,
          birthday: formattedBirthday || undefined,
          address: rawAddress || undefined,
          insuranceCode: finalBHYT,
          type: isBHXH ? 'BHXH' : 'BHYT',
          expiryDate: isBHXH ? '' : parsedDate,
          hasBHXH: isBHXH || (finalBHXH && finalBHYT !== finalBHXH ? true : false),
          insuranceCodeBHXH: finalBHXH || undefined,
          expiryDateBHXH: isBHXH ? parsedDate : undefined,
          createdAt: new Date().toISOString().split('T')[0],
          notes: rawAddress ? rawAddress : (isBHXH ? 'Đại lý BHXH tự nguyện' : 'Đại lý BHYT hộ gia đình'),
          status: 'active',
          paymentHistory: []
        });
      }

      setParsedCustomers(list);
      if (list.length === 0) {
        setErrorMessage('Không nhận diện được dòng dữ liệu hợp lệ nào. Vui lòng kiểm tra định dạng.');
      } else {
        setErrorMessage('');
      }
    } catch {
      setErrorMessage('Đã xảy ra lỗi khi phân tích cú pháp dán dữ liệu.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const resultText = event.target?.result as string;
      if (resultText) {
        handleParseText(resultText);
        setInfoMessage(`Đã đọc và phân tích dữ liệu thực tế từ file "${file.name}" thành công!`);
        setTimeout(() => setInfoMessage(''), 4000);
      }
    };
    reader.onerror = () => {
      setErrorMessage(`Lỗi: Không thể tải hoặc đọc tệp tin "${file.name}".`);
    };
    reader.readAsText(file);
  };

  const executeImport = () => {
    if (parsedCustomers.length === 0) return;
    
    // cast back to accurate Customer definitions
    const completedList: Customer[] = parsedCustomers.map((p, idx) => ({
      id: `cust-excel-${Date.now()}-${idx}`,
      name: p.name || 'Khách hàng không tên',
      phone: p.phone || '',
      cccd: p.cccd || '',
      insuranceCode: p.insuranceCode || '',
      hasBHXH: p.hasBHXH ?? false,
      insuranceCodeBHXH: p.insuranceCodeBHXH,
      expiryDateBHXH: p.expiryDateBHXH,
      expiryDate: p.expiryDate || '',
      createdAt: p.createdAt || '2026-06-12',
      notes: p.notes || '',
      status: 'active',
      paymentHistory: p.paymentHistory || [],
      birthday: p.birthday,
      gender: p.gender,
      address: p.address,
      ...((p as any).type ? { type: (p as any).type } : {})
    }));

    onImport(completedList);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div 
        id="import-excel-modal-card"
        className="bg-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 to-teal-900 border-b border-slate-850 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold font-sans flex items-center gap-2 text-white">
              <Database className="w-5 h-5 text-emerald-400" />
              Tải Nhập Dữ Liệu Nhanh Từ Excel / Google Sheets
            </h3>
            <p className="text-xs text-emerald-400/85 mt-0.5">Chuyển toàn bộ sổ tay người dân dạng bảng tính lên hệ thống trong 3 giây</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick instructions and sample copy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2 bg-slate-950/50 rounded-xl p-4 border border-slate-850">
              <h4 className="text-sm font-semibold text-white mb-2">Quy tắc tải hoặc dán dữ liệu:</h4>
              <ol className="text-xs text-slate-400 space-y-1.5 list-decimal pl-4 leading-normal">
                <li><strong className="text-emerald-400">Cách 1 - Nhập Từ Bảng Tính (Hỗ trợ 100% Ảnh):</strong> Bạn có thể copy trực tiếp các cột/hàng từ file Excel danh sách phường xã hoặc xuất từ phần mềm đại lý thu (<strong className="text-slate-300 font-medium">Mã số BHXH, Họ tên, Ngày sinh, Giới tính, Địa chỉ, SĐT, Ngày đến hạn...</strong>) rồi dán vào ô bên dưới. Hệ thống tự so khớp tiêu đề cột cực kỳ thông minh!</li>
                <li><strong className="text-emerald-450">Tải File Mẫu:</strong> Bấm nút <strong className="text-emerald-400">"Tải File Mẫu Excel (.csv)"</strong> bên sườn phải để lấy file chuẩn đã điền sẵn dữ liệu mẫu giống như ảnh cổng dịch vụ công của cơ quan BHXH.</li>
                <li><strong className="text-amber-400">Tự động nhận diện loại hình:</strong> Nếu ngày đến hạn là định dạng đầy đủ <code className="text-amber-300 font-mono">dd/mm/yyyy</code> (ví dụ: <code className="text-emerald-350 font-mono">04/06/2026</code>), hệ thống tự khớp <strong className="text-emerald-400 font-bold">BHYT</strong>. Nếu là định dạng tháng/năm <code className="text-indigo-400 font-mono">mm/yyyy</code> (ví dụ: <code className="text-indigo-300 font-mono">06/2026</code>) hoặc định dạng khác, hệ thống tự khớp là <strong className="text-indigo-400 font-bold">BHXH Tự Nguyện</strong>.</li>
              </ol>
            </div>

            <div className="bg-gradient-to-br from-emerald-950/30 to-teal-900/20 border border-emerald-900/50 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase text-emerald-400 tracking-wider">Hỗ trợ nhanh</span>
                <h5 className="text-xs font-extrabold text-white mt-1 mb-1.5">Mẫu Excel đồng bộ cổng DV công:</h5>
                <p className="text-[11px] text-slate-350 leading-relaxed mb-3">Tải file mẫu Excel chuẩn có đầy đủ cột (Mã BHXH, Họ tên, SĐT, Ngày sinh...) khớp ảnh chụp danh sách phường xã.</p>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-black text-slate-900 bg-emerald-400 hover:bg-emerald-300 py-2.5 px-3 rounded-lg transition-all cursor-pointer shadow-md transform active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải File Mẫu Excel (.csv)
                </button>
                
                <button
                  type="button"
                  onClick={handleCopySample}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-slate-300 bg-slate-950 hover:bg-slate-900 border border-slate-800 py-2.5 px-3 rounded-lg transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Sao chép dán nhanh mẫu
                </button>
              </div>
            </div>
          </div>

          {infoMessage && (
            <div className="bg-emerald-950/50 border border-emerald-900 text-emerald-400 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-450 shrink-0" />
              {infoMessage}
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-950/50 border border-rose-900 text-rose-400 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-450 shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Input Method Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Method 1: File Upload */}
            <div className="border border-slate-850 rounded-xl p-4 bg-slate-950/20 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <Upload className="w-4 h-4 text-emerald-400" />
                CÁCH 1: TẢI FILE EXCEL HOẶC FILE JSON (.JSON, .XLSX, .CSV)
              </div>
              <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition-all relative bg-slate-950/40">
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls, .txt, .json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-950 flex items-center justify-center text-emerald-400 mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-300">Kéo thả hoặc nhấp để tải file lên</p>
                  <p className="text-[10px] text-slate-500 mt-1">Hỗ trợ file JSON thực tế và tệp Excel</p>
                </div>
              </div>
            </div>

            {/* Method 2: Paste Area */}
            <div className="border border-slate-850 rounded-xl p-4 bg-slate-950/20 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold text-xs animate-pulse">
                <FileText className="w-4 h-4 text-emerald-450" />
                CÁCH 2: DÁN DỮ LIỆU SAO CHÉP TRỰC TIẾP
              </div>
              <textarea
                value={pasteData}
                onChange={(e) => handleParseText(e.target.value)}
                placeholder="Dán dữ liệu cột Excel (Họ tên, SĐT, CCCD...) hoặc dán mã JSON chứa mảng/đối tượng ở đây..."
                rows={4}
                className="w-full text-xs font-mono p-3 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 bg-slate-950 placeholder-slate-650"
              />
            </div>
          </div>

          {/* Mapped results list previews */}
          {parsedCustomers.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-950/85 border-b border-slate-850 rounded-t-lg px-4 py-2">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Kết Quả Phân Tích ({parsedCustomers.length} người dân tìm thấy):
                </h4>
                <p className="text-[10px] text-slate-500 uppercase font-medium">Bản xem trước dữ liệu</p>
              </div>

              <div className="overflow-x-auto border border-slate-850 rounded-b-xl max-h-[220px]">
                <table className="min-w-full divide-y divide-slate-800 text-left table-auto">
                  <thead className="bg-slate-950">
                    <tr>
                      <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Họ và Tên</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số ĐT</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số CCCD</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mã Số Thẻ</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loại Bảo Hiểm</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngày Đến Hạn</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-900 divide-y divide-slate-850 text-xs">
                    {parsedCustomers.map((cust, idx) => (
                      <tr key={idx} className="hover:bg-slate-850/40 text-slate-300">
                        <td className="px-4 py-2 font-medium text-white">{cust.name}</td>
                        <td className="px-4 py-2 text-slate-300 font-mono">{cust.phone}</td>
                        <td className="px-4 py-2 text-slate-400 font-mono">{cust.cccd}</td>
                        <td className="px-4 py-2 text-emerald-400 font-mono">
                          {cust.type === 'BHXH' ? cust.insuranceCodeBHXH : cust.insuranceCode}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            cust.type === 'BHXH' ? 'bg-indigo-950/60 border border-indigo-500/30 text-indigo-300' : 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                          }`}>
                            {cust.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-white font-mono font-medium">
                          {cust.type === 'BHXH' ? cust.expiryDateBHXH : cust.expiryDate}
                        </td>
                        <td className="px-4 py-2 text-slate-400 truncate max-w-[150px]">{cust.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-850 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-300 bg-slate-950 border border-slate-800 hover:bg-slate-900 hover:text-white px-4 py-2 rounded-lg transition-all cursor-pointer"
          >
            Đóng
          </button>
          
          <button
            type="button"
            disabled={parsedCustomers.length === 0}
            onClick={executeImport}
            className={`flex items-center gap-1.5 text-sm font-semibold text-white px-5 py-2.5 rounded-lg transition-all cursor-pointer shadow-md ${
              parsedCustomers.length === 0 
                ? 'bg-slate-800 text-slate-600 pointer-events-none' 
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            Đồng Ý Nhập {parsedCustomers.length} Khách Hàng
          </button>
        </div>
      </div>
    </div>
  );
}
