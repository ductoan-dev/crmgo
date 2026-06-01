import React, { useState, useMemo, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore, useUIStore } from '../../store';
import { CATS, CAT_CLR, WF_LABEL, VIETNAM_REGIONS, NCC_QUOTE_DEADLINE_HOURS } from '../../utils/constants';
import { fmt, fmtDate } from '../../utils/helpers';

// ────────────────────────────────────────────────────────────
// SHARED HELPERS
// ────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────
// ASSIGN NCC PANEL — giao đơn cho nhà cung cấp
// ────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────
// SUPPLIER CARD (tab Nhà cung cấp)
// ────────────────────────────────────────────────────────────
function SupplierCard({ sup, onEdit, onDelete }) {
  return (
    <div className="card card-pad" style={{ marginBottom:10, borderLeft:'4px solid #0d9488' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{
          width:44, height:44, borderRadius:12, flexShrink:0,
          background:'linear-gradient(135deg,#0d9488,#059669)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
        }}>🏭</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontWeight:800, fontSize:14, color:'#1e293b' }}>{sup.name}</span>
            <code style={{
              fontSize:11, fontWeight:700, color:'#0d9488',
              background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:4, padding:'1px 7px',
            }}>@{sup.username}</code>
          </div>
          {(sup.phone || sup.email) && (
            <div style={{ fontSize:12, color:'#64748b', marginTop:3, display:'flex', gap:12, flexWrap:'wrap' }}>
              {sup.phone && <span>📞 {sup.phone}</span>}
              {sup.email && <span>✉️ {sup.email}</span>}
            </div>
          )}
          {sup.cats?.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:7 }}>
              {sup.cats.map(c => (
                <span key={c} style={{
                  fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:99,
                  background:'#f0fdfa', color:'#0d9488', border:'1px solid #99f6e4',
                }}>{c}</span>
              ))}
            </div>
          )}
          {sup.areas?.length > 0 ? (
            <div style={{ marginTop:6 }}>
              <span style={{ fontSize:10, fontWeight:700, color:'#7c3aed', marginRight:5 }}>📍 KV:</span>
              {sup.areas.slice(0, 6).map(a => (
                <span key={a} style={{
                  fontSize:10, padding:'1px 7px', borderRadius:99, marginRight:4,
                  background:'#f5f3ff', color:'#7c3aed', border:'1px solid #ddd6fe',
                }}>{a}</span>
              ))}
              {sup.areas.length > 6 && (
                <span style={{ fontSize:10, color:'#94a3b8' }}>+{sup.areas.length - 6} tỉnh</span>
              )}
            </div>
          ) : (
            <div style={{ marginTop:4, fontSize:10, color:'#94a3b8' }}>📍 Toàn quốc</div>
          )}
          {sup.note && (
            <div style={{ fontSize:11, color:'#64748b', marginTop:4, fontStyle:'italic' }}>{sup.note}</div>
          )}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(sup)}>✏️ Sửa</button>
          <button
            className="btn btn-sm"
            style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca' }}
            onClick={() => onDelete(sup)}
          >🗑️ Xoá</button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SUPPLIER FORM (slide-in panel)
// ────────────────────────────────────────────────────────────
const emptyForm = () => ({
  name:'', username:'', pass:'', confirmPass:'',
  phone:'', email:'', note:'', cats:[], areas:[], showPass:false,
});

