import React, { useState, useMemo, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore, useUIStore } from '../../store';
import { TEMP_CFG, CONTACT_STATUSES, CHANNEL_CFG, OVERDUE_HOURS } from '../../utils/constants';
import { fmtDate, leadAgeHours, isLeadOverdue, fmtHours } from '../../utils/helpers';

/* ─────────────────────────────────────────────────────────────
   Trạng thái bắt buộc hiện popup nhập lý do
───────────────────────────────────────────────────────────── */
const NEED_NOTE_STATUSES = ['ko_lh', 'ko_nghe', 'ko_trien'];

const NOTE_PRESETS = {
  ko_lh: [
    'Số máy không liên lạc được',
    'Thuê bao không liên lạc được',
    'Số máy sai / không tồn tại',
    'Gọi nhiều lần không nghe',
    'Zalo không nhận',
    'Email không có phản hồi',
  ],
  ko_nghe: ['Máy bận', 'Không nghe — lần 1', 'Không nghe — lần 2', 'Số máy không đúng', 'Máy tắt'],
  ko_trien: ['Không có nhu cầu', 'Đã có nhà cung cấp', 'Ngân sách không phù hợp', 'Chưa có kế hoạch', 'Liên hệ lại sau'],
};

const STATUS_NOTE_LABEL = {
  ko_lh:    'Lý do không liên hệ được',
  ko_nghe:  'Lý do không nghe máy',
  ko_trien: 'Lý do không triển khai',
};

