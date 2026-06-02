import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  CATS, TEMP_CFG, CONTACT_STATUSES,
  VIETNAM_REGIONS,
} from '../../utils/constants';
import {
  SALES_LIST, CHANNELS, LOAI_KHACH, NGANH_LIST,
  NGAN_SACH_LIST, THOI_DIEM_LIST, UU_TIEN_LIST,
  daysUntilBirthday,
} from './helpers';

/* ═══════════════════════════════════════════════════════════════
   MODAL CHỈNH SỬA LEAD
═══════════════════════════════════════════════════════════════ */
export default function EditLeadModal({ lead, onSave, onClose }) {
  const [form, setForm] = useState({
    name:          lead.name          || '',
    loaiKhach:     lead.loaiKhach     || '',
    phone:         lead.phone         || '',
    email:         lead.email         || '',
    company:       lead.company       || '',
    nganh:         lead.nganh         || '',
    area:          lead.area          || '',
    product:       lead.product       || '',
    channel:       lead.channel       || '',
    temp:          lead.temp          || 'warm',
    uuTien:        lead.uuTien        || 'trung_binh',
    nganSach:      lead.nganSach      || 'Chưa xác định',
    thoiDiem:      lead.thoiDiem      || 'Chưa xác định',
    assignedTo:    lead.assignedTo    || '',
    note:          lead.note          || '',
    birthday:      lead.birthday      || '',
    trangThai:     lead.trangThai     || 'moi',
    contactStatus: lead.contactStatus || 'chua_lh',
  });

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const bdayDays = daysUntilBirthday(form.birthday);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 680,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
      }}>

        {/* Header */}
        <div style={{
          padding: '18px 24px 14px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>
            ✏️ Chỉnh sửa Lead — {lead.name}
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 7, border: '1px solid #e2e8f0',
            background: '#f8fafc', cursor: 'pointer', fontSize: 14, color: '#64748b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>

            <div className="fi-group">
              <label className="fi-label">HỌ TÊN / KHÁCH HÀNG <span style={{ color: 'red' }}>*</span></label>
              <input className="fi" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nguyễn Văn A..." />
            </div>

            <div className="fi-group">
              <label className="fi-label">LOẠI KHÁCH</label>
              <select className="fi" value={form.loaiKhach} onChange={e => set('loaiKhach', e.target.value)}>
                <option value="">-- Chọn loại --</option>
                {LOAI_KHACH.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>

            <div className="fi-group">
              <label className="fi-label">SĐT <span style={{ color: 'red' }}>*</span></label>
              <input className="fi" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0912 345 678" />
            </div>

            <div className="fi-group">
              <label className="fi-label">EMAIL</label>
              <input className="fi" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
            </div>

            <div className="fi-group">
              <label className="fi-label">CÔNG TY</label>
              <input className="fi" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Tên công ty..." />
            </div>

            <div className="fi-group">
              <label className="fi-label">NGÀNH</label>
              <select className="fi" value={form.nganh} onChange={e => set('nganh', e.target.value)}>
                <option value="">-- Chọn ngành --</option>
                {NGANH_LIST.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="fi-group">
              <label className="fi-label">KHU VỰC</label>
              <select className="fi" value={form.area} onChange={e => set('area', e.target.value)}>
                <option value="">-- Chọn tỉnh/thành --</option>
                {VIETNAM_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="fi-group">
              <label className="fi-label">SẢN PHẨM QUAN TÂM</label>
              <select className="fi" value={form.product} onChange={e => set('product', e.target.value)}>
                <option value="">-- Chọn sản phẩm --</option>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="fi-group">
              <label className="fi-label">KÊNH</label>
              <select className="fi" value={form.channel} onChange={e => set('channel', e.target.value)}>
                <option value="">-- Chọn kênh --</option>
                {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div className="fi-group">
              <label className="fi-label">MỨC ĐỘ (NHIỆT ĐỘ)</label>
              <select className="fi" value={form.temp} onChange={e => set('temp', e.target.value)}>
                {Object.entries(TEMP_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>

            {/* ── Trạng thái + Tình trạng LH ── */}
            <div style={{
              gridColumn: '1 / -1',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px',
              padding: '14px 16px', borderRadius: 10,
              border: '2px solid var(--primary)',
              background: 'var(--primary-pale)',
            }}>
              <div className="fi-group" style={{ marginBottom: 0 }}>
                <label className="fi-label" style={{ color: 'var(--primary)' }}>TRẠNG THÁI</label>
                <select className="fi" value={form.trangThai} onChange={e => set('trangThai', e.target.value)}
                  style={{ borderColor: 'var(--primary-bd)' }}>
                  <option value="moi">Mới</option>
                  <option value="dang_xu_ly">Đang xử lý</option>
                  <option value="cho_phan_hoi">Chờ phản hồi</option>
                  <option value="da_tu_van">Đã tư vấn</option>
                  <option value="thanh_cong">Thành công</option>
                  <option value="that_bai">Thất bại</option>
                </select>
              </div>
              <div className="fi-group" style={{ marginBottom: 0 }}>
                <label className="fi-label" style={{ color: 'var(--primary)' }}>TÌNH TRẠNG LIÊN HỆ</label>
                <select className="fi" value={form.contactStatus} onChange={e => set('contactStatus', e.target.value)}
                  style={{ borderColor: 'var(--primary-bd)' }}>
                  {CONTACT_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="fi-group">
              <label className="fi-label">ƯU TIÊN</label>
              <select className="fi" value={form.uuTien} onChange={e => set('uuTien', e.target.value)}>
                {UU_TIEN_LIST.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>

            <div className="fi-group">
              <label className="fi-label">NGÂN SÁCH</label>
              <select className="fi" value={form.nganSach} onChange={e => set('nganSach', e.target.value)}>
                {NGAN_SACH_LIST.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="fi-group">
              <label className="fi-label">THỜI ĐIỂM CẦN</label>
              <select className="fi" value={form.thoiDiem} onChange={e => set('thoiDiem', e.target.value)}>
                {THOI_DIEM_LIST.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="fi-group">
              <label className="fi-label">NV PHỤ TRÁCH (KD)</label>
              <select className="fi" value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)}>
                <option value="">-- Chưa phân công --</option>
                {SALES_LIST.map(s => <option key={s.username} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            {/* ── Ngày sinh nhật ── */}
            <div className="fi-group" style={{
              gridColumn: '1 / -1',
              padding: '14px 16px', borderRadius: 10,
              border: '1.5px solid #fbcfe8',
              background: '#fdf2f8',
            }}>
              <label className="fi-label" style={{ color: '#9d174d' }}>
                🎂 NGÀY SINH NHẬT — Hệ thống sẽ nhắc CSKH trước 3–5 ngày
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                <input
                  type="date"
                  className="fi"
                  style={{ flex: 1, marginTop: 0, borderColor: '#f9a8d4' }}
                  value={form.birthday}
                  onChange={e => set('birthday', e.target.value)}
                />
                {bdayDays !== null && (
                  <div style={{
                    padding: '6px 14px', borderRadius: 8, whiteSpace: 'nowrap',
                    background: bdayDays <= 5 ? '#fdf2f8' : '#f8fafc',
                    border: bdayDays <= 5 ? '1.5px solid #f9a8d4' : '1px solid #e2e8f0',
                    fontSize: 12, fontWeight: 700,
                    color: bdayDays === 0 ? '#dc2626' : bdayDays <= 5 ? '#9d174d' : '#475569',
                  }}>
                    {bdayDays === 0 ? '🎉 Hôm nay!' : bdayDays <= 5 ? `⚠️ Còn ${bdayDays} ngày` : `📅 Còn ${bdayDays} ngày`}
                  </div>
                )}
              </div>
            </div>

            <div className="fi-group" style={{ gridColumn: '1 / -1' }}>
              <label className="fi-label">GHI CHÚ</label>
              <textarea
                className="fi" rows={3}
                value={form.note} onChange={e => set('note', e.target.value)}
                placeholder="Ghi chú về khách hàng, yêu cầu đặc biệt..."
                style={{ resize: 'vertical' }}
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0,
        }}>
          <button className="btn btn-ghost" onClick={onClose}>Huỷ</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!form.name.trim())  { toast.error('Vui lòng nhập tên khách hàng'); return; }
              if (!form.phone.trim()) { toast.error('Vui lòng nhập SĐT'); return; }
              onSave(form);
            }}
          >
            💾 Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
