import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore, useUIStore } from '../../store';
import { fmt, fmtDate, truncate } from '../../utils/helpers';
import { WF_LABEL, CAT_CLR } from '../../utils/constants';

// ── Popup xác nhận giao hàng ──────────────────────────────────
function DeliverPopup({ order, onSave, onClose }) {
  const [note, setNote] = useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: 24,
        width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        borderTop: '4px solid #059669',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#059669', marginBottom: 4 }}>
          📦 Xuất kho / Giao hàng
        </div>
        <div style={{
          fontSize: 12, color: 'var(--muted)', marginBottom: 18,
          paddingBottom: 14, borderBottom: '1px solid #f1f5f9',
        }}>
          Mã đơn: <strong style={{ color: '#6d28d9' }}>{order.code}</strong>
          {' · '}{truncate(order.name || order.customerName || '', 40)}
        </div>

        {/* Tóm tắt đơn */}
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 10, padding: '12px 14px', marginBottom: 16,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>KD phụ trách</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#E8380D' }}>{order.emp || '–'}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Giá trị đơn</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{fmt(order.grandTotal)}</div>
          </div>
          {order.diadiem && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Địa chỉ giao</div>
              <div style={{ fontSize: 12, color: '#475569' }}>📍 {order.diadiem}</div>
            </div>
          )}
        </div>

        <div className="fi-group" style={{ marginBottom: 20 }}>
          <label className="fi-label">Ghi chú giao hàng (tuỳ chọn)</label>
          <textarea
            className="fi"
            autoFocus
            rows={3}
            placeholder="Tên người nhận, thời gian giao, ghi chú đặc biệt..."
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{ resize: 'none', fontSize: 13 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Huỷ</button>
          <button
            className="btn"
            onClick={() => onSave(note.trim())}
            style={{
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#fff', border: 'none', fontWeight: 700,
            }}
          >
            🎉 Xác nhận giao hàng
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Order card ─────────────────────────────────────────────────
function OrderCard({ order, onDeliver }) {
  const isWarehouse = order.wfStatus === 'in_warehouse';
  const isDelivered = order.wfStatus === 'delivered';

  const catColor    = CAT_CLR[order.orderType] || '#64748b';
  const accentColor = isWarehouse ? '#059669' : '#16a34a';

  const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : null;
  const arrivedAt   = order.wfStatusChangedAt
    ? (isWarehouse ? new Date(order.wfStatusChangedAt) : null)
    : null;

  const waitH = isWarehouse && arrivedAt
    ? Math.floor((Date.now() - arrivedAt.getTime()) / 3_600_000)
    : null;

  return (
    <div className="ord-card" style={{ borderLeft: `4px solid ${accentColor}` }}>
      {/* Header */}
      <div className="ord-card-head">
        <span className="ord-code" style={{
          color: accentColor,
          background: accentColor + '14',
          borderColor: accentColor + '40',
        }}>
          {order.code}
        </span>
        <span className="ord-name">{order.name || order.customerName || '–'}</span>

        {order.orderType && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#fff',
            background: catColor, borderRadius: 5, padding: '2px 8px',
          }}>
            {order.orderType}
          </span>
        )}

        {isWarehouse && (
          <span style={{
            fontSize: 10, fontWeight: 800, color: '#059669',
            background: '#f0fdf4', border: '1.5px solid #86efac',
            borderRadius: 5, padding: '2px 8px',
            animation: 'pulse 2s infinite',
          }}>
            📦 Chờ giao hàng
          </span>
        )}
        {isDelivered && (
          <span style={{
            fontSize: 10, fontWeight: 800, color: '#16a34a',
            background: '#f0fdf4', border: '1.5px solid #bbf7d0',
            borderRadius: 5, padding: '2px 8px',
          }}>
            🎉 Đã giao
          </span>
        )}

        <span className="ord-amount">{fmt(order.grandTotal)}</span>
      </div>

      {/* Meta */}
      <div className="ord-meta">
        <div className="ord-meta-item">
          <div className="ord-meta-label">KD phụ trách</div>
          <div className="ord-meta-val" style={{ color: '#E8380D', fontWeight: 700 }}>
            {order.emp || '–'}
          </div>
        </div>
        {order.orderType && (
          <div className="ord-meta-item">
            <div className="ord-meta-label">Loại đơn</div>
            <div className="ord-meta-val">{order.orderType}</div>
          </div>
        )}
        {order.smgrNccName && (
          <div className="ord-meta-item">
            <div className="ord-meta-label">NCC sản xuất</div>
            <div className="ord-meta-val">🏭 {order.smgrNccName}</div>
          </div>
        )}
        {order.diadiem && (
          <div className="ord-meta-item">
            <div className="ord-meta-label">Địa chỉ giao</div>
            <div className="ord-meta-val">📍 {order.diadiem}</div>
          </div>
        )}
        {isWarehouse && arrivedAt && (
          <div className="ord-meta-item">
            <div className="ord-meta-label">Về kho lúc</div>
            <div className="ord-meta-val" style={{ color: waitH && waitH > 24 ? '#d97706' : '#059669' }}>
              {fmtDate(arrivedAt)}
              {waitH !== null && ` · ${waitH < 24 ? `${waitH}h trước` : `${Math.floor(waitH / 24)} ngày trước`}`}
            </div>
          </div>
        )}
        {isDelivered && deliveredAt && (
          <div className="ord-meta-item">
            <div className="ord-meta-label">Giao hàng</div>
            <div className="ord-meta-val" style={{ color: '#16a34a' }}>
              {fmtDate(deliveredAt)}{order.deliveredBy && ` · ${order.deliveredBy}`}
            </div>
          </div>
        )}
        {order.smgrExpectDate && (
          <div className="ord-meta-item">
            <div className="ord-meta-label">Hạn giao</div>
            <div className="ord-meta-val" style={{ color: '#0d9488' }}>
              📅 {fmtDate(order.smgrExpectDate)}
            </div>
          </div>
        )}
        <div className="ord-meta-item">
          <div className="ord-meta-label">Ngày tạo</div>
          <div className="ord-meta-val">{fmtDate(order.createdAt)}</div>
        </div>
      </div>

      {/* Ghi chú giao hàng */}
      {order.deliveryNote && (
        <div style={{
          margin: '0 16px 10px', fontSize: 12, color: '#16a34a',
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 7, padding: '7px 12px',
        }}>
          📝 <strong>Ghi chú:</strong> {order.deliveryNote}
        </div>
      )}

      {/* Actions */}
      <div className="ord-actions">
        {isWarehouse && (
          <button
            className="btn btn-sm"
            onClick={() => onDeliver(order)}
            style={{
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#fff', border: 'none', fontWeight: 700,
            }}
          >
            🎉 Xuất kho / Giao hàng
          </button>
        )}
        {isDelivered && (
          <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
            ✅ Đã hoàn thành giao hàng
          </span>
        )}
      </div>
    </div>
  );
}

