/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  KeyRound, 
  UserPlus, 
  Globe, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck
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
  onBypass: () => void;
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
  const [showServerConfig, setShowServerConfig] = useState(false);
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
      
      setSuccessMsg('Xác thực Google thành công! Đang kết nối tài khoản...');
      const idToken = await fbUser.getIdToken();
      
      const resp = await loginWithFirebaseToWordPress(idToken);
      setSuccessMsg('Đăng nhập thành công!');
      onSuccess(resp.user);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('unauthorized-domain'))) {
        setErrorMsg(
          `Tên miền ${window.location.hostname} chưa được mở quyền trong Firebase. Vui lòng kiểm tra lại cấu hình Domain ủy quyền.`
        );
      } else if (err.code === 'auth/operation-not-allowed' || (err.message && err.message.includes('operation-not-allowed'))) {
        setErrorMsg('Phương thức đăng nhập Google chưa được bật trong Firebase Console.');
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

    const trimmedUrl = wpUrl.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setErrorMsg('Địa chỉ WordPress GraphQL phải bắt đầu bằng http:// hoặc https://');
      return;
    }
    setStoredWordPressUrl(trimmedUrl);

    if (activeTab === 'register') {
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        setErrorMsg('Vui lòng nhập địa chỉ Email hợp lệ.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Mật khẩu tối thiểu từ 6 ký tự.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
        return;
      }

      setIsLoading(true);
      try {
        await registerToWordPress(username.trim(), email.trim(), password);
        setSuccessMsg('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.');
        setActiveTab('login');
        setPassword('');
        setConfirmPassword('');
      } catch (err: any) {
        setErrorMsg(err.message || 'Lỗi đăng ký tài khoản.');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!username.trim() || !password) {
        setErrorMsg('Vui lòng nhập tài khoản và mật khẩu.');
        return;
      }

      setIsLoading(true);
      try {
        const resp = await loginToWordPress(username.trim(), password);
        onSuccess(resp.user);
      } catch (err: any) {
        setErrorMsg(err.message || 'Tài khoản hoặc mật khẩu không chính xác.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div id="wordpress-auth-view" className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      
      {/* Soft Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-emerald-950/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] bg-teal-950/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 transition-all duration-300">
        
        {/* Simplified Header */}
        <div className="px-6 py-6 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-b border-slate-800/80 text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-extrabold flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">LWS - Sổ thu bảo hiểm</h2>
          <p className="text-xs text-slate-300 mt-1">Dành Cho Nhân Viên Thu BHXH & BHYT</p>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Messages */}
          {errorMsg && (
            <div className="bg-rose-950/40 border border-rose-900/80 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs flex gap-2.5 items-start leading-relaxed animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-900/80 text-emerald-300 px-3.5 py-2.5 rounded-xl text-xs flex gap-2.5 items-start leading-relaxed animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>{successMsg}</div>
            </div>
          )}

          {/* Quick Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
            className={`w-full py-3 px-4 text-xs font-bold text-white bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 active:scale-99 rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm ${
              (isLoading || isGoogleLoading) ? 'opacity-70 pointer-events-none' : ''
            }`}
          >
            {isGoogleLoading ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.56h3.3c1.92,-1.77 3.02,-4.38 3.02,-7.36c0,-0.61 -0.05,-1.21 -0.15,-1.78z" fill="#4285F4" />
                <path d="M12,20.6c2.6,0 4.77,-0.86 6.36,-2.34l-3.3,-2.56c-0.91,0.61 -2.08,0.98 -3.06,0.98c-2.37,0 -4.38,-1.6 -5.1,-3.74H3.4v2.64c1.6,3.18 4.9,5.26 8.6,5.26z" fill="#34A853" />
                <path d="M6.9,12.94c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7c0,-0.59 0.1,-1.16 0.28,-1.7V6.9H3.4c-0.6,1.2 -0.94,2.56 -0.94,4c0,1.44 0.34,2.8 0.94,4l3.5,-2.72c0,-0.02 0,-0.02 0,-0.02z" fill="#FBBC05" />
                <path d="M12,6.38c1.4,0 2.67,0.48 3.66,1.43l2.74,-2.74C16.76,3.52 14.6,2.6 12,2.6C8.3,2.6 5,4.68 3.4,7.86l3.5,2.72c0.72,-2.14 2.73,-3.74 5.1,-3.74z" fill="#EA4335" />
              </svg>
            )}
            <span>Đăng nhập nhanh bằng Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">hoặc tài khoản</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-850">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'login'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Đăng Ký
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tên tài khoản:</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tên đăng nhập"
                className="w-full text-xs p-2.5 border border-slate-800 bg-slate-950 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            {activeTab === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email:</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Địa chỉ email"
                  className="w-full text-xs p-2.5 border border-slate-800 bg-slate-950 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Mật khẩu:</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full text-xs p-2.5 pr-10 border border-slate-800 bg-slate-950 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {activeTab === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Xác nhận mật khẩu:</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full text-xs p-2.5 border border-slate-800 bg-slate-950 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-2 py-3 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 rounded-xl transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer ${
                isLoading ? 'opacity-70 pointer-events-none' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang xử lý...
                </>
              ) : activeTab === 'login' ? (
                <>
                  Đăng Nhập Ngay
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Tạo Tài Khoản
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Offline Mode direct access button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onBypass}
              className="w-full py-2.5 text-xs text-slate-300 bg-slate-950 border border-slate-800 hover:bg-slate-850 hover:text-white rounded-xl transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Sử dụng ngay không cần đăng nhập (Lưu trên máy)
            </button>
          </div>

          {/* Collapsible Advanced WordPress Server Configuration */}
          <div className="pt-2 border-t border-slate-850">
            <button
              type="button"
              onClick={() => setShowServerConfig(!showServerConfig)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center justify-between w-full py-1 cursor-pointer font-medium"
            >
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                Cấu hình máy chủ WordPress GraphQL
                {wpUrl !== DEFAULT_ENDPOINT && (
                  <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-800/80 px-1.5 py-0.2 rounded font-mono">
                    Tùy chỉnh
                  </span>
                )}
              </span>
              {showServerConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showServerConfig && (
              <div className="mt-2.5 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                    URL WPGraphQL Endpoint:
                  </label>
                  {wpUrl !== DEFAULT_ENDPOINT && (
                    <button
                      type="button"
                      onClick={() => {
                        setWpUrl(DEFAULT_ENDPOINT);
                        setStoredWordPressUrl(DEFAULT_ENDPOINT);
                      }}
                      className="text-[10px] text-emerald-400 hover:underline font-semibold cursor-pointer"
                    >
                      Đặt lại mặc định
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={wpUrl}
                  onChange={(e) => {
                    setWpUrl(e.target.value);
                    setStoredWordPressUrl(e.target.value);
                  }}
                  placeholder={DEFAULT_ENDPOINT}
                  className="w-full text-xs p-2.5 border border-slate-800 bg-slate-900 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Cho phép kết nối đến máy chủ WordPress (WPGraphQL) riêng của bạn hoặc mặc định hệ thống cloud của Long Web Studio.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
