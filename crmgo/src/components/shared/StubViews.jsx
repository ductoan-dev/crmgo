// ── Stub views for remaining roles ────────────────────────────
// These provide working shells that can be extended

import React from 'react';
import { useAuthStore, useDataStore, useUIStore } from '../../store';
import { fmt, fmtDate } from '../../utils/helpers';
import { WF_LABEL } from '../../utils/constants';
import KetoanView from '../ketoan/KetoanView';

// ── SmgrView ──────────────────────────────────────────────────
export function SmgrView() {
  const orders = useDataStore(s => s.orders);
  const activeTab = useUIStore(s => s.activeTab);

  const pending = orders.filter(o => !o.oppId || (o.wfStatus === 'kt_approved'));
  const inProd  = orders.filter(o => ['in_production','supplier_sent','in_warehouse'].includes(o.wfStatus));

  if (activeTab === 'ai') return (
    <div className="empty-state">
      <div className="empty-icon">🤖</div>
      <div className="empty-text">AI Báo Giá Tự Động</div>
      <div className="empty-sub">Chỉ phân tích cơ hội chưa có báo giá</div>
    </div>
  );

  return (
    <div>
      <div className="kpi-strip">
        <div className="kpi-card" style={{ borderTopColor:'#f59e0b' }}>
          <div className="kpi-lbl">⏳ Chờ báo giá</div>
          <div className="kpi-val" style={{ color:'#f59e0b' }}>{pending.length}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor:'#0d9488' }}>
          <div className="kpi-lbl">🏭 Đang sản xuất</div>
          <div className="kpi-val" style={{ color:'#0d9488' }}>{inProd.length}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor:'#16a34a' }}>
          <div className="kpi-lbl">✅ Hoàn thành</div>
          <div className="kpi-val" style={{ color:'#16a34a' }}>{orders.filter(o=>o.wfStatus==='delivered').length}</div>
        </div>
      </div>
      {inProd.map(o => (
        <div key={o.id} className="ord-card" style={{ borderLeft:'4px solid #0d9488' }}>
          <div className="ord-card-head">
            <span className="ord-code">{o.code}</span>
            <span className="ord-name">{o.name}</span>
            <span className="ord-amount">{fmt(o.grandTotal)}</span>
          </div>
          <div className="ord-meta">
            <div className="ord-meta-item"><div className="ord-meta-label">KD</div><div className="ord-meta-val">{o.emp}</div></div>
            <div className="ord-meta-item"><div className="ord-meta-label">NCC</div><div className="ord-meta-val">{o.smgrNccName||'Chưa chọn'}</div></div>
            {o.smgrExpectDate && <div className="ord-meta-item"><div className="ord-meta-label">Hạn giao</div><div className="ord-meta-val">{fmtDate(o.smgrExpectDate)}</div></div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── AdminView ─────────────────────────────────────────────────
import { DEMO_ACCOUNTS, ROLE_LBL } from '../../utils/constants';
export function AdminView() {
  const activeTab = useUIStore(s => s.activeTab);
  if (activeTab === 'users') return (
    <div>
      <div style={{ marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ fontSize:16, fontWeight:800 }}>👤 Quản lý tài khoản</h2>
        <button className="btn btn-primary btn-sm">+ Thêm tài khoản</button>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Username</th><th>Họ tên</th><th>Vai trò</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
          <tbody>
            {DEMO_ACCOUNTS.map((u,i) => (
              <tr key={u.username}>
                <td><code style={{fontSize:12}}>{u.username}</code></td>
                <td style={{fontWeight:600}}>{u.name}</td>
                <td><span className="badge badge-blue">{ROLE_LBL[u.role]}</span></td>
                <td><span className="badge badge-green">✅ Hoạt động</span></td>
                <td><button className="btn btn-ghost btn-sm">Sửa</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  return (
    <div>
      <div className="kpi-strip">
        {[
          {label:'Tổng đơn hàng', val: useDataStore.getState().orders.length, color:'var(--primary)'},
          {label:'Cơ hội', val: useDataStore.getState().opps.length, color:'#2563eb'},
          {label:'Lead', val: useDataStore.getState().leads.length, color:'#7c3aed'},
          {label:'Tài khoản', val: DEMO_ACCOUNTS.length, color:'#0891b2'},
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{borderTopColor:k.color}}>
            <div className="kpi-lbl">{k.label}</div>
            <div className="kpi-val" style={{color:k.color}}>{k.val}</div>
          </div>
        ))}
      </div>
      <div className="empty-state">
        <div className="empty-icon">🔴</div>
        <div className="empty-text">Admin Dashboard</div>
        <div className="empty-sub">Xem tab Nhân sự để quản lý tài khoản</div>
      </div>
    </div>
  );
}

// ── DesignView ────────────────────────────────────────────────
export function DesignView() {
  const orders = useDataStore(s => s.orders);
  const designOrds = orders.filter(o => o.orderType === 'thiet-ke');
  return (
    <div>
      <div className="kpi-strip">
        <div className="kpi-card" style={{borderTopColor:'#db2877'}}>
          <div className="kpi-lbl">🎨 Đơn thiết kế</div>
          <div className="kpi-val" style={{color:'#db2877'}}>{designOrds.length}</div>
        </div>
      </div>
      {designOrds.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🎨</div><div className="empty-text">Chưa có đơn thiết kế</div></div>
      ) : designOrds.map(o => (
        <div key={o.id} className="ord-card" style={{borderLeft:'4px solid #db2877'}}>
          <div className="ord-card-head">
            <span className="ord-code">{o.code}</span>
            <span className="ord-name">{o.name}</span>
            <span className="ord-amount">{fmt(o.grandTotal)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── KhoView ───────────────────────────────────────────────────
export function KhoView() {
  const orders = useDataStore(s => s.orders);
  const khoOrds = orders.filter(o => o.wfStatus === 'in_warehouse');
  return (
    <div>
      <div className="kpi-strip">
        <div className="kpi-card" style={{borderTopColor:'#92400e'}}>
          <div className="kpi-lbl">📦 Hàng về kho</div>
          <div className="kpi-val" style={{color:'#92400e'}}>{khoOrds.length}</div>
        </div>
      </div>
      {khoOrds.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📦</div><div className="empty-text">Chưa có hàng về kho</div></div>
      ) : khoOrds.map(o => (
        <div key={o.id} className="ord-card" style={{borderLeft:'4px solid #92400e'}}>
          <div className="ord-card-head">
            <span className="ord-code">{o.code}</span>
            <span className="ord-name">{o.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MktView ───────────────────────────────────────────────────
export function MktView() {
  const leads = useDataStore(s => s.leads);
  return (
    <div>
      <div className="kpi-strip">
        <div className="kpi-card" style={{borderTopColor:'#7c3aed'}}>
          <div className="kpi-lbl">📣 Tổng lead</div>
          <div className="kpi-val" style={{color:'#7c3aed'}}>{leads.length}</div>
        </div>
      </div>
      <div className="empty-state">
        <div className="empty-icon">📣</div>
        <div className="empty-text">Marketing Dashboard</div>
        <div className="empty-sub">Quản lý chiến dịch và phân bổ lead</div>
      </div>
    </div>
  );
}

// ── CskhView ──────────────────────────────────────────────────
export function CskhView() {
  return (
    <div className="empty-state">
      <div className="empty-icon">🤝</div>
      <div className="empty-text">CSKH — Chăm sóc khách hàng</div>
    </div>
  );
}

// ── OppsView ──────────────────────────────────────────────────
export function OppsView() {
  const user = useAuthStore(s => s.user);
  const opps = useDataStore(s => s.opps);
  const myOpps = opps.filter(o => o.emp === user?.name);
  return (
    <div>
      <div className="kpi-strip">
        <div className="kpi-card"><div className="kpi-lbl">Tổng cơ hội</div><div className="kpi-val">{myOpps.length}</div></div>
        <div className="kpi-card" style={{borderTopColor:'#16a34a'}}>
          <div className="kpi-lbl">Có báo giá</div>
          <div className="kpi-val" style={{color:'#16a34a'}}>{myOpps.filter(o=>o.quotes?.length>0).length}</div>
        </div>
      </div>
      {myOpps.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">⚡</div><div className="empty-text">Chưa có cơ hội nào</div></div>
      ) : myOpps.map(o => (
        <div key={o.id} className="card card-pad" style={{marginBottom:8}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontFamily:'monospace',fontSize:11,fontWeight:800,color:'var(--primary)',background:'var(--primary-pale)',borderRadius:4,padding:'2px 8px'}}>{o.code}</span>
            <span style={{flex:1,fontWeight:700}}>{o.chungloai}</span>
            <span style={{fontSize:12,color:'var(--muted)'}}>{o.dateStr}</span>
            <span className={`badge ${o.quotes?.length>0?'badge-green':'badge-gray'}`}>
              {o.quotes?.length>0?`✅ ${o.quotes.length} báo giá`:'⏳ Chờ BG'}
            </span>
          </div>
          {o.diadiem&&<div style={{fontSize:12,color:'var(--muted)',marginTop:4}}>📍 {o.diadiem}</div>}
        </div>
      ))}
    </div>
  );
}

// ── ReportView ────────────────────────────────────────────────
export function ReportView() {
  const user = useAuthStore(s => s.user);
  const orders = useDataStore(s => s.orders);
  const myOrders = orders.filter(o => o.emp === user?.name);
  const revenue = myOrders.filter(o=>o.wfStatus==='delivered').reduce((s,o)=>s+(o.grandTotal||0),0);
  return (
    <div>
      <div className="kpi-strip">
        <div className="kpi-card"><div className="kpi-lbl">Tổng đơn</div><div className="kpi-val">{myOrders.length}</div></div>
        <div className="kpi-card" style={{borderTopColor:'#16a34a'}}>
          <div className="kpi-lbl">Doanh thu</div>
          <div className="kpi-val" style={{fontSize:16,color:'#16a34a'}}>{fmt(revenue)}</div>
        </div>
      </div>
      <div className="empty-state"><div className="empty-icon">📊</div><div className="empty-text">Báo cáo đang được phát triển</div></div>
    </div>
  );
}

// ── MyCustView ────────────────────────────────────────────────
export function MyCustView() {
  return (
    <div className="empty-state">
      <div className="empty-icon">🤝</div>
      <div className="empty-text">Khách hàng của tôi</div>
      <div className="empty-sub">Tính năng đang được phát triển cho React</div>
    </div>
  );
}

export default SmgrView;
