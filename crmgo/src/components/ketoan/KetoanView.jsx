import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore, useUIStore } from '../../store';
import { fmt, fmtDate } from '../../utils/helpers';
import { WF_LABEL } from '../../utils/constants';
import PaymentPanel from './PaymentPanel';
import WfStepper from './WfStepper';
import VatSection from './VatSection';
import OrderCard from './OrderCard';

// ════════════════════════════════════════════════════════════
// KetoanView — MAIN
// ════════════════════════════════════════════════════════════
export default function KetoanView() {
  const user          = useAuthStore(s => s.user);
  const orders        = useDataStore(s => s.orders);
  const ktApprove     = useDataStore(s => s.ktApprove);
  const ktReject      = useDataStore(s => s.ktReject);
  const recordPayment = useDataStore(s => s.recordPayment);
  const updateOrder   = useDataStore(s => s.updateOrder);
  const activeTab     = useUIStore(s => s.activeTab);

  const [q,           setQ]           = useState('');
  const [recordingId, setRecordingId] = useState(null);

  // ── Phân loại đơn ───────────────────────────────────────────
  const pendingOrds  = useMemo(() => orders.filter(o => o.wfStatus === 'pending_kt'), [orders]);
  const approvedOrds = useMemo(() => orders.filter(o => o.ktApproved && o.wfStatus !== 'pending_kt'), [orders]);

  // ── Tổng hợp tài chính ──────────────────────────────────────
  const finance = useMemo(() => {
    const totalRevenue = approvedOrds.reduce((s, o) => s + (o.grandTotal    || 0), 0);
    const totalPaid    = approvedOrds.reduce((s, o) => s + (o.ktPaidAmount  || 0), 0);
    const totalDeposit = approvedOrds.reduce((s, o) => s + (o.deposit       || 0), 0);
    return { totalRevenue, totalPaid, totalDebt: totalRevenue - totalPaid, totalDeposit };
  }, [approvedOrds]);

  const handleApprove = async (ordId) => {
    const ok = await ktApprove(ordId, user?.name);
    if (ok) toast.success('✅ Đã phê duyệt — đơn chuyển xuống mục Đã duyệt');
    else    toast.error('Không thể phê duyệt đơn này');
  };

  const handleReject = (ordId) => {
    const reason = window.prompt('Lý do từ chối (bắt buộc):');
    if (!reason?.trim()) return;
    ktReject(ordId, user?.name, reason.trim());
    toast.error('Đã từ chối đơn hàng');
  };

  const handleRecordPayment = (ordId, amount) => {
    recordPayment(ordId, amount, user?.name);
    toast.success(`💰 Đã ghi nhận ${amount.toLocaleString('vi-VN')}₫`);
  };

  const handleMarkVatExported = (ordId) => {
    const now = new Date().toLocaleDateString('vi-VN');
    updateOrder(ordId, {
      vatExported:   true,
      vatExportedAt: now,
      vatExportedBy: user?.name,
    });
    toast.success('✅ Đã đánh dấu xuất hoá đơn VAT');
  };

  const cardProps = {
    onApprove: handleApprove,
    onReject: handleReject,
    onRecordPayment: handleRecordPayment,
    onMarkVatExported: handleMarkVatExported,
    recordingId,
    setRecordingId,
  };

  // ════════════════════════════════════════════════════════════
  // TAB: PHÊ DUYỆT
  // ════════════════════════════════════════════════════════════
  if (activeTab !== 'orders' && activeTab !== 'report') {
    // Tất cả đơn chưa được KT duyệt (bất kể wfStatus)
    const allPending  = orders.filter(o => !o.ktApproved && !o.ktRejected);
    const allApproved = orders.filter(o => o.ktApproved === true);

    // Filter tìm kiếm
    const filterQ = (list) => {
      if (!q) return list;
      const lq = q.toLowerCase();
      return list.filter(o =>
        o.code?.toLowerCase().includes(lq) ||
        o.name?.toLowerCase().includes(lq) ||
        o.customerName?.toLowerCase().includes(lq) ||
        o.emp?.toLowerCase().includes(lq)
      );
    };

    return (
      <div>
        {/* KPI */}
        <div className="kpi-strip">
          <div className="kpi-card" style={{ borderTopColor: '#f59e0b' }}>
            <div className="kpi-lbl">⏳ Chờ phê duyệt</div>
            <div className="kpi-val" style={{ color: '#f59e0b' }}>{allPending.length}</div>
          </div>
          <div className="kpi-card" style={{ borderTopColor: '#059669' }}>
            <div className="kpi-lbl">✅ Đã phê duyệt</div>
            <div className="kpi-val" style={{ color: '#059669' }}>{allApproved.length}</div>
          </div>
          <div className="kpi-card" style={{ borderTopColor: '#7c3aed' }}>
            <div className="kpi-lbl">💰 Tổng giá trị</div>
            <div className="kpi-val" style={{ fontSize: 14 }}>{fmt(finance.totalRevenue)}</div>
          </div>
          <div className="kpi-card" style={{ borderTopColor: '#dc2626' }}>
            <div className="kpi-lbl">⚠ Công nợ</div>
            <div className="kpi-val" style={{ fontSize: 14, color: '#dc2626' }}>{fmt(finance.totalDebt)}</div>
          </div>
        </div>

        {/* Search */}
        <div className="search-bar">
          <input
            className="search-input"
            placeholder="Tìm mã đơn, tên KH, KD..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>

        {/* ── Section 1: Chờ phê duyệt ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: '#f59e0b',
            textTransform: 'uppercase', letterSpacing: .5,
            marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ⏳ Chờ phê duyệt
            <span style={{
              background: '#fef3c7', color: '#92400e', borderRadius: 99,
              fontSize: 10, fontWeight: 900, padding: '2px 8px',
            }}>{allPending.length}</span>
          </div>

          {filterQ(allPending).length === 0 ? (
            <div style={{
              background: '#fffbeb', border: '1.5px dashed #fcd34d',
              borderRadius: 10, padding: '20px', textAlign: 'center',
              color: '#92400e', fontSize: 13,
            }}>
              {q ? 'Không tìm thấy đơn phù hợp' : '✅ Không có đơn nào chờ duyệt'}
            </div>
          ) : filterQ(allPending).map(ord => (
            <OrderCard key={ord.id} ord={ord} showApprove={true} {...cardProps} />
          ))}
        </div>

        {/* ── Section 2: Đã phê duyệt ── */}
        {allApproved.length > 0 && (
          <div>
            <div style={{
              fontSize: 11, fontWeight: 800, color: '#059669',
              textTransform: 'uppercase', letterSpacing: .5,
              marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ✅ Đã phê duyệt
              <span style={{
                background: '#dcfce7', color: '#166534', borderRadius: 99,
                fontSize: 10, fontWeight: 900, padding: '2px 8px',
              }}>{allApproved.length}</span>
            </div>
            {filterQ(allApproved).map(ord => (
              <OrderCard key={ord.id} ord={ord} showApprove={false} {...cardProps} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // TAB: ĐƠN HÀNG — pipeline wfStatus + theo dõi thu tiền
  // ════════════════════════════════════════════════════════════
  if (activeTab === 'orders') {
    // netDue = grandTotal - deposit (số KT thực sự cần thu)
    const netRemaining = o => (o.grandTotal || 0) - (o.deposit || 0) - (o.ktPaidAmount || 0);
    const debtOrds = approvedOrds.filter(o => netRemaining(o) > 0);
    const paidOrds = approvedOrds.filter(o => netRemaining(o) <= 0);

    return (
      <div>
        {/* KPI */}
        <div className="kpi-strip">
          <div className="kpi-card" style={{ borderTopColor: '#7c3aed' }}>
            <div className="kpi-lbl">💰 Doanh thu</div>
            <div className="kpi-val" style={{ fontSize: 14, color: '#7c3aed' }}>{fmt(finance.totalRevenue)}</div>
          </div>
          <div className="kpi-card" style={{ borderTopColor: '#16a34a' }}>
            <div className="kpi-lbl">✅ Đã thu</div>
            <div className="kpi-val" style={{ fontSize: 14, color: '#16a34a' }}>{fmt(finance.totalPaid)}</div>
          </div>
          <div className="kpi-card" style={{ borderTopColor: '#dc2626' }}>
            <div className="kpi-lbl">⚠ Công nợ</div>
            <div className="kpi-val" style={{ fontSize: 14, color: '#dc2626' }}>{fmt(finance.totalDebt)}</div>
          </div>
          <div className="kpi-card" style={{ borderTopColor: '#f59e0b' }}>
            <div className="kpi-lbl">📦 Tổng đơn</div>
            <div className="kpi-val" style={{ color: '#f59e0b' }}>{orders.length}</div>
          </div>
        </div>

        {/* ── Danh sách đơn ── */}
        {debtOrds.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 11, fontWeight: 800, color: '#dc2626',
              textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10,
            }}>⚠ Còn công nợ ({debtOrds.length})</div>
            {debtOrds.map(ord => <OrderCard key={ord.id} ord={ord} showApprove={false} {...cardProps} />)}
          </div>
        )}

        {pendingOrds.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 11, fontWeight: 800, color: '#f59e0b',
              textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10,
            }}>⏳ Chờ phê duyệt ({pendingOrds.length})</div>
            {pendingOrds.map(ord => <OrderCard key={ord.id} ord={ord} showApprove {...cardProps} />)}
          </div>
        )}

        {paidOrds.length > 0 && (
          <div>
            <div style={{
              fontSize: 11, fontWeight: 800, color: '#16a34a',
              textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10,
            }}>✅ Đã thanh toán đủ ({paidOrds.length})</div>
            {paidOrds.map(ord => <OrderCard key={ord.id} ord={ord} showApprove={false} {...cardProps} />)}
          </div>
        )}

        {pendingOrds.length === 0 && approvedOrds.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text">Chưa có đơn hàng nào</div>
            <div className="empty-sub">Khi KD tạo đơn và được phê duyệt, đơn sẽ hiển thị ở đây</div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // TAB: BÁO CÁO — tổng hợp tài chính theo KD
  // ════════════════════════════════════════════════════════════
  const byKd = useMemo(() =>
    Object.values(
      approvedOrds.reduce((map, o) => {
        if (!map[o.emp]) map[o.emp] = { name: o.emp, count: 0, revenue: 0, paid: 0 };
        map[o.emp].count++;
        map[o.emp].revenue += o.grandTotal   || 0;
        map[o.emp].paid    += o.ktPaidAmount || 0;
        return map;
      }, {})
    ).sort((a, b) => b.revenue - a.revenue),
  [approvedOrds]);

  return (
    <div>
      <div className="kpi-strip">
        {[
          { label: '💰 Doanh thu',  value: fmt(finance.totalRevenue), color: '#7c3aed' },
          { label: '✅ Đã thu',     value: fmt(finance.totalPaid),    color: '#16a34a' },
          { label: '⚠ Công nợ',    value: fmt(finance.totalDebt),    color: '#dc2626' },
          { label: '🏦 Tiền cọc',  value: fmt(finance.totalDeposit), color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ borderTopColor: k.color }}>
            <div className="kpi-lbl">{k.label}</div>
            <div className="kpi-val" style={{ fontSize: 14, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tỉ lệ thu tiền tổng thể */}
      {finance.totalRevenue > 0 && (
        <div style={{
          background: '#fff', borderRadius: 10, padding: '14px 16px',
          border: '1px solid var(--border)', marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            📊 Tỉ lệ thu tiền tổng thể
          </div>
          <div style={{ height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99, transition: 'width .5s',
              width: `${Math.min(Math.round(finance.totalPaid / finance.totalRevenue * 100), 100)}%`,
              background: 'linear-gradient(90deg,#16a34a,#059669)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 5, color: '#64748b' }}>
            <span>Đã thu: <strong style={{color:'#16a34a'}}>
              {Math.round(finance.totalPaid / finance.totalRevenue * 100)}%
            </strong></span>
            <span>Công nợ: <strong style={{color:'#dc2626'}}>
              {Math.round(finance.totalDebt / finance.totalRevenue * 100)}%
            </strong></span>
          </div>
        </div>
      )}

      {/* Bảng theo KD */}
      {byKd.length > 0 ? (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
            👤 Theo nhân viên KD
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th style={{textAlign:'center'}}>Đơn</th>
                  <th style={{textAlign:'right'}}>Doanh thu</th>
                  <th style={{textAlign:'right'}}>Đã thu</th>
                  <th style={{textAlign:'right'}}>Công nợ</th>
                  <th style={{textAlign:'right'}}>Tỉ lệ</th>
                </tr>
              </thead>
              <tbody>
                {byKd.map(r => {
                  const debt = r.revenue - r.paid;
                  const pct  = r.revenue ? Math.round(r.paid / r.revenue * 100) : 0;
                  return (
                    <tr key={r.name}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td style={{ textAlign: 'center' }}>{r.count}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(r.revenue)}</td>
                      <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>{fmt(r.paid)}</td>
                      <td style={{ textAlign: 'right', color: debt > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                        {debt > 0 ? fmt(debt) : '✅'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
                          <div style={{ width:50, height:5, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${pct}%`, background:'#16a34a', borderRadius:99 }} />
                          </div>
                          <span style={{ fontSize:11, fontWeight:700, color: pct>=100?'#16a34a':'#64748b' }}>
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-text">Chưa có dữ liệu báo cáo</div>
          <div className="empty-sub">Dữ liệu xuất hiện khi có đơn hàng được phê duyệt</div>
        </div>
      )}
    </div>
  );
}
