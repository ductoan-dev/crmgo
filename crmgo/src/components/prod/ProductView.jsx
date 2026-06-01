import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore } from '../../store';
import { fmt, fmtDate } from '../../utils/helpers';
import { CAT_CLR, WF_LABEL } from '../../utils/constants';

// ── Popup nhập báo giá ────────────────────────────────────────
function QuotePopup({ order, onSave, onClose }) {
  const [price, setPrice] = useState(
    order.nccQuotePrice ? new Intl.NumberFormat('vi-VN').format(order.nccQuotePrice) : ''
  );
  const [note, setNote] = useState(order.nccQuoteNote || '');

  const parsePrice = (s) => parseInt((s || '').replace(/\D/g, ''), 10) || 0;

  const handleBlur = () => {
    const n = parsePrice(price);
    setPrice(n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '');
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: 24,
        width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
          💰 Báo giá đơn hàng
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
          <strong style={{ color: '#6d28d9' }}>{order.code}</strong> · {order.name}
        </div>
        <div className="fi-group" style={{ marginBottom: 12 }}>
          <label className="fi-label">Giá báo (VNĐ) <span style={{ color: 'red' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <input
              className="fi" autoFocus placeholder="VD: 5.000.000"
              value={price} inputMode="numeric"
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
          <input className="fi" placeholder="Ghi chú về giá, điều kiện..."
            value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Huỷ</button>
          <button
            className="btn btn-primary" disabled={!parsePrice(price)}
            onClick={() => { const n = parsePrice(price); if (n) onSave(n, note.trim()); }}
          >
            ✅ Xác nhận báo giá
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card trái: thông tin cơ hội + báo giá của tôi ────────────
export function MyInfoCard({ order, user, onQuote, onDecline }) {
  const catColor  = CAT_CLR[order.orderType] || '#64748b';
  const wf        = WF_LABEL[order.wfStatus] || { label: order.wfStatus || '–', color: '#64748b' };
  const hasQuote  = !!order.nccQuotePrice;
  const isDone    = ['delivered', 'in_warehouse'].includes(order.wfStatus || '');

  const specParts = [
    order.orderType,
    order.quycach && `quy cách ${order.quycach}`,
    order.soluong  && `SL: ${order.soluong}${order.donvi ? ' ' + order.donvi : ''}`,
  ].filter(Boolean).join(' – ');

  return (
    <div style={{
      background: '#fff',
      border: '2px solid #6366f1',
      borderRadius: 14,
      padding: 20,
      boxShadow: '0 4px 16px rgba(99,102,241,0.10)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* Tiêu đề */}
      <div style={{
        paddingBottom: 14, borderBottom: '1px solid #e0e7ff',
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', letterSpacing: 0.6, marginBottom: 4 }}>
          THÔNG TIN CƠ HỘI & BÁO GIÁ CỦA TÔI
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
          ({user?.supplier || user?.name})
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#6d28d9',
            background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 5, padding: '2px 8px',
          }}>{order.code}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: wf.color,
            background: wf.color + '14', border: `1px solid ${wf.color}40`,
            borderRadius: 5, padding: '2px 8px',
          }}>{wf.label}</span>
          {order.smgrExpectDate && (
            <span style={{ fontSize: 11, color: '#64748b' }}>
              📅 {fmtDate(order.smgrExpectDate)}
            </span>
          )}
        </div>
      </div>

      {/* YÊU CẦU SẢN PHẨM */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', letterSpacing: 0.5, marginBottom: 8 }}>
          YÊU CẦU SP
        </div>
        <div style={{
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: 10,
          padding: '14px 16px',
        }}>
          {specParts ? (
            <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500, lineHeight: 1.6 }}>
              {specParts}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Chưa có thông tin sản phẩm</div>
          )}
          {order.thongtin && (
            <div style={{
              marginTop: 10, fontSize: 12, color: '#475569',
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 7, padding: '8px 12px', lineHeight: 1.6,
            }}>
              {order.thongtin}
            </div>
          )}
        </div>
      </div>

      {/* Thông tin thêm */}
      {(order.diadiem || order.emp || order.smgrNote) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 10,
        }}>
          {order.emp && (
            <div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>KD phụ trách</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#E8380D' }}>{order.emp}</div>
            </div>
          )}
          {order.diadiem && (
            <div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>Địa điểm</div>
              <div style={{ fontSize: 12, color: '#475569' }}>📍 {order.diadiem}</div>
            </div>
          )}
          {order.smgrNote && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>Ghi chú từ SMGR</div>
              <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }}>"{order.smgrNote}"</div>
            </div>
          )}
        </div>
      )}

      {/* BÁO GIÁ CỦA TÔI */}
      <div style={{
        marginTop: 'auto',
        borderTop: '1px solid #e0e7ff',
        paddingTop: 14,
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', letterSpacing: 0.5, marginBottom: 10 }}>
          BÁO GIÁ CỦA TÔI
        </div>

        {order.nccDeclined ? (
          <div style={{
            background: '#fef2f2', border: '1.5px solid #fca5a5',
            borderRadius: 10, padding: '12px 16px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>
              ❌ Đã từ chối báo giá
            </div>
            {order.nccDeclineReason && (
              <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginBottom: 10 }}>
                Lý do: {order.nccDeclineReason}
              </div>
            )}
            {!isDone && onQuote && (
              <button
                onClick={onQuote}
                style={{
                  fontSize: 12, fontWeight: 700, color: '#6d28d9',
                  background: '#f5f3ff', border: '1.5px solid #ddd6fe',
                  borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ↩ Chuyển sang báo giá
              </button>
            )}
          </div>
        ) : hasQuote ? (
          <div style={{
            background: '#f0fdf4', border: '1.5px solid #bbf7d0',
            borderRadius: 10, padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>
                {new Intl.NumberFormat('vi-VN').format(order.nccQuotePrice)}đ
              </div>
              {order.nccQuoteNote && (
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                  {order.nccQuoteNote}
                </div>
              )}
            </div>
            {!isDone && (
              <button
                onClick={onQuote}
                style={{
                  fontSize: 12, fontWeight: 700, color: '#16a34a',
                  background: '#dcfce7', border: '1.5px solid #86efac',
                  borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ✏️ Sửa giá
              </button>
            )}
          </div>
        ) : (
          <div style={{
            background: '#fef2f2', border: '1.5px dashed #fca5a5',
            borderRadius: 10, padding: '14px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, marginBottom: 10 }}>
              Chưa có báo giá
            </div>
            {!isDone && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={onQuote}
                  style={{
                    fontSize: 13, fontWeight: 800, color: '#fff',
                    background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
                    border: 'none', borderRadius: 8, padding: '8px 18px',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  💰 Nhập báo giá
                </button>
                {onDecline && (
                  <button
                    onClick={onDecline}
                    style={{
                      fontSize: 12, fontWeight: 700, color: '#dc2626',
                      background: '#fef2f2', border: '1.5px solid #fca5a5',
                      borderRadius: 8, padding: '8px 16px',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    ❌ Từ chối BG
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Panel phải: tất cả báo giá ────────────────────────────────
export function AllQuotesPanel({ order, allOrders, mySupplier }) {
  // Thu thập tất cả báo giá có liên quan đến cơ hội này
  const allQuotes = useMemo(() => {
    // Lấy những orders có cùng name/code gốc hoặc oppId
    const related = allOrders.filter(o =>
      o.id !== order.id && (
        (o.oppId && o.oppId === order.oppId) ||
        (o.name  && o.name  === order.name)
      ) && o.nccQuotePrice
    );

    const quotes = related.map(o => ({
      supplier: o.smgrNccName || '–',
      price:    o.nccQuotePrice,
      note:     o.nccQuoteNote,
      isMe:     o.smgrNccName === mySupplier,
    }));

    // Thêm báo giá của chính mình nếu đã có
    if (order.nccQuotePrice) {
      quotes.unshift({
        supplier: mySupplier || order.smgrNccName || '–',
        price:    order.nccQuotePrice,
        note:     order.nccQuoteNote,
        isMe:     true,
      });
    }

    return quotes.sort((a, b) => a.price - b.price);
  }, [allOrders, order, mySupplier]);

  const lowest = allQuotes[0]?.price || 0;

  return (
    <div style={{
      background: '#fff',
      border: '1.5px solid #e2e8f0',
      borderRadius: 14,
      padding: 20,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      height: '100%',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: '#475569',
        letterSpacing: 0.5, marginBottom: 16,
        paddingBottom: 12, borderBottom: '1px solid #f1f5f9',
      }}>
        TẤT CẢ BG ({allQuotes.length})
      </div>

      {allQuotes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
          Chưa có báo giá nào từ các NCC khác
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allQuotes.map((q, i) => {
            const isLowest = q.price === lowest && allQuotes.length > 1;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 10,
                border: q.isMe
                  ? '2px solid #6366f1'
                  : isLowest
                    ? '1.5px solid #bbf7d0'
                    : '1.5px solid #f1f5f9',
                background: q.isMe
                  ? '#eef2ff'
                  : isLowest
                    ? '#f0fdf4'
                    : '#fafafe',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: q.isMe ? '#6366f1' : '#1e293b',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {q.supplier}
                    {q.isMe && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, color: '#6366f1',
                        background: '#e0e7ff', borderRadius: 4, padding: '1px 5px',
                      }}>TÔI</span>
                    )}
                    {isLowest && !q.isMe && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, color: '#16a34a',
                        background: '#dcfce7', borderRadius: 4, padding: '1px 5px',
                      }}>Thấp nhất</span>
                    )}
                  </div>
                  {q.note && (
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{q.note}</div>
                  )}
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 800,
                  color: q.isMe ? '#6366f1' : '#16a34a',
                  whiteSpace: 'nowrap', marginLeft: 12,
                }}>
                  {new Intl.NumberFormat('vi-VN').format(q.price)}đ
                </div>
              </div>
            );
          })}
        </div>
      )}

      {allQuotes.length > 1 && (
        <div style={{
          marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9',
          fontSize: 11, color: '#64748b',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Thấp nhất</span>
            <span style={{ fontWeight: 700, color: '#16a34a' }}>
              {new Intl.NumberFormat('vi-VN').format(Math.min(...allQuotes.map(q => q.price)))}đ
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Cao nhất</span>
            <span style={{ fontWeight: 700, color: '#dc2626' }}>
              {new Intl.NumberFormat('vi-VN').format(Math.max(...allQuotes.map(q => q.price)))}đ
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function ProductView() {
  const user           = useAuthStore(s => s.user);
  const orders         = useDataStore(s => s.orders);
  const updateProdQuote = useDataStore(s => s.updateProdQuote);

  const [selectedId, setSelectedId] = useState(null);
  const [quotePopup,  setQuotePopup]  = useState(null);
  const [q,      setQ]      = useState('');
  const [filter, setFilter] = useState('all');

  const mySupplier = user?.supplier;

  const myOrders = useMemo(() =>
    orders.filter(o => !mySupplier || o.smgrNccName === mySupplier),
    [orders, mySupplier]
  );

  const counts = useMemo(() => ({
    all:     myOrders.length,
    quoted:  myOrders.filter(o => !!o.nccQuotePrice).length,
    pending: myOrders.filter(o => !o.nccQuotePrice).length,
  }), [myOrders]);

  const filtered = useMemo(() => {
    let list = myOrders;
    if (filter === 'quoted')  list = list.filter(o => !!o.nccQuotePrice);
    if (filter === 'pending') list = list.filter(o => !o.nccQuotePrice);
    if (!q.trim()) return list;
    const lq = q.toLowerCase();
    return list.filter(o =>
      o.code?.toLowerCase().includes(lq) ||
      o.name?.toLowerCase().includes(lq) ||
      o.orderType?.toLowerCase().includes(lq) ||
      o.quycach?.toLowerCase().includes(lq)
    );
  }, [myOrders, q, filter]);

  const selected = useMemo(() =>
    selectedId ? myOrders.find(o => o.id === selectedId) : (filtered[0] || null),
    [selectedId, myOrders, filtered]
  );

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

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%', minHeight: 500 }}>

      {/* ── Sidebar: danh sách đơn hàng ── */}
      <div style={{
        width: 260, flexShrink: 0,
        background: '#fff', borderRadius: 12,
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', letterSpacing: 0.5, marginBottom: 10 }}>
            CƠ HỘI CỦA TÔI ({myOrders.length})
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {[
              { key: 'all',     label: 'Tất cả',        count: counts.all,     color: '#6366f1' },
              { key: 'quoted',  label: 'Đã báo giá',    count: counts.quoted,  color: '#16a34a' },
              { key: 'pending', label: 'Chưa báo giá',  count: counts.pending, color: '#dc2626' },
            ].map(tab => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setFilter(tab.key); setSelectedId(null); }}
                  style={{
                    flex: 1,
                    padding: '5px 4px',
                    borderRadius: 7,
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    border: active ? `1.5px solid ${tab.color}` : '1.5px solid #e2e8f0',
                    background: active ? tab.color + '14' : '#f8fafc',
                    color: active ? tab.color : '#94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    lineHeight: 1.2,
                    transition: 'all .12s',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 800 }}>{tab.count}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <input
            className="fi" style={{ marginBottom: 0 }}
            placeholder="🔍 Tìm đơn..."
            value={q} onChange={e => setQ(e.target.value)}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
              Không tìm thấy đơn nào
            </div>
          ) : filtered.map(o => {
            const isActive  = selected?.id === o.id;
            const hasQuote  = !!o.nccQuotePrice;
            const catColor  = CAT_CLR[o.orderType] || '#64748b';
            return (
              <div
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid #f8fafc',
                  cursor: 'pointer',
                  background: isActive ? '#eef2ff' : '#fff',
                  borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                  transition: 'all .12s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                    color: isActive ? '#6366f1' : '#64748b',
                  }}>{o.code}</span>
                  {o.orderType && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: '#fff',
                      background: catColor, borderRadius: 4, padding: '1px 6px',
                    }}>{o.orderType}</span>
                  )}
                </div>
                <div style={{
                  fontSize: 12, color: '#1e293b', fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {o.name || o.customerName || '–'}
                </div>
                <div style={{ marginTop: 4 }}>
                  {hasQuote ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>
                      ✓ {new Intl.NumberFormat('vi-VN').format(o.nccQuotePrice)}đ
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
                      Chưa báo giá
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Detail: 2 cột ── */}
      {selected ? (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, minWidth: 0 }}>
          <MyInfoCard
            order={selected}
            user={user}
            onQuote={() => setQuotePopup(selected)}
          />
          <AllQuotesPanel
            order={selected}
            allOrders={orders}
            mySupplier={mySupplier}
          />
        </div>
      ) : (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#fff', borderRadius: 12, border: '1.5px solid #e2e8f0',
        }}>
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Chọn một đơn hàng để xem chi tiết</div>
          </div>
        </div>
      )}

      {quotePopup && (
        <QuotePopup order={quotePopup} onSave={handleQuote} onClose={() => setQuotePopup(null)} />
      )}
    </div>
  );
}
