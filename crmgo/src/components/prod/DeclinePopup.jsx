import React, { useState } from 'react';

const DECLINE_REASONS = [
  'NCC không đủ năng lực sản xuất',
  'Quy cách sản phẩm quá khó',
  'Giá nguyên liệu quá cao',
  'Quá tải đơn hàng hiện tại',
  'Không phù hợp chuyên môn',
];

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

export default DeclinePopup;
