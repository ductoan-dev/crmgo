import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore } from '../../store';
import {
  CATS, TEMP_CFG, CONTACT_STATUSES, CHANNEL_CFG,
  CUSTOMER_PROFILES, VIETNAM_REGIONS, DEMO_ACCOUNTS,
} from '../../utils/constants';
import { fmtDate } from '../../utils/helpers';

// ── Constants ─────────────────────────────────────────────────
const SALES_LIST = DEMO_ACCOUNTS.filter(a => a.role === 'sales');
const CHANNELS   = Object.entries(CHANNEL_CFG).map(([v, c]) => ({ value: v, label: `${c.icon} ${c.label}` }));

const LOAI_KHACH = [
  { value: 'doanh_nghiep', label: '🏢 Doanh nghiệp' },
  { value: 'ca_nhan',      label: '👤 Cá nhân' },
  { value: 'ho_kinh_doanh',label: '🏪 Hộ kinh doanh' },
  { value: 'to_chuc',      label: '🏛️ Tổ chức / NGO' },
];

const NGANH_LIST = [
  'Bán lẻ / Thương mại','Sản xuất','Thực phẩm & Đồ uống',
  'Nông nghiệp','Dược phẩm / Y tế','Giáo dục',
  'Khách sạn / Du lịch','Nhà hàng / F&B','Xây dựng / Vật liệu',
  'Logistics / Vận chuyển','Tài chính / Ngân hàng','Bất động sản',
  'Công nghệ','Khác',
];

const NGAN_SACH_LIST = [
  'Chưa xác định','Dưới 5 triệu','5 – 20 triệu',
  '20 – 50 triệu','50 – 100 triệu','Trên 100 triệu',
];

const THOI_DIEM_LIST = [
  'Chưa xác định','Ngay lập tức','Trong tuần này',
  'Trong tháng này','1 – 3 tháng tới','Trên 3 tháng',
];

const UU_TIEN_LIST = [
  { value: 'cao',        label: '🔴 Cao' },
  { value: 'trung_binh', label: '🟡 Trung bình' },
  { value: 'thap',       label: '🟢 Thấp' },
];

const CSKH_STATUSES = CONTACT_STATUSES.filter(s => s.value !== 'da_chuyen');

// ── Helper: số ngày đến sinh nhật tiếp theo ───────────────────
function daysUntilBirthday(birthday) {
  if (!birthday) return null;
  const parts = birthday.split('-');
  if (parts.length < 3) return null;
  const month = parseInt(parts[1], 10);
  const day   = parseInt(parts[2], 10);
  if (!month || !day) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let bday = new Date(today.getFullYear(), month - 1, day);
  if (bday < today) bday = new Date(today.getFullYear() + 1, month - 1, day);
  return Math.floor((bday - today) / 86400000);
}

// ── Auto-assign KD ────────────────────────────────────────────
function autoAssignKd(phone, company, leads, orders) {
  const CUTOFF = Date.now() - 18 * 30 * 24 * 3_600_000;
  const norm   = (p) => (p || '').replace(/\D/g, '');
  const pNorm  = norm(phone);

  const existing =
    (pNorm && leads.find(l => norm(l.phone) === pNorm)) ||
    (company?.trim() && leads.find(l =>
      l.company?.trim().toLowerCase() === company.trim().toLowerCase()
    ));

  if (existing?.assignedTo && SALES_LIST.some(s => s.name === existing.assignedTo)) {
    const kdName = existing.assignedTo;
    const active = orders.some(o =>
      o.emp === kdName && new Date(o.createdAt).getTime() > CUTOFF
    );
    if (active) {
      return { name: kdName, badge: '🔁 Giữ KD', color: '#059669',
               reason: `KD cũ · có đơn trong 18 tháng gần nhất` };
    }
    const expiredKd = kdName;
    if (!SALES_LIST.length) return { name: '', badge: '–', color: '#9ca3af', reason: 'Chưa có KD' };
    const loads = SALES_LIST
      .map(s => ({ name: s.name, count: leads.filter(l => l.assignedTo === s.name).length }))
      .sort((a, b) => a.count - b.count || a.name.localeCompare(b.name));
    return {
      name:   loads[0].name,
      badge:  '🔄 Tái phân',
      color:  '#d97706',
      reason: `KD cũ (${expiredKd}) không có đơn >18 tháng · tái phân sang ${loads[0].name}`,
    };
  }

  if (!SALES_LIST.length) return { name: '', badge: '–', color: '#9ca3af', reason: 'Chưa có KD' };

  const loads = SALES_LIST
    .map(s => ({ name: s.name, count: leads.filter(l => l.assignedTo === s.name).length }))
    .sort((a, b) => a.count - b.count || a.name.localeCompare(b.name));

  return {
    name:   loads[0].name,
    badge:  '🆕 Phân mới',
    color:  '#2563eb',
    reason: `Lead mới · phân theo tải (${loads[0].count} lead hiện tại)`,
  };
}

