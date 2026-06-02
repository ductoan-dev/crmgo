import React, { useState, useMemo, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CATS, VIETNAM_REGIONS } from '../../utils/constants';
import StarRating from './StarRating';

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────

const emptyForm = () => ({
  name:'', username:'', pass:'', confirmPass:'',
  phone:'', email:'', note:'', cats:[], areas:[], showPass:false,
  company:'', taxCode:'', workshopAddress:'',
  rating: 0, ratingPros:'', ratingCons:'',
});

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:11, fontWeight:800, color:'#0d9488', textTransform:'uppercase', letterSpacing:.5, marginBottom:10 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ChipMulti({ options, value = [], onChange, color = 'var(--primary)', bg = 'var(--primary-pale)' }) {
  const toggle = (v) =>
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
      {options.map(o => {
        const active = value.includes(o);
        return (
          <button key={o} type="button" onClick={() => toggle(o)} style={{
            padding:'4px 11px', borderRadius:99, fontSize:12, fontWeight:600,
            cursor:'pointer', fontFamily:'inherit', transition:'all .12s',
            border: active ? `2px solid ${color}` : '1.5px solid #e2e8f0',
            background: active ? bg : '#f8fafc', color: active ? color : '#475569',
          }}>{o}</button>
        );
      })}
    </div>
  );
}

