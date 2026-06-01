import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore } from '../../store';
import { ROLE_LBL } from '../../utils/constants';
import { api } from '../../utils/api';

const ROLES = [
  { value:'sales',  icon:'💼', label:'Kinh doanh' },
  { value:'mkt',    icon:'📣', label:'Marketing' },
  { value:'cskh',   icon:'🤝', label:'CSKH' },
  { value:'ketoan', icon:'💰', label:'Kế toán' },
  { value:'design', icon:'🎨', label:'Thiết kế' },
  { value:'kho',    icon:'📦', label:'Kho' },
  { value:'smgr',   icon:'🗂️', label:'Quản lý NCC' },
  { value:'prod',   icon:'🏭', label:'Nhà cung cấp' },
  { value:'admin',  icon:'🔴', label:'Admin' },
];

export default function LoginScreen() {
  const [selRole, setSelRole] = useState('sales');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const getUser  = useAuthStore(s => s.getUser);
  const login    = useAuthStore(s => s.login);
  const setUseApi = useAuthStore(s => s.setUseApi);
  const loadData = useDataStore(s => s.load);

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error('Vui lòng nhập tài khoản và mật khẩu');
      return;
    }
    setLoading(true);

    // ── Bước 1: Xác thực (API hoặc Demo) ──────────────────────
    let apiMode = false;
    let loggedInUser = null;

    try {
      // Thử backend API trước
      const { accessToken, refreshToken, user: apiUser } = await api.auth.login(username, password);
      if (apiUser.role !== selRole) {
        toast.error(`Tài khoản này thuộc loại "${ROLE_LBL[apiUser.role]}"`);
        setLoading(false);
        return;
      }
      login(
        { ...apiUser, isLeader: apiUser.is_leader || false, permissions: apiUser.permissions || {} },
        accessToken,
        refreshToken,
      );
      setUseApi(true);
      apiMode = true;
      loggedInUser = apiUser;
    } catch (_apiErr) {
      // Backend lỗi → fallback demo mode
      const demoUser = getUser(username, password);
      if (!demoUser) {
        toast.error('Tài khoản hoặc mật khẩu không đúng');
        setLoading(false);
        return;
      }
      if (demoUser.role !== selRole) {
        toast.error(`Tài khoản này thuộc loại "${ROLE_LBL[demoUser.role]}"`);
        setLoading(false);
        return;
      }
      setUseApi(false);
      login({ ...demoUser, isLeader: false, permissions: {} });
      loggedInUser = demoUser;
    }

    // ── Bước 2: Load dữ liệu (xử lý lỗi riêng, không ảnh hưởng login) ─
    try {
      await loadData();
    } catch (loadErr) {
      console.warn('[CRMGO] Load data error (non-fatal):', loadErr.message);
    }

    toast.success(`${apiMode ? '✅' : ''} Chào mừng, ${loggedInUser.name}!${apiMode ? '' : ' (Demo mode)'}`);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="login-screen">
      <div className="login-box">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-brand">CRMGO</div>
          <div className="login-tagline">Hệ thống CRM In ấn & Bao bì</div>
        </div>

        {/* Role selector */}
        <div style={{ marginBottom: 16 }}>
          <div className="fi-label" style={{ marginBottom: 8 }}>Chọn vai trò của bạn</div>
          <div className="role-grid">
            {ROLES.map(r => (
              <button
                key={r.value}
                className={`role-btn ${selRole === r.value ? 'selected' : ''}`}
                onClick={() => setSelRole(r.value)}
                type="button"
              >
                <span className="role-icon">{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Username */}
        <div className="fi-group">
          <label className="fi-label">Tên đăng nhập</label>
          <input
            className="fi"
            type="text"
            placeholder="Nhập username..."
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="username"
          />
        </div>

        {/* Password */}
        <div className="fi-group">
          <label className="fi-label">Mật khẩu</label>
          <input
            className="fi"
            type="password"
            placeholder="Nhập mật khẩu..."
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="current-password"
          />
        </div>

        {/* Submit */}
        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập'}
        </button>

        {/* Demo hint */}
        <div style={{ textAlign:'center', marginTop:16, fontSize:11, color:'#94a3b8' }}>
          Mật khẩu mặc định: <strong>123456</strong>
        </div>
      </div>
    </div>
  );
}
