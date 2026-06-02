import React, { useState, useMemo, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore, useUIStore } from '../../store';
import { TEMP_CFG, CONTACT_STATUSES, CHANNEL_CFG, OVERDUE_HOURS } from '../../utils/constants';
import { fmtDate, leadAgeHours, isLeadOverdue, fmtHours } from '../../utils/helpers';
import ContactNotePopup from './ContactNotePopup';
import { NEED_NOTE_STATUSES } from './ContactNotePopup';
import LeadDetailPopup from './LeadDetailPopup';
import { StatusBadge, StatusDropdown } from './LeadStatusBadge';

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
  const [notePopup, setNotePopup]   = useState(null); // { leadId, leadName, status, prevNote }
  const [dropdown, setDropdown]     = useState(null); // { leadId, top, left }
  const [detailLead, setDetailLead] = useState(null); // lead object để xem chi tiết

  /* ── Phân quyền: admin / isLeader xem tất cả leads ── */
  const canSeeAll = user?.role === 'admin' || user?.isLeader === true;

  /* ── Lọc danh sách lead ── */
  const myLeads = useMemo(() => leads.filter(l => {
    const isVisible = canSeeAll || !l.assignedTo || l.assignedTo === user?.name;
    const matchQ = !q
      || l.name?.toLowerCase().includes(q.toLowerCase())
      || l.phone?.includes(q)
      || l.product?.toLowerCase().includes(q.toLowerCase());
    const matchT = tempF === 'all' || l.temp === tempF;
    const matchS = statF === 'all' || l.contactStatus === statF;
    return isVisible && matchQ && matchT && matchS;
  }), [leads, user, canSeeAll, q, tempF, statF]);

  const kpis = useMemo(() => ({
    total:     myLeads.length,
    hot:       myLeads.filter(l => l.temp === 'hot').length,
    contacted: myLeads.filter(l => l.contactStatus === 'da_lh').length,
    converted: myLeads.filter(l => l.contactStatus === 'da_chuyen').length,
    ko_lh:     myLeads.filter(l => l.contactStatus === 'ko_lh').length,
    overdue:   myLeads.filter(l => isLeadOverdue(l, OVERDUE_HOURS)).length,
  }), [myLeads]);

  /* ── Grid columns — ẩn "NV phụ trách" nếu không có quyền ── */
  const gridCols = canSeeAll
    ? '36px 1.6fr 112px 105px 150px 112px 100px 88px 178px 90px 130px'
    : '36px 1.6fr 112px 150px 112px 100px 88px 178px 90px 130px';

  /* ── Chọn trạng thái mới ── */
  const handleStatusSelect = (lead, newStatus) => {
    setDropdown(null);
    if (NEED_NOTE_STATUSES.includes(newStatus)) {
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

  const handleSaveNote = (note) => {
    const { leadId, status } = notePopup;
    updateLead(leadId, { contactStatus: status, contactNote: note });
    toast.success(note ? '📝 Đã lưu lý do' : '✅ Đã cập nhật trạng thái');
    setNotePopup(null);
  };

  const handleSkipNote = () => {
    const { leadId, status } = notePopup;
    updateLead(leadId, { contactStatus: status, contactNote: '' });
    toast('Đã cập nhật trạng thái', { icon: '📌' });
    setNotePopup(null);
  };

  /* ── Tạo cơ hội từ lead ── */
  const handleCreateOpp = (lead) => {
    if (lead.contactStatus === 'da_chuyen') { toast.error('Lead này đã được chuyển'); return; }
    setDetailLead(null);
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

  /* ── Tạo đơn từ lead ── */
  const handleCreateOrder = (lead) => {
    setDetailLead(null);
    openModal('addOrder', {
      name:  lead.name  || '',
      phone: lead.phone || '',
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

      {/* ── POPUP LÝ DO ──────────────────────────────────────── */}
      {notePopup && (
        <ContactNotePopup
          leadName={notePopup.leadName}
          status={notePopup.status}
          prevNote={notePopup.prevNote}
          onSave={handleSaveNote}
          onSkip={handleSkipNote}
        />
      )}

      {/* ── DETAIL POPUP ──────────────────────────────────────── */}
      {detailLead && (
        <LeadDetailPopup
          lead={detailLead}
          onClose={() => setDetailLead(null)}
          onCreateOpp={() => handleCreateOpp(detailLead)}
          onCreateOrder={() => handleCreateOrder(detailLead)}
        />
      )}

      {/* ── KPI ──────────────────────────────────────────────── */}
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

      {/* ── TOOLBAR ──────────────────────────────────────────── */}
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

      {/* ── BẢNG LEAD ────────────────────────────────────────── */}
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
            minWidth: canSeeAll ? 980 : 880,
          }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: gridCols,
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
              {canSeeAll && <div>Nhân viên</div>}
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
              const hasNote = !!(lead.contactNote && NEED_NOTE_STATUSES.includes(lead.contactStatus));
              const isLast  = idx === arr.length - 1;
              const isOpen  = dropdown?.leadId === lead.id;
              const overdue = isLeadOverdue(lead, OVERDUE_HOURS);
              const ageH    = overdue ? leadAgeHours(lead) : 0;

              return (
                <div
                  key={lead.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: gridCols,
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

                  {/* Nhân viên — chỉ hiện với canSeeAll */}
                  {canSeeAll && (
                    <div style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.assignedTo || lead.createdBy || '—'}
                    </div>
                  )}

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
                    <button
                      onClick={() => setDetailLead(lead)}
                      style={{
                        fontSize: 11, fontWeight: 700, color: '#374151',
                        background: '#f3f4f6',
                        border: '1px solid #e5e7eb', borderRadius: 7,
                        padding: '5px 8px', cursor: 'pointer',
                        fontFamily: 'inherit', whiteSpace: 'nowrap',
                      }}
                    >
                      👁 Chi tiết
                    </button>
                    {lead.contactStatus === 'da_chuyen' ? (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: '#16a34a',
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap',
                        textAlign: 'center',
                      }}>✅ Đã CH</span>
                    ) : (
                      <button
                        onClick={() => handleCreateOpp(lead)}
                        style={{
                          fontSize: 11, fontWeight: 700, color: '#fff',
                          background: 'linear-gradient(135deg,#E8380D,#c42d09)',
                          border: 'none', borderRadius: 7,
                          padding: '5px 8px', cursor: 'pointer',
                          fontFamily: 'inherit', whiteSpace: 'nowrap',
                          boxShadow: '0 2px 6px rgba(232,56,13,.28)',
                        }}
                      >
                        🎯 Tạo cơ hội
                      </button>
                    )}
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
          {canSeeAll && (
            <span style={{ marginLeft: 6, color: '#d97706', fontWeight: 600 }}>· Chế độ xem toàn bộ</span>
          )}
        </div>
      )}
    </div>
  );
}
