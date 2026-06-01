import React, { useState, useMemo } from 'react';
import { useDataStore, useUIStore } from '../../store';
import { fmtDate } from '../../utils/helpers';

/* ── Badge nhỏ ── */
function CountBadge({ count, color = '#6b7280', bg = '#f3f4f6', label }) {
  if (!count) return <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      color, background: bg, border: `1px solid ${color}30`,
    }}>
      {count} {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN — MyCustView
═══════════════════════════════════════════════════════════════ */
export default function MyCustView() {
  const businesses = useDataStore(s => s.businesses);
  const leads      = useDataStore(s => s.leads);
  const opps       = useDataStore(s => s.opps);
  const setTab     = useUIStore(s => s.setTab);

  const [q, setQ] = useState('');

  /* ── Đếm leads & opps theo business ── */
  const leadsByBiz = useMemo(() => {
    const map = {};
    leads.forEach(l => {
      if (l.businessId) map[l.businessId] = (map[l.businessId] || 0) + 1;
    });
    return map;
  }, [leads]);

  const oppsByBiz = useMemo(() => {
    const map = {};
    opps.forEach(o => {
      if (o.businessId) map[o.businessId] = (map[o.businessId] || 0) + 1;
    });
    return map;
  }, [opps]);

  /* ── Lọc tìm kiếm ── */
  const filtered = useMemo(() => businesses.filter(b => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      b.name?.toLowerCase().includes(s)  ||
      b.phone?.includes(s)               ||
      b.email?.toLowerCase().includes(s) ||
      b.industry?.toLowerCase().includes(s)
    );
  }), [businesses, q]);

  /* ── KPI ── */
  const now      = new Date();
  const thisMonth= businesses.filter(b => {
    const d = new Date(b.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const withOpps = businesses.filter(b => (oppsByBiz[b.id] || 0) > 0).length;

  /* ── Empty ── */
  if (businesses.length === 0) {
    return (
      <div>
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-icon">🤝</div>
          <div className="empty-text">Chưa có khách hàng nào</div>
          <div className="empty-sub">
            Khách hàng được tạo tự động khi bạn chuyển Lead thành Cơ hội
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 18 }}
            onClick={() => setTab('leads')}
          >
            👥 Đến danh sách Lead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── KPI ─────────────────────────────────────────────── */}
      <div className="kpi-strip">
        <div className="kpi-card">
          <div className="kpi-lbl">Tổng khách hàng</div>
          <div className="kpi-val">{businesses.length}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#2563eb' }}>
          <div className="kpi-lbl">🆕 Mới tháng này</div>
          <div className="kpi-val" style={{ color: '#2563eb' }}>{thisMonth}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#16a34a' }}>
          <div className="kpi-lbl">⚡ Có cơ hội</div>
          <div className="kpi-val" style={{ color: '#16a34a' }}>{withOpps}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#7c3aed' }}>
          <div className="kpi-lbl">📋 Tổng cơ hội</div>
          <div className="kpi-val" style={{ color: '#7c3aed' }}>{opps.length}</div>
        </div>
      </div>

      {/* ── TOOLBAR ─────────────────────────────────────────── */}
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="🔍 Tìm tên, SĐT, email, ngành nghề..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <div style={{
          fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 12px', background: '#f0fdf4', borderRadius: 8,
          border: '1px solid #bbf7d0', fontWeight: 600, color: '#15803d',
        }}>
          💡 Khách hàng được tạo tự động khi chuyển Lead → Cơ hội
        </div>
      </div>

      {/* ── BẢNG KHÁCH HÀNG ─────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-text">Không tìm thấy khách hàng</div>
          <div className="empty-sub">Thử từ khoá khác</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{
            background: '#fff', borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 4px rgba(0,0,0,.06)',
            minWidth: 860,
          }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '36px 2fr 130px 180px 120px 90px 90px 110px',
              padding: '10px 16px', gap: 8,
              background: '#f9fafb',
              borderRadius: '12px 12px 0 0',
              borderBottom: '1px solid #e5e7eb',
              fontSize: 11, fontWeight: 700, color: '#6b7280',
              textTransform: 'uppercase', letterSpacing: .4,
            }}>
              <div>#</div>
              <div>Tên khách hàng</div>
              <div>SĐT</div>
              <div>Email</div>
              <div>Ngành nghề</div>
              <div>Lead</div>
              <div>Cơ hội</div>
              <div>Ngày tạo</div>
            </div>

            {/* Rows */}
            {filtered.map((biz, idx) => {
              const isLast    = idx === filtered.length - 1;
              const leadCount = leadsByBiz[biz.id] || 0;
              const oppCount  = oppsByBiz[biz.id]  || 0;

              return (
                <div
                  key={biz.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 2fr 130px 180px 120px 90px 90px 110px',
                    padding: '12px 16px', gap: 8,
                    alignItems: 'center',
                    borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
                    borderRadius: isLast ? '0 0 12px 12px' : 0,
                    transition: 'background .1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* # */}
                  <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>{idx + 1}</div>

                  {/* Tên */}
                  <div>
                    <div style={{
                      fontWeight: 700, fontSize: 13, color: '#111827',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      🏢 {biz.name}
                    </div>
                    {biz.note && (
                      <div style={{
                        fontSize: 11, color: '#6b7280', marginTop: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {biz.note}
                      </div>
                    )}
                    {biz.createdBy && (
                      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
                        KD: {biz.createdBy}
                      </div>
                    )}
                  </div>

                  {/* SĐT */}
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', whiteSpace: 'nowrap' }}>
                    {biz.phone || <span style={{ color: '#d1d5db' }}>—</span>}
                  </div>

                  {/* Email */}
                  <div style={{
                    fontSize: 12, color: '#374151',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {biz.email ? (
                      <a href={`mailto:${biz.email}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                        ✉ {biz.email}
                      </a>
                    ) : <span style={{ color: '#d1d5db' }}>—</span>}
                  </div>

                  {/* Ngành nghề */}
                  <div style={{
                    fontSize: 12, color: '#374151',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {biz.industry || <span style={{ color: '#d1d5db' }}>—</span>}
                  </div>

                  {/* Số lead */}
                  <div>
                    <CountBadge count={leadCount} color="#7c3aed" bg="#f5f3ff" label="lead" />
                  </div>

                  {/* Số cơ hội */}
                  <div>
                    <CountBadge count={oppCount} color="#E8380D" bg="#fff5f3" label="CH" />
                  </div>

                  {/* Ngày tạo */}
                  <div style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {biz.createdAt ? fmtDate(biz.createdAt) : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#9ca3af', textAlign: 'right' }}>
          {filtered.length} khách hàng
        </div>
      )}
    </div>
  );
}
