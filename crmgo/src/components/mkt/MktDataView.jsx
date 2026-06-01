import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useDataStore } from '../../store';

// ── Kênh MKT ─────────────────────────────────────────────────
const MKT_CHANNELS = [
  { value: 'facebook',  label: 'Facebook',      icon: '📘', color: '#1877f2' },
  { value: 'tiktok',    label: 'TikTok',        icon: '🎵', color: '#010101' },
  { value: 'youtube',   label: 'YouTube',       icon: '▶️',  color: '#ff0000' },
  { value: 'website',   label: 'Website',       icon: '🌐', color: '#059669' },
  { value: 'zalo',      label: 'Zalo',          icon: '💬', color: '#0068ff' },
  { value: 'other',     label: 'Khác',          icon: '📌', color: '#64748b' },
];

// ── VND format helper ─────────────────────────────────────────
const fmtVND = (n) =>
  n ? new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ' : '—';

const parseNum = (s) => parseInt((s || '').replace(/\D/g, ''), 10) || 0;

// ── Input tự động format VND ──────────────────────────────────
function VNDInput({ value, onChange, placeholder = '0' }) {
  const [display, setDisplay] = useState(value ? new Intl.NumberFormat('vi-VN').format(value) : '');

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setDisplay(raw ? new Intl.NumberFormat('vi-VN').format(parseInt(raw)) : '');
    onChange(raw ? parseInt(raw) : 0);
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        className="fi"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        style={{ paddingRight: 32 }}
      />
      <span style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        fontSize: 11, fontWeight: 700, color: '#94a3b8',
      }}>
        đ
      </span>
    </div>
  );
}

// ── Form mặc định ─────────────────────────────────────────────
const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  channel: 'facebook',
  adCost: 0,
  sessions: '',
  views: '',
  posts: '',
  leads: '',
  note: '',
};

