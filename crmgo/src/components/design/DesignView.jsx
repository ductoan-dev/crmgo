import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore, useUIStore } from '../../store';
import { fmt, fmtDate, truncate } from '../../utils/helpers';
import { WF_LABEL, CAT_CLR } from '../../utils/constants';

// ── Popup hoàn thành thiết kế ─────────────────────────────────
function DonePopup({ order, onSave, onClose }) {
  const [note, setNote] = useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: 24,
        width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        borderTop: '4px solid #db2877',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#db2877', marginBottom: 4 }}>
          🎨 Hoàn thành thiết kế
        </div>
        <div style={{
          fontSize: 12, color: 'var(--muted)', marginBottom: 18,
          paddingBottom: 14, borderBottom: '1px solid #f1f5f9',
        }}>
          Mã đơn: <strong style={{ color: '#6d28d9' }}>{order.code}</strong>
          {' · '}{truncate(order.name || order.customerName || '', 40)}
        </div>

        <div className="fi-group" style={{ marginBottom: 20 }}>
          <label className="fi-label">Ghi chú thiết kế (tuỳ chọn)</label>
          <textarea
            className="fi"
            autoFocus
            rows={3}
            placeholder="Mô tả công việc đã thực hiện, file đính kèm, lưu ý cho NCC..."
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
              background: 'linear-gradient(135deg, #db2877, #9d174d)',
              color: '#fff', border: 'none', fontWeight: 700,
            }}
          >
            ✅ Xác nhận hoàn thành
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Order card ────────────────────────────────────────────────
function OrderCard({ order, user, onAccept, onComplete }) {
  const isPending = order.wfStatus === 'kt_approved';
  const isActive  = order.wfStatus === 'in_design';
  const isDone    = order.wfStatus === 'design_done';

  const catColor = CAT_CLR[order.orderType] || '#64748b';

  const accentColor = isPending ? '#f59e0b'
    : isActive ? '#db2877'
    : '#16a34a';

  const acceptedAt = order.designAcceptedAt ? new Date(order.designAcceptedAt) : null;
  const doneAt     = order.designDoneAt     ? new Date(order.designDoneAt)     : null;

  const ageH = isActive && acceptedAt
    ? Math.floor((Date.now() - acceptedAt.getTime()) / 3_600_000)
    : null;

  const specParts = [
    order.orderType,
    order.quycach && `quy cách: ${order.quycach}`,
    order.soluong  && `SL: ${order.soluong}${order.donvi ? ' ' + order.donvi : ''}`,
  ].filter(Boolean).join(' · ');

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

        {isPending && (
          <span style={{
            fontSize: 10, fontWeight: 800, color: '#d97706',
            background: '#fffbeb', border: '1.5px solid #fcd34d',
            borderRadius: 5, padding: '2px 8px',
          }}>
            ⏳ Chờ nhận TK
          </span>
        )}
        {isActive && (
          <span style={{
            fontSize: 10, fontWeight: 800, color: '#db2877',
            background: '#fdf2f8', border: '1.5px solid #f9a8d4',
            borderRadius: 5, padding: '2px 8px',
          }}>
            🎨 Đang thiết kế
          </span>
        )}
        {isDone && (
          <span style={{
            fontSize: 10, fontWeight: 800, color: '#16a34a',
            background: '#f0fdf4', border: '1.5px solid #86efac',
            borderRadius: 5, padding: '2px 8px',
          }}>
            ✅ Đã xong
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
        {specParts && (
          <div className="ord-meta-item">
            <div className="ord-meta-label">Sản phẩm</div>
            <div className="ord-meta-val">{specParts}</div>
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
        {isActive && acceptedAt && (
          <div className="ord-meta-item">
            <div className="ord-meta-label">Đã nhận</div>
            <div className="ord-meta-val" style={{ color: '#db2877' }}>
              {ageH !== null ? `${ageH}h trước` : fmtDate(acceptedAt)}
              {order.designAcceptedBy && ` · ${order.designAcceptedBy}`}
            </div>
          </div>
        )}
        {isDone && doneAt && (
          <div className="ord-meta-item">
            <div className="ord-meta-label">Hoàn thành</div>
            <div className="ord-meta-val" style={{ color: '#16a34a' }}>
              {fmtDate(doneAt)}{order.designDoneBy && ` · ${order.designDoneBy}`}
            </div>
          </div>
        )}
      </div>

      {/* Yêu cầu thiết kế từ Sales / SMGR */}
      {(order.thongtin || order.smgrNote || order.designNote) && (
        <div style={{ margin: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {order.thongtin && (
            <div style={{
              fontSize: 12, color: '#475569',
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 7, padding: '7px 12px',
            }}>
              📋 <strong>Yêu cầu:</strong> {order.thongtin}
            </div>
          )}
          {order.smgrNote && (
            <div style={{
              fontSize: 12, color: '#7c3aed',
              background: '#f5f3ff', border: '1px solid #ddd6fe',
              borderRadius: 7, padding: '7px 12px',
            }}>
              📌 <strong>Ghi chú SMGR:</strong> {order.smgrNote}
            </div>
          )}
          {isDone && order.designNote && (
            <div style={{
              fontSize: 12, color: '#16a34a',
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 7, padding: '7px 12px',
            }}>
              🎨 <strong>Ghi chú TK:</strong> {order.designNote}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="ord-actions">
        {isPending && (
          <button
            className="btn btn-sm"
            onClick={() => onAccept(order.id)}
            style={{
              background: 'linear-gradient(135deg, #db2877, #9d174d)',
              color: '#fff', border: 'none', fontWeight: 700,
            }}
          >
            🎨 Nhận đơn thiết kế
          </button>
        )}
        {isActive && (
          <button
            className="btn btn-green btn-sm"
            onClick={() => onComplete(order)}
          >
            ✅ Hoàn thành thiết kế
          </button>
        )}
        {isDone && (
          <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
            ✅ Đã hoàn thành — chờ SMGR tiếp nhận
          </span>
        )}
      </div>
    </div>
  );
}

// ── Tab Phân công ─────────────────────────────────────────────
function AssignTab({ orders }) {
  const thisMonth = new Date().getMonth();
  const thisYear  = new Date().getFullYear();

  // Gom theo designer
  const byDesigner = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      const designer = o.designAcceptedBy || o.designDoneBy;
      if (!designer) return;
      if (!map[designer]) map[designer] = { active: 0, done: 0 };
      if (o.wfStatus === 'in_design') map[designer].active++;
      if (o.wfStatus === 'design_done') {
        const doneDate = o.designDoneAt ? new Date(o.designDoneAt) : null;
        if (doneDate && doneDate.getMonth() === thisMonth && doneDate.getFullYear() === thisYear) {
          map[designer].done++;
        }
      }
    });
    return Object.entries(map).sort((a, b) => b[1].active - a[1].active);
  }, [orders, thisMonth, thisYear]);

  const unassigned = orders.filter(o => o.wfStatus === 'kt_approved').length;

  return (
    <div>
      {unassigned > 0 && (
        <div style={{
          marginBottom: 20, padding: '12px 16px',
          background: '#fffbeb', border: '1.5px solid #fcd34d',
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
              {unassigned} đơn chưa được nhận thiết kế
            </div>
            <div style={{ fontSize: 12, color: '#78716c' }}>
              Chuyển sang tab "Đơn thiết kế" để nhận và xử lý
            </div>
          </div>
        </div>
      )}

      {byDesigner.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📌</div>
          <div className="empty-text">Chưa có phân công nào</div>
          <div className="empty-sub">Dữ liệu phân công sẽ hiện sau khi designer nhận đơn</div>
        </div>
      ) : (
        <div style={{
          background: '#fff', borderRadius: 12,
          border: '1px solid #e2e8f0', overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>
              📌 Khối lượng công việc designer
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['DESIGNER', 'ĐANG THIẾT KẾ', 'XONG THÁNG NÀY', 'TỔNG'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byDesigner.map(([name, counts], idx) => (
                <tr
                  key={name}
                  style={{
                    borderTop: '1px solid #f1f5f9',
                    background: idx % 2 === 0 ? '#fff' : '#fafafe',
                  }}
                >
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                    🎨 {name}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {counts.active > 0 ? (
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: '#db2877',
                        background: '#fdf2f8', border: '1px solid #f9a8d4',
                        borderRadius: 5, padding: '2px 10px',
                      }}>
                        {counts.active} đơn
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>–</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: '#16a34a',
                      background: '#f0fdf4', border: '1px solid #bbf7d0',
                      borderRadius: 5, padding: '2px 10px',
                    }}>
                      {counts.done} đơn
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#475569' }}>
                    {counts.active + counts.done}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function DesignView() {
  const user           = useAuthStore(s => s.user);
  const orders         = useDataStore(s => s.orders);
  const designAccept   = useDataStore(s => s.designAccept);
  const designComplete = useDataStore(s => s.designComplete);
  const activeTab      = useUIStore(s => s.activeTab);

  const [filter,    setFilter]    = useState('all');
  const [q,         setQ]         = useState('');
  const [donePopup, setDonePopup] = useState(null);

  const designOrders = useMemo(() =>
    orders.filter(o => ['kt_approved', 'in_design', 'design_done'].includes(o.wfStatus || '')),
    [orders]
  );

  const classified = useMemo(() => {
    const pending = [], active = [], done = [];
    designOrders.forEach(o => {
      if (o.wfStatus === 'kt_approved') pending.push(o);
      else if (o.wfStatus === 'in_design') active.push(o);
      else done.push(o);
    });
    return { pending, active, done };
  }, [designOrders]);

  const list = useMemo(() => {
    let base;
    if (filter === 'pending') base = classified.pending;
    else if (filter === 'active') base = classified.active;
    else if (filter === 'done') base = classified.done;
    else base = [...classified.pending, ...classified.active, ...classified.done];

    if (!q.trim()) return base;
    const lq = q.toLowerCase();
    return base.filter(o =>
      o.code?.toLowerCase().includes(lq) ||
      o.name?.toLowerCase().includes(lq) ||
      o.emp?.toLowerCase().includes(lq) ||
      o.orderType?.toLowerCase().includes(lq) ||
      o.thongtin?.toLowerCase().includes(lq)
    );
  }, [filter, classified, q]);

  const handleAccept = async (ordId) => {
    try {
      await designAccept(ordId, user?.name);
      toast.success('🎨 Đã nhận đơn thiết kế');
    } catch {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const handleComplete = async (note) => {
    if (!donePopup) return;
    try {
      await designComplete(donePopup.id, user?.name, note);
      toast.success('✅ Thiết kế hoàn thành — SMGR sẽ tiếp nhận');
    } catch {
      toast.error('Không thể cập nhật trạng thái');
    }
    setDonePopup(null);
  };

  // ── Tab: Phân công ──
  if (activeTab === 'assign') {
    return <AssignTab orders={designOrders} />;
  }

  // ── Tab: Đơn thiết kế ──
  return (
    <div>
      {/* KPI */}
      <div className="kpi-strip">
        <div
          className="kpi-card"
          style={{
            borderTopColor: classified.pending.length > 0 ? '#d97706' : '#e2e8f0',
            background: classified.pending.length > 0 ? '#fffbeb' : undefined,
            cursor: 'pointer',
          }}
          onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')}
        >
          <div className="kpi-lbl" style={{ color: classified.pending.length > 0 ? '#d97706' : undefined }}>
            ⏳ Chờ nhận TK
          </div>
          <div className="kpi-val" style={{ color: '#d97706' }}>{classified.pending.length}</div>
        </div>

        <div
          className="kpi-card"
          style={{ borderTopColor: '#db2877', cursor: 'pointer' }}
          onClick={() => setFilter(filter === 'active' ? 'all' : 'active')}
        >
          <div className="kpi-lbl">🎨 Đang thiết kế</div>
          <div className="kpi-val" style={{ color: '#db2877' }}>{classified.active.length}</div>
        </div>

        <div
          className="kpi-card"
          style={{ borderTopColor: '#16a34a', cursor: 'pointer' }}
          onClick={() => setFilter(filter === 'done' ? 'all' : 'done')}
        >
          <div className="kpi-lbl">✅ Thiết kế xong</div>
          <div className="kpi-val" style={{ color: '#16a34a' }}>{classified.done.length}</div>
        </div>

        <div className="kpi-card" style={{ borderTopColor: '#6366f1' }}>
          <div className="kpi-lbl">📋 Tổng</div>
          <div className="kpi-val" style={{ color: '#6366f1' }}>{designOrders.length}</div>
        </div>
      </div>

      {/* Filter + Search */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="filter-chips" style={{ margin: 0 }}>
          {[
            { key: 'all',     label: '📋 Tất cả' },
            {
              key: 'pending',
              label: `⏳ Chờ nhận${classified.pending.length > 0 ? ` (${classified.pending.length})` : ''}`,
              warn: classified.pending.length > 0,
            },
            { key: 'active', label: '🎨 Đang TK' },
            { key: 'done',   label: '✅ Hoàn thành' },
          ].map(f => (
            <button
              key={f.key}
              className={`chip ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
              style={f.warn && filter !== f.key ? {
                background: '#fffbeb', color: '#d97706',
                border: '1.5px solid #fcd34d', fontWeight: 700,
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
            placeholder="Tìm đơn hàng..."
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{
              border: 'none', outline: 'none', fontSize: 13,
              color: '#475569', background: 'transparent', minWidth: 180,
            }}
          />
        </div>
      </div>

      {/* Order list */}
      <div id="ps-list">
        {list.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎨</div>
            <div className="empty-text">
              {designOrders.length === 0 ? 'Chưa có đơn thiết kế nào' : 'Không tìm thấy kết quả'}
            </div>
            <div className="empty-sub">
              {designOrders.length === 0
                ? 'Đơn hàng sẽ xuất hiện sau khi KT phê duyệt'
                : 'Thử tìm kiếm khác hoặc bỏ bộ lọc'}
            </div>
          </div>
        ) : list.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            user={user}
            onAccept={handleAccept}
            onComplete={(o) => setDonePopup(o)}
          />
        ))}
      </div>

      {donePopup && (
        <DonePopup
          order={donePopup}
          onSave={handleComplete}
          onClose={() => setDonePopup(null)}
        />
      )}
    </div>
  );
}
