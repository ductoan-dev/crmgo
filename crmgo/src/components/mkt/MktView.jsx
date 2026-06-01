import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore, useUIStore } from '../../store';
import {
  TEMP_CFG, CHANNEL_CFG, CONTACT_STATUSES, DEMO_ACCOUNTS, CUSTOMER_PROFILES,
} from '../../utils/constants';
import MktDataView from './MktDataView';

const SALES_USERS = DEMO_ACCOUNTS.filter(u => u.role === 'sales');

// ── Router — không có hooks ở đây ────────────────────────────
export default function MktView() {
  const activeTab = useUIStore(s => s.activeTab);
  if (activeTab === 'data')   return <MktDataView />;
  if (activeTab === 'report') return <MktReportView />;
  return <MktLeadsView />;
}

// ── Tab Leads ─────────────────────────────────────────────────
function MktLeadsView() {
  const user         = useAuthStore(s => s.user);
  const leads        = useDataStore(s => s.leads);
  const transferLead = useDataStore(s => s.transferLead);
  const openModal    = useUIStore(s => s.openModal);

  const [q, setQ]             = useState('');
  const [tempF, setTempF]     = useState('all');
  const [statusF, setStatusF] = useState('all');
  const [expanded, setExpanded]           = useState(null);
  const [transferPopup, setTransferPopup] = useState(null);
  const [selectedKD, setSelectedKD]       = useState('');

  const myLeads = useMemo(() => {
    return leads
      .filter(l =>
        l.createdBy  === user?.name ||
        l.emp        === user?.name ||
        l.assignedTo === user?.name ||
        !l.assignedTo
      )
      .filter(l => {
        const matchQ = !q
          || (l.name    || '').toLowerCase().includes(q.toLowerCase())
          || (l.phone   || '').includes(q)
          || (l.company || '').toLowerCase().includes(q.toLowerCase());
        const matchT = tempF   === 'all' || l.temp === tempF;
        const matchS = statusF === 'all' || l.contactStatus === statusF;
        return matchQ && matchT && matchS;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [leads, user, q, tempF, statusF]);

  const kpis = useMemo(() => ({
    total:     myLeads.length,
    hot:       myLeads.filter(l => l.temp === 'hot').length,
    da_lh:     myLeads.filter(l => ['da_lh', 'dat_hen'].includes(l.contactStatus)).length,
    da_chuyen: myLeads.filter(l =>
      l.transferredTo || (l.assignedTo && l.assignedTo !== user?.name)
    ).length,
  }), [myLeads, user]);

  const handleTransfer = async () => {
    if (!selectedKD) { toast.error('Vui lòng chọn nhân viên KD'); return; }
    const kd = SALES_USERS.find(u => u.username === selectedKD);
    if (!kd) return;
    try {
      await transferLead(transferPopup.leadId, kd);
      toast.success(`Đã chuyển "${transferPopup.leadName}" cho ${kd.name}`);
      setTransferPopup(null);
      setSelectedKD('');
    } catch (e) {
      toast.error(`Lỗi: ${e.message || 'Không thể chuyển lead'}`);
    }
  };

  const renderChannel = (ch, customChannel) => {
    if (!ch) return <span style={{ color: '#d1d5db' }}>—</span>;
    if (ch === 'other' && customChannel) {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
          color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0',
        }}>
          📌 {customChannel}
        </span>
      );
    }
    const cfg = CHANNEL_CFG[ch] || { label: ch, icon: '📌', color: '#64748b', bg: '#f8fafc' };
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
        color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30`,
      }}>
        {cfg.icon} {cfg.label}
      </span>
    );
  };

  const renderTemp = (t) => {
    const cfg = TEMP_CFG[t || 'warm'];
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
        color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30`,
      }}>
        {cfg.icon} {cfg.label}
      </span>
    );
  };

  const renderStatus = (s) => {
    const cfg = CONTACT_STATUSES.find(x => x.value === s) || CONTACT_STATUSES[0];
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
        color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30`,
      }}>
        {cfg.icon} {cfg.label}
      </span>
    );
  };

  return (
    <div>
      {/* KPI */}
      <div className="kpi-strip">
        <div className="kpi-card" style={{ borderTopColor: '#7c3aed' }}>
          <div className="kpi-lbl">📣 Tổng lead</div>
          <div className="kpi-val" style={{ color: '#7c3aed' }}>{kpis.total}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#dc2626' }}>
          <div className="kpi-lbl">🔥 Hot</div>
          <div className="kpi-val" style={{ color: '#dc2626' }}>{kpis.hot}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#2563eb' }}>
          <div className="kpi-lbl">✓ Đã liên hệ</div>
          <div className="kpi-val" style={{ color: '#2563eb' }}>{kpis.da_lh}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#16a34a' }}>
          <div className="kpi-lbl">→ Đã chuyển KD</div>
          <div className="kpi-val" style={{ color: '#16a34a' }}>{kpis.da_chuyen}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Tìm tên, SĐT, công ty..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select className="fi" style={{ width: 'auto' }} value={tempF} onChange={e => setTempF(e.target.value)}>
          <option value="all">🌡️ Nhiệt độ</option>
          <option value="hot">🔥 Hot</option>
          <option value="warm">⚡ Warm</option>
          <option value="cold">❄️ Cold</option>
        </select>
        <select className="fi" style={{ width: 'auto' }} value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="all">🔄 Trạng thái</option>
          {CONTACT_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => openModal('addLead')}>
          + Thêm Lead
        </button>
      </div>

      {/* Table */}
      {myLeads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📣</div>
          <div className="empty-text">Chưa có lead nào</div>
          <div className="empty-sub">Nhấn "+ Thêm Lead" để nhập khách hàng tiềm năng</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th>Nguồn / Kênh</th>
                <th>Khu vực</th>
                <th>Nhiệt độ</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {myLeads.map((l, idx) => {
                const isTransferred = !!(l.transferredTo || (l.assignedTo && l.assignedTo !== user?.name));
                const kdName = l.transferredTo || (isTransferred ? l.assignedTo : null);
                const isExp  = expanded === l.id;
                return (
                  <React.Fragment key={l.id}>
                    <tr style={{ background: isTransferred ? '#f0fdf4' : undefined }}>
                      <td style={{ color: 'var(--muted)', fontSize: 11 }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{l.name}</div>
                        {l.company && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{l.company}</div>}
                        {l.email   && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{l.email}</div>}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{l.phone || '—'}</td>
                      <td>{renderChannel(l.channel, l.customChannel)}</td>
                      <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                        {l.area ? `📍 ${l.area}` : '—'}
                      </td>
                      <td>{renderTemp(l.temp)}</td>
                      <td>
                        {isTransferred ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 10px', borderRadius: 99,
                            fontSize: 11, fontWeight: 700,
                            color: '#15803d', background: '#dcfce7',
                            border: '1px solid #86efac',
                          }}>
                            ✅ Đã chuyển KD
                          </span>
                        ) : renderStatus(l.contactStatus)}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {l.createdAt ? new Date(l.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'nowrap' }}>
                          {(l.note || l.chandung?.length > 0) && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setExpanded(isExp ? null : l.id)}
                              title="Xem yêu cầu"
                            >
                              {isExp ? '▲' : '📋'}
                            </button>
                          )}
                          {isTransferred ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                              <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>KD tiếp nhận:</span>
                              <span style={{ fontSize: 12, fontWeight: 800, color: '#15803d', whiteSpace: 'nowrap' }}>
                                {kdName}
                              </span>
                            </div>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ whiteSpace: 'nowrap' }}
                              onClick={() => { setTransferPopup({ leadId: l.id, leadName: l.name }); setSelectedKD(''); }}
                            >
                              → Chuyển KD
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isExp && (
                      <tr>
                        <td colSpan={9} style={{ padding: '0 16px 12px', background: '#fafafa' }}>
                          <div style={{
                            padding: '12px 16px', background: '#fffbeb',
                            borderRadius: 8, border: '1px solid #fde68a',
                          }}>
                            {l.note && (
                              <>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 5 }}>
                                  📋 Yêu cầu / Ghi chú từ khách
                                </div>
                                <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.7, marginBottom: 8 }}>
                                  {l.note}
                                </div>
                              </>
                            )}
                            {l.chandung?.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e' }}>🎯 Chân dung:</span>
                                {l.chandung.map(v => {
                                  const p = CUSTOMER_PROFILES.find(x => x.value === v);
                                  return p ? (
                                    <span key={v} style={{
                                      fontSize: 11, padding: '2px 10px', borderRadius: 99,
                                      background: '#eff6ff', color: '#2563eb',
                                      border: '1px solid #bfdbfe', fontWeight: 600,
                                    }}>
                                      {p.icon} {p.label}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Popup chọn KD */}
      {transferPopup && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28,
            width: 390, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
              → Chuyển cho Kinh Doanh tư vấn
            </div>
            <div style={{
              fontSize: 12, color: 'var(--muted)', marginBottom: 20,
              paddingBottom: 14, borderBottom: '1px solid #f1f5f9',
            }}>
              Lead: <strong style={{ color: '#1e293b' }}>{transferPopup.leadName}</strong>
            </div>
            <label className="fi-label">Nhân viên KD tiếp nhận <span style={{ color: 'red' }}>*</span></label>
            <select
              className="fi" value={selectedKD}
              onChange={e => setSelectedKD(e.target.value)}
              style={{ marginBottom: 14 }}
            >
              <option value="">-- Chọn KD --</option>
              {SALES_USERS.map(u => (
                <option key={u.username} value={u.username}>{u.name}</option>
              ))}
            </select>
            <div style={{
              fontSize: 12, color: '#64748b', marginBottom: 20, lineHeight: 1.5,
              padding: '8px 12px', background: '#f8fafc', borderRadius: 8,
            }}>
              Lead sẽ xuất hiện trong danh sách của KD được chọn để tư vấn và tạo cơ hội.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => { setTransferPopup(null); setSelectedKD(''); }}>Huỷ</button>
              <button className="btn btn-primary" onClick={handleTransfer}>✅ Xác nhận chuyển</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab Báo cáo ───────────────────────────────────────────────
function MktReportView() {
  const mktData = useDataStore(s => s.mktData);

  const byChannel = {};
  mktData.forEach(d => {
    if (!byChannel[d.channel]) byChannel[d.channel] = { adCost: 0, leads: 0, views: 0, posts: 0 };
    byChannel[d.channel].adCost += d.adCost || 0;
    byChannel[d.channel].leads  += parseInt(d.leads    || 0);
    byChannel[d.channel].views  += parseInt(d.sessions || 0) + parseInt(d.views || 0);
    byChannel[d.channel].posts  += parseInt(d.posts    || 0);
  });

  const ICONS  = { facebook:'📘', tiktok:'🎵', youtube:'▶️', website:'🌐', zalo:'💬', other:'📌' };
  const LABELS = { facebook:'Facebook', tiktok:'TikTok', youtube:'YouTube', website:'Website', zalo:'Zalo', other:'Khác' };
  const rows   = Object.entries(byChannel);

  const totals = rows.reduce((acc, [, v]) => ({
    adCost: acc.adCost + v.adCost,
    leads:  acc.leads  + v.leads,
    views:  acc.views  + v.views,
    posts:  acc.posts  + v.posts,
  }), { adCost: 0, leads: 0, views: 0, posts: 0 });

  return (
    <div>
      <div className="kpi-strip">
        <div className="kpi-card" style={{ borderTopColor: '#dc2626' }}>
          <div className="kpi-lbl">💰 Tổng chi phí Ads</div>
          <div className="kpi-val" style={{ fontSize: 14, color: '#dc2626' }}>
            {new Intl.NumberFormat('vi-VN').format(totals.adCost)}đ
          </div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#2563eb' }}>
          <div className="kpi-lbl">👁️ Tổng lượt xem</div>
          <div className="kpi-val" style={{ color: '#2563eb' }}>{totals.views.toLocaleString('vi-VN')}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#7c3aed' }}>
          <div className="kpi-lbl">📝 Tổng bài đăng</div>
          <div className="kpi-val" style={{ color: '#7c3aed' }}>{totals.posts}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#16a34a' }}>
          <div className="kpi-lbl">👥 Tổng Lead</div>
          <div className="kpi-val" style={{ color: '#16a34a' }}>{totals.leads}</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-text">Chưa có dữ liệu báo cáo</div>
          <div className="empty-sub">Nhập dữ liệu tại tab Dữ liệu để xem báo cáo tổng hợp</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Kênh</th>
                <th>Chi phí Ads</th>
                <th>Lượt xem</th>
                <th>Bài đăng</th>
                <th>Lead thu được</th>
                <th>Chi phí / Lead</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([ch, v]) => (
                <tr key={ch}>
                  <td><strong>{ICONS[ch] || '📌'} {LABELS[ch] || ch}</strong></td>
                  <td style={{ color: '#dc2626', fontWeight: 700 }}>
                    {v.adCost > 0 ? new Intl.NumberFormat('vi-VN').format(v.adCost) + 'đ' : '—'}
                  </td>
                  <td>{v.views > 0 ? v.views.toLocaleString('vi-VN') : '—'}</td>
                  <td>{v.posts || '—'}</td>
                  <td style={{ color: '#16a34a', fontWeight: 700 }}>{v.leads || '—'}</td>
                  <td style={{ color: '#7c3aed' }}>
                    {v.leads > 0
                      ? new Intl.NumberFormat('vi-VN').format(Math.round(v.adCost / v.leads)) + 'đ'
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