export default function MktDataView() {
  const mktData      = useDataStore(s => s.mktData);
  const addMktData   = useDataStore(s => s.addMktData);
  const deleteMktData = useDataStore(s => s.deleteMktData);

  const [form, setForm]   = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [filterCh, setFilterCh] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  // ── Lọc data ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return mktData
      .filter(d => filterCh === 'all' || d.channel === filterCh)
      .filter(d => !filterMonth || d.date?.startsWith(filterMonth))
      .sort((a, b) => b.date?.localeCompare(a.date));
  }, [mktData, filterCh, filterMonth]);

  // ── Tổng hợp ────────────────────────────────────────────────
  const totals = useMemo(() => ({
    adCost:   filtered.reduce((s, d) => s + (d.adCost || 0), 0),
    sessions: filtered.reduce((s, d) => s + (parseNum(d.sessions)), 0),
    views:    filtered.reduce((s, d) => s + (parseNum(d.views)), 0),
    leads:    filtered.reduce((s, d) => s + (parseNum(d.leads)), 0),
    posts:    filtered.reduce((s, d) => s + (parseNum(d.posts)), 0),
  }), [filtered]);

  const handleSave = () => {
    if (!form.date) { toast.error('Chọn ngày báo cáo'); return; }
    addMktData({ ...form });
    toast.success('Đã lưu dữ liệu MKT');
    setForm(emptyForm);
    setShowForm(false);
  };

  const chCfg = (v) => MKT_CHANNELS.find(c => c.value === v) || MKT_CHANNELS[5];

  return (
    <div>
      {/* KPI tổng hợp */}
      <div className="kpi-strip">
        <div className="kpi-card" style={{ borderTopColor: '#dc2626' }}>
          <div className="kpi-lbl">💰 Tổng chi phí Ads</div>
          <div className="kpi-val" style={{ fontSize: 14, color: '#dc2626' }}>
            {new Intl.NumberFormat('vi-VN').format(totals.adCost)}đ
          </div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#2563eb' }}>
          <div className="kpi-lbl">👁️ Lượt xem / Session</div>
          <div className="kpi-val" style={{ color: '#2563eb' }}>
            {(totals.sessions + totals.views).toLocaleString('vi-VN')}
          </div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#7c3aed' }}>
          <div className="kpi-lbl">📝 Bài đăng</div>
          <div className="kpi-val" style={{ color: '#7c3aed' }}>{totals.posts}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#16a34a' }}>
          <div className="kpi-lbl">👥 Lead thu được</div>
          <div className="kpi-val" style={{ color: '#16a34a' }}>{totals.leads}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="search-bar">
        <input
          type="month"
          className="fi"
          style={{ width: 160 }}
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          placeholder="Lọc tháng"
        />
        <select className="fi" style={{ width: 'auto' }} value={filterCh} onChange={e => setFilterCh(e.target.value)}>
          <option value="all">📊 Tất cả kênh</option>
          {MKT_CHANNELS.map(c => (
            <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
          ))}
        </select>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowForm(v => !v)}
        >
          {showForm ? '✕ Đóng' : '+ Thêm Data'}
        </button>
      </div>

      {/* Form nhập data */}
      {showForm && (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,.06)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>
            📈 Nhập dữ liệu MKT
          </div>

          <div className="form-grid">
            {/* Ngày + Kênh */}
            <div className="fi-group">
              <label className="fi-label">Ngày báo cáo <span style={{ color: 'red' }}>*</span></label>
              <input type="date" className="fi" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="fi-group">
              <label className="fi-label">Kênh <span style={{ color: 'red' }}>*</span></label>
              <select className="fi" value={form.channel} onChange={e => set('channel', e.target.value)}>
                {MKT_CHANNELS.map(c => (
                  <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>

            {/* Chi phí Ads */}
            <div className="fi-group">
              <label className="fi-label">💰 Chi phí Ads (VNĐ)</label>
              <VNDInput value={form.adCost} onChange={v => set('adCost', v)} placeholder="0" />
            </div>

            {/* Traffic */}
            <div className="fi-group">
              <label className="fi-label">
                {['website'].includes(form.channel) ? '👁️ Sessions' : '👁️ Lượt xem'}
              </label>
              <input
                className="fi" type="number" min="0"
                placeholder="0"
                value={form.sessions}
                onChange={e => set('sessions', e.target.value)}
              />
            </div>

            {/* Content */}
            <div className="fi-group">
              <label className="fi-label">
                {form.channel === 'website' ? '📄 Bài viết / Trang' : '📝 Bài đăng / Video'}
              </label>
              <input
                className="fi" type="number" min="0"
                placeholder="0"
                value={form.posts}
                onChange={e => set('posts', e.target.value)}
              />
            </div>

            {/* Lượt xem content (cho video) */}
            {['tiktok', 'youtube'].includes(form.channel) && (
              <div className="fi-group">
                <label className="fi-label">▶️ Lượt xem video</label>
                <input
                  className="fi" type="number" min="0"
                  placeholder="0"
                  value={form.views}
                  onChange={e => set('views', e.target.value)}
                />
              </div>
            )}

            {/* Lead */}
            <div className="fi-group">
              <label className="fi-label">👥 Lead thu được</label>
              <input
                className="fi" type="number" min="0"
                placeholder="0"
                value={form.leads}
                onChange={e => set('leads', e.target.value)}
              />
            </div>

            {/* Ghi chú */}
            <div className="fi-group" style={{ gridColumn: '1 / -1' }}>
              <label className="fi-label">Ghi chú</label>
              <input
                className="fi"
                placeholder="Ghi chú thêm về chiến dịch..."
                value={form.note}
                onChange={e => set('note', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Huỷ</button>
            <button className="btn btn-primary" onClick={handleSave}>✅ Lưu dữ liệu</button>
          </div>
        </div>
      )}

      {/* Danh sách data */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📈</div>
          <div className="empty-text">Chưa có dữ liệu MKT</div>
          <div className="empty-sub">Nhấn "+ Thêm Data" để nhập chi phí và hiệu quả các kênh</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Kênh</th>
                <th>Chi phí Ads</th>
                <th>Lượt xem / Session</th>
                <th>Video views</th>
                <th>Bài đăng</th>
                <th>Lead</th>
                <th>Chi phí / Lead</th>
                <th>Ghi chú</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const ch = chCfg(d.channel);
                const views = parseNum(d.sessions) + parseNum(d.views);
                const leads = parseNum(d.leads);
                const costPerLead = leads > 0 ? Math.round(d.adCost / leads) : null;
                return (
                  <tr key={d.id}>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{d.date}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                        color: ch.color, background: `${ch.color}15`,
                        border: `1px solid ${ch.color}30`,
                      }}>
                        {ch.icon} {ch.label}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#dc2626', fontSize: 12 }}>
                      {d.adCost > 0 ? new Intl.NumberFormat('vi-VN').format(d.adCost) + 'đ' : '—'}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {views > 0 ? views.toLocaleString('vi-VN') : '—'}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {parseNum(d.views) > 0 ? parseNum(d.views).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td style={{ fontSize: 12 }}>{d.posts || '—'}</td>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>{d.leads || '—'}</td>
                    <td style={{ fontSize: 12, color: costPerLead ? '#7c3aed' : 'var(--muted)' }}>
                      {costPerLead ? new Intl.NumberFormat('vi-VN').format(costPerLead) + 'đ' : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 150 }}>
                      {d.note || '—'}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { deleteMktData(d.id); toast('Đã xoá', { icon: '🗑️' }); }}
                        style={{ color: '#ef4444' }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
