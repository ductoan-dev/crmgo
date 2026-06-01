import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore, useUIStore } from '../../store';
import { STATUS_CFG, CATS, CUSTOMER_PROFILES } from '../../utils/constants';
import { fmt, fmtDate, truncate } from '../../utils/helpers';

const PROB_COLORS = [
  { min:0,  max:30,  color:'#dc2626', bg:'#fef2f2' },
  { min:30, max:60,  color:'#d97706', bg:'#fffbeb' },
  { min:60, max:80,  color:'#2563eb', bg:'#eff6ff' },
  { min:80, max:101, color:'#16a34a', bg:'#f0fdf4' },
];
const getProbColor = (p) => PROB_COLORS.find(c => p >= c.min && p < c.max) || PROB_COLORS[0];

export default function OppsView() {
  const user       = useAuthStore(s => s.user);
  const opps       = useDataStore(s => s.opps);
  const updateOpp  = useDataStore(s => s.updateOpp);
  const addQuote   = useDataStore(s => s.addQuote);
  const openModal  = useUIStore(s => s.openModal);

  const [q, setQ]        = useState('');
  const [statF, setStatF]= useState('all');
  const [expanded, setExpanded] = useState(null); // id of expanded opp

  const isLeader = user?.isLeader || user?.role === 'admin' || user?.role === 'smgr';

  const myOpps = useMemo(() => {
    return opps.filter(o => {
      const isMe = isLeader || o.emp === user?.name;
      const matchQ = !q
        || (o.khachHang || '').toLowerCase().includes(q.toLowerCase())
        || (o.code || '').toLowerCase().includes(q.toLowerCase())
        || (o.chungloai || '').toLowerCase().includes(q.toLowerCase());
      const matchS = statF === 'all' || String(o.status) === statF;
      return isMe && matchQ && matchS;
    }).sort((a, b) => (b.dateObj || 0) - (a.dateObj || 0));
  }, [opps, user, q, statF, isLeader]);

  const kpis = useMemo(() => {
    const hot  = myOpps.filter(o => o.status <= 1 && o.khaNang >= 60).length;
    const withQuote = myOpps.filter(o => o.quotes?.length > 0).length;
    const closed = myOpps.filter(o => o.status === 2).length;
    const totalValue = myOpps
      .filter(o => o.quotes?.length > 0)
      .reduce((s, o) => s + (o.quotes[o.quotes.length - 1]?.total || 0), 0);
    return { total: myOpps.length, hot, withQuote, closed, totalValue };
  }, [myOpps]);

  const handleAddQuote = (oppId) => {
    const totalStr = window.prompt('Giá trị báo giá (VNĐ):', '');
    if (!totalStr) return;
    const total = parseInt(totalStr.replace(/\D/g, ''), 10);
    if (!total || isNaN(total)) { toast.error('Giá trị không hợp lệ'); return; }
    const note = window.prompt('Ghi chú báo giá (tuỳ chọn):', '') || '';
    addQuote(oppId, { total, note });
    toast.success(`✅ Đã thêm báo giá ${fmt(total)}`);
  };

  const handleStatusChange = (id, status) => {
    updateOpp(id, { status: Number(status) });
    toast.success('Đã cập nhật trạng thái cơ hội');
  };

  const handleProbChange = (id, khaNang) => {
    updateOpp(id, { khaNang: Number(khaNang) });
  };

  return (
    <div>
      {/* KPI */}
      <div className="kpi-strip">
        <div className="kpi-card">
          <div className="kpi-lbl">Tổng cơ hội</div>
          <div className="kpi-val">{kpis.total}</div>
        </div>
        <div className="kpi-card" style={{borderTopColor:'#2563eb'}}>
          <div className="kpi-lbl">🔥 Tiềm năng cao</div>
          <div className="kpi-val" style={{color:'#2563eb'}}>{kpis.hot}</div>
        </div>
        <div className="kpi-card" style={{borderTopColor:'#16a34a'}}>
          <div className="kpi-lbl">✅ Có báo giá</div>
          <div className="kpi-val" style={{color:'#16a34a'}}>{kpis.withQuote}</div>
        </div>
        <div className="kpi-card" style={{borderTopColor:'var(--primary)'}}>
          <div className="kpi-lbl">💰 Giá trị dự kiến</div>
          <div className="kpi-val" style={{fontSize:15}}>{fmt(kpis.totalValue)}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Tìm mã, tên khách, sản phẩm..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select className="fi" style={{width:'auto'}} value={statF} onChange={e => setStatF(e.target.value)}>
          <option value="all">🔄 Tất cả trạng thái</option>
          {STATUS_CFG.map((s, i) => (
            <option key={i} value={String(i)}>{s.label}</option>
          ))}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => openModal('addOpp')}>
          + Cơ hội mới
        </button>
      </div>

      {/* List */}
      {myOpps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚡</div>
          <div className="empty-text">Chưa có cơ hội nào</div>
          <div className="empty-sub">Chuyển đổi lead thành cơ hội hoặc tạo mới</div>
        </div>
      ) : myOpps.map(opp => {
        const st = STATUS_CFG[opp.status] || STATUS_CFG[0];
        const prob = opp.khaNang || 50;
        const pc = getProbColor(prob);
        const lastQuote = opp.quotes?.length > 0 ? opp.quotes[opp.quotes.length - 1] : null;
        const isExp = expanded === opp.id;

        return (
          <div key={opp.id} className="ord-card" style={{borderLeft:`4px solid ${st.color}`}}>
            {/* Header */}
            <div
              className="ord-card-head"
              style={{cursor:'pointer'}}
              onClick={() => setExpanded(isExp ? null : opp.id)}
            >
              <span className="ord-code">{opp.code}</span>
              <span className="ord-name">
                {opp.khachHang || opp.customer_name || '–'}
                {opp.chungloai && (
                  <span style={{fontSize:11, color:'var(--muted)', fontWeight:500, marginLeft:8}}>
                    · {opp.chungloai}
                  </span>
                )}
              </span>
              <span style={{
                fontSize:10, fontWeight:700, borderRadius:5, padding:'2px 8px',
                color: st.color, background: st.bg, border:`1px solid ${st.color}40`,
              }}>
                {st.label}
              </span>
              <span style={{
                fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99,
                color: pc.color, background: pc.bg,
              }}>
                {prob}%
              </span>
              {lastQuote && (
                <span className="ord-amount">{fmt(lastQuote.total)}</span>
              )}
              <span style={{fontSize:11, color:'var(--muted)', marginLeft:'auto'}}>
                {opp.dateStr || fmtDate(opp.dateObj)}
              </span>
              <span style={{fontSize:14, color:'var(--muted)', transform: isExp ? 'rotate(180deg)' : 'none', transition:'transform .2s'}}>▾</span>
            </div>

            {/* Expanded detail */}
            {isExp && (
              <div style={{padding:'12px 16px', borderTop:'1px solid #f1f5f9'}}>
                <div className="ord-meta">
                  {opp.emp && (
                    <div className="ord-meta-item">
                      <div className="ord-meta-label">KD phụ trách</div>
                      <div className="ord-meta-val">{opp.emp}</div>
                    </div>
                  )}
                  {opp.soDienThoai && (
                    <div className="ord-meta-item">
                      <div className="ord-meta-label">Số điện thoại</div>
                      <div className="ord-meta-val">📱 {opp.soDienThoai}</div>
                    </div>
                  )}
                  {opp.diadiem && (
                    <div className="ord-meta-item">
                      <div className="ord-meta-label">Khu vực</div>
                      <div className="ord-meta-val">📍 {opp.diadiem}</div>
                    </div>
                  )}
                  {opp.quycach && (
                    <div className="ord-meta-item" style={{gridColumn:'1/-1'}}>
                      <div className="ord-meta-label">Quy cách sản phẩm</div>
                      <div className="ord-meta-val">{opp.quycach}</div>
                    </div>
                  )}
                  {opp.thongtin && (
                    <div className="ord-meta-item" style={{gridColumn:'1/-1'}}>
                      <div className="ord-meta-label">Yêu cầu cụ thể từ khách</div>
                      <div className="ord-meta-val" style={{
                        whiteSpace:'pre-wrap', lineHeight:1.6,
                        background:'#fffbeb', padding:'8px 10px',
                        borderRadius:6, border:'1px solid #fde68a',
                        color:'#1e293b',
                      }}>
                        {opp.thongtin}
                      </div>
                    </div>
                  )}
                </div>

                {/* Chân dung khách hàng */}
                {opp.chandung?.length > 0 && (
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11, fontWeight:700, color:'var(--text2)', marginBottom:6}}>
                      🎯 Chân dung khách hàng
                    </div>
                    <div style={{display:'flex', flexWrap:'wrap', gap:5}}>
                      {opp.chandung.map(v => {
                        const p = CUSTOMER_PROFILES.find(x => x.value === v);
                        return p ? (
                          <span key={v} style={{
                            fontSize:11, padding:'3px 10px', borderRadius:99,
                            background:'#eff6ff', color:'#2563eb',
                            border:'1px solid #bfdbfe', fontWeight:600,
                          }}>
                            {p.icon} {p.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Probability slider */}
                <div style={{marginBottom:12}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
                    <span style={{fontSize:11, fontWeight:700, color:'var(--text2)'}}>Khả năng chốt đơn</span>
                    <span style={{fontSize:13, fontWeight:800, color: pc.color}}>{prob}%</span>
                  </div>
                  <input
                    type="range" min="0" max="100" step="5"
                    value={prob}
                    onChange={e => handleProbChange(opp.id, e.target.value)}
                    style={{width:'100%', accentColor: pc.color}}
                  />
                </div>

                {/* Status */}
                <div style={{marginBottom:12, display:'flex', gap:8, alignItems:'center'}}>
                  <span style={{fontSize:11, fontWeight:700, color:'var(--text2)'}}>Trạng thái:</span>
                  <select
                    className="fi"
                    style={{width:'auto', padding:'4px 10px', fontSize:12, height:'auto'}}
                    value={opp.status}
                    onChange={e => handleStatusChange(opp.id, e.target.value)}
                  >
                    {STATUS_CFG.map((s, i) => (
                      <option key={i} value={i}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Quotes */}
                {opp.quotes?.length > 0 && (
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:11, fontWeight:700, color:'var(--text2)', marginBottom:6}}>📄 Lịch sử báo giá</div>
                    {opp.quotes.map((q, qi) => (
                      <div key={q.id || qi} style={{
                        display:'flex', gap:8, alignItems:'center',
                        padding:'6px 10px', background:'#f8fafc',
                        borderRadius:6, marginBottom:4, fontSize:12,
                      }}>
                        <span style={{fontWeight:700, color:'#64748b'}}>BG{qi + 1}</span>
                        <span style={{fontWeight:800, color:'var(--green)'}}>{fmt(q.total)}</span>
                        {q.note && <span style={{color:'var(--muted)', flex:1}}>· {q.note}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="ord-actions" style={{padding:0}}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleAddQuote(opp.id)}
                  >
                    💰 Thêm báo giá
                  </button>
                  {/* Tạo đơn — hiện với mọi trạng thái trừ Hủy đơn & Đã thanh toán */}
                  {opp.status !== 4 && opp.status !== 7 && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => openModal('addOrder', {
                        oppId: opp.id,
                        name:  opp.khachHang || opp.customer_name || '',
                        phone: opp.soDienThoai || '',
                      })}
                    >
                      📋 Tạo đơn hàng
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
