import React, { useState } from 'react';
import { fmt } from '../../utils/helpers';

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

export default QuotePopup;
