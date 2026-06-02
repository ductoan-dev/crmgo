import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore } from '../../store';
import {
  CATS, TEMP_CFG, VIETNAM_REGIONS, CUSTOMER_PROFILES,
} from '../../utils/constants';
import {
  SALES_LIST, CHANNELS, LOAI_KHACH, NGANH_LIST,
  NGAN_SACH_LIST, THOI_DIEM_LIST,
  autoAssignKd,
} from './helpers';

/* ═══════════════════════════════════════════════════════════════
   MODAL TẠO LEAD (CSKH)
═══════════════════════════════════════════════════════════════ */
export default function CreateLeadModal({ leads, orders, onClose }) {
  const user    = useAuthStore(s => s.user);
  const addLead = useDataStore(s => s.addLead);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', company: '',
    loaiKhach: '', nganh: '', area: '',
    product: '', channel: '', temp: 'warm',
    nganSach: 'Chưa xác định', thoiDiem: 'Chưa xác định',
    chandung: [], note: '', birthday: '',
    attachments: [],
  });
  const [assign, setAssign] = useState(null);
  const [saving, setSaving] = useState(false);
  const [attName, setAttName] = useState('');
  const [attUrl,  setAttUrl]  = useState('');

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    setAssign(autoAssignKd(form.phone, form.company, leads, orders));
  }, [form.phone, form.company]);

  const addAtt = () => {
    if (!attUrl.trim()) { toast.error('Vui lòng nhập URL / Link'); return; }
    setF('attachments', [...form.attachments, {
      id: Date.now(), type: 'link',
      url:     attUrl.trim(),
      name:    attName.trim() || attUrl.trim(),
      addedAt: new Date().toISOString(),
    }]);
    setAttUrl(''); setAttName('');
  };

  const removeAtt = (id) => setF('attachments', form.attachments.filter(a => a.id !== id));

  const handleSave = async () => {
    if (!form.name.trim())  { toast.error('Vui lòng nhập tên khách hàng'); return; }
    if (!form.phone.trim()) { toast.error('Vui lòng nhập số điện thoại'); return; }
    setSaving(true);
    try {
      await addLead({
        ...form,
        assignedTo:    assign?.name || '',
        createdBy:     user?.name,
        contactStatus: 'chua_lh',
        cskhCalls:     [],
      });
      toast.success(`✅ Đã tạo lead "${form.name}"${assign?.name ? ` → phân cho ${assign.name}` : ''}`);
      onClose();
    } catch (e) {
      toast.error(e.message || 'Lỗi khi tạo lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '20px 16px', overflowY: 'auto',
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 660,
        boxShadow: '0 32px 80px rgba(0,0,0,.25)',
        marginTop: 20, marginBottom: 20,
      }}>

        {/* Header */}
        <div style={{
          padding: '18px 24px 14px',
          background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
          borderBottom: '1px solid #bbf7d0',
          borderRadius: '16px 16px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#15803d' }}>🤝 Tiếp nhận Lead mới</div>
            <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>
              CSKH nhập thông tin · hệ thống tự phân KD phụ trách
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <div className="form-grid">

            <div className="fi-group">
              <label className="fi-label">Tên khách hàng <span style={{ color: 'red' }}>*</span></label>
              <input className="fi" placeholder="Nguyễn Văn A..." autoFocus
                value={form.name} onChange={e => setF('name', e.target.value)} />
            </div>

            <div className="fi-group">
              <label className="fi-label">Loại khách</label>
              <select className="fi" value={form.loaiKhach} onChange={e => setF('loaiKhach', e.target.value)}>
                <option value="">-- Chọn loại --</option>
                {LOAI_KHACH.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>

            <div className="fi-group">
              <label className="fi-label">Số điện thoại <span style={{ color: 'red' }}>*</span></label>
              <input className="fi" placeholder="0912 345 678"
                value={form.phone} onChange={e => setF('phone', e.target.value)} />
            </div>

            <div className="fi-group">
              <label className="fi-label">Email</label>
              <input className="fi" type="email" placeholder="email@example.com"
                value={form.email} onChange={e => setF('email', e.target.value)} />
            </div>

            <div className="fi-group">
              <label className="fi-label">Công ty / Đơn vị</label>
              <input className="fi" placeholder="Tên công ty (nếu có)"
                value={form.company} onChange={e => setF('company', e.target.value)} />
            </div>

            <div className="fi-group">
              <label className="fi-label">Ngành</label>
              <select className="fi" value={form.nganh} onChange={e => setF('nganh', e.target.value)}>
                <option value="">-- Chọn ngành --</option>
                {NGANH_LIST.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="fi-group">
              <label className="fi-label">Khu vực / Tỉnh-thành</label>
              <select className="fi" value={form.area} onChange={e => setF('area', e.target.value)}>
                <option value="">-- Chọn tỉnh/thành --</option>
                {VIETNAM_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="fi-group">
              <label className="fi-label">Sản phẩm quan tâm</label>
              <select className="fi" value={form.product} onChange={e => setF('product', e.target.value)}>
                <option value="">-- Chọn danh mục --</option>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="fi-group">
              <label className="fi-label">Kênh tiếp cận</label>
              <select className="fi" value={form.channel} onChange={e => setF('channel', e.target.value)}>
                <option value="">-- Chọn kênh --</option>
                {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div className="fi-group">
              <label className="fi-label">Nhiệt độ</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {Object.entries(TEMP_CFG).map(([k, v]) => (
                  <button key={k} type="button" onClick={() => setF('temp', k)} style={{
                    flex: 1, padding: '7px 0', borderRadius: 8, border: '2px solid',
                    borderColor: form.temp === k ? v.color : '#e2e8f0',
                    background:  form.temp === k ? v.bg    : '#fff',
                    color:       form.temp === k ? v.color : 'var(--text2)',
                    fontWeight:  form.temp === k ? 700     : 500,
                    fontSize: 13, cursor: 'pointer', transition: 'all .15s',
                  }}>
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="fi-group">
              <label className="fi-label">Ngân sách dự kiến</label>
              <select className="fi" value={form.nganSach} onChange={e => setF('nganSach', e.target.value)}>
                {NGAN_SACH_LIST.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="fi-group">
              <label className="fi-label">Thời điểm cần</label>
              <select className="fi" value={form.thoiDiem} onChange={e => setF('thoiDiem', e.target.value)}>
                {THOI_DIEM_LIST.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Chân dung khách hàng */}
            <div className="fi-group" style={{ gridColumn: '1 / -1' }}>
              <label className="fi-label">
                🎯 Chân dung khách hàng
                <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--muted)', marginLeft: 6 }}>(chọn 1 hoặc nhiều)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {CUSTOMER_PROFILES.map(p => {
                  const active = form.chandung.includes(p.value);
                  return (
                    <button key={p.value} type="button" onClick={() =>
                      setF('chandung', active ? form.chandung.filter(v => v !== p.value) : [...form.chandung, p.value])
                    } style={{
                      padding: '5px 11px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s',
                      border:     active ? '2px solid var(--primary)' : '1.5px solid #e2e8f0',
                      background: active ? 'var(--primary-pale)'      : '#f8fafc',
                      color:      active ? 'var(--primary)'           : 'var(--text2)',
                    }}>
                      {p.icon} {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auto-assign KD */}
            <div className="fi-group" style={{ gridColumn: '1 / -1' }}>
              <label className="fi-label">👤 NV phụ trách tư vấn — Tự động phân công</label>
              <div style={{
                background: '#f8fafc', border: '1.5px solid #e2e8f0',
                borderRadius: 10, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  {assign && (
                    <span style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: `${assign.color}18`, color: assign.color,
                      border: `1.5px solid ${assign.color}44`, whiteSpace: 'nowrap',
                    }}>
                      {assign.badge}
                    </span>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                    {assign?.name || '(chưa xác định)'}
                  </span>
                  {assign?.reason && (
                    <span style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>
                      · {assign.reason}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', fontWeight: 600 }}>Đổi KD:</span>
                  <select
                    className="fi"
                    style={{ flex: 1, marginTop: 0, fontSize: 12 }}
                    value={assign?.name || ''}
                    onChange={e => setAssign({
                      name:   e.target.value,
                      badge:  '✏️ Thủ công',
                      color:  '#7c3aed',
                      reason: 'Phân công thủ công bởi CSKH',
                    })}
                  >
                    <option value="">-- Chọn KD --</option>
                    {SALES_LIST.map(s => <option key={s.username} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="fi-group" style={{ gridColumn: '1 / -1' }}>
              <label className="fi-label">Ghi chú / Nhu cầu</label>
              <textarea className="fi" rows={3} style={{ resize: 'vertical' }}
                placeholder="Nhu cầu, yêu cầu đặc biệt từ khách hàng..."
                value={form.note} onChange={e => setF('note', e.target.value)} />
            </div>

            {/* Đính kèm */}
            <div className="fi-group" style={{ gridColumn: '1 / -1' }}>
              <label className="fi-label">📎 Tài liệu / Hình ảnh / Link khách hàng cung cấp</label>
              <div style={{ display: 'flex', gap: 7, marginBottom: 8 }}>
                <input className="fi" style={{ flex: 1, marginTop: 0 }}
                  placeholder="Tên / Mô tả"
                  value={attName} onChange={e => setAttName(e.target.value)} />
                <input className="fi" style={{ flex: 2, marginTop: 0 }}
                  placeholder="URL / Link (Google Drive, Zalo Cloud, ...)"
                  value={attUrl} onChange={e => setAttUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAtt(); } }} />
                <button type="button" onClick={addAtt} style={{
                  padding: '0 16px', borderRadius: 8, border: 'none',
                  background: '#2563eb', color: '#fff', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                }}>+ Thêm</button>
              </div>
              {form.attachments.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {form.attachments.map(a => (
                    <div key={a.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 10px', borderRadius: 8,
                      background: '#eff6ff', border: '1.5px solid #bfdbfe',
                    }}>
                      <span>🔗</span>
                      <a href={a.url} target="_blank" rel="noreferrer" style={{
                        fontSize: 12, fontWeight: 600, color: '#1d4ed8', textDecoration: 'none',
                        maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{a.name}</a>
                      <button onClick={() => removeAtt(a.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#6b7280', fontSize: 14, padding: 0, lineHeight: 1,
                      }}>✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
                  Chưa có tài liệu · nhập link và bấm "+ Thêm"
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid #f3f4f6',
          background: '#f9fafb', display: 'flex', gap: 8, justifyContent: 'flex-end',
          borderRadius: '0 0 16px 16px',
        }}>
          <button className="btn btn-ghost" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Đang lưu...' : '✅ Tạo Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}
