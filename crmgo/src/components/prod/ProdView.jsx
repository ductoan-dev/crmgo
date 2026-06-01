import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore, useUIStore } from '../../store';
import { fmt, fmtDate, isOverdue, daysBetween, truncate } from '../../utils/helpers';
import { WF_LABEL, CAT_CLR, NCC_QUOTE_DEADLINE_HOURS } from '../../utils/constants';
import ProductView, { MyInfoCard, AllQuotesPanel } from './ProductView';

const DECLINE_REASONS = [
  'NCC không đủ năng lực sản xuất',
  'Quy cách sản phẩm quá khó',
  'Giá nguyên liệu quá cao',
  'Quá tải đơn hàng hiện tại',
  'Không phù hợp chuyên môn',
];

// ── Popup từ chối báo giá ─────────────────────────────────────
function DeclinePopup({ order, onSave, onClose }) {
  const [selected, setSelected] = useState('');
  const [custom,   setCustom]   = useState('');

  const reason = selected === '__other__' ? custom.trim() : selected;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: 24,
        width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#dc2626', marginBottom: 4 }}>
          ❌ Từ chối báo giá
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
          Mã đơn: <strong style={{ color: '#6d28d9' }}>{order.code}</strong>
          {' · '}{order.name}
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10 }}>
          Chọn lý do từ chối <span style={{ color: 'red' }}>*</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
          {DECLINE_REASONS.map(r => (
            <label key={r} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
              border: selected === r ? '2px solid #dc2626' : '1.5px solid #e2e8f0',
              background: selected === r ? '#fef2f2' : '#fafafe',
              transition: 'all .1s',
            }}>
              <input
                type="radio" name="decline_reason"
                checked={selected === r}
                onChange={() => { setSelected(r); setCustom(''); }}
                style={{ accentColor: '#dc2626', width: 15, height: 15, flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, color: '#1e293b' }}>{r}</span>
            </label>
          ))}

          <label style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
            border: selected === '__other__' ? '2px solid #dc2626' : '1.5px solid #e2e8f0',
            background: selected === '__other__' ? '#fef2f2' : '#fafafe',
            transition: 'all .1s',
          }}>
            <input
              type="radio" name="decline_reason"
              checked={selected === '__other__'}
              onChange={() => setSelected('__other__')}
              style={{ accentColor: '#dc2626', width: 15, height: 15, flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: '#1e293b' }}>Lý do khác...</span>
          </label>
        </div>

        {selected === '__other__' && (
          <textarea
            autoFocus
            className="fi"
            placeholder="Nhập lý do từ chối..."
            value={custom}
            onChange={e => setCustom(e.target.value)}
            rows={3}
            style={{ resize: 'none', marginBottom: 16, fontSize: 13 }}
          />
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Huỷ</button>
          <button
            className="btn btn-sm"
            disabled={!reason}
            onClick={() => reason && onSave(reason)}
            style={{
              background: reason ? '#dc2626' : '#e2e8f0',
              color: reason ? '#fff' : '#94a3b8',
              border: 'none', fontWeight: 700,
            }}
          >
            ❌ Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Popup cảnh báo đơn In nhanh quá hạn báo giá ──────────────
function OverdueQuoteAlert({ orders, onClose, onQuote }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 24,
        width: 480, maxWidth: '92vw', maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        borderTop: '4px solid #f59e0b',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16, flexShrink: 0 }}>
          <div style={{ fontSize: 30, lineHeight: 1 }}>⚠️</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#92400e', marginBottom: 3 }}>
              Đơn In nhanh cần báo giá gấp!
            </div>
            <div style={{ fontSize: 12, color: '#78716c' }}>
              {orders.length} đơn hàng đã quá <strong>{NCC_QUOTE_DEADLINE_HOURS}h</strong> chưa có báo giá.
              Vui lòng xử lý ngay để tránh ảnh hưởng tiến độ.
            </div>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, marginBottom: 16 }}>
          {orders.map(o => {
            const t   = o.wfStatusChangedAt || o.createdAt;
            const ageH = t ? Math.floor((Date.now() - new Date(t).getTime()) / 3_600_000) : 0;
            const overH = Math.max(0, ageH - NCC_QUOTE_DEADLINE_HOURS);
            return (
              <div key={o.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', marginBottom: 8,
                background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 10,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
                    <span style={{ fontFamily: 'monospace', color: '#d97706' }}>{o.code}</span>
                    <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 6 }}>
                      {truncate(o.name || o.customerName || '', 28)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#92400e' }}>
                    ⏰ <strong>{ageH}h</strong> chưa báo giá
                    {overH > 0 && <span style={{ marginLeft: 4, color: '#dc2626' }}>· quá {overH}h</span>}
                    {o.quycach && (
                      <span style={{ marginLeft: 6, color: '#78716c' }}>
                        · {truncate(o.quycach, 24)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onQuote(o)}
                  style={{
                    fontSize: 12, fontWeight: 700, color: '#fff',
                    background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                    border: 'none', borderRadius: 8, padding: '6px 14px',
                    cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                    flexShrink: 0, marginLeft: 12,
                  }}
                >
                  Báo giá
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button className="btn btn-ghost" onClick={onClose}>Đóng, nhắc sau</button>
        </div>
      </div>
    </div>
  );
}

// ── Popup báo giá ─────────────────────────────────────────────
function QuotePopup({ order, onSave, onClose }) {
  const [price, setPrice] = useState(
    order.nccQuotePrice ? new Intl.NumberFormat('vi-VN').format(order.nccQuotePrice) : ''
  );
  const [note, setNote]   = useState(order.nccQuoteNote || '');

  const parsePrice = (s) => parseInt((s || '').replace(/\D/g, ''), 10) || 0;

  const handleBlur = () => {
    const n = parsePrice(price);
    setPrice(n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '');
  };

  const handleSave = () => {
    const n = parsePrice(price);
    if (!n) return;
    onSave(n, note.trim());
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: 24,
        width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
          💰 Báo giá đơn hàng
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
          Mã đơn: <strong style={{ color: '#6d28d9' }}>{order.code}</strong>
          {' · '}{order.name}
        </div>

        <div className="fi-group" style={{ marginBottom: 12 }}>
          <label className="fi-label">Giá báo (VNĐ) <span style={{ color: 'red' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <input
              className="fi"
              autoFocus
              placeholder="VD: 5.000.000"
              value={price}
              inputMode="numeric"
              onChange={e => setPrice(e.target.value.replace(/[^\d.]/g, ''))}
              onBlur={handleBlur}
              style={{ paddingRight: 32 }}
            />
            <span style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: 11, fontWeight: 700, color: '#94a3b8',
            }}>đ</span>
          </div>
        </div>

        <div className="fi-group" style={{ marginBottom: 20 }}>
          <label className="fi-label">Ghi chú (tuỳ chọn)</label>
          <input
            className="fi"
            placeholder="Ghi chú về giá, điều kiện..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Huỷ</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!parsePrice(price)}
          >
            ✅ Xác nhận báo giá
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProdView() {
  const user        = useAuthStore(s => s.user);
  const orders      = useDataStore(s => s.orders);
  const markDone          = useDataStore(s => s.markProdDone);
  const markDefect        = useDataStore(s => s.markProdDefect);
  const clearDefect       = useDataStore(s => s.clearProdDefect);
  const updateProdQuote   = useDataStore(s => s.updateProdQuote);
  const declineProdQuote  = useDataStore(s => s.declineProdQuote);
  const activeTab   = useUIStore(s => s.activeTab);

  const [statusFilter,  setStatusFilter]  = useState('all');
  const [cardFilter,    setCardFilter]    = useState('all');
  const [q, setQ]             = useState('');
  const [quotePopup,   setQuotePopup]   = useState(null);
  const [declinePopup, setDeclinePopup] = useState(null);
  const [expandedId,   setExpandedId]   = useState(null);
  const [overduePopup, setOverduePopup] = useState(null);

  const myOrders = useMemo(() => {
    const supplier = user?.supplier;
    return orders.filter(o => !supplier || o.smgrNccName === supplier);
  }, [orders, user?.supplier]);

  // Hiển thị popup cảnh báo một lần mỗi ngày khi NCC đăng nhập
  useEffect(() => {
    const today = new Date().toDateString();
    const key   = `ncc_qp_${user?.username}_${today}`;
    if (localStorage.getItem(key)) return;

    const DEADLINE_MS = NCC_QUOTE_DEADLINE_HOURS * 3_600_000;
    const overdue = myOrders.filter(o => {
      if (o.orderType !== 'In nhanh') return false;
      if (o.wfStatus  !== 'supplier_sent') return false;
      if (o.nccQuotePrice) return false;
      const t = o.wfStatusChangedAt || o.createdAt;
      return t && (Date.now() - new Date(t).getTime()) > DEADLINE_MS;
    });

    if (overdue.length > 0) {
      setOverduePopup(overdue);
      localStorage.setItem(key, '1');
    }
  }, []);

  const now = new Date();

  const classified = useMemo(() => {
    const late = [], done = [], defect = [], active = [], pending = [];
    myOrders.forEach(o => {
      const isDefect  = !!(o.defect || o.isDefect);
      const isDone    = ['delivered', 'in_warehouse'].includes(o.wfStatus || '') && !isDefect;
      const isPending = o.wfStatus === 'supplier_sent' && !isDefect;
      const isActive  = o.wfStatus === 'in_production' && !isDefect;
      const isLate    = (isPending || isActive) && o.smgrExpectDate && new Date(o.smgrExpectDate) < now;
      if (isDefect)       defect.push(o);
      else if (isDone)    done.push(o);
      else if (isLate)    late.push(o);
      else if (isPending) pending.push(o);
      else if (isActive)  active.push(o);
    });
    return { late, done, defect, active, pending };
  }, [myOrders]);

  const list = useMemo(() => {
    if (statusFilter === 'pending') return classified.pending;
    if (statusFilter === 'late')    return classified.late;
    if (statusFilter === 'done')    return classified.done;
    if (statusFilter === 'defect')  return classified.defect;
    return [...classified.pending, ...classified.defect, ...classified.late, ...classified.active, ...classified.done];
  }, [statusFilter, classified]);

  const filteredOrders = useMemo(() => {
    let base = myOrders;
    if (cardFilter === 'quoted')   base = base.filter(o => !!o.nccQuotePrice);
    if (cardFilter === 'myQuote')  base = base.filter(o => o.nccQuotePrice && (!o.nccQuotedBy || o.nccQuotedBy === user?.name));
    if (cardFilter === 'pending')  base = base.filter(o => !o.nccQuotePrice);
    if (!q.trim()) return base;
    const lq = q.toLowerCase();
    return base.filter(o =>
      o.code?.toLowerCase().includes(lq) ||
      o.name?.toLowerCase().includes(lq) ||
      o.emp?.toLowerCase().includes(lq) ||
      o.diadiem?.toLowerCase().includes(lq) ||
      o.orderType?.toLowerCase().includes(lq)
    );
  }, [myOrders, q, cardFilter, user?.name]);

  const handleQuote = async (price, note) => {
    if (!quotePopup) return;
    try {
      await updateProdQuote(quotePopup.id, price, note, user?.name);
      toast.success(`💰 Đã báo giá ${new Intl.NumberFormat('vi-VN').format(price)}đ`);
    } catch {
      toast.error('Không thể lưu báo giá');
    }
    setQuotePopup(null);
  };

  const handleDecline = async (reason) => {
    if (!declinePopup) return;
    try {
      await declineProdQuote(declinePopup.id, reason, user?.name);
      toast.error(`❌ Đã từ chối báo giá — ${reason}`);
    } catch {
      toast.error('Không thể lưu từ chối');
    }
    setDeclinePopup(null);
  };

  const handleDone = async (ordId) => {
    try {
      await markDone(ordId, user?.name);
      toast.success('✅ Đã đánh dấu hoàn thành');
    } catch {
      toast.error('Không thể cập nhật trạng thái');
    }
  };
  const handleDefect = async (ordId) => {
    const note = window.prompt('Ghi chú lỗi (tuỳ chọn):', '');
    if (note === null) return;
    try {
      await markDefect(ordId, user?.name, note);
      toast.error('❌ Đã báo lỗi đơn hàng');
    } catch {
      toast.error('Không thể cập nhật trạng thái');
    }
  };
  const handleClearDefect = async (ordId) => {
    try {
      await clearDefect(ordId, user?.name);
      toast.success('Đã bỏ đánh dấu lỗi');
    } catch {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const overduePopupEl = overduePopup && (
    <OverdueQuoteAlert
      orders={overduePopup}
      onClose={() => setOverduePopup(null)}
      onQuote={(o) => { setOverduePopup(null); setQuotePopup(o); }}
    />
  );

  // ══════════════════════════════════════════════════════
  // TAB: CƠ HỘI (list) — bảng đơn hàng + báo giá
  // ══════════════════════════════════════════════════════
  if (activeTab === 'list') {
    const totalOrd   = myOrders.length;
    const quotedOrd  = myOrders.filter(o => !!o.nccQuotePrice).length;
    const myQuoteOrd = myOrders.filter(o => o.nccQuotePrice && (!o.nccQuotedBy || o.nccQuotedBy === user?.name)).length;
    const pendingOrd = myOrders.filter(o => !o.nccQuotePrice).length;

    const CARD_CFG = [
      { key: 'all',      label: 'TỔNG CƠ HỘI',    value: totalOrd,   accent: '#6366f1' },
      { key: 'quoted',   label: 'ĐÃ BÁO GIÁ',      value: quotedOrd,  accent: '#16a34a' },
      { key: 'myQuote',  label: 'BÁO GIÁ CỦA TÔI', value: myQuoteOrd, accent: '#2563eb' },
      { key: 'pending',  label: 'CHỜ BÁO GIÁ',      value: pendingOrd, accent: '#dc2626' },
    ];

    const COLS = [
      { label: '',             w: 36  },
      { label: '#',            w: 40  },
      { label: 'MÃ CH',        w: 72  },
      { label: 'NGÀY',         w: 110 },
      { label: 'KD',           w: 140 },
      { label: 'CHỦNG LOẠI',   w: 110 },
      { label: 'CHI TIẾT SP',  w: 160 },
      { label: 'ĐỊA ĐIỂM',     w: 150 },
      { label: 'KHẢ NĂNG',     w: 130 },
      { label: 'BÁO GIÁ CỦA TÔI', w: 155 },
      { label: '',             w: 100 },
    ];

    return (
      <div>
        {/* Stats cards — clickable filter */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          {CARD_CFG.map(card => {
            const active = cardFilter === card.key;
            return (
              <div
                key={card.key}
                onClick={() => { setCardFilter(active ? 'all' : card.key); setExpandedId(null); }}
                style={{
                  background: active ? card.accent + '0d' : '#fff',
                  borderRadius: 14, padding: '18px 20px',
                  border: active ? `2px solid ${card.accent}` : '1.5px solid #e2e8f0',
                  boxShadow: active ? `0 4px 12px ${card.accent}22` : '0 1px 3px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  transition: 'all .15s',
                  position: 'relative',
                }}
              >
                {active && (
                  <div style={{
                    position: 'absolute', top: 10, right: 12,
                    fontSize: 9, fontWeight: 800, color: card.accent,
                    background: card.accent + '20', borderRadius: 4, padding: '1px 6px',
                  }}>Đang lọc ✕</div>
                )}
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginBottom: 6,
                  color: active ? card.accent : '#94a3b8',
                }}>
                  {card.label}
                </div>
                <div style={{
                  fontSize: 28, fontWeight: 800,
                  color: active ? card.accent : '#1e293b',
                }}>
                  {card.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: '#fff', border: '1.5px solid #e2e8f0',
            borderRadius: 10, padding: '8px 14px', gap: 8, minWidth: 280,
          }}>
            <span style={{ color: '#94a3b8', fontSize: 14 }}>🔍</span>
            <input
              placeholder="Tìm cơ hội..."
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, color: '#475569', background: 'transparent', minWidth: 200 }}
            />
          </div>
        </div>

        {/* Table */}
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text">
              {myOrders.length === 0 ? 'Chưa có đơn hàng nào' : 'Không tìm thấy kết quả'}
            </div>
            <div className="empty-sub">
              {myOrders.length === 0 ? 'SMGR sẽ phân công đơn hàng cho bạn' : 'Thử tìm kiếm khác'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1060 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                  {COLS.map((h, i) => (
                    <th key={i} style={{
                      padding: '10px 12px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, color: '#94a3b8',
                      letterSpacing: 0.5, whiteSpace: 'nowrap', width: h.w,
                    }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o, idx) => {
                  const isExpanded = expandedId === o.id;
                  const isDefect   = !!(o.defect || o.isDefect);
                  const isDone     = ['delivered', 'in_warehouse'].includes(o.wfStatus || '') && !isDefect;
                  const isPending  = o.wfStatus === 'supplier_sent' && !isDefect;
                  const isActive   = o.wfStatus === 'in_production' && !isDefect;
                  const isLate     = (isPending || isActive) && o.smgrExpectDate && new Date(o.smgrExpectDate) < now;
                  const daysLate   = isLate ? Math.floor((now - new Date(o.smgrExpectDate)) / 86400000) : 0;

                  const catColor = CAT_CLR[o.orderType] || '#64748b';
                  const rowBg    = idx % 2 === 0 ? '#fff' : '#fafafe';

                  const kha      = o.khaNang ?? o.probability ?? 50;
                  const khaColor = kha >= 80 ? '#16a34a' : kha >= 60 ? '#2563eb' : kha >= 30 ? '#d97706' : '#dc2626';

                  const dateRaw = o.createdAt ? new Date(o.createdAt) : null;
                  const dateStr = dateRaw
                    ? dateRaw.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })
                    : fmtDate(o.createdAt);
                  const timeStr = dateRaw
                    ? dateRaw.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    : '';

                  return (
                    <React.Fragment key={o.id}>
                      <tr
                        style={{ borderBottom: '1px solid #f1f5f9', background: isExpanded ? '#f5f3ff' : rowBg, transition: 'background .12s' }}
                        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = '#f5f3ff'; }}
                        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = rowBg; }}
                      >
                        <td
                          style={{ padding: '10px 8px', textAlign: 'center', cursor: 'pointer', width: 36 }}
                          onClick={() => setExpandedId(isExpanded ? null : o.id)}
                        >
                          <span style={{
                            color: '#94a3b8', fontSize: 9, display: 'inline-block',
                            transform: isExpanded ? 'rotate(90deg)' : 'none',
                            transition: 'transform .15s',
                          }}>▶</span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 26, height: 26, background: '#f1f5f9', borderRadius: 7,
                            fontSize: 13, color: '#64748b', fontWeight: 700, cursor: 'default',
                          }}>-</span>
                        </td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{dateStr}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{timeStr}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#E8380D' }}>{o.emp || '–'}</span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {o.orderType ? (
                            <span style={{
                              fontSize: 12, fontWeight: 700, color: '#fff', background: catColor,
                              borderRadius: 99, padding: '4px 12px', whiteSpace: 'nowrap',
                            }}>
                              {o.orderType}
                            </span>
                          ) : '–'}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {o.quycach ? truncate(o.quycach, 20) : (o.name || '–')}
                        </td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                          {o.diadiem
                            ? <span style={{ fontSize: 12, color: '#475569' }}><span style={{ color: '#e11d48' }}>📍</span> {o.diadiem}</span>
                            : <span style={{ fontSize: 12, color: '#cbd5e1' }}>–</span>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', minWidth: 60 }}>
                              <div style={{
                                height: '100%', width: `${kha}%`,
                                background: `linear-gradient(90deg, ${khaColor}99, ${khaColor})`,
                                borderRadius: 99,
                              }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', minWidth: 32 }}>{kha}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {o.nccQuotePrice ? (
                            <span style={{
                              fontSize: 12, fontWeight: 700, color: '#16a34a',
                              background: '#f0fdf4', borderRadius: 6, padding: '4px 10px',
                              border: '1px solid #bbf7d0', display: 'inline-block', whiteSpace: 'nowrap',
                            }}>
                              ✓ 1 · {new Intl.NumberFormat('vi-VN').format(o.nccQuotePrice)}đ
                            </span>
                          ) : (
                            <span style={{
                              fontSize: 12, color: '#94a3b8',
                              border: '1px solid #e2e8f0', borderRadius: 6,
                              padding: '4px 10px', display: 'inline-block', whiteSpace: 'nowrap',
                            }}>
                              Chưa báo giá
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {isDone ? (
                            <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ Hoàn thành</span>
                          ) : isDefect ? (
                            <button
                              style={{ fontSize: 11, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}
                              onClick={() => handleClearDefect(o.id)}
                            >↩ Bỏ lỗi</button>
                          ) : o.nccDeclined ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 5, padding: '2px 7px', whiteSpace: 'nowrap' }}>
                                ❌ Đã từ chối
                              </span>
                              <button
                                onClick={() => setQuotePopup(o)}
                                style={{ fontSize: 10, fontWeight: 600, color: '#6d28d9', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                              >
                                ↩ Đổi sang BG
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              <button
                                onClick={() => setQuotePopup(o)}
                                style={{
                                  fontSize: 12, fontWeight: 700, color: '#fff',
                                  background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
                                  border: 'none', borderRadius: 7, padding: '6px 12px',
                                  cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                                }}
                              >
                                + Báo giá
                              </button>
                              <button
                                onClick={() => setDeclinePopup(o)}
                                style={{
                                  fontSize: 11, fontWeight: 600, color: '#dc2626',
                                  background: '#fef2f2', border: '1px solid #fecaca',
                                  borderRadius: 7, padding: '4px 10px',
                                  cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                                }}
                              >
                                ❌ Từ chối BG
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr style={{ background: '#f5f3ff', borderBottom: '2px solid #ede9fe' }}>
                          <td colSpan={11} style={{ padding: '16px 20px' }}>
                            {/* Cảnh báo lỗi */}
                            {o.defectNote && (
                              <div style={{ marginBottom: 14, fontSize: 11, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '7px 12px', color: '#dc2626' }}>
                                📝 <strong>Ghi chú lỗi:</strong> {o.defectNote}
                              </div>
                            )}

                            {/* Layout 2 cột: thông tin + tất cả BG */}
                            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
                              <MyInfoCard
                                order={o}
                                user={user}
                                onQuote={() => setQuotePopup(o)}
                                onDecline={() => setDeclinePopup(o)}
                              />
                              <AllQuotesPanel
                                order={o}
                                allOrders={orders}
                                mySupplier={user?.supplier}
                              />
                            </div>

                            {/* Nút hành động */}
                            {(isPending && !isDefect) && (
                              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                                <button className="btn btn-green btn-sm" onClick={() => handleDone(o.id)}>✅ Hoàn thành</button>
                                <button className="btn btn-red btn-sm" onClick={() => handleDefect(o.id)}>❌ Báo lỗi</button>
                              </div>
                            )}
                            {isActive && !isDefect && (
                              <div style={{ marginTop: 14 }}>
                                <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>
                                  ⏳ Chờ SMGR xác nhận bàn giao cho NCC
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {quotePopup && (
          <QuotePopup order={quotePopup} onSave={handleQuote} onClose={() => setQuotePopup(null)} />
        )}
        {declinePopup && (
          <DeclinePopup order={declinePopup} onSave={handleDecline} onClose={() => setDeclinePopup(null)} />
        )}
        {overduePopupEl}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // TAB: TÌNH TRẠNG (status) — card view theo bước sản xuất
  // ══════════════════════════════════════════════════════
  if (activeTab === 'status') {
    return (
      <div>
        {/* KPI */}
        <div className="kpi-strip">
          <div className="kpi-card" style={{
            borderTopColor: classified.pending.length > 0 ? '#dc2626' : '#e2e8f0',
            background: classified.pending.length > 0 ? '#fff5f5' : undefined,
          }}>
            <div className="kpi-lbl" style={{ color: classified.pending.length > 0 ? '#dc2626' : undefined }}>
              🔴 Chưa xử lý
            </div>
            <div className="kpi-val" style={{ color: '#dc2626' }}>{classified.pending.length}</div>
          </div>
          <div className="kpi-card" style={{ borderTopColor: '#0d9488' }}>
            <div className="kpi-lbl">⚙️ Đang sản xuất</div>
            <div className="kpi-val" style={{ color: '#0d9488' }}>{classified.active.length}</div>
          </div>
          <div className="kpi-card" style={{ borderTopColor: '#f97316' }}>
            <div className="kpi-lbl">⏰ Trễ hạn</div>
            <div className="kpi-val" style={{ color: '#f97316' }}>{classified.late.length}</div>
          </div>
          <div className="kpi-card" style={{ borderTopColor: '#16a34a' }}>
            <div className="kpi-lbl">✅ Hoàn thành</div>
            <div className="kpi-val" style={{ color: '#16a34a' }}>{classified.done.length}</div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="filter-chips">
          {[
            { key: 'all',     label: '📋 Tất cả' },
            {
              key: 'pending',
              label: `🔴 Chưa xử lý${classified.pending.length > 0 ? ` (${classified.pending.length})` : ''}`,
              red: classified.pending.length > 0,
            },
            { key: 'late',   label: '⏰ Đơn trễ'   },
            { key: 'done',   label: '✅ Hoàn thành' },
            { key: 'defect', label: '❌ Đơn lỗi'   },
          ].map(f => (
            <button
              key={f.key}
              className={`chip ${statusFilter === f.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(f.key)}
              style={f.red && statusFilter !== f.key ? {
                background: '#fef2f2', color: '#dc2626',
                border: '1.5px solid #fca5a5', fontWeight: 700,
              } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Order cards */}
        <div id="ps-list">
          {list.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <div className="empty-text">Không có đơn hàng nào</div>
            </div>
          ) : list.map(o => {
            const isDefect  = !!(o.defect || o.isDefect);
            const isDone    = ['delivered', 'in_warehouse'].includes(o.wfStatus || '') && !isDefect;
            const isPending = o.wfStatus === 'supplier_sent' && !isDefect;
            const isActive  = o.wfStatus === 'in_production' && !isDefect;
            const isLate    = (isPending || isActive) && o.smgrExpectDate && new Date(o.smgrExpectDate) < now;
            const daysLate  = isLate ? Math.floor((now - new Date(o.smgrExpectDate)) / 86400000) : 0;
            const wf = WF_LABEL[o.wfStatus] || { label: o.wfStatus || '–', color: '#64748b' };
            const accent = isDefect ? '#dc2626' : isLate ? '#f97316' : isPending ? '#dc2626' : isDone ? '#16a34a' : '#0d9488';

            let badge;
            if (isDefect)       badge = <span className="badge badge-red">❌ Đơn lỗi</span>;
            else if (isLate)    badge = <span className="badge badge-red">⏰ Trễ {daysLate} ngày</span>;
            else if (isPending) badge = (
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '2px 9px', borderRadius: 5,
                background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fca5a5',
                animation: 'pulse 2s infinite',
              }}>
                🔴 Chưa xử lý
              </span>
            );
            else if (isDone)    badge = <span className="badge badge-green">✅ Hoàn thành</span>;
            else                badge = <span className="badge" style={{ background: '#f0fdfa', color: '#0d9488' }}>⚙️ Đang sản xuất</span>;

            return (
              <div key={o.id} className="ord-card" style={{ borderLeft: `4px solid ${accent}` }}>
                <div className="ord-card-head">
                  <span className="ord-code" style={{ color: accent, background: accent + '14', borderColor: accent + '40' }}>
                    {o.code}
                  </span>
                  <span className="ord-name">{o.name}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: wf.color,
                    background: wf.color + '14', border: `1px solid ${wf.color}40`,
                    borderRadius: 5, padding: '2px 8px',
                  }}>
                    {wf.label}
                  </span>
                  {badge}
                  <span className="ord-amount">{fmt(o.grandTotal)}</span>
                </div>

                <div className="ord-meta">
                  <div className="ord-meta-item">
                    <div className="ord-meta-label">KD phụ trách</div>
                    <div className="ord-meta-val">{o.emp}</div>
                  </div>
                  {o.smgrExpectDate && (
                    <div className="ord-meta-item">
                      <div className="ord-meta-label">Hạn giao</div>
                      <div className="ord-meta-val" style={{ color: isLate ? '#dc2626' : '#0d9488' }}>
                        📅 {fmtDate(o.smgrExpectDate)} {isLate && `⚠️ quá ${daysLate} ngày`}
                      </div>
                    </div>
                  )}
                  <div className="ord-meta-item">
                    <div className="ord-meta-label">Ngày tạo</div>
                    <div className="ord-meta-val">{fmtDate(o.createdAt)}</div>
                  </div>
                </div>

                {o.defectNote && (
                  <div style={{
                    margin: '0 16px 10px', fontSize: 11,
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 7, padding: '7px 12px', color: '#dc2626',
                  }}>
                    📝 <strong>Ghi chú lỗi:</strong> {o.defectNote}
                  </div>
                )}

                <div className="ord-actions">
                  {!isDone && !isDefect && (
                    o.nccQuotePrice ? (
                      <button
                        className="btn btn-sm"
                        style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 700 }}
                        onClick={() => setQuotePopup(o)}
                      >
                        ✅ Đã báo: {new Intl.NumberFormat('vi-VN').format(o.nccQuotePrice)}đ
                        {o.nccQuoteNote && <span style={{ fontSize: 10, fontWeight: 500, marginLeft: 4 }}>· {o.nccQuoteNote}</span>}
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm"
                        style={{ background: '#dc2626', color: '#fff', border: 'none', fontWeight: 800 }}
                        onClick={() => setQuotePopup(o)}
                      >
                        🔴 Chưa báo giá — Bấm để nhập
                      </button>
                    )
                  )}

                  {isPending && !isDefect && (
                    <>
                      <button className="btn btn-green btn-sm" onClick={() => handleDone(o.id)}>
                        ✅ Hoàn thành
                      </button>
                      <button className="btn btn-red btn-sm" onClick={() => handleDefect(o.id)}>
                        ❌ Báo lỗi
                      </button>
                    </>
                  )}
                  {isActive && !isDefect && (
                    <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>
                      ⏳ Chờ SMGR xác nhận bàn giao
                    </span>
                  )}
                  {isDefect && (
                    <button className="btn btn-ghost btn-sm" onClick={() => handleClearDefect(o.id)}>
                      ↩ Bỏ lỗi
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {quotePopup && (
          <QuotePopup order={quotePopup} onSave={handleQuote} onClose={() => setQuotePopup(null)} />
        )}
        {overduePopupEl}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // TAB: DASHBOARD (dash)
  // ══════════════════════════════════════════════════════
  const total      = myOrders.length;
  const doneCount  = classified.done.length;
  const doneRate   = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const defectRate = total > 0 ? Math.round((classified.defect.length / total) * 100) : 0;
  const quotedCount = myOrders.filter(o => o.nccQuotePrice).length;
  const quoteRate   = total > 0 ? Math.round((quotedCount / total) * 100) : 0;

  const totalQuoteValue = myOrders.reduce((s, o) => s + (o.nccQuotePrice || 0), 0);
  const totalOrderValue = myOrders.reduce((s, o) => s + (o.grandTotal || 0), 0);

  // Top chủng loại
  const catMap = {};
  myOrders.forEach(o => {
    if (!o.orderType) return;
    catMap[o.orderType] = (catMap[o.orderType] || 0) + 1;
  });
  const topCats = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCat = topCats[0]?.[1] || 1;

  // 5 đơn gần nhất
  const recentOrders = [...myOrders]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const StatCard = ({ icon, label, value, sub, accent: ac = '#6d28d9' }) => (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '20px 22px',
      border: '1.5px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      borderTop: `3px solid ${ac}`,
    }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
    </div>
  );

  const RateBar = ({ label, value, color }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{value}%</span>
      </div>
      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${value}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: 99, transition: 'width .4s',
        }} />
      </div>
    </div>
  );

  return (
    <div>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <StatCard icon="📦" label="TỔNG ĐƠN HÀNG"   value={total}      ac="#6d28d9" />
        <StatCard icon="⚙️"  label="ĐANG SẢN XUẤT"   value={classified.active.length}  sub={`${classified.pending.length} chưa xử lý`} ac="#0d9488" />
        <StatCard icon="✅"  label="HOÀN THÀNH"       value={doneCount}  sub={`${doneRate}% tổng đơn`} ac="#16a34a" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard icon="⏰" label="TRỄ HẠN"          value={classified.late.length}   ac="#f97316" />
        <StatCard icon="❌" label="ĐƠN LỖI"          value={classified.defect.length} ac="#dc2626" />
        <StatCard icon="💰" label="ĐÃ BÁO GIÁ"       value={quotedCount} sub={`${quoteRate}% tổng đơn`} ac="#2563eb" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Tỷ lệ hiệu suất */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '20px 24px',
          border: '1.5px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 18 }}>📈 Tỷ lệ hiệu suất</div>
          <RateBar label="Tỷ lệ hoàn thành"    value={doneRate}   color="#16a34a" />
          <RateBar label="Tỷ lệ đã báo giá"    value={quoteRate}  color="#2563eb" />
          <RateBar label="Tỷ lệ đơn lỗi"       value={defectRate} color="#dc2626" />
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Tổng giá trị báo giá</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#2563eb' }}>
                {new Intl.NumberFormat('vi-VN').format(totalQuoteValue)}đ
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Tổng giá trị đơn hàng</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#6d28d9' }}>
                {new Intl.NumberFormat('vi-VN').format(totalOrderValue)}đ
              </span>
            </div>
          </div>
        </div>

        {/* Top chủng loại */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '20px 24px',
          border: '1.5px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 18 }}>🏷️ Top chủng loại sản phẩm</div>
          {topCats.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', paddingTop: 20 }}>Chưa có dữ liệu</div>
          ) : topCats.map(([cat, cnt]) => {
            const pct  = Math.round((cnt / maxCat) * 100);
            const clr  = CAT_CLR[cat] || '#6d28d9';
            return (
              <div key={cat} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#fff', background: clr,
                    borderRadius: 99, padding: '2px 10px',
                  }}>{cat}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{cnt} đơn</span>
                </div>
                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: `linear-gradient(90deg, ${clr}88, ${clr})`,
                    borderRadius: 99,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {overduePopupEl}

      {/* Đơn hàng gần nhất */}
      <div style={{
        background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>🕐 Đơn hàng gần nhất</span>
        </div>
        {recentOrders.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chưa có đơn hàng nào</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['MÃ ĐƠN', 'TÊN ĐƠN', 'KD', 'TRẠNG THÁI', 'HẠN GIAO', 'GIÁ TRỊ'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textAlign: 'left', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o, idx) => {
                const isDefect  = !!(o.defect || o.isDefect);
                const isDone    = ['delivered', 'in_warehouse'].includes(o.wfStatus || '') && !isDefect;
                const isPending = o.wfStatus === 'supplier_sent' && !isDefect;
                const isActive  = o.wfStatus === 'in_production' && !isDefect;
                const isLate    = (isPending || isActive) && o.smgrExpectDate && new Date(o.smgrExpectDate) < now;
                const accent = isDefect ? '#dc2626' : isLate ? '#f97316' : isPending ? '#dc2626' : isDone ? '#16a34a' : '#0d9488';
                const stateLabel = isDefect ? '❌ Lỗi' : isLate ? '⏰ Trễ' : isPending ? '🔴 Chờ xử lý' : isDone ? '✅ Xong' : '⚙️ Đang làm';
                return (
                  <tr key={o.id} style={{ borderTop: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafe' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#6d28d9' }}>{o.code || '–'}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#475569', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.name || '–'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#E8380D' }}>
                      {o.emp || '–'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: accent, background: accent + '14', borderRadius: 5, padding: '3px 8px', border: `1px solid ${accent}40` }}>
                        {stateLabel}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: isLate ? '#dc2626' : '#64748b' }}>
                      {o.smgrExpectDate ? fmtDate(o.smgrExpectDate) : '–'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                      {fmt(o.grandTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
