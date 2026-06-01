import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore, useUIStore } from '../../store';
import { CATS, TEMP_CFG, CONTACT_STATUSES, CHANNEL_CFG, CUSTOMER_PROFILES, VIETNAM_REGIONS } from '../../utils/constants';

// Tạo danh sách kênh từ CHANNEL_CFG để đồng bộ với hệ thống
const CHANNELS = Object.entries(CHANNEL_CFG).map(([value, cfg]) => ({
  value,
  label: `${cfg.icon} ${cfg.label}`,
}));

const empty = {
  name: '', phone: '', company: '', taxCode: '', email: '',
  area: '', product: '', note: '', temp: 'warm',
  channel: '', customChannel: '', contactStatus: 'chua_lh',
  chandung: [], customChandung: '',
};

export default function AddLeadModal() {
  const user      = useAuthStore(s => s.user);
  const addLead   = useDataStore(s => s.addLead);
  const closeModal = useUIStore(s => s.closeModal);

  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên khách hàng'); return; }
    if (!form.phone.trim()) { toast.error('Vui lòng nhập số điện thoại'); return; }
    setSaving(true);
    try {
      await addLead({
        ...form,
        assignedTo: user?.name,
        createdBy: user?.name,
      });
      toast.success(`✅ Đã thêm lead "${form.name}"`);
      closeModal();
    } catch (e) {
      toast.error(`Lỗi: ${e.message || 'Không thể thêm lead'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="modal-title">👥 Thêm Lead mới</div>

      <div className="form-grid">
        {/* Tên khách hàng */}
        <div className="fi-group">
          <label className="fi-label">Tên khách hàng <span style={{color:'red'}}>*</span></label>
          <input
            className="fi"
            placeholder="Nguyễn Văn A..."
            value={form.name}
            onChange={e => set('name', e.target.value)}
            autoFocus
          />
        </div>

        {/* Số điện thoại */}
        <div className="fi-group">
          <label className="fi-label">Số điện thoại <span style={{color:'red'}}>*</span></label>
          <input
            className="fi"
            placeholder="0912 345 678"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
          />
        </div>

        {/* Công ty */}
        <div className="fi-group">
          <label className="fi-label">Công ty</label>
          <input
            className="fi"
            placeholder="Tên công ty (nếu có)"
            value={form.company}
            onChange={e => set('company', e.target.value)}
          />
        </div>

        {/* Mã số thuế */}
        <div className="fi-group">
          <label className="fi-label">Mã số thuế (MST)</label>
          <input
            className="fi"
            placeholder="VD: 0123456789"
            value={form.taxCode}
            onChange={e => set('taxCode', e.target.value.replace(/\D/g, ''))}
            maxLength={14}
          />
        </div>

        {/* Email */}
        <div className="fi-group">
          <label className="fi-label">Email</label>
          <input
            className="fi"
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
          />
        </div>

        {/* Khu vực */}
        <div className="fi-group">
          <label className="fi-label">Khu vực / Tỉnh-thành</label>
          <select className="fi" value={form.area} onChange={e => set('area', e.target.value)}>
            <option value="">-- Chọn tỉnh/thành --</option>
            {VIETNAM_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Sản phẩm quan tâm */}
        <div className="fi-group" style={{gridColumn:'1 / -1'}}>
          <label className="fi-label">Sản phẩm quan tâm</label>
          <select className="fi" value={form.product} onChange={e => set('product', e.target.value)}>
            <option value="">-- Chọn danh mục --</option>
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Nhiệt độ */}
        <div className="fi-group">
          <label className="fi-label">Nhiệt độ</label>
          <div style={{display:'flex', gap:8, marginTop:4}}>
            {Object.entries(TEMP_CFG).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => set('temp', k)}
                style={{
                  flex:1, padding:'8px 0', borderRadius:8, border:'2px solid',
                  borderColor: form.temp === k ? v.color : '#e2e8f0',
                  background: form.temp === k ? v.bg : '#fff',
                  color: form.temp === k ? v.color : 'var(--text2)',
                  fontWeight: form.temp === k ? 700 : 500,
                  fontSize: 13, cursor:'pointer', transition:'all .15s',
                }}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kênh */}
        <div className="fi-group">
          <label className="fi-label">Kênh tiếp cận</label>
          <select
            className="fi"
            value={form.channel}
            onChange={e => { set('channel', e.target.value); if (e.target.value !== 'other') set('customChannel', ''); }}
          >
            <option value="">-- Chọn kênh --</option>
            {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {/* Popup nhập kênh cụ thể khi chọn Khác */}
          {form.channel === 'other' && (
            <input
              className="fi"
              style={{ marginTop: 6 }}
              placeholder="Nhập tên kênh cụ thể (VD: Hội chợ, Sự kiện, Báo...)"
              value={form.customChannel}
              onChange={e => set('customChannel', e.target.value)}
              autoFocus
            />
          )}
        </div>

        {/* Trạng thái liên hệ */}
        <div className="fi-group">
          <label className="fi-label">Trạng thái liên hệ</label>
          <select className="fi" value={form.contactStatus} onChange={e => set('contactStatus', e.target.value)}>
            {CONTACT_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Chân dung khách hàng */}
        <div className="fi-group" style={{gridColumn:'1 / -1'}}>
          <label className="fi-label">
            🎯 Chân dung khách hàng
            <span style={{fontSize:10, fontWeight:400, color:'var(--muted)', marginLeft:6}}>(chọn 1 hoặc nhiều)</span>
          </label>
          <div style={{display:'flex', flexWrap:'wrap', gap:7, marginTop:4}}>
            {CUSTOMER_PROFILES.map(p => {
              const active = form.chandung.includes(p.value);
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    set('chandung',
                      active
                        ? form.chandung.filter(v => v !== p.value)
                        : [...form.chandung, p.value]
                    );
                    if (p.value === 'khac' && active) set('customChandung', '');
                  }}
                  style={{
                    padding:'5px 12px', borderRadius:99, fontSize:12, fontWeight:600,
                    cursor:'pointer', fontFamily:'inherit', transition:'all .12s',
                    border: active ? '2px solid var(--primary)' : '1.5px solid #e2e8f0',
                    background: active ? 'var(--primary-pale)' : '#f8fafc',
                    color: active ? 'var(--primary)' : 'var(--text2)',
                  }}
                >
                  {p.icon} {p.label}
                </button>
              );
            })}
          </div>
          {/* Input mô tả khi chọn "Khác" */}
          {form.chandung.includes('khac') && (
            <input
              className="fi"
              style={{ marginTop: 8 }}
              placeholder="Mô tả chân dung cụ thể (VD: Chủ hộ kinh doanh, Trưởng phòng...)"
              value={form.customChandung}
              onChange={e => set('customChandung', e.target.value)}
              autoFocus
            />
          )}
        </div>

        {/* Ghi chú */}
        <div className="fi-group" style={{gridColumn:'1 / -1'}}>
          <label className="fi-label">Ghi chú</label>
          <textarea
            className="fi"
            rows={3}
            placeholder="Nhu cầu, yêu cầu đặc biệt..."
            value={form.note}
            onChange={e => set('note', e.target.value)}
            style={{resize:'vertical'}}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={closeModal}>Huỷ</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '⏳ Đang lưu...' : '✅ Thêm Lead'}
        </button>
      </div>
    </div>
  );
}
