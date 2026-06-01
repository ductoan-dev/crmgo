import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore, useUIStore } from '../../store';
import { WF_LABEL, ORDER_TYPES } from '../../utils/constants';
import { fmt, fmtDate } from '../../utils/helpers';

const VALUE_RANGES = [
  { value:'all',    label:'💰 Tất cả giá trị' },
  { value:'lt10',   label:'Dưới 10 triệu' },
  { value:'10to50', label:'10 – 50 triệu' },
  { value:'50to200',label:'50 – 200 triệu' },
  { value:'gt200',  label:'Trên 200 triệu' },
];

export default function OrdersView() {
  const user      = useAuthStore(s => s.user);
  const orders    = useDataStore(s => s.orders);
  const openModal = useUIStore(s => s.openModal);

  const [q, setQ]       = useState('');
  const [wfF, setWfF]   = useState('all');
  const [valF, setValF] = useState('all');

  const myOrders = useMemo(() => {
    return orders.filter(o => {
      const isMe = !user?.isLeader ? o.emp === user?.name : true;
      const matchQ = !q
        || o.code?.toLowerCase().includes(q.toLowerCase())
        || o.name?.toLowerCase().includes(q.toLowerCase())
        || o.phone?.includes(q);
      const matchWf = wfF === 'all' || o.wfStatus === wfF;
      const v = o.grandTotal || 0;
      const matchV = valF === 'all'
        || (valF === 'lt10'    && v < 10_000_000)
        || (valF === '10to50'  && v >= 10_000_000  && v < 50_000_000)
        || (valF === '50to200' && v >= 50_000_000  && v < 200_000_000)
        || (valF === 'gt200'   && v >= 200_000_000);
      return isMe && matchQ && matchWf && matchV;
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [orders, user, q, wfF, valF]);

  const kpis = useMemo(() => ({
    total:    myOrders.length,
    pending:  myOrders.filter(o => o.wfStatus === 'pending_kt').length,
    approved: myOrders.filter(o => o.ktApproved).length,
    revenue:  myOrders.filter(o => o.wfStatus === 'delivered').reduce((s,o) => s+(o.grandTotal||0), 0),
  }), [myOrders]);

  const hasFilter = q || wfF !== 'all' || valF !== 'all';
  const clearFilters = () => { setQ(''); setWfF('all'); setValF('all'); };

  return (
    <div>
      {/* KPI */}
      <div className="kpi-strip">
        <div className="kpi-card">
          <div className="kpi-lbl">Tổng đơn</div>
          <div className="kpi-val">{kpis.total}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor:'#f59e0b' }}>
          <div className="kpi-lbl">⏳ Chờ KT</div>
          <div className="kpi-val" style={{ color:'#f59e0b' }}>{kpis.pending}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor:'#16a34a' }}>
          <div className="kpi-lbl">✅ Đã duyệt</div>
          <div className="kpi-val" style={{ color:'#16a34a' }}>{kpis.approved}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor:'var(--primary)' }}>
          <div className="kpi-lbl">Doanh thu</div>
          <div className="kpi-val" style={{ fontSize:16 }}>{fmt(kpis.revenue)}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Tìm mã đơn, tên, SĐT..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select className="fi" style={{ width:'auto' }} value={wfF} onChange={e => setWfF(e.target.value)}>
          <option value="all">🔄 Tất cả tiến trình</option>
          {Object.entries(WF_LABEL).map(([k,v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select className="fi" style={{ width:'auto' }} value={valF} onChange={e => setValF(e.target.value)}>
          {VALUE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => openModal('addOrder')}>
          + Tạo đơn
        </button>
      </div>

      {/* Active filter bar */}
      {hasFilter && (
        <div style={{
          display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
          background:'#fffbeb', border:'1px solid #fde68a',
          borderRadius:8, padding:'7px 14px', marginBottom:10,
        }}>
          <span style={{ fontSize:12, fontWeight:700, color:'var(--primary)' }}>
            🔍 {myOrders.length} đơn hàng
          </span>
          {q && <span className="badge badge-amber">🔍 "{q}"</span>}
          {wfF !== 'all' && <span className="badge badge-blue">{WF_LABEL[wfF]?.label}</span>}
          {valF !== 'all' && <span className="badge badge-amber">💰 {VALUE_RANGES.find(r=>r.value===valF)?.label}</span>}
          <button
            onClick={clearFilters}
            style={{ marginLeft:'auto', background:'none', border:'none', fontSize:11, color:'var(--muted)', cursor:'pointer', fontFamily:'inherit' }}
          >
            ✕ Xoá bộ lọc
          </button>
        </div>
      )}

      {/* Order list */}
      {myOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-text">Không có đơn hàng nào</div>
        </div>
      ) : myOrders.map(ord => {
        const wf        = WF_LABEL[ord.wfStatus] || { label: ord.wfStatus, color:'#64748b' };
        const deposit   = ord.deposit || 0;
        const remaining = (ord.grandTotal || 0) - deposit;

        return (
          <div key={ord.id} className="ord-card" style={{ borderLeft:`4px solid ${wf.color}` }}>

            {/* ── Header ── */}
            <div className="ord-card-head">
              <span className="ord-code">{ord.code}</span>
              <span className="ord-name">{ord.name}</span>
              <span style={{
                fontSize:10, fontWeight:700,
                color: wf.color, background: wf.color + '14',
                border: `1px solid ${wf.color}40`,
                borderRadius:5, padding:'2px 8px',
              }}>
                {wf.label}
              </span>
              <span className="ord-amount">{fmt(ord.grandTotal)}</span>
            </div>

            {/* ── Metadata ── */}
            <div className="ord-meta">
              <div className="ord-meta-item">
                <div className="ord-meta-label">Khách hàng</div>
                <div className="ord-meta-val">{ord.name}</div>
              </div>
              <div className="ord-meta-item">
                <div className="ord-meta-label">KD phụ trách</div>
                <div className="ord-meta-val">{ord.emp}</div>
              </div>
              <div className="ord-meta-item">
                <div className="ord-meta-label">Loại đơn</div>
                <div className="ord-meta-val">
                  {ord.orderType || '–'}
                </div>
              </div>
              <div className="ord-meta-item">
                <div className="ord-meta-label">Ngày tạo</div>
                <div className="ord-meta-val">{fmtDate(ord.createdAt)}</div>
              </div>
              {ord.payMethod && (
                <div className="ord-meta-item">
                  <div className="ord-meta-label">Thanh toán</div>
                  <div className="ord-meta-val">{ord.payMethod}</div>
                </div>
              )}
            </div>

            {/* ── Thanh toán (đáy) — chỉ hiện khi có tiền cọc ── */}
            {deposit > 0 && (
              <div style={{
                borderTop: '1px solid #f1f5f9',
                padding: '10px 16px',
                display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                gap: 24, flexWrap: 'wrap',
              }}>
                {/* Tổng cộng */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:1 }}>
                  <span style={{ fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:.4 }}>
                    Tổng cộng
                  </span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#374151' }}>
                    {fmt(ord.grandTotal)}
                  </span>
                </div>

                <span style={{ fontSize:18, color:'#d1d5db' }}>−</span>

                {/* Đã cọc */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:1 }}>
                  <span style={{ fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:.4 }}>
                    Đã cọc
                  </span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#16a34a' }}>
                    {fmt(deposit)}
                  </span>
                </div>

                <span style={{ fontSize:18, color:'#d1d5db' }}>=</span>

                {/* Còn lại */}
                <div style={{
                  display:'flex', flexDirection:'column', alignItems:'flex-end', gap:1,
                  padding: '5px 12px', borderRadius: 8,
                  background: remaining > 0 ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${remaining > 0 ? '#fecaca' : '#bbf7d0'}`,
                }}>
                  <span style={{
                    fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:.4,
                    color: remaining > 0 ? '#dc2626' : '#16a34a',
                  }}>
                    {remaining > 0 ? 'Còn lại' : 'Đã đủ'}
                  </span>
                  <span style={{ fontSize:15, fontWeight:800, color: remaining > 0 ? '#dc2626' : '#16a34a' }}>
                    {remaining > 0 ? fmt(remaining) : '✅'}
                  </span>
                </div>
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}
