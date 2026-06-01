import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore, useUIStore } from '../../store';
import {
  OPP_TYPES, OPP_CATS, CUSTOMER_PROFILES, UNITS, VIETNAM_REGIONS,
} from '../../utils/constants';

/* ── Section header ── */
function Section({ icon, title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: 'var(--primary)',
        textTransform: 'uppercase', letterSpacing: .6,
        marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span>{icon}</span> {title}
      </div>
      {children}
    </div>
  );
}

/* ── Tile chọn 1 ── */
function TileSelect({ options, value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(options.length, 4)}, 1fr)`, gap: 8 }}>
      {options.map(o => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
              fontFamily: 'inherit', textAlign: 'center', transition: 'all .12s',
              border: active ? '2px solid var(--primary)' : '1.5px solid #e2e8f0',
              background: active ? 'var(--primary-pale)' : '#fff',
              boxShadow: active ? '0 0 0 3px var(--primary-bd)' : 'none',
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>{o.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: active ? 'var(--primary)' : '#1e293b' }}>
              {o.label}
            </div>
            {o.desc && (
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, lineHeight: 1.3 }}>
                {o.desc}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Chip multi-select ── */
function ChipMulti({ options, value = [], onChange, accentColor = 'var(--primary)', accentBg = 'var(--primary-pale)' }) {
  const toggle = (v) =>
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {options.map(o => {
        const active = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            style={{
              padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s',
              border: active ? `2px solid ${accentColor}` : '1.5px solid #e2e8f0',
              background: active ? accentBg : '#f8fafc',
              color: active ? accentColor : '#475569',
            }}
          >
            {o.icon} {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ══ Main modal ══════════════════════════════════════════════ */
export default function AddOppModal({ data }) {
  const user          = useAuthStore(s => s.user);
  const addOpp        = useDataStore(s => s.addOpp);
  const convertLead   = useDataStore(s => s.convertLead);
  const updateLead    = useDataStore(s => s.updateLead);
  const closeModal    = useUIStore(s => s.closeModal);
  const setTab        = useUIStore(s => s.setTab);

  // data từ lead (nếu chuyển từ lead sang cơ hội)
  const fromLead = data?.fromLead || false;

  const [form, setForm] = useState({
    loai:        '',
    khachHang:   data?.khachHang   || '',
    soDienThoai: data?.soDienThoai || '',
    // ── Chân dung tự động bắt từ lead ──
    chandung:    data?.chandung    || [],
    danhMuc:     data?.danhMuc     || '',
    soluong:     '',
    donvi:       'cái',
    diadiem:     data?.area || '',
    quycach:     '',
    thongtin:    data?.thongtin    || '',
    khaNang:     50,
    status:      0,
  });
  const [saving, setSaving] = useState(false);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = async () => {
    if (!form.loai)              { toast.error('Chọn loại cơ hội');         return; }
    if (!form.khachHang.trim())  { toast.error('Nhập tên khách hàng');      return; }
    if (!form.danhMuc)           { toast.error('Chọn danh mục sản phẩm');   return; }

    setSaving(true);
    try {
      if (fromLead && data.leadId) {
        // ── Chuyển Lead → Khách hàng + Cơ hội (atomic) ──────────
        await convertLead(data.leadId, {
          khachHang:   form.khachHang,
          soDienThoai: form.soDienThoai,
          chandung:    form.chandung,
          danhMuc:     form.danhMuc,
          loai:        form.loai,
          soluong:     form.soluong,
          donvi:       form.donvi,
          diadiem:     form.diadiem,
          quycach:     form.quycach,
          thongtin:    form.thongtin,
          khaNang:     form.khaNang,
        });
        toast.success(`✅ Đã tạo khách hàng & cơ hội cho "${form.khachHang}"`);
        closeModal();
        setTab('mycust'); // chuyển sang tab Khách hàng
      } else {
        // ── Tạo cơ hội mới (không từ lead) ──────────────────────
        await addOpp({
          emp:         user?.name,
          customerName:form.khachHang,
          khachHang:   form.khachHang,
          soDienThoai: form.soDienThoai,
          chandung:    form.chandung,
          chungloai:   form.danhMuc,
          loaiCoHoi:   form.loai,
          soluong:     form.soluong,
          donvi:       form.donvi,
          diadiem:     form.diadiem,
          quycach:     form.quycach,
          thongtin:    form.thongtin,
          khaNang:     form.khaNang,
          status:      form.status,
        });
        toast.success(`✅ Đã tạo cơ hội cho "${form.khachHang}"`);
        closeModal();
        setTab('opps');
      }
    } catch (e) {
      toast.error(`Lỗi: ${e.message || 'Có lỗi xảy ra'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* ── Title ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>💡</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>
              Tạo Cơ hội – Yêu cầu báo giá
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
              Điền thông tin để gửi nhà cung cấp báo giá
            </div>
          </div>
        </div>

        {/* Badge từ lead */}
        {fromLead && (
          <div style={{
            marginTop: 10, padding: '6px 12px',
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#15803d',
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            🔗 Chuyển từ Lead: <strong>{data.khachHang}</strong>
          </div>
        )}
      </div>

      {/* ── Section 1: Loại cơ hội ── */}
      <Section icon="📋" title="Loại cơ hội *">
        <TileSelect
          options={OPP_TYPES}
          value={form.loai}
          onChange={v => set('loai', v)}
        />
      </Section>

      {/* ── Section 2: Thông tin khách hàng ── */}
      <Section icon="👤" title="Thông tin khách hàng">
        <div className="form-grid">
          <div className="fi-group">
            <label className="fi-label">Họ tên khách hàng <span style={{color:'red'}}>*</span></label>
            <input
              className="fi"
              placeholder="Nguyễn Văn A / Công ty ABC"
              value={form.khachHang}
              onChange={e => set('khachHang', e.target.value)}
              autoFocus={!fromLead}
            />
          </div>
          <div className="fi-group">
            <label className="fi-label">Số điện thoại <span style={{color:'red'}}>*</span></label>
            <input
              className="fi"
              placeholder="0912 345 678"
              value={form.soDienThoai}
              onChange={e => set('soDienThoai', e.target.value)}
            />
          </div>
        </div>

        {/* Chân dung khách hàng — AUTO-FILL từ lead */}
        <div style={{ marginTop: 12 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#475569',
            marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5,
          }}>
            🎯 Chân dung khách hàng
            <span style={{ fontWeight: 400, color: '#94a3b8' }}>(chọn 1 hoặc nhiều)</span>
            {fromLead && form.chandung.length > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: '#f0fdf4', color: '#15803d',
                border: '1px solid #bbf7d0',
                borderRadius: 4, padding: '1px 6px', marginLeft: 4,
              }}>
                ✓ Đã bắt từ lead
              </span>
            )}
          </div>
          <ChipMulti
            options={CUSTOMER_PROFILES}
            value={form.chandung}
            onChange={v => set('chandung', v)}
          />
        </div>
      </Section>

      {/* ── Section 3: Danh mục & Sản phẩm ── */}
      <Section icon="🎨" title="Danh mục & Sản phẩm">
        {/* Danh mục (tile chọn 1) */}
        <div style={{ marginBottom: 12 }}>
          <label className="fi-label" style={{ marginBottom: 8, display: 'block' }}>
            Danh mục sản phẩm <span style={{color:'red'}}>*</span>
            <span style={{fontSize:10, fontWeight:400, color:'#94a3b8', marginLeft:4}}>(chọn 1)</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {OPP_CATS.map(c => {
              const active = form.danhMuc === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => set('danhMuc', c.value)}
                  style={{
                    padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s',
                    border: active ? `2px solid ${c.color}` : '1.5px solid #e2e8f0',
                    background: active ? `${c.color}15` : '#f8fafc',
                    color: active ? c.color : '#475569',
                  }}
                >
                  {c.icon} {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Số lượng + đơn vị + địa điểm */}
        <div className="form-grid">
          <div className="fi-group">
            <label className="fi-label">Số lượng <span style={{color:'red'}}>*</span></label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                className="fi"
                placeholder="VD: 1000"
                value={form.soluong}
                onChange={e => set('soluong', e.target.value)}
                style={{ flex: 1 }}
              />
              <select
                className="fi"
                value={form.donvi}
                onChange={e => set('donvi', e.target.value)}
                style={{ width: 80 }}
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="fi-group">
            <label className="fi-label">Địa điểm giao hàng <span style={{color:'red'}}>*</span></label>
            <select className="fi" value={form.diadiem} onChange={e => set('diadiem', e.target.value)}>
              <option value="">-- Chọn tỉnh/thành phố --</option>
              {VIETNAM_REGIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="fi-group" style={{ gridColumn: '1 / -1' }}>
            <label className="fi-label">Quy cách sản phẩm <span style={{color:'red'}}>*</span></label>
            <input
              className="fi"
              placeholder="VD: Kích thước 20×30cm, 4 màu CMYK, giấy couché 300gsm, cán mờ, bế theo..."
              value={form.quycach}
              onChange={e => set('quycach', e.target.value)}
            />
          </div>

          <div className="fi-group" style={{ gridColumn: '1 / -1' }}>
            <label className="fi-label">Thông tin thêm / Yêu cầu đặc biệt</label>
            <textarea
              className="fi"
              rows={2}
              placeholder="Nhu cầu, yêu cầu đặc biệt, mẫu tham khảo..."
              value={form.thongtin}
              onChange={e => set('thongtin', e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
      </Section>

      {/* ── Khả năng chốt ── */}
      <div className="fi-group" style={{ marginBottom: 16 }}>
        <label className="fi-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Khả năng chốt đơn</span>
          <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{form.khaNang}%</span>
        </label>
        <input
          type="range" min="0" max="100" step="10"
          value={form.khaNang}
          onChange={e => set('khaNang', Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--primary)', marginTop: 4 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
          <span>0% Thấp</span><span>50% Trung bình</span><span>100% Rất cao</span>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={closeModal}>Huỷ</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving
            ? '⏳ Đang tạo...'
            : fromLead
              ? '🤝 Tạo Khách hàng & Cơ hội'
              : '💡 Tạo cơ hội'}
        </button>
      </div>
    </div>
  );
}