// ── Shared badges ─────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = CONTACT_STATUSES.find(s => s.value === status) || CONTACT_STATUSES[0];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 99, whiteSpace: 'nowrap',
      fontSize: 11, fontWeight: 700,
      color: cfg.color, background: cfg.bg, border: `1.5px solid ${cfg.color}44`,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function TempBadge({ temp }) {
  const cfg = TEMP_CFG[temp || 'warm'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '3px 9px', borderRadius: 99,
      fontSize: 11, fontWeight: 700,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30`,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 3 }}>{icon} {label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{value || '—'}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODAL CHỈNH SỬA LEAD
═══════════════════════════════════════════════════════════════ */
function EditLeadModal({ lead, onSave, onClose }) {
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

/* ═══════════════════════════════════════════════════════════════
   MODAL TẠO LEAD (CSKH)
═══════════════════════════════════════════════════════════════ */
function CreateLeadModal({ leads, orders, onClose }) {
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

/* ═══════════════════════════════════════════════════════════════
   PANEL CHI TIẾT
   — Hiển thị thông tin đầy đủ + đính kèm + lịch sử chăm sóc CSKH
═══════════════════════════════════════════════════════════════ */
function LeadDetailPanel({ lead: initialLead, onClose }) {
  const user       = useAuthStore(s => s.user);
  const updateLead = useDataStore(s => s.updateLead);

  const [lead,     setLead]     = useState(initialLead);
  const [attName,  setAttName]  = useState('');
  const [attUrl,   setAttUrl]   = useState('');
  const [callDate, setCallDate] = useState(new Date().toISOString().slice(0, 10));
  const [callNote, setCallNote] = useState('');
  const [addingCall, setAddingCall] = useState(false);

  const attachments = lead.attachments || [];
  const cskhCalls   = (lead.cskhCalls  || []).slice().sort((a, b) =>
    new Date(b.callDate || b.createdAt) - new Date(a.callDate || a.createdAt)
  );

  const statusCfg  = CONTACT_STATUSES.find(s => s.value === lead.contactStatus) || CONTACT_STATUSES[0];
  const tempCfg    = TEMP_CFG[lead.temp || 'warm'];
  const channelCfg = CHANNEL_CFG[lead.channel] || null;
  const bdayDays   = daysUntilBirthday(lead.birthday);

  const addAtt = async () => {
    if (!attUrl.trim()) { toast.error('Nhập URL / Link trước'); return; }
    const updated = [...attachments, {
      id: Date.now(), type: 'link',
      url:     attUrl.trim(),
      name:    attName.trim() || attUrl.trim(),
      addedAt: new Date().toISOString(),
    }];
    await updateLead(lead.id, { attachments: updated });
    setLead(p => ({ ...p, attachments: updated }));
    setAttUrl(''); setAttName('');
    toast.success('Đã thêm đính kèm');
  };

  const removeAtt = async (id) => {
    const updated = attachments.filter(a => a.id !== id);
    await updateLead(lead.id, { attachments: updated });
    setLead(p => ({ ...p, attachments: updated }));
    toast.success('Đã xoá đính kèm');
  };

  const handleAddCall = async () => {
    if (!callNote.trim()) { toast.error('Vui lòng nhập ghi chú cuộc gọi'); return; }
    setAddingCall(true);
    try {
      const newCall = {
        id:        Date.now(),
        callDate:  callDate,
        callNote:  callNote.trim(),
        callBy:    user?.name || 'CSKH',
        createdAt: new Date().toISOString(),
      };
      const updatedCalls = [...(lead.cskhCalls || []), newCall];
      await updateLead(lead.id, { cskhCalls: updatedCalls });
      setLead(p => ({ ...p, cskhCalls: updatedCalls }));
      setCallNote('');
      setCallDate(new Date().toISOString().slice(0, 10));
      toast.success('✅ Đã lưu lịch chăm sóc');
    } catch {
      toast.error('Không thể lưu');
    } finally {
      setAddingCall(false);
    }
  };

  const removeCall = async (id) => {
    const updated = (lead.cskhCalls || []).filter(c => c.id !== id);
    await updateLead(lead.id, { cskhCalls: updated });
    setLead(p => ({ ...p, cskhCalls: updated }));
    toast.success('Đã xoá');
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580,
        boxShadow: '0 32px 80px rgba(0,0,0,.22)',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          padding: '18px 24px 14px',
          background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
          borderRadius: '16px 16px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{lead.name}</div>
            {lead.company && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>🏢 {lead.company}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>

          {/* Cảnh báo sinh nhật gần */}
          {bdayDays !== null && bdayDays <= 5 && (
            <div style={{
              marginBottom: 16, padding: '12px 16px',
              background: bdayDays === 0 ? '#fdf2f8' : '#fffbeb',
              border: `1.5px solid ${bdayDays === 0 ? '#f9a8d4' : '#fcd34d'}`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>{bdayDays === 0 ? '🎉' : '🎂'}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: bdayDays === 0 ? '#9d174d' : '#92400e' }}>
                  {bdayDays === 0
                    ? 'Hôm nay là sinh nhật khách hàng!'
                    : `Còn ${bdayDays} ngày nữa là sinh nhật!`
                  }
                </div>
                <div style={{ fontSize: 11, color: '#78716c', marginTop: 1 }}>
                  Chuẩn bị lời chúc + voucher / quà tặng cho {lead.name}
                </div>
              </div>
            </div>
          )}

          {/* Thông tin cơ bản */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <InfoRow icon="📞" label="Số điện thoại" value={lead.phone} />
            <InfoRow icon="✉️" label="Email"          value={lead.email} />
            <InfoRow icon="📍" label="Khu vực"        value={lead.area} />
            <InfoRow icon="🛍️" label="Sản phẩm"       value={lead.product} />
            <InfoRow icon="👤" label="NV phụ trách"   value={lead.assignedTo} />
            {lead.nganh    && <InfoRow icon="🏭" label="Ngành"        value={lead.nganh} />}
            {lead.nganSach && <InfoRow icon="💰" label="Ngân sách"    value={lead.nganSach} />}
            {lead.thoiDiem && <InfoRow icon="⏰" label="Thời điểm"    value={lead.thoiDiem} />}
            {lead.birthday && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 3 }}>🎂 Sinh nhật</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                  {lead.birthday}
                  {bdayDays !== null && (
                    <span style={{
                      marginLeft: 8, fontSize: 11,
                      color: bdayDays <= 5 ? '#db2777' : '#6b7280',
                    }}>
                      ({bdayDays === 0 ? 'Hôm nay!' : `còn ${bdayDays} ngày`})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Kênh */}
          {channelCfg && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 5 }}>📣 Kênh tiếp cận</div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 11px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                color: channelCfg.color, background: channelCfg.bg, border: `1px solid ${channelCfg.color}30`,
              }}>
                {channelCfg.icon} {channelCfg.label}
              </span>
            </div>
          )}

          {/* Trạng thái */}
          <div style={{
            padding: '14px 16px', borderRadius: 10, marginBottom: 18,
            background: '#f9fafb', border: '1px solid #e5e7eb',
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#9ca3af',
              textTransform: 'uppercase', letterSpacing: .5, marginBottom: 9,
            }}>
              Trạng thái liên hệ — 🔒 KD cập nhật · CSKH chỉ xem
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                color: statusCfg.color, background: statusCfg.bg,
                border: `1.5px solid ${statusCfg.color}44`,
              }}>
                {statusCfg.icon} {statusCfg.label}
              </span>
              <TempBadge temp={lead.temp} />
            </div>
            {lead.contactNote && (
              <div style={{
                marginTop: 9, fontSize: 12, color: '#92400e',
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 6, padding: '7px 10px',
              }}>
                📝 {lead.contactNote}
              </div>
            )}
          </div>

          {/* Ghi chú */}
          {lead.note && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 5 }}>📋 Ghi chú / Nhu cầu</div>
              <div style={{
                fontSize: 13, color: '#374151', lineHeight: 1.6,
                background: '#f9fafb', borderRadius: 8, padding: '10px 12px', border: '1px solid #e5e7eb',
              }}>
                {lead.note}
              </div>
            </div>
          )}

          {/* ── LỊCH SỬ CHĂM SÓC CSKH ── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>📞 Lịch sử chăm sóc CSKH</span>
              {cskhCalls.length > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#2563eb',
                  background: '#eff6ff', border: '1px solid #bfdbfe',
                  borderRadius: 99, padding: '1px 8px',
                }}>
                  {cskhCalls.length} lần
                </span>
              )}
            </div>

            {/* Form thêm call */}
            <div style={{
              background: '#f8fafc', border: '1.5px solid #e2e8f0',
              borderRadius: 10, padding: 14, marginBottom: 14,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10 }}>
                + Ghi nhận lần chăm sóc mới
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>NGÀY GỌI</div>
                  <input
                    type="date"
                    className="fi"
                    style={{ marginTop: 0 }}
                    value={callDate}
                    onChange={e => setCallDate(e.target.value)}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>GHI CHÚ KẾT QUẢ CUỘC GỌI <span style={{ color: 'red' }}>*</span></div>
                  <textarea
                    className="fi"
                    rows={3}
                    placeholder="Khách hàng phản hồi thế nào? Nhu cầu mới? Hẹn gọi lại...?"
                    value={callNote}
                    onChange={e => setCallNote(e.target.value)}
                    style={{ resize: 'none', marginTop: 0 }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleAddCall}
                  disabled={addingCall || !callNote.trim()}
                  style={{
                    padding: '7px 18px', borderRadius: 8, fontWeight: 700,
                    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                    background: !callNote.trim() ? '#e2e8f0' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                    color: !callNote.trim() ? '#94a3b8' : '#fff',
                  }}
                >
                  {addingCall ? '⏳...' : '💾 Lưu lịch chăm sóc'}
                </button>
              </div>
            </div>

            {/* Danh sách calls */}
            {cskhCalls.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '20px 0', color: '#9ca3af',
                fontSize: 12, fontStyle: 'italic', background: '#fafafa',
                borderRadius: 8, border: '1px dashed #e2e8f0',
              }}>
                📭 Chưa có lịch sử chăm sóc · Ghi nhận ở trên sau mỗi lần gọi điện
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cskhCalls.map((c, idx) => (
                  <div key={c.id} style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: idx === 0 ? '#eff6ff' : '#f9fafb',
                    border: idx === 0 ? '1.5px solid #bfdbfe' : '1px solid #e5e7eb',
                    position: 'relative',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: '#1d4ed8',
                            background: '#eff6ff', border: '1px solid #bfdbfe',
                            borderRadius: 5, padding: '1px 8px',
                          }}>
                            📅 {c.callDate}
                          </span>
                          <span style={{ fontSize: 11, color: '#6b7280' }}>
                            bởi {c.callBy}
                          </span>
                          {idx === 0 && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: '#16a34a',
                              background: '#f0fdf4', border: '1px solid #bbf7d0',
                              borderRadius: 4, padding: '1px 6px',
                            }}>
                              Mới nhất
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: 13, color: '#374151', lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                        }}>
                          {c.callNote}
                        </div>
                      </div>
                      <button
                        onClick={() => removeCall(c.id)}
                        title="Xoá"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#9ca3af', fontSize: 13, padding: '2px 4px',
                          borderRadius: 4, flexShrink: 0,
                          transition: 'color .1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                        onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── ĐÍNH KÈM ── */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 10 }}>
              📎 Tài liệu / Hình ảnh / Link khách hàng cung cấp
            </div>
            <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
              <input className="fi" style={{ flex: 1, marginTop: 0 }}
                placeholder="Tên / Mô tả"
                value={attName} onChange={e => setAttName(e.target.value)} />
              <input className="fi" style={{ flex: 2, marginTop: 0 }}
                placeholder="URL / Link"
                value={attUrl} onChange={e => setAttUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAtt(); } }} />
              <button type="button" onClick={addAtt} style={{
                padding: '0 14px', borderRadius: 8, border: 'none',
                background: '#2563eb', color: '#fff', fontWeight: 700,
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}>+ Thêm</button>
            </div>
            {attachments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {attachments.map(a => (
                  <div key={a.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 8,
                    background: '#eff6ff', border: '1.5px solid #bfdbfe',
                  }}>
                    <span style={{ fontSize: 18 }}>🔗</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a href={a.url} target="_blank" rel="noreferrer" style={{
                        fontSize: 13, fontWeight: 600, color: '#1d4ed8', textDecoration: 'none',
                        display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {a.name}
                      </a>
                      {a.name !== a.url && (
                        <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.url}
                        </div>
                      )}
                    </div>
                    <button onClick={() => removeAtt(a.id)} style={{
                      background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6,
                      cursor: 'pointer', color: '#dc2626', fontSize: 11, fontWeight: 700,
                      padding: '3px 8px', fontFamily: 'inherit',
                    }}>Xoá</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 12, fontStyle: 'italic' }}>
                📭 Chưa có tài liệu · Nhập link ở trên để thêm
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN — CskhView
═══════════════════════════════════════════════════════════════ */
export default function CskhView() {
  const user            = useAuthStore(s => s.user);
  const leads           = useDataStore(s => s.leads);
  const orders          = useDataStore(s => s.orders);
  const updateLead      = useDataStore(s => s.updateLead);
  const pushNotification = useDataStore(s => s.pushNotification);

  const [q,           setQ]           = useState('');
  const [tempF,       setTempF]       = useState('all');
  const [statF,       setStatF]       = useState('all');
  const [kdF,         setKdF]         = useState('all');
  const [nganhF,      setNganhF]      = useState('all');
  const [showCreate,  setShowCreate]  = useState(false);
  const [detailLead,  setDetailLead]  = useState(null);
  const [editingLead, setEditingLead] = useState(null);

  // ── Thông báo sinh nhật (check khi mount) ────────────────────
  useEffect(() => {
    const today   = new Date();
    const todayStr = today.toDateString();

    leads.forEach(lead => {
      const days = daysUntilBirthday(lead.birthday);
      if (days === null || days > 5) return;

      const key = `cskh_bday_${lead.id}_${todayStr}`;
      if (localStorage.getItem(key)) return;

      const msg = days === 0
        ? `Hôm nay là sinh nhật của ${lead.name}!`
        : `Còn ${days} ngày nữa là sinh nhật ${lead.name}`;

      pushNotification({
        type:    'birthday_reminder',
        title:   days === 0 ? `🎉 Sinh nhật hôm nay: ${lead.name}` : `🎂 Sắp sinh nhật: ${lead.name}`,
        text:    msg,
        detail:  `Chuẩn bị voucher / quà tặng + lời chúc · SĐT: ${lead.phone || '–'}`,
        leadId:  lead.id,
        forRole: 'cskh',
      });
      localStorage.setItem(key, '1');
    });
  }, []);

  const kpis = useMemo(() => ({
    total:     leads.length,
    chuaLh:    leads.filter(l => l.contactStatus === 'chua_lh').length,
    dangTd:    leads.filter(l => ['da_lh', 'dat_hen'].includes(l.contactStatus)).length,
    koLh:      leads.filter(l => l.contactStatus === 'ko_lh').length,
    converted: leads.filter(l => l.contactStatus === 'da_chuyen').length,
    hasAtt:    leads.filter(l => l.attachments?.length > 0).length,
  }), [leads]);

  const filtered = useMemo(() => {
    const qLow = q.toLowerCase();
    return leads
      .filter(l => {
        const matchQ  = !q
          || l.name?.toLowerCase().includes(qLow)
          || l.phone?.includes(q)
          || l.company?.toLowerCase().includes(qLow)
          || l.email?.toLowerCase().includes(qLow);
        const matchT  = tempF  === 'all' || l.temp === tempF;
        const matchS  = statF  === 'all' || l.contactStatus === statF;
        const matchKD = kdF    === 'all' || l.assignedTo === kdF;
        const matchN  = nganhF === 'all' || l.nganh === nganhF;
        return matchQ && matchT && matchS && matchKD && matchN;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [leads, q, tempF, statF, kdF, nganhF]);

  const handleSaveLead = async (form) => {
    try {
      await updateLead(editingLead.id, form);
      toast.success('✅ Đã cập nhật thông tin lead');
      setEditingLead(null);
    } catch {
      toast.error('Không thể cập nhật');
    }
  };

  // COLS: bỏ cột "Ngày tạo"
  const COLS = '36px 1.9fr 128px 100px 100px 170px 88px 90px 148px';

  return (
    <div>

      {showCreate && (
        <CreateLeadModal leads={leads} orders={orders} onClose={() => setShowCreate(false)} />
      )}

      {detailLead && (
        <LeadDetailPanel
          lead={detailLead}
          onClose={() => setDetailLead(null)}
        />
      )}

      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          onSave={handleSaveLead}
          onClose={() => setEditingLead(null)}
        />
      )}

      {/* ── KPI ── */}
      <div className="kpi-strip">
        <div className="kpi-card">
          <div className="kpi-lbl">Tổng lead</div>
          <div className="kpi-val">{kpis.total}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#64748b' }}>
          <div className="kpi-lbl">⭕ Chưa liên hệ</div>
          <div className="kpi-val" style={{ color: '#64748b' }}>{kpis.chuaLh}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#2563eb' }}>
          <div className="kpi-lbl">💬 Đang theo dõi</div>
          <div className="kpi-val" style={{ color: '#2563eb' }}>{kpis.dangTd}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#dc2626' }}>
          <div className="kpi-lbl">🚫 Không LH được</div>
          <div className="kpi-val" style={{ color: '#dc2626' }}>{kpis.koLh}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#16a34a' }}>
          <div className="kpi-lbl">✅ Đã chuyển CH</div>
          <div className="kpi-val" style={{ color: '#16a34a' }}>{kpis.converted}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#2563eb' }}>
          <div className="kpi-lbl">📎 Có tài liệu</div>
          <div className="kpi-val" style={{ color: '#2563eb' }}>{kpis.hasAtt}</div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="🔍 Tìm tên, SĐT, công ty, email..."
          value={q} onChange={e => setQ(e.target.value)}
        />
        <select className="fi" style={{ width: 'auto' }} value={tempF} onChange={e => setTempF(e.target.value)}>
          <option value="all">🌡️ Tất cả nhiệt độ</option>
          <option value="hot">🔥 Hot</option>
          <option value="warm">⚡ Warm</option>
          <option value="cold">❄️ Cold</option>
        </select>
        <select className="fi" style={{ width: 'auto' }} value={statF} onChange={e => setStatF(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          {CSKH_STATUSES.map(s => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
        </select>
        <select className="fi" style={{ width: 'auto' }} value={nganhF} onChange={e => setNganhF(e.target.value)}>
          <option value="all">🏭 Tất cả ngành</option>
          {NGANH_LIST.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select className="fi" style={{ width: 'auto' }} value={kdF} onChange={e => setKdF(e.target.value)}>
          <option value="all">👤 Tất cả KD</option>
          {SALES_LIST.map(s => <option key={s.username} value={s.name}>{s.name}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          + Tạo Lead
        </button>
      </div>

      {/* ── BẢNG LEAD ── */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🤝</div>
          <div className="empty-text">Không có lead phù hợp</div>
          <div className="empty-sub">Điều chỉnh bộ lọc hoặc tạo lead mới</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{
            background: '#fff', borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 4px rgba(0,0,0,.06)',
            minWidth: 960,
          }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: COLS,
              padding: '10px 16px', gap: 8,
              background: '#f9fafb', borderRadius: '12px 12px 0 0',
              borderBottom: '1px solid #e5e7eb',
              fontSize: 11, fontWeight: 700, color: '#6b7280',
              textTransform: 'uppercase', letterSpacing: .4,
            }}>
              <div>#</div>
              <div>Khách hàng</div>
              <div>NV phụ trách</div>
              <div>Sản phẩm</div>
              <div>Kênh</div>
              <div>Trạng thái LH</div>
              <div>Nhiệt độ</div>
              <div>Đính kèm</div>
              <div>Hành động</div>
            </div>

            {/* Rows */}
            {filtered.map((lead, idx, arr) => {
              const isLast     = idx === arr.length - 1;
              const attCount   = lead.attachments?.length || 0;
              const callCount  = lead.cskhCalls?.length  || 0;
              const channelCfg = CHANNEL_CFG[lead.channel] || null;
              const bdayDays   = daysUntilBirthday(lead.birthday);

              return (
                <div
                  key={lead.id}
                  style={{
                    display: 'grid', gridTemplateColumns: COLS,
                    padding: '11px 16px', gap: 8, alignItems: 'center',
                    borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
                    borderRadius: isLast ? '0 0 12px 12px' : 0,
                    transition: 'background .1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* # */}
                  <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>{idx + 1}</div>

                  {/* Khách hàng */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.name}
                      {bdayDays !== null && bdayDays <= 5 && (
                        <span title={bdayDays === 0 ? 'Sinh nhật hôm nay!' : `Sinh nhật trong ${bdayDays} ngày`}
                          style={{ marginLeft: 5, fontSize: 12 }}>
                          {bdayDays === 0 ? '🎉' : '🎂'}
                        </span>
                      )}
                    </div>
                    {lead.company && (
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        🏢 {lead.company}
                        {lead.nganh && <span style={{ color: '#9ca3af' }}> · {lead.nganh}</span>}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 1 }}>
                      {lead.phone || '—'}
                      {lead.email && <span style={{ color: '#9ca3af' }}> · {lead.email}</span>}
                    </div>
                  </div>

                  {/* NV phụ trách */}
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.assignedTo || <span style={{ color: '#d1d5db' }}>—</span>}
                  </div>

                  {/* Sản phẩm */}
                  <div style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.product || <span style={{ color: '#d1d5db' }}>—</span>}
                  </div>

                  {/* Kênh */}
                  <div>
                    {channelCfg ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        padding: '3px 8px', borderRadius: 99,
                        fontSize: 11, fontWeight: 600,
                        color: channelCfg.color, background: channelCfg.bg,
                        border: `1px solid ${channelCfg.color}30`,
                      }}>
                        {channelCfg.icon} {channelCfg.label}
                      </span>
                    ) : <span style={{ color: '#d1d5db' }}>—</span>}
                  </div>

                  {/* Trạng thái LH */}
                  <div>
                    <StatusBadge status={lead.contactStatus || 'chua_lh'} />
                    {callCount > 0 && (
                      <div style={{ marginTop: 3 }}>
                        <span style={{
                          fontSize: 10, color: '#2563eb', fontWeight: 600,
                          background: '#eff6ff', border: '1px solid #bfdbfe',
                          borderRadius: 4, padding: '1px 6px',
                        }}>
                          📞 {callCount} lần CS
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Nhiệt độ */}
                  <div><TempBadge temp={lead.temp} /></div>

                  {/* Đính kèm */}
                  <div>
                    {attCount > 0 ? (
                      <button
                        onClick={() => setDetailLead(lead)}
                        title={`${attCount} tài liệu`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 99,
                          fontSize: 11, fontWeight: 700,
                          background: '#eff6ff', color: '#1d4ed8',
                          border: '1.5px solid #bfdbfe',
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        📎 {attCount}
                      </button>
                    ) : (
                      <span style={{ color: '#d1d5db', fontSize: 11 }}>—</span>
                    )}
                  </div>

                  {/* Hành động */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <button
                      onClick={() => setDetailLead(lead)}
                      style={{
                        fontSize: 11, fontWeight: 700, color: '#fff',
                        background: 'linear-gradient(135deg,#059669,#047857)',
                        border: 'none', borderRadius: 7,
                        padding: '5px 10px', cursor: 'pointer',
                        fontFamily: 'inherit', whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(5,150,105,.25)',
                      }}
                    >
                      🔍 Chi tiết
                    </button>
                    <button
                      onClick={() => setEditingLead(lead)}
                      style={{
                        fontSize: 11, fontWeight: 700, color: '#fff',
                        background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                        border: 'none', borderRadius: 7,
                        padding: '5px 10px', cursor: 'pointer',
                        fontFamily: 'inherit', whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(37,99,235,.28)',
                      }}
                    >
                      ✏️ Chỉnh sửa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#9ca3af', textAlign: 'right' }}>
          {filtered.length} / {leads.length} lead
        </div>
      )}
    </div>
  );
}
