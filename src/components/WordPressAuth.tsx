import React, { useState } from 'react';
import { 
  KeyRound, 
  UserPlus, 
  Globe, 
  HelpCircle, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  BookOpen, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { 
  getStoredWordPressUrl, 
  setStoredWordPressUrl, 
  loginToWordPress, 
  registerToWordPress,
  loginWithFirebaseToWordPress,
  DEFAULT_ENDPOINT,
  WPUser
} from '../lib/graphql';
import { signInWithGoogle } from '../lib/firebase';

interface WordPressAuthProps {
  onSuccess: (userInfo: WPUser) => void;
  onBypass: () => void; // Allow offline local storage bypass as a helpful demo fallback!
}

export default function WordPressAuth({ onSuccess, onBypass }: WordPressAuthProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // input fields
  const [wpUrl, setWpUrl] = useState(getStoredWordPressUrl());
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // visual controls
  const [showPassword, setShowPassword] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // operation status
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);
    
    try {
      const fbUser = await signInWithGoogle();
      if (!fbUser || !fbUser.email) {
        throw new Error('Không lấy được thông tin email từ tài khoản Google.');
      }
      
      setSuccessMsg('Xác thực Google thành công! Đang lấy Firebase ID Token...');
      const idToken = await fbUser.getIdToken();
      
      setSuccessMsg('Đang gửi Token đến WordPress để xác thực và tạo phiên đăng nhập...');
      const resp = await loginWithFirebaseToWordPress(idToken);
      
      setSuccessMsg('Đăng nhập thành công!');
      onSuccess(resp.user);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('unauthorized-domain'))) {
        setErrorMsg(
          `Tên miền của website hiện tại chưa được cấp quyền (Authorized Domain) trong cấu hình Firebase của bạn.\n\n` +
          `Để khắc phục, vui lòng thêm tên miền này vào danh sách miền được ủy quyền của Firebase:\n` +
          `1. Mở Firebase Console -> Authentication -> Settings -> Authorized domains.\n` +
          `2. Thêm tên miền sau:\n` +
          `• ${window.location.hostname}\n\n` +
          `Sau đó tải lại trang và tiến hành đăng nhập bằng Google.`
        );
      } else if (err.code === 'auth/operation-not-allowed' || (err.message && err.message.includes('operation-not-allowed'))) {
        setErrorMsg(
          `Phương thức đăng nhập bằng Google chưa được bật trong Firebase Console.\n\n` +
          `Để khắc phục, vui lòng kích hoạt nhà cung cấp dịch vụ Google:\n` +
          `1. Truy cập vào Firebase Console.\n` +
          `2. Đi tới phần Authentication -> Sign-in method.\n` +
          `3. Chọn "Add new provider" và kích hoạt nhà cung cấp dịch vụ **Google**.\n` +
          `4. Điền các thông tin bắt buộc và lưu lại.\n\n` +
          `Sau đó tiến hành quay lại website và đăng nhập bằng Google một lần nữa.`
        );
      } else if (err.message && (err.message.includes('loginWithFirebase') || err.message.includes('Cannot query field'))) {
        setErrorMsg(
          `Website WordPress của bạn chưa được cài đặt Plugin đăng nhập liên kết qua Firebase.\n\n` +
          `Để khắc phục, vui lòng cài đặt plugin hỗ trợ đăng nhập Firebase trên WordPress của bạn:\n` +
          `1. Tạo tập tin PHP mới có tên 'lws-custom-auth-sync.php' trong thư mục '/wp-content/plugins/' của WordPress.\n` +
          `2. Sao chép đoạn mã PHP hỗ trợ đăng nhập qua Firebase vào đó.\n` +
          `3. Truy cập trang Quản trị WordPress -> Gói mở rộng (Plugins) -> Kích hoạt plugin "LWS Custom Auth & Sync".\n\n` +
          `Sau khi kích hoạt xong, quay lại đây, tải lại trang và thử đăng nhập bằng Google để trải nghiệm tính năng liên kết tự động!`
        );
      } else {
        setErrorMsg(err.message || 'Đăng nhập Google thất bại hoặc đã bị từ chối.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Save GraphQL endpoint URL first
    const trimmedUrl = wpUrl.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setErrorMsg('Địa chỉ WPGraphQL phải bắt đầu bằng http:// hoặc https://');
      return;
    }
    setStoredWordPressUrl(trimmedUrl);

    if (activeTab === 'register') {
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        setErrorMsg('Vui lòng nhập địa chỉ Email hợp lệ.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Mật khẩu tối thiểu phải từ 6 ký tự để bảo mật.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Mật khẩu nhập lại không trùng khớp.');
        return;
      }

      setIsLoading(true);
      try {
        await registerToWordPress(username.trim(), email.trim(), password);
        setSuccessMsg('Đăng ký tài khoản WordPress thành công! Bạn có thể đăng nhập ngay.');
        setActiveTab('login');
        setPassword('');
        setConfirmPassword('');
      } catch (err: any) {
        setErrorMsg(err.message || 'Lỗi đăng ký. Đảm bảo plugin hỗ trợ đăng ký người dùng ở WPGraphQL đã được cài đặt.');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!username.trim() || !password) {
        setErrorMsg('Vui lòng điền đầy đủ tài khoản và mật khẩu.');
        return;
      }

      setIsLoading(true);
      try {
        const resp = await loginToWordPress(username.trim(), password);
        onSuccess(resp.user);
      } catch (err: any) {
        setErrorMsg(err.message || 'Lỗi đăng nhập. Vui lòng kiểm tra lại Đường dẫn GraphQL, Tên tài khoản hoặc Mật khẩu.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div id="wordpress-auth-view" className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      
      {/* Absolute Decorative Circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-950/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-950/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Login / Register Card Container */}
      <div className="w-full max-w-lg bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 transition-all duration-300">
        
        {/* Brand Banner */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-950 to-teal-950 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-extrabold shadow-sm">
              Wp
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-extrabold block">KẾT NỐI BACKEND</span>
              <h2 className="text-base font-bold text-white block">Sổ Thu WordPress GraphQL</h2>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-emerald-950/40 border border-emerald-900/60 rounded-lg px-2.5 py-1 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">ĐÃ BẢO MẬT</span>
          </div>
        </div>

        <form onSubmit={handleAuthSubmit} className="p-6 space-y-5 flex-1">
          
          {/* Informational Section (Endpoint Configuration - secure read-only) */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400" /> Máy chủ lưu trữ WordPress
              </span>
              <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded font-extrabold border border-emerald-900/50">
                MẶC ĐỊNH SẴN SÀNG
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Hệ thống được đóng gói kết nối trực tiếp và an toàn đến máy chủ WordPress của <strong>Long Web Studio</strong>:
            </p>
            
            
          </div>

          {/* Form Message States */}
          {errorMsg && (
            <div className="bg-rose-950/40 border border-rose-900 text-rose-400 px-4 py-3 rounded-xl text-xs flex gap-2.5 items-start leading-relaxed animate-fade-in whitespace-pre-line">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Gặp lỗi kết nối:</strong>
                {errorMsg}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-900 text-emerald-400 px-4 py-3 rounded-xl text-xs flex gap-2.5 items-start leading-relaxed animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Thành công:</strong>
                {successMsg}
              </div>
            </div>
          )}

          {/* Google Sign In Federated Button powered by Firebase */}
          <div className="space-y-2 select-none animate-in fade-in slide-in-from-top-2 duration-300">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading}
              className={`w-full py-3 px-4 text-xs font-bold text-slate-100 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 active:scale-99 rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer shadow-md ${
                (isLoading || isGoogleLoading) ? 'opacity-70 pointer-events-none' : ''
              }`}
            >
              {isGoogleLoading ? (
                <div className="w-4.5 h-4.5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.56h3.3c1.92,-1.77 3.02,-4.38 3.02,-7.36c0,-0.61 -0.05,-1.21 -0.15,-1.78z" fill="#4285F4" />
                  <path d="M12,20.6c2.6,0 4.77,-0.86 6.36,-2.34l-3.3,-2.56c-0.91,0.61 -2.08,0.98 -3.06,0.98c-2.37,0 -4.38,-1.6 -5.1,-3.74H3.4v2.64c1.6,3.18 4.9,5.26 8.6,5.26z" fill="#34A853" />
                  <path d="M6.9,12.94c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7c0,-0.59 0.1,-1.16 0.28,-1.7V6.9H3.4c-0.6,1.2 -0.94,2.56 -0.94,4c0,1.44 0.34,2.8 0.94,4l3.5,-2.72c0,-0.02 0,-0.02 0,-0.02z" fill="#FBBC05" />
                  <path d="M12,6.38c1.4,0 2.67,0.48 3.66,1.43l2.74,-2.74C16.76,3.52 14.6,2.6 12,2.6C8.3,2.6 5,4.68 3.4,7.86l3.5,2.72c0.72,-2.14 2.73,-3.74 5.1,-3.74z" fill="#EA4335" />
                </svg>
              )}
              <span>ĐĂNG NHẬP NHANH BẰNG GOOGLE</span>
            </button>
            
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-850/60"></div>
              <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-bold uppercase tracking-wider">Hoặc sử dụng tài khoản mật khẩu</span>
              <div className="flex-grow border-t border-slate-850/60"></div>
            </div>
          </div>

         

          {/* Actual fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Tên tài khoản (WordPress Username):</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ví dụ: admin hoặc dai_ly_thu"
                className="w-full text-xs p-3 border border-slate-800 bg-slate-950 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            {activeTab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Địa chỉ Email:</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nhập-email-của-bạn@longwebstudio.net"
                  className="w-full text-xs p-3 border border-slate-800 bg-slate-950 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Mật khẩu bảo mật:</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full text-xs p-3 pr-10 border border-slate-800 bg-slate-950 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {activeTab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Nhập lại mật khẩu:</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu chính xác"
                  className="w-full text-xs p-3 border border-slate-800 bg-slate-950 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer ${
                isLoading ? 'opacity-70 pointer-events-none' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang gửi tới WordPress...
                </>
              ) : activeTab === 'login' ? (
                <>
                  Đăng Nhập Hệ Thống
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Đăng Ký Tài Khoản WordPress
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Offline Bypass/Demo Mode for fast testing fallback! */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-850"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Hoặc trải nghiệm thử</span>
              <div className="flex-grow border-t border-slate-850"></div>
            </div>

            <button
              type="button"
              onClick={onBypass}
              className="w-full py-2.5 text-xs text-slate-400 bg-slate-950 border border-slate-850 hover:bg-slate-900 hover:text-white rounded-xl transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Sử dụng chế độ Offline (Lưu trữ Trình duyệt) ➔
            </button>
          </div>

        </form>

        {/* Informative Footer explaining dependencies */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-850 text-[10px] text-slate-500 space-y-1.5">
          <div className="flex items-center gap-1 text-slate-400 font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Yêu Cầu Phía Máy Chủ WordPress:
          </div>
          <p className="leading-relaxed">
            Để tính năng hoạt động chính xác, máy chủ WordPress của anh/chị cần cài và cấu hình các plugin sau:
            <br />
            1. <strong className="text-slate-300">WPGraphQL</strong> — Hỗ trợ ngôn ngữ truy vấn GraphQL.
            <br />
            2. <strong className="text-slate-300">WPGraphQL JWT Authentication</strong> — Hỗ rợ xác thực qua token JWT và cung cấp mutation `login`.
          </p>
        </div>

      </div>
    </div>
  );
}