function SupplierForm({ initial, suppliers, onSave, onCancel }) {
  const isEdit = !!initial?.id;
  const [f, setF] = useState(() => initial
    ? { ...emptyForm(), ...initial, confirmPass: initial.pass || '', showPass:false }
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

// ════════════════════════════════════════════════════════════
// SMGR VIEW — MAIN
// ════════════════════════════════════════════════════════════
export default function SmgrView() {
  const user           = useAuthStore(s => s.user);
  const activeTab      = useUIStore(s => s.activeTab);
  const orders         = useDataStore(s => s.orders);
  const suppliers      = useDataStore(s => s.suppliers);
  const addSupplier    = useDataStore(s => s.addSupplier);
  const updateSupplier = useDataStore(s => s.updateSupplier);
  const deleteSupplier = useDataStore(s => s.deleteSupplier);
  const smgrAssignNcc           = useDataStore(s => s.smgrAssignNcc);
  const checkNccQuoteDeadline   = useDataStore(s => s.checkNccQuoteDeadline);

  // Supplier form state
  const [showForm,    setShowForm]    = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [supQ,        setSupQ]        = useState('');

  // Order assign state — id của đơn đang mở panel giao NCC
  const [assigningId, setAssigningId] = useState(null);

  // ── Phân loại đơn hàng ──────────────────────────────────────
  // needAction = chờ giao NCC (chưa assign) hoặc đã giao (đang theo dõi)
  const needAction  = useMemo(() =>
    orders.filter(o => ['kt_approved','supplier_sent','in_production'].includes(o.wfStatus)),
  [orders]);
  const pending     = useMemo(() => orders.filter(o => o.wfStatus === 'kt_approved'), [orders]);
  const inProd      = useMemo(() => orders.filter(o => ['in_production','supplier_sent'].includes(o.wfStatus)), [orders]);
  const inWarehouse = useMemo(() => orders.filter(o => o.wfStatus === 'in_warehouse'), [orders]);
  const done        = useMemo(() => orders.filter(o => o.wfStatus === 'delivered'), [orders]);

  // ── Đơn In nhanh đã giao NCC nhưng chưa có báo giá > 24h ────
  const nccOverdueOrders = useMemo(() => {
    const DEADLINE_MS = NCC_QUOTE_DEADLINE_HOURS * 3_600_000;
    return orders.filter(o => {
      if (o.orderType !== 'In nhanh') return false;
      if (o.wfStatus  !== 'supplier_sent') return false;
      if (o.nccQuotePrice) return false;
      const t = o.wfStatusChangedAt || o.createdAt;
      return t && (Date.now() - new Date(t).getTime()) > DEADLINE_MS;
    });
  }, [orders]);

  // ── Lọc NCC ─────────────────────────────────────────────────
  const filteredSuppliers = useMemo(() => {
    if (!supQ.trim()) return suppliers;
    const lq = supQ.toLowerCase();
    return suppliers.filter(s =>
      s.name?.toLowerCase().includes(lq) ||
      s.username?.toLowerCase().includes(lq) ||
      s.cats?.some(c => c.toLowerCase().includes(lq)) ||
      s.areas?.some(a => a.toLowerCase().includes(lq))
    );
  }, [suppliers, supQ]);

  // ── Handlers NCC ────────────────────────────────────────────
  const handleSupSave = async (data) => {
    if (editTarget) {
      updateSupplier(editTarget.id, data);
      toast.success(`✅ Đã cập nhật "${data.name}"`);
    } else {
      addSupplier(data);
      toast.success(`✅ Đã tạo NCC "${data.name}" (@${data.username})`);
    }
    setShowForm(false); setEditTarget(null);
  };
  const handleSupEdit   = (s) => { setEditTarget(s); setShowForm(true); };
  const handleSupDelete = (s) => {
    if (!window.confirm(`Xoá "${s.name}"?`)) return;
    deleteSupplier(s.id); toast.success(`Đã xoá ${s.name}`);
  };

  // ── Handler giao NCC ────────────────────────────────────────
  const handleAssign = async (ordId, data) => {
    try {
      await smgrAssignNcc(ordId, data, user?.name);
      toast.success(`📤 Đã giao đơn cho ${data.nccName}`);
      setAssigningId(null);
    } catch {
      toast.error('Không thể giao đơn — kiểm tra trạng thái đơn hàng');
    }
  };

  // ════════════════════════════════════════════════════════════
  // TAB: NHÀ CUNG CẤP
  // ════════════════════════════════════════════════════════════
  if (activeTab === 'suppliers') return (
    <div>
      <div className="kpi-strip">
        <div className="kpi-card" style={{ borderTopColor:'#0d9488' }}>
          <div className="kpi-lbl">🏭 Tổng NCC</div>
          <div className="kpi-val" style={{ color:'#0d9488' }}>{suppliers.length}</div>
        </div>
        {['In nhanh','Offset','Hộp sóng','Hộp cứng'].map(cat => (
          <div key={cat} className="kpi-card" style={{ borderTopColor:'#7c3aed' }}>
            <div className="kpi-lbl">{cat}</div>
            <div className="kpi-val" style={{ color:'#7c3aed', fontSize:20 }}>
              {suppliers.filter(s => s.cats?.includes(cat)).length}
            </div>
          </div>
        ))}
      </div>

      <div className="search-bar">
        <input className="search-input" placeholder="Tìm tên, username, danh mục, khu vực..."
          value={supQ} onChange={e => setSupQ(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={() => { setEditTarget(null); setShowForm(true); }}>
          + Thêm NCC
        </button>
      </div>

      {filteredSuppliers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏭</div>
          <div className="empty-text">Chưa có nhà cung cấp nào</div>
          <button className="btn btn-primary" style={{ marginTop:12 }}
            onClick={() => { setEditTarget(null); setShowForm(true); }}>+ Thêm NCC đầu tiên</button>
        </div>
      ) : filteredSuppliers.map(sup => (
        <SupplierCard key={sup.id} sup={sup} onEdit={handleSupEdit} onDelete={handleSupDelete} />
      ))}

      {showForm && (
        <SupplierForm initial={editTarget} suppliers={suppliers}
          onSave={handleSupSave}
          onCancel={() => { setShowForm(false); setEditTarget(null); }} />
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // TAB: AI
  // ════════════════════════════════════════════════════════════
  if (activeTab === 'ai') return (
    <div className="empty-state">
      <div className="empty-icon">🤖</div>
      <div className="empty-text">AI Báo Giá Tự Động</div>
      <div className="empty-sub">Chỉ phân tích cơ hội chưa có báo giá</div>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // TAB: ĐƠN HÀNG (default)
  // ════════════════════════════════════════════════════════════
  return (
    <div>
      {/* KPI */}
      <div className="kpi-strip">
        <div className="kpi-card" style={{ borderTopColor:'#f59e0b', background: pending.length > 0 ? '#fffbeb' : undefined }}>
          <div className="kpi-lbl" style={{ color: pending.length > 0 ? '#92400e' : undefined }}>⏳ Chờ giao NCC</div>
          <div className="kpi-val" style={{ color:'#f59e0b' }}>{pending.length}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor:'#0d9488' }}>
          <div className="kpi-lbl">✅ Đã giao NCC</div>
          <div className="kpi-val" style={{ color:'#0d9488' }}>{inProd.length}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor:'#059669' }}>
          <div className="kpi-lbl">📦 Về kho</div>
          <div className="kpi-val" style={{ color:'#059669' }}>{inWarehouse.length}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor:'#16a34a' }}>
          <div className="kpi-lbl">✅ Hoàn thành</div>
          <div className="kpi-val" style={{ color:'#16a34a' }}>{done.length}</div>
        </div>
      </div>

      {/* ── ALERT: In nhanh quá hạn báo giá ── */}
      {nccOverdueOrders.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', marginBottom: 16,
          background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 10,
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#92400e' }}>
                {nccOverdueOrders.length} đơn In nhanh quá {NCC_QUOTE_DEADLINE_HOURS}h chưa có báo giá từ NCC
              </div>
              <div style={{ fontSize: 11, color: '#78716c', marginTop: 1 }}>
                {nccOverdueOrders.map(o => o.smgrNccName).filter((v, i, a) => a.indexOf(v) === i).join(' · ')}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              checkNccQuoteDeadline(user, { force: true });
              toast.success(`🔔 Đã gửi thông báo test đến chuông SMGR (${nccOverdueOrders.length} đơn)`);
            }}
            style={{
              fontSize: 12, fontWeight: 700, color: '#92400e',
              background: '#fef3c7', border: '1.5px solid #fcd34d',
              borderRadius: 8, padding: '6px 14px',
              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            🧪 Test thông báo
          </button>
        </div>
      )}

      {/* ── SECTION: Tất cả đơn cần xử lý (chờ giao + đã giao) ── */}
      {needAction.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{
            fontSize:11, fontWeight:800, color:'#475569',
            textTransform:'uppercase', letterSpacing:.5,
            marginBottom:10, display:'flex', alignItems:'center', gap:6,
          }}>
            📋 Đơn hàng cần xử lý ({needAction.length})
            {pending.length > 0 && (
              <span style={{
                background:'#fef3c7', color:'#92400e',
                borderRadius:99, fontSize:10, fontWeight:900, padding:'2px 8px',
              }}>⏳ {pending.length} chờ giao</span>
            )}
          </div>

          {needAction.map(o => {
            const isAssigned = ['supplier_sent','in_production'].includes(o.wfStatus);
            const expectDate = o.smgrExpectDate ? new Date(o.smgrExpectDate) : null;
            const isLate     = isAssigned && expectDate && expectDate < new Date();
            const hasQuote   = !!o.nccQuotePrice;

            // Màu border: chờ giao = vàng, đã giao = xanh, trễ = đỏ
            const accent = isLate ? '#dc2626' : isAssigned ? '#0d9488' : '#f59e0b';

            return (
              <div key={o.id} style={{ marginBottom:8 }}>
                <div className="ord-card" style={{
                  borderLeft:`4px solid ${accent}`,
                  borderRadius: assigningId === o.id ? '10px 10px 0 0' : 10,
                  marginBottom:0,
                  background: !isAssigned ? '#fffdf5' : undefined,
                }}>
                  <div className="ord-card-head">
                    <span className="ord-code">{o.code}</span>
                    <span className="ord-name">{o.name}</span>

                    {/* Badge loại đơn */}
                    {o.orderType && (
                      <span style={{
                        fontSize:11, fontWeight:700, color:'#fff',
                        background: CAT_CLR[o.orderType] || '#64748b',
                        borderRadius:99, padding:'3px 10px', whiteSpace:'nowrap',
                      }}>
                        {o.orderType}
                      </span>
                    )}

                    {/* Badge trạng thái giao NCC */}
                    {isAssigned ? (
                      <span style={{
                        fontSize:11, fontWeight:800, color:'#fff',
                        background:'#0d9488', borderRadius:6,
                        padding:'3px 10px', whiteSpace:'nowrap',
                        display:'inline-flex', alignItems:'center', gap:5,
                      }}>
                        ✅ Đã giao: {o.smgrNccName}
                      </span>
                    ) : (
                      <span style={{
                        fontSize:10, fontWeight:700, color:'#92400e',
                        background:'#fef3c7', border:'1px solid #fde68a',
                        borderRadius:5, padding:'3px 10px', whiteSpace:'nowrap',
                      }}>
                        ⏳ Chưa giao NCC
                      </span>
                    )}

                    {/* Badge ưu tiên In nhanh */}
                    {o.orderType === 'In nhanh' && !isAssigned && (
                      <span style={{
                        fontSize:10, fontWeight:800, color:'#fff',
                        background:'#f59e0b', borderRadius:5, padding:'2px 8px',
                        whiteSpace:'nowrap',
                      }}>⚡ Giao gấp — 24h</span>
                    )}

                    {isLate && (
                      <span style={{
                        fontSize:10, fontWeight:700, color:'#dc2626',
                        background:'#fef2f2', border:'1px solid #fecaca',
                        borderRadius:5, padding:'2px 8px',
                      }}>🔴 Trễ hạn</span>
                    )}
                    <span className="ord-amount">{fmt(o.grandTotal)}</span>
                  </div>

                  {/* Trạng thái báo giá NCC — chỉ hiện khi đã giao */}
                  {isAssigned && (() => {
                    if (hasQuote) return (
                      <div style={{
                        margin:'0 16px 8px', padding:'8px 12px',
                        background:'#f0fdf4', borderRadius:8, border:'1px solid #bbf7d0',
                        display:'flex', alignItems:'center', gap:10,
                      }}>
                        <span style={{ fontSize:11, fontWeight:700, color:'#15803d' }}>💰 NCC báo giá:</span>
                        <span style={{ fontSize:14, fontWeight:900, color:'#15803d' }}>
                          {new Intl.NumberFormat('vi-VN').format(o.nccQuotePrice)}đ
                        </span>
                        {o.nccQuoteNote && <span style={{ fontSize:11, color:'#64748b' }}>· {o.nccQuoteNote}</span>}
                        <span style={{ fontSize:10, color:'#94a3b8', marginLeft:'auto' }}>
                          {o.nccQuotedBy} · {o.nccQuotedAt}
                        </span>
                      </div>
                    );
                    const t      = o.wfStatusChangedAt || o.createdAt;
                    const ageH   = t ? Math.floor((Date.now() - new Date(t).getTime()) / 3_600_000) : null;
                    const isInNhanh = o.orderType === 'In nhanh';
                    const isOverdueQuote = isInNhanh && ageH !== null && ageH >= NCC_QUOTE_DEADLINE_HOURS;
                    return (
                      <div style={{
                        margin:'0 16px 8px', padding:'7px 12px',
                        background: isOverdueQuote ? '#fef2f2' : '#fff7ed',
                        borderRadius:8,
                        border: isOverdueQuote ? '1.5px solid #fca5a5' : '1px solid #fed7aa',
                        display:'flex', alignItems:'center', gap:8,
                      }}>
                        <span style={{ fontSize:11, fontWeight:700, color: isOverdueQuote ? '#dc2626' : '#c2410c' }}>
                          {isOverdueQuote ? '🔴 Quá hạn báo giá!' : '⏳ Chờ báo giá từ NCC'}
                        </span>
                        {ageH !== null && (
                          <span style={{
                            fontSize:10, padding:'2px 8px', borderRadius:99, fontWeight:700,
                            background: isOverdueQuote ? '#dc2626' : '#fed7aa',
                            color: isOverdueQuote ? '#fff' : '#92400e',
                          }}>
                            {ageH}h đã trôi qua
                          </span>
                        )}
                        {isInNhanh && !isOverdueQuote && ageH !== null && (
                          <span style={{ fontSize:10, color:'#92400e' }}>
                            · còn {NCC_QUOTE_DEADLINE_HOURS - ageH}h nữa đến hạn
                          </span>
                        )}
                        {isOverdueQuote && (
                          <span style={{ fontSize:10, color:'#dc2626', marginLeft:2 }}>
                            · quá {ageH - NCC_QUOTE_DEADLINE_HOURS}h
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  <div className="ord-meta">
                    <div className="ord-meta-item">
                      <div className="ord-meta-label">KD phụ trách</div>
                      <div className="ord-meta-val">{o.emp}</div>
                    </div>
                    <div className="ord-meta-item">
                      <div className="ord-meta-label">Loại đơn</div>
                      <div className="ord-meta-val">{o.orderType || '–'}</div>
                    </div>
                    {o.diadiem && (
                      <div className="ord-meta-item">
                        <div className="ord-meta-label">📍 Giao đến</div>
                        <div className="ord-meta-val">{o.diadiem}</div>
                      </div>
                    )}
                    {isAssigned && o.smgrExpectDate && (
                      <div className="ord-meta-item">
                        <div className="ord-meta-label">Hạn giao</div>
                        <div className="ord-meta-val" style={{ color: isLate ? '#dc2626' : '#0d9488', fontWeight: isLate ? 700 : 400 }}>
                          📅 {fmtDate(o.smgrExpectDate)} {isLate && '⚠️ quá hạn'}
                        </div>
                      </div>
                    )}
                    {isAssigned && (
                      <div className="ord-meta-item">
                        <div className="ord-meta-label">Giao bởi</div>
                        <div className="ord-meta-val">{o.smgrAssignedBy || '—'}</div>
                      </div>
                    )}
                  </div>

                  <div className="ord-actions">
                    {!isAssigned && (
                      assigningId === o.id ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => setAssigningId(null)}>
                          ✕ Đóng
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm"
                          style={{ background:'#0d9488', color:'#fff', border:'none', fontWeight:700 }}
                          onClick={() => setAssigningId(o.id)}
                        >
                          📤 Giao NCC sản xuất
                        </button>
                      )
                    )}
                    {isAssigned && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setAssigningId(assigningId === o.id ? null : o.id)}
                      >
                        {assigningId === o.id ? '✕ Đóng' : '🔄 Đổi NCC'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Assign panel */}
                {assigningId === o.id && (
                  <AssignPanel
                    order={o}
                    suppliers={suppliers}
                    onAssign={handleAssign}
                    onClose={() => setAssigningId(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── SECTION 3: Về kho / Hoàn thành ── */}
      {(inWarehouse.length > 0 || done.length > 0) && (
        <div>
          <div style={{
            fontSize:11, fontWeight:800, color:'#16a34a',
            textTransform:'uppercase', letterSpacing:.5, marginBottom:10,
          }}>
            ✅ Về kho & Hoàn thành ({inWarehouse.length + done.length})
          </div>
          {[...inWarehouse, ...done].map(o => {
            const wf = WF_LABEL[o.wfStatus] || { label: o.wfStatus, color:'#64748b' };
            return (
              <div key={o.id} className="ord-card" style={{ borderLeft:'4px solid #16a34a', opacity:.85 }}>
                <div className="ord-card-head">
                  <span className="ord-code">{o.code}</span>
                  <span className="ord-name">{o.name}</span>
                  <span style={{
                    fontSize:10, fontWeight:700, color:wf.color,
                    background:wf.color+'14', border:`1px solid ${wf.color}40`,
                    borderRadius:5, padding:'2px 8px',
                  }}>{wf.label}</span>
                  <span className="ord-amount">{fmt(o.grandTotal)}</span>
                </div>
                <div className="ord-meta">
                  <div className="ord-meta-item">
                    <div className="ord-meta-label">NCC</div>
                    <div className="ord-meta-val">{o.smgrNccName || '—'}</div>
                  </div>
                  <div className="ord-meta-item">
                    <div className="ord-meta-label">KD</div>
                    <div className="ord-meta-val">{o.emp}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty */}
      {pending.length === 0 && inProd.length === 0 && inWarehouse.length === 0 && done.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-text">Không có đơn hàng nào</div>
          <div className="empty-sub">KT phê duyệt đơn hàng sẽ xuất hiện ở đây</div>
        </div>
      )}
    </div>
  );
}