function RegionDropdown({ value = [], onChange }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef             = useRef(null);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = useMemo(() =>
    VIETNAM_REGIONS.filter(r => r.toLowerCase().includes(search.toLowerCase())), [search]);

  const toggle      = (r) => onChange(value.includes(r) ? value.filter(x => x !== r) : [...value, r]);
  const selectAll   = () => onChange([...new Set([...value, ...filtered])]);
  const deselectAll = () => onChange(value.filter(v => !filtered.includes(v)));

  return (
    <div ref={wrapRef} style={{ position:'relative' }}>
      <button type="button" onClick={() => setOpen(v => !v)} style={{
        width:'100%', padding:'9px 12px', borderRadius:8, cursor:'pointer',
        fontFamily:'inherit', fontSize:13, textAlign:'left',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        border: open ? '2px solid #7c3aed' : '1.5px solid #e2e8f0',
        background: open ? '#faf5ff' : '#fff',
        boxShadow: open ? '0 0 0 3px #ede9fe' : 'none', transition:'all .12s',
      }}>
        <span style={{ color: value.length ? '#1e293b' : '#94a3b8' }}>
          {value.length === 0 ? '📍 Chọn tỉnh / thành phố...' : `📍 ${value.length} tỉnh/thành đã chọn`}
        </span>
        <span style={{ fontSize:11, color:'#94a3b8' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left:0, right:0,
          background:'#fff', border:'1.5px solid #e2e8f0',
          borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,.12)', zIndex:400, overflow:'hidden',
        }}>
          <div style={{ padding:'10px 12px', borderBottom:'1px solid #f1f5f9' }}>
            <input autoFocus className="fi" placeholder="🔍 Tìm tỉnh/thành..."
              value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom:0 }} />
            <div style={{ display:'flex', gap:8, marginTop:7 }}>
              <button type="button" onClick={selectAll} style={{
                flex:1, padding:'4px 0', borderRadius:6, fontSize:11, fontWeight:700,
                cursor:'pointer', fontFamily:'inherit',
                border:'1px solid #ddd6fe', background:'#f5f3ff', color:'#7c3aed',
              }}>☑ Chọn tất cả ({filtered.length})</button>
              <button type="button" onClick={deselectAll} style={{
                flex:1, padding:'4px 0', borderRadius:6, fontSize:11, fontWeight:700,
                cursor:'pointer', fontFamily:'inherit',
                border:'1px solid #e2e8f0', background:'#f8fafc', color:'#64748b',
              }}>☐ Bỏ chọn ({value.filter(v => filtered.includes(v)).length})</button>
            </div>
          </div>
          <div style={{ maxHeight:220, overflowY:'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding:16, textAlign:'center', color:'#94a3b8', fontSize:12 }}>
                Không tìm thấy
              </div>
            ) : filtered.map(r => {
              const checked = value.includes(r);
              return (
                <label key={r} style={{
                  display:'flex', alignItems:'center', gap:10, padding:'8px 14px', cursor:'pointer',
                  background: checked ? '#faf5ff' : 'transparent',
                  borderLeft: checked ? '3px solid #7c3aed' : '3px solid transparent',
                }}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(r)}
                    style={{ accentColor:'#7c3aed', width:15, height:15, cursor:'pointer' }} />
                  <span style={{ fontSize:13, fontWeight: checked ? 700 : 400, color: checked ? '#6d28d9' : '#374151' }}>{r}</span>
                  {checked && <span style={{ marginLeft:'auto', fontSize:10, color:'#7c3aed' }}>✓</span>}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {value.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
          {value.map(r => (
            <span key={r} style={{
              fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:99,
              background:'#f5f3ff', color:'#7c3aed', border:'1px solid #ddd6fe',
              display:'flex', alignItems:'center', gap:4,
            }}>
              {r}
              <button type="button" onClick={() => toggle(r)} style={{
                background:'none', border:'none', cursor:'pointer', fontSize:11,
                color:'#a78bfa', lineHeight:1, padding:0,
              }}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SUPPLIER FORM (slide-in panel)
// ────────────────────────────────────────────────────────────
function SupplierForm({ initial, suppliers, onSave, onCancel }) {
  const isEdit = !!initial?.id;
  const [f, setF] = useState(() => initial
    ? { ...emptyForm(), ...initial, rating: initial.rating ?? 0, confirmPass: initial.pass || '', showPass:false }
    : emptyForm()
  );
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleNameChange = (val) => {
    set('name', val);
    if (!isEdit && !f._usernameTouched) set('username', `sanxuat${suppliers.length + 1}`);
  };

  const handleSave = async () => {
    if (!f.name.trim())      { toast.error('Nhập tên NCC');           return; }
    if (!f.username.trim())  { toast.error('Nhập username đăng nhập');  return; }
    if (!isEdit && !f.pass)  { toast.error('Nhập mật khẩu');            return; }
    if (f.pass && f.pass !== f.confirmPass) { toast.error('Mật khẩu không khớp'); return; }
    if (f.cats.length === 0) { toast.error('Chọn ít nhất 1 danh mục'); return; }
    const dup = suppliers.find(s => s.username === f.username.trim() && s.id !== initial?.id);
    if (dup) { toast.error(`Username "${f.username}" đã tồn tại`); return; }
    setSaving(true);
    await onSave({
      name: f.name.trim(), username: f.username.trim(),
      pass: f.pass || initial?.pass || '123456',
      phone: f.phone.trim(), email: f.email.trim(),
      note: f.note.trim(), cats: f.cats, areas: f.areas,
      company:         f.company.trim(),
      taxCode:         f.taxCode.trim(),
      workshopAddress: f.workshopAddress.trim(),
      rating:          f.rating,
      ratingPros:      f.ratingPros.trim(),
      ratingCons:      f.ratingCons.trim(),
    });
    setSaving(false);
  };

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.35)',
      zIndex:300, display:'flex', alignItems:'flex-start', justifyContent:'flex-end',
    }} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{
        width: Math.min(480, window.innerWidth - 16), height:'100%',
        background:'#fff', boxShadow:'-4px 0 24px rgba(0,0,0,.15)',
        overflowY:'auto', display:'flex', flexDirection:'column',
      }}>
        {/* Header */}
        <div style={{
          padding:'18px 20px 14px', borderBottom:'1px solid #f1f5f9',
          display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, background:'#fff', zIndex:1,
        }}>
          <div style={{
            width:36, height:36, borderRadius:10, fontSize:18,
            background:'linear-gradient(135deg,#0d9488,#059669)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>🏭</div>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:'#1e293b' }}>
              {isEdit ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
            </div>
            <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>
              {isEdit ? `Chỉnh sửa ${initial.name}` : 'Tạo tài khoản NCC mới'}
            </div>
          </div>
          <button onClick={onCancel} style={{
            marginLeft:'auto', background:'none', border:'none', fontSize:20,
            cursor:'pointer', color:'#94a3b8', lineHeight:1,
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding:20, flex:1 }}>
          <Section title="📋 Thông tin cơ bản">
            <div className="fi-group">
              <label className="fi-label">Tên nhà cung cấp <span style={{color:'red'}}>*</span></label>
              <input className="fi" autoFocus placeholder="VD: Công ty In ABC"
                value={f.name} onChange={e => handleNameChange(e.target.value)} />
            </div>
            <div className="form-grid" style={{ marginTop:10 }}>
              <div className="fi-group">
                <label className="fi-label">Số điện thoại</label>
                <input className="fi" placeholder="0912 345 678" value={f.phone}
                  onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="fi-group">
                <label className="fi-label">Email</label>
                <input className="fi" placeholder="ncc@email.com" value={f.email}
                  onChange={e => set('email', e.target.value)} />
              </div>
            </div>
            <div className="fi-group" style={{ marginTop:10 }}>
              <label className="fi-label">Ghi chú</label>
              <textarea className="fi" rows={2} placeholder="Ghi chú thêm..."
                value={f.note} onChange={e => set('note', e.target.value)} style={{ resize:'vertical' }} />
            </div>
          </Section>

          <Section title="🔐 Tài khoản đăng nhập">
            <div className="fi-group">
              <label className="fi-label">Username <span style={{color:'red'}}>*</span></label>
              <input className="fi" placeholder="VD: sanxuat4" value={f.username}
                onChange={e => { set('username', e.target.value); set('_usernameTouched', true); }} />
              <div style={{ fontSize:10, color:'#94a3b8', marginTop:4 }}>
                Dùng để đăng nhập (không dấu, không khoảng trắng)
              </div>
            </div>
            <div className="form-grid" style={{ marginTop:10 }}>
              <div className="fi-group">
                <label className="fi-label">
                  {isEdit ? 'Đổi mật khẩu' : 'Mật khẩu'} <span style={{color:'red'}}>*</span>
                </label>
                <div style={{ position:'relative' }}>
                  <input className="fi" type={f.showPass ? 'text' : 'password'}
                    placeholder={isEdit ? 'Để trống = giữ nguyên' : 'Nhập mật khẩu'}
                    value={f.pass} onChange={e => set('pass', e.target.value)}
                    style={{ paddingRight:40 }} />
                  <button type="button" onClick={() => set('showPass', !f.showPass)} style={{
                    position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', fontSize:14,
                  }}>{f.showPass ? '🙈' : '👁️'}</button>
                </div>
              </div>
              <div className="fi-group">
                <label className="fi-label">Xác nhận mật khẩu</label>
                <input className="fi" type={f.showPass ? 'text' : 'password'}
                  placeholder="Nhập lại" value={f.confirmPass}
                  onChange={e => set('confirmPass', e.target.value)} />
                {f.pass && f.confirmPass && f.pass !== f.confirmPass && (
                  <div style={{ fontSize:10, color:'#dc2626', marginTop:3 }}>⚠ Không khớp</div>
                )}
                {f.pass && f.confirmPass && f.pass === f.confirmPass && (
                  <div style={{ fontSize:10, color:'#16a34a', marginTop:3 }}>✅ Khớp</div>
                )}
              </div>
            </div>
          </Section>

          <Section title="🎨 Danh mục sản xuất *">
            <ChipMulti options={CATS} value={f.cats}
              onChange={v => set('cats', v)} color="#0d9488" bg="#f0fdfa" />
            {f.cats.length === 0 && (
              <div style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>
                Chọn ít nhất 1 danh mục
              </div>
            )}
          </Section>

          <Section title="📍 Khu vực hoạt động">
            <div style={{ fontSize:11, color:'#64748b', marginBottom:8 }}>
              Ưu tiên NCC gần khu vực giao hàng khi giao đơn
              {f.areas.length === 0 && <span style={{ color:'#94a3b8' }}> · Không chọn = toàn quốc</span>}
            </div>
            <RegionDropdown value={f.areas} onChange={v => set('areas', v)} />
          </Section>

          <Section title="🏢 Thông tin pháp lý">
            <div className="form-grid" style={{ marginTop:0 }}>
              <div className="fi-group">
                <label className="fi-label">Tên công ty / Hộ KD</label>
                <input className="fi" placeholder="VD: Công ty TNHH In ABC"
                  value={f.company} onChange={e => set('company', e.target.value)} />
              </div>
              <div className="fi-group">
                <label className="fi-label">Mã số thuế (MST)</label>
                <input className="fi" placeholder="VD: 0123456789"
                  value={f.taxCode}
                  onChange={e => set('taxCode', e.target.value.replace(/\D/g, ''))}
                  maxLength={14} />
              </div>
            </div>
            <div className="fi-group" style={{ marginTop:10 }}>
              <label className="fi-label">Địa chỉ xưởng</label>
              <textarea className="fi" rows={2}
                placeholder="VD: 123 Nguyễn Văn Linh, Quận 7, TP.HCM"
                value={f.workshopAddress}
                onChange={e => set('workshopAddress', e.target.value)}
                style={{ resize:'vertical' }} />
            </div>
          </Section>

          <Section title="⭐ Đánh giá nhà cung cấp">
            <div className="fi-group">
              <label className="fi-label">Xếp hạng tổng thể</label>
              <StarRating value={f.rating} onChange={v => set('rating', v)} size={26} />
            </div>
            <div className="form-grid" style={{ marginTop:10 }}>
              <div className="fi-group">
                <label className="fi-label" style={{ color:'#16a34a' }}>✅ Ưu điểm</label>
                <input className="fi"
                  placeholder="VD: Giao nhanh, giá tốt, ổn định..."
                  value={f.ratingPros}
                  onChange={e => set('ratingPros', e.target.value)} />
              </div>
              <div className="fi-group">
                <label className="fi-label" style={{ color:'#dc2626' }}>⚠️ Nhược điểm</label>
                <input className="fi"
                  placeholder="VD: Đôi khi trễ hẹn..."
                  value={f.ratingCons}
                  onChange={e => set('ratingCons', e.target.value)} />
              </div>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div style={{
          padding:'14px 20px', borderTop:'1px solid #f1f5f9',
          display:'flex', gap:10, justifyContent:'flex-end',
          position:'sticky', bottom:0, background:'#fff',
        }}>
          <button className="btn btn-ghost" onClick={onCancel}>Huỷ</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Đang lưu...' : isEdit ? '💾 Lưu thay đổi' : '✅ Tạo nhà cung cấp'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SupplierForm;
