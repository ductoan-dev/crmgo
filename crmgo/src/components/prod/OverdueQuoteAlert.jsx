import React from 'react';
import { NCC_QUOTE_DEADLINE_HOURS } from '../../utils/constants';
import { truncate } from '../../utils/helpers';

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

export default OverdueQuoteAlert;