/* ═══════════════════════════════════════════════════════════════
   POPUP NHẬP LÝ DO
═══════════════════════════════════════════════════════════════ */
function ContactNotePopup({ leadName, status, prevNote, onSave, onSkip }) {
  const [note, setNote] = useState(prevNote || '');
  const taRef = useRef(null);

  const statusCfg = CONTACT_STATUSES.find(s => s.value === status);
  const presets   = NOTE_PRESETS[status] || [];
  const label     = STATUS_NOTE_LABEL[status] || 'Ghi lý do';
  const isKoLh    = status === 'ko_lh';
  const accentClr = isKoLh ? '#dc2626' : '#d97706';
  const headerBg  = isKoLh ? '#fef2f2' : '#fffbeb';

  useEffect(() => {
    setTimeout(() => taRef.current?.focus(), 80);
    const esc = (e) => { if (e.key === 'Escape') onSkip(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);

  /* Toggle preset: click lần 1 → thêm, click lần 2 → xoá */
  const togglePreset = (p) => {
    setNote(prev => {
      const lines = prev.trim() ? prev.trim().split('\n') : [];
      if (lines.includes(p)) {
        // Đã có → xoá đi
        return lines.filter(l => l !== p).join('\n');
      } else {
        // Chưa có → thêm vào
        return [...lines, p].join('\n');
      }
    });
    taRef.current?.focus();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(4px)',
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onSkip(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460,
        boxShadow: '0 32px 80px rgba(0,0,0,.25)',
        overflow: 'hidden',
        animation: 'modalIn .18s ease',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '18px 20px 14px',
          background: headerBg,
          borderBottom: `2px solid ${accentClr}20`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: accentClr, marginBottom: 4 }}>
              {isKoLh ? '🚫 Không liên hệ được' : '📝 Ghi lý do liên hệ'}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              Khách hàng: <strong style={{ color: '#111827' }}>{leadName}</strong>
              {statusCfg && (
                <span style={{ marginLeft: 6, fontWeight: 700, color: accentClr }}>
                  → {statusCfg.icon} {statusCfg.label}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onSkip}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 20, color: '#9ca3af', lineHeight: 1, padding: 0,
            }}
          >✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '18px 20px 14px' }}>

          {/* Gợi ý chọn nhanh */}
          {presets.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 7, textTransform: 'uppercase', letterSpacing: .5 }}>
                Chọn nhanh
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {presets.map(p => {
                  const selected = note.split('\n').map(l => l.trim()).includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePreset(p)}
                      style={{
                        padding: '5px 11px', fontSize: 11, fontWeight: 600,
                        borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
                        border: `1.5px solid ${selected ? accentClr : '#e5e7eb'}`,
                        background: selected ? (isKoLh ? '#fef2f2' : '#fffbeb') : '#f9fafb',
                        color: selected ? accentClr : '#6b7280',
                        transition: 'all .1s',
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Textarea nhập lý do */}
          <div>
            <label style={{
              fontSize: 11, fontWeight: 700, color: '#6b7280',
              display: 'block', marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: .5,
            }}>
              {label}
            </label>
            <textarea
              ref={taRef}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Nhập lý do cụ thể... (không bắt buộc)"
              rows={3}
              style={{
                width: '100%', resize: 'vertical',
                padding: '10px 13px', fontSize: 13,
                border: `1.5px solid #e5e7eb`, borderRadius: 9,
                fontFamily: 'inherit', outline: 'none',
                lineHeight: 1.6, transition: 'border-color .15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = accentClr}
              onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #f3f4f6',
          background: '#f9fafb',
          display: 'flex', gap: 8, justifyContent: 'flex-end',
        }}>
          <button
            onClick={onSkip}
            style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 600,
              background: 'transparent', border: '1.5px solid #e5e7eb',
              borderRadius: 8, cursor: 'pointer', color: '#6b7280', fontFamily: 'inherit',
            }}
          >
            Bỏ qua
          </button>
          <button
            onClick={() => onSave(note.trim())}
            style={{
              padding: '8px 20px', fontSize: 13, fontWeight: 700,
              background: accentClr, border: 'none',
              borderRadius: 8, cursor: 'pointer', color: '#fff', fontFamily: 'inherit',
              boxShadow: `0 2px 8px ${accentClr}40`,
            }}
          >
            💾 Lưu lý do
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STATUS BADGE (click để đổi)
═══════════════════════════════════════════════════════════════ */
function StatusBadge({ status, onClick }) {
  const cfg = CONTACT_STATUSES.find(s => s.value === status)
           || CONTACT_STATUSES[0];
  return (
    <button
      onClick={onClick}
      title="Click để đổi trạng thái"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 99, cursor: 'pointer',
        fontSize: 11, fontWeight: 700,
        color: cfg.color, background: cfg.bg,
        border: `1.5px solid ${cfg.color}55`,
        fontFamily: 'inherit', transition: 'opacity .1s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '.72'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <span>{cfg.icon}</span> {cfg.label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STATUS DROPDOWN (position fixed — không bị clip bởi overflow)
═══════════════════════════════════════════════════════════════ */
function StatusDropdown({ lead, top, left, onClose, onSelect }) {
  const ref = useRef(null);

  useEffect(() => {
    // Đợi 1 tick để tránh mousedown mở đóng ngay
    const tid = setTimeout(() => {
      const fn = (e) => {
        if (ref.current && !ref.current.contains(e.target)) onClose();
      };
      document.addEventListener('mousedown', fn);
      // cleanup
      ref.current._cleanup = () => document.removeEventListener('mousedown', fn);
    }, 0);
    return () => {
      clearTimeout(tid);
      ref.current?._cleanup?.();
    };
  }, []);

  const safeLeft = Math.min(left, window.innerWidth - 230);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', top, left: safeLeft,
        zIndex: 800,
        background: '#fff', borderRadius: 10,
        boxShadow: '0 8px 30px rgba(0,0,0,.18)',
        border: '1px solid #e5e7eb',
        padding: 5, minWidth: 218,
      }}
    >
      {CONTACT_STATUSES.map(s => {
        const active = (lead.contactStatus || 'chua_lh') === s.value;
        return (
          <button
            key={s.value}
            onClick={() => onSelect(s.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              width: '100%', textAlign: 'left',
              padding: '8px 10px', borderRadius: 7, border: 'none',
              background: active ? s.bg : 'transparent',
              color: active ? s.color : '#374151',
              fontWeight: active ? 700 : 500,
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f9fafb'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ width: 18, textAlign: 'center', fontSize: 13 }}>{s.icon}</span>
            <span style={{ flex: 1 }}>{s.label}</span>
            {active && <span style={{ fontSize: 11, color: s.color }}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN — LeadsView
═══════════════════════════════════════════════════════════════ */
export default function LeadsView() {
  const user       = useAuthStore(s => s.user);
  const leads      = useDataStore(s => s.leads);
  const updateLead = useDataStore(s => s.updateLead);
  const openModal  = useUIStore(s => s.openModal);

  const [q, setQ]               = useState('');
  const [tempF, setTempF]       = useState('all');
  const [statF, setStatF]       = useState('all');
  const [notePopup, setNotePopup]         = useState(null); // { leadId, leadName, status, prevNote }
  const [dropdown, setDropdown]           = useState(null); // { leadId, top, left }

  /* ── Lọc danh sách lead của nhân viên đang đăng nhập ── */
  const myLeads = useMemo(() => leads.filter(l => {
    const isMe  = !l.assignedTo || l.assignedTo === user?.name;
    const matchQ = !q
      || l.name?.toLowerCase().includes(q.toLowerCase())
      || l.phone?.includes(q)
      || l.product?.toLowerCase().includes(q.toLowerCase());
    const matchT = tempF === 'all' || l.temp === tempF;
    const matchS = statF === 'all' || l.contactStatus === statF;
    return isMe && matchQ && matchT && matchS;
  }), [leads, user, q, tempF, statF]);

  const kpis = useMemo(() => ({
    total:     myLeads.length,
    hot:       myLeads.filter(l => l.temp === 'hot').length,
    contacted: myLeads.filter(l => l.contactStatus === 'da_lh').length,
    converted: myLeads.filter(l => l.contactStatus === 'da_chuyen').length,
    ko_lh:     myLeads.filter(l => l.contactStatus === 'ko_lh').length,
    overdue:   myLeads.filter(l => isLeadOverdue(l, OVERDUE_HOURS)).length,
  }), [myLeads]);

  /* ── Chọn trạng thái mới ── */
  const handleStatusSelect = (lead, newStatus) => {
    setDropdown(null); // đóng dropdown trước
    if (NEED_NOTE_STATUSES.includes(newStatus)) {
      // Mở popup nhập lý do
      setNotePopup({
        leadId:   lead.id,
        leadName: lead.name,
        status:   newStatus,
        prevNote: lead.contactNote || '',
      });
    } else {
      updateLead(lead.id, { contactStatus: newStatus, contactNote: '' });
      toast.success('Đã cập nhật trạng thái');
    }
  };

  /* ── Lưu lý do từ popup ── */
  const handleSaveNote = (note) => {
    const { leadId, status } = notePopup;
    updateLead(leadId, { contactStatus: status, contactNote: note });
    toast.success(note ? '📝 Đã lưu lý do' : '✅ Đã cập nhật trạng thái');
    setNotePopup(null);
  };

  /* ── Bỏ qua popup — vẫn cập nhật trạng thái ── */
  const handleSkipNote = () => {
    const { leadId, status } = notePopup;
    updateLead(leadId, { contactStatus: status, contactNote: '' });
    toast('Đã cập nhật trạng thái', { icon: '📌' });
    setNotePopup(null);
  };

  /* ── Chuyển lead thành cơ hội — mở modal AddOpp với dữ liệu từ lead ── */
  const handleConvert = (lead) => {
    if (lead.contactStatus === 'da_chuyen') { toast.error('Lead này đã được chuyển'); return; }
    openModal('addOpp', {
      fromLead:    true,
      leadId:      lead.id,
      khachHang:   lead.name,
      soDienThoai: lead.phone,
      chandung:    lead.chandung || [],
      thongtin:    lead.note || '',
      area:        lead.area || '',
    });
  };

  /* ── Badge kênh ── */
  const renderChannel = (ch) => {
    if (!ch) return <span style={{ color: '#d1d5db' }}>—</span>;
    const cfg = CHANNEL_CFG[ch] || { label: ch, icon: '📌', color: '#64748b', bg: '#f8fafc' };
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        padding: '3px 9px', borderRadius: 99,
        fontSize: 11, fontWeight: 600,
        color: cfg.color, background: cfg.bg,
        border: `1px solid ${cfg.color}30`, whiteSpace: 'nowrap',
      }}>
        {cfg.icon} {cfg.label}
      </span>
    );
  };

  /* ── Badge nhiệt độ ── */
  const renderTemp = (t) => {
    const cfg = TEMP_CFG[t || 'warm'];
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        padding: '3px 9px', borderRadius: 99,
        fontSize: 11, fontWeight: 700,
        color: cfg.color, background: cfg.bg,
        border: `1px solid ${cfg.color}30`, whiteSpace: 'nowrap',
      }}>
        {cfg.icon} {cfg.label}
      </span>
    );
  };

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <div>

      {/* ── POPUP LÝ DO (hiện khi cần) ──────────────────── */}
      {notePopup && (
        <ContactNotePopup
          leadName={notePopup.leadName}
          status={notePopup.status}
          prevNote={notePopup.prevNote}
          onSave={handleSaveNote}
          onSkip={handleSkipNote}
        />
      )}

      {/* ── KPI ──────────────────────────────────────────── */}
      <div className="kpi-strip">
        <div className="kpi-card">
          <div className="kpi-lbl">Tổng lead</div>
          <div className="kpi-val">{kpis.total}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#dc2626' }}>
          <div className="kpi-lbl">🔥 Hot</div>
          <div className="kpi-val" style={{ color: '#dc2626' }}>{kpis.hot}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#2563eb' }}>
          <div className="kpi-lbl">Đã liên hệ</div>
          <div className="kpi-val" style={{ color: '#2563eb' }}>{kpis.contacted}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#16a34a' }}>
          <div className="kpi-lbl">Đã chuyển CH</div>
          <div className="kpi-val" style={{ color: '#16a34a' }}>{kpis.converted}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#dc2626' }}>
          <div className="kpi-lbl">🚫 Không LH được</div>
          <div className="kpi-val" style={{ color: '#dc2626' }}>{kpis.ko_lh}</div>
        </div>
        <div className="kpi-card" style={{
          borderTopColor: '#f59e0b',
          background: kpis.overdue > 0 ? '#fffbeb' : undefined,
        }}>
          <div className="kpi-lbl">⏰ Quá hạn LH</div>
          <div className="kpi-val" style={{ color: kpis.overdue > 0 ? '#d97706' : '#94a3b8' }}>
            {kpis.overdue}
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ──────────────────────────────────────── */}
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="🔍 Tìm tên, SĐT, sản phẩm..."
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
          {CONTACT_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
          ))}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => openModal('addLead')}>
          + Thêm lead
        </button>
      </div>

      {/* ── BẢNG LEAD ────────────────────────────────────── */}
      {myLeads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-text">Không có lead nào</div>
          <div className="empty-sub">Thêm lead mới hoặc điều chỉnh bộ lọc</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{
            background: '#fff', borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 4px rgba(0,0,0,.06)',
            minWidth: 980,
          }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '36px 1.6fr 112px 105px 150px 112px 100px 88px 178px 90px 130px',
              padding: '10px 16px', gap: 8,
              background: '#f9fafb',
              borderRadius: '12px 12px 0 0',
              borderBottom: '1px solid #e5e7eb',
              fontSize: 11, fontWeight: 700, color: '#6b7280',
              textTransform: 'uppercase', letterSpacing: .4,
            }}>
              <div>#</div>
              <div>Khách hàng</div>
              <div>SĐT</div>
              <div>Nhân viên</div>
              <div>Sản phẩm</div>
              <div>Kênh</div>
              <div>Khu vực</div>
              <div>Nhiệt độ</div>
              <div>Trạng thái LH</div>
              <div>Ngày tạo</div>
              <div>Hành động</div>
            </div>

            {/* Rows — overdue lên đầu */}
            {[...myLeads]
              .sort((a, b) => {
                const aOd = isLeadOverdue(a, OVERDUE_HOURS) ? 0 : 1;
                const bOd = isLeadOverdue(b, OVERDUE_HOURS) ? 0 : 1;
                return aOd - bOd;
              })
              .map((lead, idx, arr) => {
              const hasNote  = !!(lead.contactNote && NEED_NOTE_STATUSES.includes(lead.contactStatus));
              const isLast   = idx === arr.length - 1;
              const isOpen   = dropdown?.leadId === lead.id;
              const overdue  = isLeadOverdue(lead, OVERDUE_HOURS);
              const ageH     = overdue ? leadAgeHours(lead) : 0;

              return (
                <div
                  key={lead.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 1.6fr 112px 105px 150px 112px 100px 88px 178px 90px 130px',
                    padding: '11px 16px', gap: 8,
                    alignItems: 'center',
                    borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
                    borderRadius: isLast ? '0 0 12px 12px' : 0,
                    borderLeft: overdue ? '3px solid #f59e0b' : '3px solid transparent',
                    background: overdue ? '#fffdf0' : 'transparent',
                    transition: 'background .1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = overdue ? '#fff8d6' : '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = overdue ? '#fffdf0' : 'transparent'}
                >
                  {/* # */}
                  <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>{idx + 1}</div>

                  {/* Khách hàng */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.name}
                    </div>
                    {lead.email && (
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        ✉ {lead.email}
                      </div>
                    )}
                    {/* Badge quá hạn */}
                    {overdue && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        marginTop: 3, padding: '2px 7px',
                        background: '#fef3c7', border: '1px solid #fbbf24',
                        borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#b45309',
                      }}>
                        ⏰ Quá hạn {fmtHours(ageH)} chưa liên hệ
                      </div>
                    )}
                    {/* Lý do (nếu đã nhập) */}
                    {hasNote && (
                      <div
                        title={lead.contactNote}
                        style={{
                          marginTop: 4, fontSize: 10, color: '#92400e',
                          background: '#fffbeb', border: '1px solid #fde68a',
                          borderRadius: 4, padding: '2px 7px',
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          maxWidth: '100%',
                        }}
                      >
                        📝
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
                          {lead.contactNote}
                        </span>
                        <button
                          title="Sửa lý do"
                          onClick={() => setNotePopup({ leadId: lead.id, leadName: lead.name, status: lead.contactStatus, prevNote: lead.contactNote })}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d97706', fontSize: 10, padding: 0, fontFamily: 'inherit' }}
                        >✏️</button>
                      </div>
                    )}
                  </div>

                  {/* SĐT */}
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', whiteSpace: 'nowrap' }}>
                    {lead.phone || '—'}
                  </div>

                  {/* Nhân viên */}
                  <div style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.assignedTo || lead.createdBy || '—'}
                  </div>

                  {/* Sản phẩm */}
                  <div style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lead.product}>
                    {lead.product || <span style={{ color: '#d1d5db' }}>—</span>}
                  </div>

                  {/* Kênh */}
                  <div>{renderChannel(lead.channel)}</div>

                  {/* Khu vực */}
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {lead.area ? `📍 ${lead.area}` : <span style={{ color: '#d1d5db' }}>—</span>}
                  </div>

                  {/* Nhiệt độ */}
                  <div>{renderTemp(lead.temp)}</div>

                  {/* Trạng thái LH */}
                  <div>
                    <StatusBadge
                      status={lead.contactStatus || 'chua_lh'}
                      onClick={e => {
                        if (isOpen) {
                          setDropdown(null);
                        } else {
                          const r = e.currentTarget.getBoundingClientRect();
                          setDropdown({ leadId: lead.id, top: r.bottom + 4, left: r.left });
                        }
                      }}
                    />
                    {isOpen && (
                      <StatusDropdown
                        lead={lead}
                        top={dropdown.top}
                        left={dropdown.left}
                        onClose={() => setDropdown(null)}
                        onSelect={newStatus => handleStatusSelect(lead, newStatus)}
                      />
                    )}
                  </div>

                  {/* Ngày tạo */}
                  <div style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {lead.createdAt ? fmtDate(lead.createdAt) : '—'}
                  </div>

                  {/* Hành động */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {/* Tạo cơ hội / badge đã chuyển */}
                    {lead.contactStatus === 'da_chuyen' ? (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: '#16a34a',
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap',
                        textAlign: 'center',
                      }}>✅ Đã CH</span>
                    ) : (
                      <button
                        onClick={() => handleConvert(lead)}
                        style={{
                          fontSize: 11, fontWeight: 700, color: '#fff',
                          background: 'linear-gradient(135deg,#E8380D,#c42d09)',
                          border: 'none', borderRadius: 7,
                          padding: '5px 8px', cursor: 'pointer',
                          fontFamily: 'inherit', whiteSpace: 'nowrap',
                          boxShadow: '0 2px 6px rgba(232,56,13,.28)',
                        }}
                      >
                        💡 Tạo CH
                      </button>
                    )}
                    {/* Tạo đơn trực tiếp */}
                    <button
                      onClick={() => openModal('addOrder', {
                        name:  lead.name  || '',
                        phone: lead.phone || '',
                      })}
                      style={{
                        fontSize: 11, fontWeight: 700, color: '#fff',
                        background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                        border: 'none', borderRadius: 7,
                        padding: '5px 8px', cursor: 'pointer',
                        fontFamily: 'inherit', whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(37,99,235,.28)',
                      }}
                    >
                      📋 Tạo đơn
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {myLeads.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#9ca3af', textAlign: 'right' }}>
          {myLeads.length} lead
        </div>
      )}
    </div>
  );
}