// ── Tab Tồn kho ────────────────────────────────────────────────
function StockTab({ orders }) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear  = now.getFullYear();

  const deliveredThisMonth = orders.filter(o => {
    if (o.wfStatus !== 'delivered') return false;
    const d = o.deliveredAt ? new Date(o.deliveredAt) : null;
    return d && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const inWarehouse = orders.filter(o => o.wfStatus === 'in_warehouse');

  // Gom theo NCC để hiện hàng về kho
  const byNcc = {};
  inWarehouse.forEach(o => {
    const ncc = o.smgrNccName || 'Không xác định';
    if (!byNcc[ncc]) byNcc[ncc] = [];
    byNcc[ncc].push(o);
  });

  return (
    <div>
      {/* KPI tháng này */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          {
            icon: '📦', label: 'ĐANG TRONG KHO',
            value: inWarehouse.length,
            color: '#059669',
            sub: 'Chờ xuất kho giao hàng',
          },
          {
            icon: '🎉', label: 'ĐÃ GIAO THÁNG NÀY',
            value: deliveredThisMonth.length,
            color: '#16a34a',
            sub: `Tổng: ${fmt(deliveredThisMonth.reduce((s, o) => s + (o.grandTotal || 0), 0))}`,
          },
          {
            icon: '💰', label: 'GIÁ TRỊ TRONG KHO',
            value: fmt(inWarehouse.reduce((s, o) => s + (o.grandTotal || 0), 0)),
            color: '#2563eb',
            sub: `${inWarehouse.length} đơn hàng`,
          },
        ].map(card => (
          <div key={card.label} style={{
            background: '#fff', borderRadius: 14, padding: '20px 22px',
            border: '1.5px solid #e2e8f0', borderTop: `3px solid ${card.color}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5, marginBottom: 4 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: card.color, lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Hàng đang trong kho theo NCC */}
      {Object.keys(byNcc).length > 0 && (
        <div style={{
          background: '#fff', borderRadius: 12,
          border: '1px solid #e2e8f0', overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 20,
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>
              📦 Hàng đang trong kho — theo NCC
            </span>
          </div>
          {Object.entries(byNcc).map(([ncc, ords]) => (
            <div key={ncc} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div style={{
                padding: '10px 16px',
                background: '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                  🏭 {ncc}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#059669',
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: 5, padding: '2px 8px',
                }}>
                  {ords.length} đơn · {fmt(ords.reduce((s, o) => s + (o.grandTotal || 0), 0))}
                </span>
              </div>
              {ords.map(o => (
                <div key={o.id} style={{
                  padding: '10px 16px 10px 28px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: '1px solid #f8fafc',
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#6d28d9', minWidth: 90 }}>
                    {o.code}
                  </span>
                  <span style={{ fontSize: 12, color: '#475569', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.name || '–'}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
                    {fmt(o.grandTotal)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Placeholder thông báo */}
      <div style={{
        background: '#eff6ff', border: '1.5px solid #bfdbfe',
        borderRadius: 12, padding: '20px 24px',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>
          ℹ️ Tính năng quản lý tồn kho nguyên vật liệu
        </div>
        <div style={{ fontSize: 12, color: '#3b82f6', lineHeight: 1.6 }}>
          Tính năng nhập/xuất kho nguyên liệu (giấy, mực in, hộp...) đang được phát triển.
          Hiện tại tab này hiển thị thống kê hàng thành phẩm đang chờ giao.
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function KhoView() {
  const user       = useAuthStore(s => s.user);
  const orders     = useDataStore(s => s.orders);
  const khoDeliver = useDataStore(s => s.khoDeliver);
  const activeTab  = useUIStore(s => s.activeTab);

  const [filter,       setFilter]       = useState('all');
  const [q,            setQ]            = useState('');
  const [deliverPopup, setDeliverPopup] = useState(null);

  const khoOrders = useMemo(() =>
    orders.filter(o => ['in_warehouse', 'delivered'].includes(o.wfStatus || '')),
    [orders]
  );

  const classified = useMemo(() => {
    const warehouse = [], delivered = [];
    khoOrders.forEach(o => {
      if (o.wfStatus === 'in_warehouse') warehouse.push(o);
      else delivered.push(o);
    });
    return { warehouse, delivered };
  }, [khoOrders]);

  const list = useMemo(() => {
    let base;
    if (filter === 'warehouse') base = classified.warehouse;
    else if (filter === 'delivered') base = classified.delivered;
    else base = [...classified.warehouse, ...classified.delivered];

    if (!q.trim()) return base;
    const lq = q.toLowerCase();
    return base.filter(o =>
      o.code?.toLowerCase().includes(lq) ||
      o.name?.toLowerCase().includes(lq) ||
      o.emp?.toLowerCase().includes(lq) ||
      o.diadiem?.toLowerCase().includes(lq) ||
      o.smgrNccName?.toLowerCase().includes(lq)
    );
  }, [filter, classified, q]);

  const handleDeliver = async (note) => {
    if (!deliverPopup) return;
    try {
      await khoDeliver(deliverPopup.id, user?.name, note);
      toast.success('🎉 Đã giao hàng thành công!');
    } catch {
      toast.error('Không thể cập nhật trạng thái');
    }
    setDeliverPopup(null);
  };

  // ── Tab: Tồn kho ──
  if (activeTab === 'stock') {
    return <StockTab orders={orders} />;
  }

  // ── Tab: Đơn hàng ──
  return (
    <div>
      {/* KPI */}
      <div className="kpi-strip">
        <div
          className="kpi-card"
          style={{
            borderTopColor: classified.warehouse.length > 0 ? '#059669' : '#e2e8f0',
            background: classified.warehouse.length > 0 ? '#f0fdf4' : undefined,
            cursor: 'pointer',
          }}
          onClick={() => setFilter(filter === 'warehouse' ? 'all' : 'warehouse')}
        >
          <div className="kpi-lbl" style={{ color: classified.warehouse.length > 0 ? '#059669' : undefined }}>
            📦 Chờ giao hàng
          </div>
          <div className="kpi-val" style={{ color: '#059669' }}>{classified.warehouse.length}</div>
        </div>

        <div
          className="kpi-card"
          style={{ borderTopColor: '#16a34a', cursor: 'pointer' }}
          onClick={() => setFilter(filter === 'delivered' ? 'all' : 'delivered')}
        >
          <div className="kpi-lbl">🎉 Đã giao</div>
          <div className="kpi-val" style={{ color: '#16a34a' }}>{classified.delivered.length}</div>
        </div>

        <div className="kpi-card" style={{ borderTopColor: '#2563eb' }}>
          <div className="kpi-lbl">💰 Giá trị chờ giao</div>
          <div className="kpi-val" style={{ color: '#2563eb', fontSize: 18 }}>
            {fmt(classified.warehouse.reduce((s, o) => s + (o.grandTotal || 0), 0))}
          </div>
        </div>

        <div className="kpi-card" style={{ borderTopColor: '#6366f1' }}>
          <div className="kpi-lbl">📋 Tổng đã xử lý</div>
          <div className="kpi-val" style={{ color: '#6366f1' }}>{khoOrders.length}</div>
        </div>
      </div>

      {/* Filter + Search */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="filter-chips" style={{ margin: 0 }}>
          {[
            { key: 'all',        label: '📋 Tất cả' },
            {
              key: 'warehouse',
              label: `📦 Chờ giao${classified.warehouse.length > 0 ? ` (${classified.warehouse.length})` : ''}`,
              pulse: classified.warehouse.length > 0,
            },
            { key: 'delivered', label: '🎉 Đã giao' },
          ].map(f => (
            <button
              key={f.key}
              className={`chip ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
              style={f.pulse && filter !== f.key ? {
                background: '#f0fdf4', color: '#059669',
                border: '1.5px solid #86efac', fontWeight: 700,
              } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center',
          background: '#fff', border: '1.5px solid #e2e8f0',
          borderRadius: 10, padding: '7px 14px', gap: 8,
        }}>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>🔍</span>
          <input
            placeholder="Tìm đơn hàng, NCC, địa chỉ..."
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{
              border: 'none', outline: 'none', fontSize: 13,
              color: '#475569', background: 'transparent', minWidth: 200,
            }}
          />
        </div>
      </div>

      {/* Order list */}
      <div id="ps-list">
        {list.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-text">
              {khoOrders.length === 0 ? 'Chưa có đơn hàng nào trong kho' : 'Không tìm thấy kết quả'}
            </div>
            <div className="empty-sub">
              {khoOrders.length === 0
                ? 'Đơn hàng sẽ xuất hiện sau khi NCC hoàn thành sản xuất'
                : 'Thử tìm kiếm khác hoặc bỏ bộ lọc'}
            </div>
          </div>
        ) : list.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            onDeliver={(o) => setDeliverPopup(o)}
          />
        ))}
      </div>

      {deliverPopup && (
        <DeliverPopup
          order={deliverPopup}
          onSave={handleDeliver}
          onClose={() => setDeliverPopup(null)}
        />
      )}
    </div>
  );
}
