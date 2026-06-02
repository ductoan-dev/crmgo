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
import { useState as _useState } from 'react';
import { DEMO_ACCOUNTS, ROLE_LBL, WF_PROD } from '../../utils/constants';
export function AdminView() {
  const activeTab   = useUIStore(s => s.activeTab);
  const orders      = useDataStore(s => s.orders);
  const opps        = useDataStore(s => s.opps);
  const leads       = useDataStore(s => s.leads);
  const suppliers   = useDataStore(s => s.suppliers);
  const businesses  = useDataStore(s => s.businesses);
  const [bizQ, setBizQ]           = _useState('');
  const [bizExpanded, setBizExpanded] = _useState(null);

  // ── Tab Doanh nghiệp ────────────────────────────────────────
  if (activeTab === 'biz') {
    const q = bizQ.toLowerCase();
    const filtered = businesses.filter(b =>
      !q ||
      b.name?.toLowerCase().includes(q) ||
      b.phone?.includes(q) ||
      b.email?.toLowerCase().includes(q) ||
      b.industry?.toLowerCase().includes(q) ||
      b.taxCode?.includes(q)
    );

    // Thống kê: đơn hàng + doanh thu theo businessId
    const bizStats = (bizId) => {
      const bizOpps  = opps.filter(op => op.businessId === bizId);
      const oppIds   = new Set(bizOpps.map(op => op.id));
      const bizOrds  = orders.filter(o => o.oppId && oppIds.has(o.oppId));
      const revenue  = bizOrds.filter(o => o.wfStatus === 'delivered')
                              .reduce((s, o) => s + (o.grandTotal || 0), 0);
      return { oppCount: bizOpps.length, ordCount: bizOrds.length, revenue };
    };

    const totalRev = businesses.reduce((s, b) => s + bizStats(b.id).revenue, 0);

    return (
      <div>
        {/* KPI */}
        <div className="kpi-strip">
          <div className="kpi-card" style={{ borderTopColor:'#2563eb' }}>
            <div className="kpi-lbl">🏢 Tổng doanh nghiệp</div>
            <div className="kpi-val" style={{ color:'#2563eb' }}>{businesses.length}</div>
          </div>
          <div className="kpi-card" style={{ borderTopColor:'#16a34a' }}>
            <div className="kpi-lbl">💰 Tổng doanh thu</div>
            <div className="kpi-val" style={{ color:'#16a34a', fontSize:18 }}>
              {totalRev > 0 ? totalRev.toLocaleString('vi-VN') + '₫' : '–'}
            </div>
          </div>
          <div className="kpi-card" style={{ borderTopColor:'#7c3aed' }}>
            <div className="kpi-lbl">📋 Có đơn hàng</div>
            <div className="kpi-val" style={{ color:'#7c3aed' }}>
              {businesses.filter(b => bizStats(b.id).ordCount > 0).length}
            </div>
          </div>
        </div>

        {/* Tìm kiếm */}
        <div className="search-bar" style={{ marginBottom:12 }}>
          <input className="search-input"
            placeholder="Tìm tên, SĐT, email, ngành, MST..."
            value={bizQ} onChange={e => setBizQ(e.target.value)} />
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <div className="empty-text">
              {businesses.length === 0 ? 'Chưa có doanh nghiệp nào' : 'Không tìm thấy kết quả'}
            </div>
            <div className="empty-sub">
              Doanh nghiệp được tạo tự động khi chuyển Lead → Cơ hội
            </div>
          </div>
        ) : (
          <div>
            {filtered.map(b => {
              const st = bizStats(b.id);
              const isOpen = bizExpanded === b.id;
              return (
                <div key={b.id} className="card card-pad" style={{
                  marginBottom:8,
                  borderLeft:`4px solid ${st.ordCount > 0 ? '#2563eb' : '#e2e8f0'}`,
                }}>
                  {/* Header row */}
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{
                      width:38, height:38, borderRadius:10, flexShrink:0,
                      background: st.ordCount > 0
                        ? 'linear-gradient(135deg,#2563eb,#1d4ed8)'
                        : 'linear-gradient(135deg,#94a3b8,#64748b)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:18, color:'#fff',
                    }}>🏢</div>

                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <span style={{ fontWeight:800, fontSize:14, color:'#1e293b' }}>{b.name}</span>
                        {b.industry && (
                          <span style={{
                            fontSize:10, fontWeight:700, color:'#7c3aed',
                            background:'#f5f3ff', border:'1px solid #ddd6fe',
                            borderRadius:99, padding:'1px 8px',
                          }}>{b.industry}</span>
                        )}
                        {b.taxCode && (
                          <span style={{
                            fontSize:10, fontWeight:600, color:'#475569',
                            background:'#f8fafc', border:'1px solid #e2e8f0',
                            borderRadius:4, padding:'1px 6px',
                          }}>MST: {b.taxCode}</span>
                        )}
                      </div>

                      {/* Liên hệ */}
                      {(b.phone || b.email) && (
                        <div style={{ display:'flex', gap:14, fontSize:12, color:'#64748b', marginTop:3, flexWrap:'wrap' }}>
                          {b.phone && <span>📞 {b.phone}</span>}
                          {b.email && <span>✉️ {b.email}</span>}
                        </div>
                      )}
                      {b.address && (
                        <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>📍 {b.address}</div>
                      )}
                    </div>

                    {/* Stats + toggle */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                      <div style={{ display:'flex', gap:8 }}>
                        <span style={{
                          fontSize:11, fontWeight:700, color:'#7c3aed',
                          background:'#f5f3ff', borderRadius:99, padding:'2px 9px',
                        }}>⚡ {st.oppCount} CH</span>
                        <span style={{
                          fontSize:11, fontWeight:700, color:'#2563eb',
                          background:'#eff6ff', borderRadius:99, padding:'2px 9px',
                        }}>📋 {st.ordCount} đơn</span>
                      </div>
                      {st.revenue > 0 && (
                        <span style={{ fontSize:11, fontWeight:800, color:'#16a34a' }}>
                          {st.revenue.toLocaleString('vi-VN')}₫
                        </span>
                      )}
                      {(st.oppCount > 0 || b.note) && (
                        <button
                          onClick={() => setBizExpanded(isOpen ? null : b.id)}
                          style={{
                            fontSize:10, color:'#94a3b8', background:'none',
                            border:'1px solid #e2e8f0', borderRadius:6,
                            padding:'2px 8px', cursor:'pointer', fontFamily:'inherit',
                          }}
                        >{isOpen ? '▲ Thu gọn' : '▼ Chi tiết'}</button>
                      )}
                    </div>
                  </div>

                  {/* Expanded: cơ hội + ghi chú */}
                  {isOpen && (
                    <div style={{
                      marginTop:10, paddingTop:10, borderTop:'1px solid #f1f5f9',
                    }}>
                      {b.note && (
                        <div style={{
                          fontSize:11, color:'#64748b', fontStyle:'italic',
                          background:'#f8fafc', borderRadius:6, padding:'6px 10px', marginBottom:8,
                        }}>📝 {b.note}</div>
                      )}
                      {b.createdBy && (
                        <div style={{ fontSize:11, color:'#94a3b8', marginBottom:6 }}>
                          👤 KD phụ trách: <strong style={{ color:'#475569' }}>{b.createdBy}</strong>
                          {b.createdAt && <span style={{ marginLeft:8 }}>· {fmtDate(b.createdAt)}</span>}
                        </div>
                      )}
                      {opps.filter(op => op.businessId === b.id).map(op => {
                        const oppOrds = orders.filter(o => o.oppId === op.id);
                        return (
                          <div key={op.id} style={{
                            background:'#f8fafc', borderRadius:7, padding:'8px 10px',
                            marginBottom:6, border:'1px solid #f1f5f9',
                          }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                              <code style={{ fontSize:11, fontWeight:700, color:'var(--primary)' }}>{op.code}</code>
                              <span style={{ fontSize:12, fontWeight:600, flex:1 }}>{op.customerName || op.name}</span>
                              <span style={{ fontSize:11, color:'#94a3b8' }}>⚡ {op.khaNang ?? 50}%</span>
                              <span style={{ fontSize:11, color:'#2563eb', fontWeight:700 }}>{oppOrds.length} đơn</span>
                            </div>
                            {oppOrds.map(o => (
                              <div key={o.id} style={{
                                marginTop:5, paddingLeft:12,
                                borderLeft:'2px solid #ddd6fe',
                                display:'flex', gap:8, alignItems:'center', flexWrap:'wrap',
                              }}>
                                <code style={{ fontSize:10, color:'#7c3aed' }}>{o.code}</code>
                                <span style={{ fontSize:11, color:'#64748b', flex:1 }}>{o.customerName || o.name}</span>
                                <span style={{ fontSize:11, fontWeight:700, color:'#1e293b' }}>
                                  {(o.grandTotal||0).toLocaleString('vi-VN')}₫
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────
  if (activeTab === 'dash') {
    const delivered  = orders.filter(o => o.wfStatus === 'delivered');
    const inProgress = orders.filter(o => o.wfStatus !== 'delivered' && o.wfStatus !== 'pending_kt');
    const revenue    = delivered.reduce((s, o) => s + (o.grandTotal || 0), 0);
    const pending    = orders.filter(o => o.wfStatus === 'pending_kt');

    const wfCounts = WF_PROD.map(k => ({
      key: k,
      label: WF_LABEL[k]?.label || k,
      color: WF_LABEL[k]?.color || '#64748b',
      count: orders.filter(o => o.wfStatus === k).length,
    }));

    return (
      <div>
        {/* KPI strip */}
        <div className="kpi-strip">
          {[
            { label:'📋 Tổng đơn',    val: orders.length,    color:'var(--primary)' },
            { label:'⚡ Đang xử lý',  val: inProgress.length, color:'#f59e0b' },
            { label:'✅ Đã giao',     val: delivered.length,  color:'#16a34a' },
            { label:'⏳ Chờ KT duyệt',val: pending.length,    color:'#dc2626' },
            { label:'🎯 Cơ hội',      val: opps.length,       color:'#2563eb' },
            { label:'📞 Lead',        val: leads.length,       color:'#7c3aed' },
            { label:'🏭 NCC',         val: suppliers.length,   color:'#0d9488' },
          ].map(k => (
            <div key={k.label} className="kpi-card" style={{ borderTopColor: k.color }}>
              <div className="kpi-lbl">{k.label}</div>
              <div className="kpi-val" style={{ color: k.color }}>{k.val}</div>
            </div>
          ))}
        </div>

        {/* Doanh thu */}
        <div className="card card-pad" style={{ marginBottom:16, borderLeft:'4px solid #16a34a' }}>
          <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>💰 Tổng doanh thu đã giao hàng</div>
          <div style={{ fontSize:28, fontWeight:900, color:'#16a34a' }}>
            {revenue.toLocaleString('vi-VN')}₫
          </div>
        </div>

        {/* Workflow funnel */}
        <div style={{ fontSize:11, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:.5, marginBottom:10 }}>
          Trạng thái đơn hàng
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:20 }}>
          {wfCounts.filter(w => w.count > 0).map(w => (
            <div key={w.key} style={{
              display:'flex', alignItems:'center', gap:10,
              background:'#f8fafc', borderRadius:8, padding:'8px 12px',
              border:'1px solid #f1f5f9',
            }}>
              <span style={{
                fontSize:11, fontWeight:700, color: w.color,
                background: w.color + '18', borderRadius:99,
                padding:'2px 10px', whiteSpace:'nowrap', minWidth:130,
              }}>{w.label}</span>
              <div style={{
                flex:1, height:8, background:'#e2e8f0', borderRadius:99, overflow:'hidden',
              }}>
                <div style={{
                  width: `${Math.min(100, (w.count / orders.length) * 100)}%`,
                  height:'100%', background: w.color, borderRadius:99,
                  transition:'width .3s',
                }} />
              </div>
              <span style={{ fontSize:13, fontWeight:800, color:'#1e293b', minWidth:24, textAlign:'right' }}>
                {w.count}
              </span>
            </div>
          ))}
          {orders.length === 0 && (
            <div style={{ color:'#94a3b8', fontSize:12, textAlign:'center', padding:'20px 0' }}>
              Chưa có đơn hàng nào
            </div>
          )}
        </div>

        {/* Đơn mới nhất */}
        {orders.length > 0 && (
          <>
            <div style={{ fontSize:11, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:.5, marginBottom:10 }}>
              Đơn hàng gần nhất
            </div>
            {[...orders].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0,5).map(o => {
              const wf = WF_LABEL[o.wfStatus] || { label: o.wfStatus, color:'#64748b' };
              return (
                <div key={o.id} className="ord-card" style={{ borderLeft:`4px solid ${wf.color}`, marginBottom:6 }}>
                  <div className="ord-card-head">
                    <span className="ord-code">{o.code}</span>
                    <span className="ord-name">{o.name || o.customerName}</span>
                    <span style={{ fontSize:11, fontWeight:700, color: wf.color,
                      background: wf.color + '18', borderRadius:99, padding:'2px 8px', whiteSpace:'nowrap',
                    }}>{wf.label}</span>
                    <span className="ord-amount">{fmt(o.grandTotal)}</span>
                  </div>
                  <div className="ord-meta">
                    <div className="ord-meta-item"><div className="ord-meta-label">KD</div><div className="ord-meta-val">{o.emp||'–'}</div></div>
                    {o.smgrNccName && <div className="ord-meta-item"><div className="ord-meta-label">NCC</div><div className="ord-meta-val">{o.smgrNccName}</div></div>}
                    <div className="ord-meta-item"><div className="ord-meta-label">Ngày</div><div className="ord-meta-val">{fmtDate(o.createdAt)}</div></div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    );
  }

  // ── Tab Nhân sự ─────────────────────────────────────────────
  return (
    <div>
      <div style={{ marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ fontSize:16, fontWeight:800 }}>👤 Quản lý tài khoản</h2>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Username</th><th>Họ tên</th><th>Vai trò</th><th>Trạng thái</th></tr>
          </thead>
          <tbody>
            {DEMO_ACCOUNTS.map(u => (
              <tr key={u.username}>
                <td><code style={{ fontSize:12 }}>{u.username}</code></td>
                <td style={{ fontWeight:600 }}>{u.name}</td>
                <td><span className="badge badge-blue">{ROLE_LBL[u.role]}</span></td>
                <td><span className="badge badge-green">✅ Hoạt động</span></td>
              </tr>
            ))}
          </tbody>
        </table>
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
