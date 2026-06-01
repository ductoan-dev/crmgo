import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore } from '../../store';
import { initials } from '../../utils/helpers';

export default function Topbar() {
  const user   = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const notifications = useDataStore(s => s.notifications);
  const markAllRead   = useDataStore(s => s.markAllRead);
  const [showNotifs, setShowNotifs] = useState(false);

  const unread = notifications.filter(n =>
    !n.read && (
      n.forEmp     === user?.name ||
      (n.forRole   === user?.role && !n.forSupplier) ||
      (n.forSupplier && n.forSupplier === user?.supplier)
    )
  );

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất');
  };

  return (
    <div className="topbar">
      {/* Logo */}
      <div className="tb-logo">
        <div className="tb-logomark">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="white">
            <path d="M4 4h12v2H4zM4 9h8v2H4zM4 14h10v2H4z"/>
          </svg>
        </div>
        <span className="tb-brand">CRMGO</span>
      </div>

      <div className="tb-sep" />

      {/* Notifications */}
      <div style={{ position: 'relative' }}>
        <button
          className="notif-bell"
          onClick={() => setShowNotifs(v => !v)}
          aria-label="Thông báo"
        >
          🔔
          {unread.length > 0 && (
            <span className="notif-badge">
              {unread.length > 9 ? '9+' : unread.length}
            </span>
          )}
        </button>

        {showNotifs && (
          <div style={{
            position:'absolute', top:42, right:0,
            width:320, background:'#fff',
            border:'1.5px solid var(--border)',
            borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,.12)',
            zIndex:200, overflow:'hidden',
          }}>
            <div style={{
              padding:'12px 16px', borderBottom:'1px solid var(--border)',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <span style={{ fontWeight:700, fontSize:13 }}>
                🔔 Thông báo {unread.length > 0 && `(${unread.length})`}
              </span>
              {unread.length > 0 && (
                <button
                  onClick={() => { markAllRead(); setShowNotifs(false); }}
                  style={{ background:'none', border:'none', fontSize:11, color:'var(--primary)', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}
                >
                  Đọc tất cả
                </button>
              )}
            </div>
            <div style={{ maxHeight:360, overflowY:'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding:24, textAlign:'center', color:'var(--muted)', fontSize:13 }}>
                  Không có thông báo
                </div>
              ) : notifications.slice(0, 20).map(n => {
                const isOverdueLead  = n.type === 'overdue_lead';
                const isOverdueOrder = n.type === 'overdue_order';
                const isProdOrder    = n.type === 'new_prod_order' || n.type === 'order_assigned_ncc';
                const isNccQuote     = n.type === 'ncc_quote_overdue';
                const bg = n.read
                  ? '#fff'
                  : isNccQuote     ? '#fff7ed'
                  : isOverdueOrder ? '#fef2f2'
                  : isOverdueLead  ? '#fff8f0'
                  : isProdOrder    ? '#f0fdfa'
                  : 'var(--primary-pale)';
                const borderLeft = !n.read && isNccQuote
                  ? '3px solid #f59e0b'
                  : !n.read && isOverdueOrder
                  ? '3px solid #dc2626'
                  : !n.read && isOverdueLead
                  ? '3px solid #f59e0b'
                  : !n.read && isProdOrder
                  ? '3px solid #0d9488'
                  : !n.read ? '3px solid var(--primary)' : '3px solid transparent';
                const titleColor = !n.read && isNccQuote
                  ? '#d97706'
                  : !n.read && isOverdueOrder
                  ? '#dc2626'
                  : !n.read && isOverdueLead
                  ? '#d97706'
                  : !n.read && isProdOrder
                  ? '#0d9488'
                  : 'inherit';

                return (
                  <div
                    key={n.id}
                    style={{
                      padding:'10px 14px',
                      borderBottom:'1px solid #f3f4f6',
                      borderLeft,
                      background: bg,
                      cursor:'pointer',
                      transition:'background .1s',
                    }}
                    onClick={() => useDataStore.getState().markNotifRead(n.id)}
                  >
                    {/* Title */}
                    <div style={{ fontSize:12, fontWeight: n.read ? 500 : 700, color: titleColor }}
                      dangerouslySetInnerHTML={{ __html: n.title }}
                    />
                    {/* Text (body) */}
                    {n.text && (
                      <div style={{ fontSize:12, color:'#374151', marginTop:2 }}
                        dangerouslySetInnerHTML={{ __html: n.text }}
                      />
                    )}
                    {/* Detail */}
                    {n.detail && (
                      <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{n.detail}</div>
                    )}
                    {/* Time */}
                    {n.time && (
                      <div style={{ fontSize:10, color:'#d1d5db', marginTop:3 }}>
                        {new Date(n.time).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })}
                        {' · '}{new Date(n.time).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* User info */}
      <div className="tb-user">
        <div className="tb-avatar">{initials(user?.name)}</div>
        <span style={{ maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {user?.name}
        </span>
      </div>

      {/* Logout */}
      <button className="tb-logout-btn" onClick={handleLogout}>
        Đăng xuất
      </button>
    </div>
  );
}
