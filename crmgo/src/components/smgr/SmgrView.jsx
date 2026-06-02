import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore, useUIStore } from '../../store';
import { CAT_CLR, WF_LABEL, NCC_QUOTE_DEADLINE_HOURS } from '../../utils/constants';
import { fmt, fmtDate } from '../../utils/helpers';
import StarRating from './StarRating';
import AssignPanel from './AssignPanel';
import SupplierCard from './SupplierCard';
import SupplierForm from './SupplierForm';

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
    orders.filter(o => ['kt_approved','design_done','supplier_sent','in_production'].includes(o.wfStatus)),
  [orders]);
  const pending     = useMemo(() => orders.filter(o => ['kt_approved','design_done'].includes(o.wfStatus)), [orders]);
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
      (Array.isArray(s.cats) && s.cats.some(c => c.toLowerCase().includes(lq))) ||
      s.areas?.some(a => a.toLowerCase().includes(lq))
    );
  }, [suppliers, supQ]);

  // ── Handlers NCC ────────────────────────────────────────────
  const handleSupSave = async (data) => {
    try {
      if (editTarget) {
        await updateSupplier(editTarget.id, data);
        toast.success(`✅ Đã cập nhật "${data.name}"`);
      } else {
        await addSupplier(data);
        toast.success(`✅ Đã tạo NCC "${data.name}" (@${data.username})`);
      }
      setShowForm(false); setEditTarget(null);
    } catch (e) {
      toast.error(`Lỗi: ${e.message}`);
    }
  };
  const handleSupEdit   = (s) => { setEditTarget(s); setShowForm(true); };
  const handleSupDelete = async (s) => {
    if (!window.confirm(`Xoá "${s.name}"?`)) return;
    try {
      await deleteSupplier(s.id);
      toast.success(`Đã xoá ${s.name}`);
    } catch (e) {
      toast.error(`Lỗi xoá NCC: ${e.message}`);
    }
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
              {suppliers.filter(s => Array.isArray(s.cats) && s.cats.includes(cat)).length}
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

            const isDesignDone = o.wfStatus === 'design_done';
            // Màu border: chờ giao = vàng, thiết kế xong = tím, đã giao = xanh, trễ = đỏ
            const accent = isLate ? '#dc2626' : isAssigned ? '#0d9488' : isDesignDone ? '#7c3aed' : '#f59e0b';

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
                    ) : isDesignDone ? (
                      <span style={{
                        fontSize:10, fontWeight:700, color:'#7c3aed',
                        background:'#f5f3ff', border:'1px solid #ddd6fe',
                        borderRadius:5, padding:'3px 10px', whiteSpace:'nowrap',
                      }}>
                        🎨 Thiết kế xong — chờ giao NCC
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
