import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore } from '../../store';
import { CHANNEL_CFG } from '../../utils/constants';
import { fmtDate } from '../../utils/helpers';
import {
  daysUntilBirthday,
  SALES_LIST, NGANH_LIST, CSKH_STATUSES,
} from '../cskh/helpers';
import { StatusBadge, TempBadge } from '../cskh/StatusBadge';
import EditLeadModal from '../cskh/EditLeadModal';
import CreateLeadModal from '../cskh/CreateLeadModal';
import LeadDetailPanel from '../cskh/LeadDetailPanel';

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
