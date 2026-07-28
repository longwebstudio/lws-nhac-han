import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Share2, Globe, ShieldCheck, Sparkles, MessageCircle, QrCode, Send } from 'lucide-react';
import { DEFAULT_SEO, updateSEOTags } from '../lib/seo';

interface SEOShareModalProps {
  agencyName?: string;
  customerCount?: number;
  onClose: () => void;
}

export default function SEOShareModal({ agencyName, customerCount = 0, onClose }: SEOShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState<'zalo' | 'facebook' | 'google'>('zalo');

  const appUrl = 'https://app.longwebstudio.io.vn/';
  const displayAgency = agencyName || 'Đại Lý Thu BHXH, BHYT';

  const ogTitle = `LWS Sổ Thu Bảo Hiểm - ${displayAgency}`;
  const ogDesc = `Sổ thu công nghệ chuyên nghiệp quản lý ${customerCount > 0 ? customerCount : 'hàng trăm'} người dân đóng BHYT Hộ gia đình & BHXH Tự nguyện. Tự động nhắc hạn Zalo 3s, tính giảm trừ chính xác!`;
  const ogImage = DEFAULT_SEO.ogImage;

  const zaloPostText = `🎉 SỔ THU BẢO HIỂM CÔNG NGHỆ BHYT & BHXH TỰ NGUYỆN
👉 Dành riêng cho Nhân viên thu & Điểm thu BHXH, BHYT!

✅ Quản lý danh sách người dân không giới hạn
✅ Tự động tính định mức BHYT hộ gia đình (Lương cơ sở 2.530.000đ)
✅ Tự động tính mức đóng BHXH tự nguyện (Hỗ trợ Nhà nước 132.000đ/tháng)
✅ Tạo tin nhắn Zalo/SMS nhắc đáo hạn tự động trong 3 giây
✅ Sao lưu dữ liệu WordPress Cloud an toàn tuyệt đối

TRUY CẬP SỬ DỤNG MIỄN PHÍ NGAY TẠI:
🌐 ${appUrl}

Phát triển bởi Freelancer Long Web Studio (Zalo: 0966570913)`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPost = () => {
    navigator.clipboard.writeText(zaloPostText);
    setCopiedPost(true);
    setTimeout(() => setCopiedPost(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: ogTitle,
          text: ogDesc,
          url: appUrl,
        });
      } catch (e) {
        console.log('Share cancelled or failed', e);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleApplyCustomSEO = () => {
    updateSEOTags({
      title: ogTitle,
      description: ogDesc,
      ogUrl: appUrl,
      canonicalUrl: appUrl,
    });
    alert('Đã cập nhật tự động thẻ SEO Open Graph (OG) lên tiêu đề trang web!');
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}&margin=10`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Modal Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-emerald-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Tối Ưu SEO & Chia Sẻ Ứng Dụng
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full font-mono">
                  OG Live
                </span>
              </h3>
              <p className="text-xs text-slate-400">Xem trước hiển thị hình ảnh & thông tin khi chia sẻ đường liên kết qua Zalo, Facebook, QR Code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-850 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Domain Canonical & Direct Quick Action Bar */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đường Dẫn Chuẩn Canonical & Share URL:</span>
                <p className="text-xs font-mono text-emerald-400 font-bold">{appUrl}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleNativeShare}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Chia sẻ nhanh qua ứng dụng trên điện thoại"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Chia Sẻ Nhanh</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-750 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  {copiedLink ? 'Đã sao chép!' : 'Sao chép Link'}
                </button>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border ${
                    showQR
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-750'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mã QR</span>
                </button>
              </div>
            </div>

            {/* Quick External Share Buttons */}
            <div className="pt-2 border-t border-slate-850 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">Chia sẻ trực tiếp:</span>
              <a
                href={`https://zalo.me/share?url=${encodeURIComponent(appUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800/80 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors"
              >
                <MessageCircle className="w-3 h-3 text-blue-400" /> Zalo Share
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/80 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors"
              >
                <Globe className="w-3 h-3 text-indigo-400" /> Facebook
              </a>
            </div>

            {/* QR Code Section */}
            {showQR && (
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-4 flex-col sm:flex-row text-center sm:text-left animate-in fade-in duration-200">
                <div className="p-2 bg-white rounded-xl shadow-md shrink-0">
                  <img
                    src={qrCodeUrl}
                    alt="LWS App QR Code"
                    className="w-28 h-28 object-contain"
                  />
                </div>
                <div className="space-y-1 text-xs">
                  <h5 className="font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
                    <QrCode className="w-4 h-4 text-amber-400" />
                    <span>Quét Mã QR Để Mở Trên Điện Thoại</span>
                  </h5>
                  <p className="text-slate-400 leading-relaxed">
                    Sử dụng camera điện thoại hoặc Zalo Quét Mã để truy cập và lưu ứng dụng trực tiếp trên thiết bị di động của bạn.
                  </p>
                  <p className="text-[10px] text-emerald-400 font-mono font-bold pt-1">{appUrl}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tab Selector for Preview Platforms */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Xem Trước Thẻ OG (Open Graph Card Preview):
              </label>
              <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('zalo')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'zalo' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Zalo Share
                </button>
                <button
                  onClick={() => setActiveTab('facebook')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'facebook' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Facebook / Messenger
                </button>
                <button
                  onClick={() => setActiveTab('google')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'google' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Google Search
                </button>
              </div>
            </div>

            {/* Zalo Card Mockup */}
            {activeTab === 'zalo' && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-blue-900/60 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-xs text-blue-400 border-b border-slate-800 pb-2">
                  <span className="font-bold flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-blue-400" /> Thẻ xem trước tin nhắn Zalo Chat (og:image & og:title)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">zalo.me</span>
                </div>
                <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 max-w-md mx-auto shadow-lg">
                  <div className="aspect-[1.91/1] bg-slate-950 relative overflow-hidden">
                    <img
                      src={ogImage}
                      alt="Zalo OG Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-emerald-400 font-mono border border-slate-800">
                      app.longwebstudio.io.vn
                    </div>
                  </div>
                  <div className="p-3.5 space-y-1">
                    <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">{ogTitle}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{ogDesc}</p>
                    <span className="text-[10px] text-blue-400 font-medium block pt-1">app.longwebstudio.io.vn</span>
                  </div>
                </div>
              </div>
            )}

            {/* Facebook / Messenger Card Mockup */}
            {activeTab === 'facebook' && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-900/60 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-xs text-indigo-400 border-b border-slate-800 pb-2">
                  <span className="font-bold flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-indigo-400" /> Thẻ xem trước Facebook Meta Tag
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">facebook.com</span>
                </div>
                <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 max-w-md mx-auto shadow-lg">
                  <div className="aspect-[1.91/1] bg-slate-950 relative overflow-hidden">
                    <img
                      src={ogImage}
                      alt="Facebook OG Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-3.5 space-y-1.5 bg-slate-900 border-t border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">APP.LONGWEBSTUDIO.IO.VN</span>
                    <h4 className="text-sm font-bold text-white line-clamp-2">{ogTitle}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{ogDesc}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Google Search Result Mockup */}
            {activeTab === 'google' && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-amber-900/60 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-xs text-amber-400 border-b border-slate-800 pb-2">
                  <span className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Thẻ xem trước kết quả tìm kiếm Google (SEO Title & Snippet)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">google.com</span>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1 font-sans">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">L</span>
                    <span className="font-medium text-slate-200">LWS Sổ Thu Bảo Hiểm</span>
                    <span className="text-slate-500">https://app.longwebstudio.io.vn</span>
                  </div>
                  <h4 className="text-base font-medium text-blue-400 hover:underline cursor-pointer pt-1">{ogTitle}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed pt-0.5">{ogDesc}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Copy Post Template for Zalo */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> Bài Viết Mẫu Chia Sẻ LWS App Trên Zalo:
              </label>
              <button
                onClick={handleCopyPost}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {copiedPost ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedPost ? 'Đã Sao Chép Bài Viết!' : 'Sao Chép Bài Đăng Zalo'}
              </button>
            </div>
            <textarea
              readOnly
              value={zaloPostText}
              rows={6}
              className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono leading-relaxed focus:outline-none select-all"
            />
          </div>

          {/* Active OG Tag Details Inspection */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850 space-y-2 text-xs">
            <h5 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center justify-between">
              <span>Danh Sách Thẻ Open Graph (OG Meta Tags) Đã Tự Động Tạo:</span>
              <button
                onClick={handleApplyCustomSEO}
                className="text-[10px] text-emerald-400 hover:underline cursor-pointer font-bold"
              >
                Cập nhật thẻ HEAD ngay
              </button>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold block">og:site_name</span>
                <span>LWS Sổ Thu Bảo Hiểm</span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold block">og:url / canonical</span>
                <span className="truncate block">{appUrl}</span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 col-span-1 sm:col-span-2">
                <span className="text-emerald-400 font-bold block">og:title</span>
                <span className="text-slate-200">{ogTitle}</span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 col-span-1 sm:col-span-2">
                <span className="text-emerald-400 font-bold block">og:image (1200x630)</span>
                <span className="truncate block text-slate-300">{ogImage}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Tự động tối ưu SEO cho Zalo, Facebook & Google
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
