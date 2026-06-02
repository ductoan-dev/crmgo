import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { CAT_CLR, WF_LABEL, NCC_QUOTE_DEADLINE_HOURS } from '../../utils/constants';
import { fmt } from '../../utils/helpers';

function AssignPanel({ order, suppliers, onAssign, onClose }) {
  const [nccId,       setNccId]       = useState('');
  const [expectDate,  setExpectDate]  = useState('');
  const [note,        setNote]        = useState('');
  const [saving,      setSaving]      = useState(false);

  const selectedNcc = suppliers.find(s => String(s.id) === nccId);

  // Gợi ý NCC theo khu vực giao hàng của đơn (nếu có)
  const suggested = useMemo(() => {
    if (!order?.diadiem) return suppliers;
    return suppliers.filter(s =>
      !s.areas?.length || s.areas.some(a => order.diadiem?.includes(a) || a.includes(order.diadiem))
    );
  }, [suppliers, order?.diadiem]);

  const hasSuggested = suggested.length < suppliers.length && suggested.length > 0;

  const handleSubmit = async () => {
    if (!nccId) { toast.error('Chọn nhà cung cấp'); return; }
    setSaving(true);
    await onAssign(order.id, {
      nccName:    selectedNcc.name,
      expectDate: expectDate || null,
      note,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div style={{
      marginTop:0, borderTop:'1px solid #f1f5f9',
      background:'#f8fafc', padding:'14px 16px',
      borderBottomLeftRadius:10, borderBottomRightRadius:10,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <span style={{ fontWeight:700, fontSize:12, color:'#0d9488' }}>📤 Giao cho Nhà cung cấp</span>
        {order.orderType && (
          <span style={{
            fontSize:11, fontWeight:700, color:'#fff',
            background: CAT_CLR[order.orderType] || '#64748b',
            borderRadius:99, padding:'2px 9px',
          }}>
            {order.orderType}
          </span>
        )}
        {order.orderType === 'In nhanh' && (
          <span style={{ fontSize:10, color:'#d97706', fontWeight:700 }}>⚡ NCC cần báo giá trong 24h</span>
        )}
      </div>

      {/* NCC select */}
      <div className="fi-group" style={{ marginBottom:10 }}>
        <label className="fi-label">
          Chọn NCC <span style={{color:'red'}}>*</span>
          {hasSuggested && (
            <span style={{
              marginLeft:6, fontSize:10, fontWeight:700,
              background:'#f0fdf4', color:'#16a34a',
              border:'1px solid #bbf7d0', borderRadius:4, padding:'1px 6px',
            }}>✨ Gợi ý theo khu vực giao hàng</span>
          )}
        </label>
        <select className="fi" value={nccId} onChange={e => setNccId(e.target.value)}>
          <option value="">-- Chọn nhà cung cấp --</option>
          {hasSuggested && (
            <>
              <optgroup label={`⭐ Phù hợp khu vực (${suggested.length})`}>
                {suggested.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.areas?.length ? ` · ${s.areas.slice(0,2).join(', ')}${s.areas.length>2?'...':''}` : ' · Toàn quốc'}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Các NCC khác">
                {suppliers.filter(s => !suggested.includes(s)).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
            </>
          )}
          {!hasSuggested && suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* Hiện thông tin NCC được chọn */}
        {selectedNcc && (
          <div style={{
            marginTop:6, padding:'7px 10px', borderRadius:7,
            background:'#f0fdfa', border:'1px solid #99f6e4',
            fontSize:11, color:'#0d9488',
          }}>
            <strong>{selectedNcc.name}</strong>
            {selectedNcc.cats?.length > 0 && <span style={{color:'#64748b'}}> · {selectedNcc.cats.join(', ')}</span>}
            {selectedNcc.phone && <span style={{color:'#64748b'}}> · 📞 {selectedNcc.phone}</span>}
          </div>
        )}
      </div>

      <div className="form-grid">
        <div className="fi-group">
          <label className="fi-label">Hạn giao hàng</label>
          <input
            className="fi" type="date"
            value={expectDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setExpectDate(e.target.value)}
          />
        </div>
        <div className="fi-group">
          <label className="fi-label">Ghi chú cho NCC</label>
          <input className="fi" placeholder="Yêu cầu đặc biệt..."
            value={note} onChange={e => setNote(e.target.value)} />
        </div>
      </div>

      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Huỷ</button>
        <button
          className="btn btn-sm"
          style={{ background:'#0d9488', color:'#fff', border:'none' }}
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? '⏳...' : '📤 Giao sản xuất'}
        </button>
      </div>
    </div>
  );
}

export default AssignPanel;
