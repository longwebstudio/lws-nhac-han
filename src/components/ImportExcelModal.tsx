/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, InsuranceType } from '../types';
import { X, FileText, Upload, Copy, AlertCircle, CheckCircle, Database } from 'lucide-react';

interface ImportExcelModalProps {
  onImport: (newCustomers: Customer[]) => void;
  onClose: () => void;
}

// Sample copy-paste content
const SAMPLE_EXCEL_PASTE = `Họ và tên\tSố điện thoại\tSố CCCD\tMã số bảo hiểm\tLoại hình\tNgày hết hạn\tGhi chú
Nguyễn Quốc Long\t0981234567\t001095018274\tDK9823019842\tBHYT\t2026-06-20\tĐại lý trưởng Long Web Studio
Trần Sĩ Vũ\t0934567890\t038200018921\tBH9012384912\tBHXH\t2026-06-16\tĐóng BHXH tự nguyện 6 tháng
Lê Thị Hương\t0356789012\t079093002842\tGD1924192041\tBHYT\t2026-06-11\tĐã hết hạn cần gọi gấp`;

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
        let bhxhRate = 4.5;
        let bhytRate = 3.1;
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

            // Lọc ghi nhận không có người nộp hoặc trạng thái Đã thu tiền
            const hasPayer = item.nguoiNop && String(item.nguoiNop).trim().length > 0;
            const isCollectedStatus = item.trangThaiHoSoName && String(item.trangThaiHoSoName).trim() === 'Đã thu tiền';
            if (!hasPayer || isCollectedStatus) {
              return;
            }

            const isBHYT = Number(item.mathuTuc) === 1; // 0: BHXH, 1: BHYT
            const codeValue = item.maSoBHXH || '';
            const cccd = item.cmnd || '';
            
            // extract ngayLap as payment date
            const paymentDateVal = item.ngayLap ? String(item.ngayLap).substring(0, 10) : new Date().toISOString().split('T')[0];
            
            // Calculate expiry date (12 months from paymentDate)
            const expDate = new Date(paymentDateVal);
            expDate.setFullYear(expDate.getFullYear() + 1);
            const expDateStr = expDate.toISOString().split('T')[0];

            const collectionNote = `Người nộp: ${item.nguoiNop || 'N/A'} | Trạng thái: ${item.trangThaiHoSoName || 'Chưa xác định'}`;
            const amount = Number(item.tongTien) || 0;
            const commission = isBHYT 
              ? Math.round(amount * (bhytRate / 100)) 
              : Math.round(amount * (bhxhRate / 100));

            const paymentHistItem = {
              id: `pay-json-${item.bienLaiId || index}-${Date.now()}`,
              paymentDate: paymentDateVal,
              amountPaid: amount,
              periodMonths: 12,
              commissionAmount: commission,
              type: (isBHYT ? 'BHYT' : 'BHXH') as InsuranceType,
              note: collectionNote
            };

            list.push({
              id: `temp-receipt-${Date.now()}-${index}`,
              name,
              phone: item.soDienThoai || '',
              cccd,
              insuranceCode: isBHYT ? codeValue : '',
              type: isBHYT ? 'BHYT' : 'BHXH',
              hasBHXH: !isBHYT,
              insuranceCodeBHXH: !isBHYT ? codeValue : undefined,
              expiryDate: isBHYT ? expDateStr : '2026-06-25',
              expiryDateBHXH: !isBHYT ? expDateStr : undefined,
              createdAt: paymentDateVal,
              notes: `Nhập biên nhận từ file JSON. ${collectionNote}`,
              status: 'active',
              paymentHistory: [paymentHistItem]
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
          const ngayDenHan = item.ngayDenHan || item.expiryDate || '';

          // Check if "ngayDenHan" is in standard "dd/mm/yyyy" format
          const ddmmyyyyRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
          const isBHYT = ddmmyyyyRegex.test(String(ngayDenHan).trim());

          let parsedDate = '';
          const rawDateStr = String(ngayDenHan).trim();

          if (isBHYT) {
            // "dd/mm/yyyy" format -> BHYT
            const parts = rawDateStr.split('/');
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            parsedDate = `${year}-${month}-${day}`;
          } else {
            // mm/yyyy format or other formats -> BHXH
            if (rawDateStr.includes('/')) {
              const parts = rawDateStr.split('/');
              if (parts.length === 2) {
                const month = parseInt(parts[0], 10);
                const year = parseInt(parts[1], 10);
                if (!isNaN(month) && !isNaN(year)) {
                  // Get the last day of the month
                  const lastDay = new Date(year, month, 0).getDate();
                  parsedDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                }
              }
            }
            if (!parsedDate) {
              parsedDate = '2026-06-25'; // Fallback date
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
            expiryDate: isBHYT ? parsedDate : '2026-06-25',
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

      // Check for headers (can be first line)
      let startIndex = 0;
      const firstLineLower = lines[0].toLowerCase();
      if (
        firstLineLower.includes('tên') || 
        firstLineLower.includes('họ') || 
        firstLineLower.includes('cccd') || 
        firstLineLower.includes('sđt') ||
        firstLineLower.includes('mã')
      ) {
        startIndex = 1; // skip header row
      }

      const list: any[] = [];

      for (let i = startIndex; i < lines.length; i++) {
        // split by tab (from excel paste) or comma/semicolon
        let cols = lines[i].split('\t');
        if (cols.length <= 1) {
          cols = lines[i].split(',');
        }
        if (cols.length <= 1) {
          cols = lines[i].split(';');
        }

        if (cols.length < 4) {
          // Skip lines with too few elements
          continue;
        }

        const name = cols[0]?.trim() || '';
        const phone = cols[1]?.trim() || '';
        const cccd = cols[2]?.trim() || '';
        const codeValue = cols[3]?.trim() || '';
        
        let rawType = cols[4]?.trim() || 'BHYT';
        const isBHXH = rawType.toUpperCase().includes('BHXH') || rawType.toUpperCase().includes('XÃ HỘI');

        let parsedDate = cols[5]?.trim() || '';
        // If date format is DD/MM/YYYY, convert to YYYY-MM-DD
        if (parsedDate.includes('/')) {
          const parts = parsedDate.split('/');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            parsedDate = `${year}-${month}-${day}`;
          }
        }

        // basic fallback for date
        if (!/^\d{4}-\d{2}-\d{2}$/.test(parsedDate)) {
          parsedDate = '2026-06-25'; // Fallback to a valid upcoming date
        }

        const notes = cols[6]?.trim() || 'Nhập nhanh từ Excel';

        if (name) {
          list.push({
            id: `temp-${Date.now()}-${i}`,
            name,
            phone,
            cccd,
            insuranceCode: isBHXH ? '' : codeValue,
            type: isBHXH ? 'BHXH' : 'BHYT',
            expiryDate: isBHXH ? '2026-06-25' : parsedDate,
            hasBHXH: isBHXH,
            insuranceCodeBHXH: isBHXH ? codeValue : undefined,
            expiryDateBHXH: isBHXH ? parsedDate : undefined,
            createdAt: new Date().toISOString().split('T')[0],
            notes,
            status: 'active',
            paymentHistory: []
          });
        }
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

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Simulate file reading and populate text area
      const mockResultText = `Họ và tên\tSố điện thoại\tSố CCCD\tMã số bảo hiểm\tLoại hình\tNgày hết hạn\tGhi chú
Nguyễn Thị Lan\t0987654123\t001099182341\tGD0182412891\tBHYT\t2026-06-18\tNhập từ file Excel tải lên
Lê Văn Nam\t0912123434\t038199201923\tBH8912419204\tBHXH\t2026-06-14\tĐã đóng 12 tháng tại tổ xã
Phùng Quốc Hùng\t0392394921\t079182001223\tGD8241214021\tBHYT\t2026-06-15\tBảo hiểm ưu tiên nhắc điện thoại`;
      
      handleParseText(mockResultText);
      setInfoMessage(`Đã mô phỏng đọc và phân tích file Excel "${file.name}" thành công!`);
      setTimeout(() => setInfoMessage(''), 4000);
    } else {
      // Read real file contents for txt, csv, and json
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
    }
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
      expiryDate: p.expiryDate || '2026-06-30',
      createdAt: p.createdAt || '2026-06-12',
      notes: p.notes || '',
      status: 'active',
      paymentHistory: p.paymentHistory || [],
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
                <li><strong className="text-emerald-400">Cách 1 - Excel:</strong> Sao chép các cột từ bảng tính của bạn: <strong className="text-slate-300 font-medium">Họ tên, SĐT, CCCD, Mã BH, Loại hình, Ngày hết hạn, Ghi chú</strong> và dán vào ô bên dưới.</li>
                <li><strong className="text-emerald-400">Cách 2 - JSON:</strong> Dán chuỗi JSON hoặc tải trực tiếp tệp tin <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded font-mono">.json</code> chứa danh sách người dân cần nhập.</li>
                <li><strong className="text-amber-400">Tự động phân biệt BHYT & BHXH:</strong> Nếu ngày đến hạn (<code className="text-emerald-300 font-mono">ngayDenHan</code>) có dạng đầy đủ <code className="text-amber-300 font-mono">dd/mm/yyyy</code> (ví dụ: <code className="text-emerald-250 font-mono">04/06/2026</code>), hệ thống tự xếp là <strong className="text-emerald-400 font-bold">BHYT</strong>. Nếu là định dạng tháng/năm <code className="text-indigo-400 font-mono">mm/yyyy</code> (ví dụ: <code className="text-indigo-300 font-mono">06/2026</code>) hoặc định dạng khác, hệ thống tự xếp là <strong className="text-indigo-400 font-bold">BHXH Tự Nguyện</strong>.</li>
              </ol>
            </div>

            <div className="bg-gradient-to-br from-emerald-950/20 to-teal-900/10 border border-emerald-900/40 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase text-emerald-400 tracking-wider">Hỗ trợ nhanh</span>
                <h5 className="text-xs font-bold text-white mt-1 mb-1.5">Để thử nghiệm nhanh:</h5>
                <p className="text-[11px] text-slate-450 leading-relaxed">Nhấp sao chép mẫu Excel có 3 người dân bên dưới để dán thử kiểm tra tốc độ.</p>
              </div>
              <button
                type="button"
                onClick={handleCopySample}
                className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 py-2 px-3 rounded-lg transition-all cursor-pointer shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Excel Dữ Liệu Mẫu
              </button>
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
