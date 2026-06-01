import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore } from './store';
import LoginScreen from './components/auth/LoginScreen';
import AppShell    from './components/layout/AppShell';
import { api, tokenStore } from './utils/api';
import './styles/globals.css';

export default function App() {
  const user       = useAuthStore(s => s.user);
  const login      = useAuthStore(s => s.login);
  const logout     = useAuthStore(s => s.logout);
  const setUseApi  = useAuthStore(s => s.setUseApi);
  const load       = useDataStore(s => s.load);

  useEffect(() => {
    // ── Bắt sự kiện session hết hạn (refresh token expired) ──
    const onExpired = () => {
      logout();
      toast.error('⏰ Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', { duration: 4000 });
    };
    window.addEventListener('crmgo:session-expired', onExpired);

    // ── Khôi phục session từ refresh token ────────────────────
    const refreshToken = tokenStore.getRefresh();
    if (refreshToken && !user) {
      api.auth.refresh(refreshToken)
        .then(async ({ accessToken, refreshToken: newRT, user: apiUser }) => {
          // Cập nhật token mới (rotation)
          tokenStore.setAccess(accessToken);
          tokenStore.setRefresh(newRT);
          login(
            { ...apiUser, isLeader: apiUser.is_leader || false, permissions: apiUser.permissions || {} },
            accessToken,
            newRT
          );
          setUseApi(true);
          await load();
        })
        .catch(() => {
          // Refresh token hết hạn hoặc không hợp lệ
          tokenStore.clearAll();
          load(); // load localStorage demo
        });
    } else {
      load(); // Không có token → demo mode
    }

    return () => window.removeEventListener('crmgo:session-expired', onExpired);
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          className: 'toast',
          style: { fontFamily: 'inherit', fontSize: 13 },
        }}
      />
      {user ? <AppShell /> : <LoginScreen />}
    </>
  );
}
