import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { fmt } from '../../utils/helpers';

function PaymentPanel({ ord, onRecord, onClose }) {
  const [amount, setAmount] = useState('');
  const [note,   setNote]   = useState('');

  const netDue    = (ord.grandTotal || 0) - (ord.deposit || 0);  // trừ cọc
  const remaining = netDue - (ord.ktPaidAmount || 0);             // còn lại KT chưa thu
  const amountNum = Number(amount.replace(/\./g, '')) || 0;
  const afterPay  = remaining - amountNum;

  const handleQuick = (val) => setAmount(val.toLocaleString('vi-VN'));

  const handleSubmit = () => {
    if (!amountNum || amountNum <= 0) { toast.error('Nhập số tiền hợp lệ'); return; }
    if (amountNum > remaining + 1)    { toast.error('Số tiền vượt quá số còn lại'); return; }
    onRecord(amountNum, note.trim());
  };

  // Quick-fill: toàn bộ còn lại, một nửa còn lại (không có nút cọc vì cọc đã được trừ)
  const quickAmounts = [remaining, Math.round(remaining / 2)]
    .filter(v => v > 0 && v <= remaining);

  return (
    <div style={{
      borderTop: '1px solid #f1f5f9', background: '#f8fafc',
      padding: '14px 16px',
      borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
    }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: '#7c3aed', marginBottom: 10 }}>
        💰 Ghi nhận thanh toán
      </div>

      {/* Tóm tắt số liệu */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 12,
        background: '#fff', borderRadius: 8, padding: '8px 12px',
        border: '1px solid #e2e8f0',
      }}>
        {[
          { label: 'TỔNG ĐƠN',  value: fmt(ord.grandTotal),     color: '#374151' },
          { label: ord.deposit > 0 ? 'CỌC + KT' : 'ĐÃ THU',
            value: ord.deposit > 0
              ? `${fmt(ord.deposit)} + ${fmt(ord.ktPaidAmount||0)}`
              : fmt(ord.ktPaidAmount||0),
            color: '#16a34a' },
          { label: 'KT CẦN THU',
            value: remaining > 0 ? fmt(remaining) : '✅ Đủ',
            color: remaining > 0 ? '#dc2626' : '#16a34a' },
        ].map(item => (
          <div key={item.label}>
            <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>{item.label}</div>
            <div style={{ fontWeight: 800, fontSize: 13, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Quick-fill buttons */}
      {quickAmounts.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {quickAmounts.map((v, i) => (
            <button key={i} type="button" onClick={() => handleQuick(v)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              border: '1px solid #ddd6fe', background: '#f5f3ff', color: '#7c3aed',
            }}>
              {i === 0 ? '💯 Toàn bộ còn lại' : '½ Một nửa'} · {fmt(v)}
            </button>
          ))}
        </div>
      )}

      <div className="form-grid">
        <div className="fi-group">
          <label className="fi-label">Số tiền nhận (₫) <span style={{color:'red'}}>*</span></label>
          <input
            className="fi" autoFocus
            placeholder="VD: 5.000.000"
            value={amount}
            inputMode="numeric"
            onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            onBlur={e => {
              const n = Number(e.target.value.replace(/\./g, ''));
              setAmount(n > 0 ? n.toLocaleString('vi-VN') : '');
            }}
          />
          {amountNum > 0 && (
            <div style={{
              fontSize: 11, marginTop: 4, fontWeight: 700,
              color: afterPay > 0 ? '#16a34a' : afterPay === 0 ? '#16a34a' : '#dc2626',
            }}>
              {afterPay > 0  ? `Sau khi nhận → còn lại: ${fmt(afterPay)}`
               : afterPay === 0 ? '✅ Thanh toán đầy đủ!'
               : `⚠ Vượt ${fmt(-afterPay)}`}
            </div>
          )}
        </div>
        <div className="fi-group">
          <label className="fi-label">Ghi chú</label>
          <input className="fi" placeholder="Chuyển khoản MB Bank, tiền mặt..."
            value={note} onChange={e => setNote(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Huỷ</button>
        <button
          className="btn btn-sm"
          style={{ background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 700 }}
          onClick={handleSubmit}
        >
          💰 Xác nhận nhận tiền
        </button>
      </div>
    </div>
  );
}

export default PaymentPanel;
