import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore, useUIStore } from '../../store';
import { fmt, fmtDate } from '../../utils/helpers';
import { WF_LABEL } from '../../utils/constants';

// ── Ghi nhận thanh toán inline ───────────────────────────────
function PaymentPanel({ ord, onRecord, onClose }) {
  const [amount, setAmount] = useState('');
  const [note,   setNote]   = useState('');

  const netDue    = (ord.grandTotal || 0) - (ord.deposit || 0);  // trừ cọc
  const remaining = netDue - (ord.ktPaidAmount || 0);             // còn lại KT chưa thu
  const amountNum = Number(amount.replace(/\./g, '')) || 0;
  const afterPay  = remaining - amountNum;

  const handleQuick = (val) => setAmount(val.toLocaleString('vi-VN'));

  const handleSubmit = () => {
    if (!amountNum || amountNum <= 0) { toast.error('Nhập số tiền hợp lệ'); return; }
    if (amountNum > remaining + 1)    { toast.error('Số tiền vượt quá số còn lại'); return; }
    onRecord(amountNum, note.trim());
  };

  // Quick-fill: toàn bộ còn lại, một nửa còn lại (không có nút cọc vì cọc đã được trừ)
  const quickAmounts = [remaining, Math.round(remaining / 2)]
    .filter(v => v > 0 && v <= remaining);

  return (
    <div style={{
      borderTop: '1px solid #f1f5f9', background: '#f8fafc',
      padding: '14px 16px',
      borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
    }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: '#7c3aed', marginBottom: 10 }}>
        💰 Ghi nhận thanh toán
      </div>

      {/* Tóm tắt số liệu */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 12,
        background: '#fff', borderRadius: 8, padding: '8px 12px',
        border: '1px solid #e2e8f0',
      }}>
        {[
          { label: 'TỔNG ĐƠN',  value: fmt(ord.grandTotal),     color: '#374151' },
          { label: ord.deposit > 0 ? 'CỌC + KT' : 'ĐÃ THU',
            value: ord.deposit > 0
              ? `${fmt(ord.deposit)} + ${fmt(ord.ktPaidAmount||0)}`
              : fmt(ord.ktPaidAmount||0),
            color: '#16a34a' },
          { label: 'KT CẦN THU',
            value: remaining > 0 ? fmt(remaining) : '✅ Đủ',
            color: remaining > 0 ? '#dc2626' : '#16a34a' },
        ].map(item => (
          <div key={item.label}>
            <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>{item.label}</div>
            <div style={{ fontWeight: 800, fontSize: 13, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Quick-fill buttons */}
      {quickAmounts.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {quickAmounts.map((v, i) => (
            <button key={i} type="button" onClick={() => handleQuick(v)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              border: '1px solid #ddd6fe', background: '#f5f3ff', color: '#7c3aed',
            }}>
              {i === 0 ? '💯 Toàn bộ còn lại' : '½ Một nửa'} · {fmt(v)}
            </button>
          ))}
        </div>
      )}

      <div className="form-grid">
        <div className="fi-group">
          <label className="fi-label">Số tiền nhận (₫) <span style={{color:'red'}}>*</span></label>
          <input
            className="fi" autoFocus
            placeholder="VD: 5.000.000"
            value={amount}
            inputMode="numeric"
            onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            onBlur={e => {
              const n = Number(e.target.value.replace(/\./g, ''));
              setAmount(n > 0 ? n.toLocaleString('vi-VN') : '');
            }}
          />
          {amountNum > 0 && (
            <div style={{
              fontSize: 11, marginTop: 4, fontWeight: 700,
              color: afterPay > 0 ? '#16a34a' : afterPay === 0 ? '#16a34a' : '#dc2626',
            }}>
              {afterPay > 0  ? `Sau khi nhận → còn lại: ${fmt(afterPay)}`
               : afterPay === 0 ? '✅ Thanh toán đầy đủ!'
               : `⚠ Vượt ${fmt(-afterPay)}`}
            </div>
          )}
        </div>
        <div className="fi-group">
          <label className="fi-label">Ghi chú</label>
          <input className="fi" placeholder="Chuyển khoản MB Bank, tiền mặt..."
            value={note} onChange={e => setNote(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Huỷ</button>
        <button
          className="btn btn-sm"
          style={{ background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 700 }}
          onClick={handleSubmit}
        >
          💰 Xác nhận nhận tiền
        </button>
      </div>
    </div>
  );
}

// ── Thứ tự bước workflow ─────────────────────────────────────
const WF_STEPS_ORDER = [
  'pending_kt','kt_approved','in_design','design_done',
  'in_production','supplier_sent','in_warehouse','delivered',
];
const WF_SHORT = {
  pending_kt:    'Chờ KT',
  kt_approved:   'KT duyệt',
  in_design:     'Thiết kế',
  design_done:   'TK xong',
  in_production: 'Sản xuất',
  supplier_sent: 'Gửi NCC',
  in_warehouse:  'Về kho',
  delivered:     'Đã giao',
};

// ── Step tracker nhỏ trong từng đơn ──────────────────────────
function WfStepper({ wfStatus }) {
  const currentIdx = WF_STEPS_ORDER.indexOf(wfStatus);
  const cfg = WF_LABEL[wfStatus] || { color: '#64748b' };

  return (
    <div style={{
      padding: '10px 16px 12px',
      borderTop: '1px solid #f1f5f9',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 8, letterSpacing: .3 }}>
        TIẾN ĐỘ ĐƠN HÀNG
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {WF_STEPS_ORDER.map((step, i) => {
          const done   = i < currentIdx;
          const active = i === currentIdx;
          const c      = WF_LABEL[step]?.color || '#64748b';
          return (
            <React.Fragment key={step}>
              {i > 0 && (
                <div style={{
                  flex: 1, height: 2, minWidth: 6,
                  background: done ? '#16a34a' : active ? c + '40' : '#e5e7eb',
                  transition: 'background .2s',
                }} />
              )}
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 4, flexShrink: 0,
              }}>
                {/* Dot */}
                <div style={{
                  width:  active ? 16 : done ? 12 : 10,
                  height: active ? 16 : done ? 12 : 10,
                  borderRadius: '50%',
                  background: done ? '#16a34a' : active ? c : '#e5e7eb',
                  border: active ? `2px solid ${c}` : done ? '2px solid #16a34a' : '2px solid #d1d5db',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 7, color: '#fff', fontWeight: 900,
                  transition: 'all .2s', flexShrink: 0,
                  boxShadow: active ? `0 0 0 3px ${c}22` : 'none',
                }}>
                  {done ? '✓' : ''}
                </div>
                {/* Label — chỉ hiện ở bước hiện tại */}
                <div style={{
                  fontSize: 9, fontWeight: active ? 800 : 600,
                  color: active ? c : done ? '#16a34a' : '#d1d5db',
                  textAlign: 'center', whiteSpace: 'nowrap',
                  maxWidth: 52, lineHeight: 1.2,
                }}>
                  {WF_SHORT[step]}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── VAT Info section ─────────────────────────────────────────
function VatSection({ ord, onMarkExported }) {
  const hasVat = ord.vatRequired === true;
  const exported = ord.vatExported;

  return (
    <div style={{
      margin: '0 16px 12px',
      padding: '10px 14px',
      background: hasVat ? (exported ? '#f0fdf4' : '#fffbeb') : '#f8fafc',
      borderRadius: 8,
      border: `1px solid ${hasVat ? (exported ? '#bbf7d0' : '#fde68a') : '#e2e8f0'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, color: hasVat ? (exported ? '#15803d' : '#92400e') : '#64748b' }}>
            🧾 {hasVat ? 'Xuất hoá đơn VAT' : 'Không xuất hoá đơn VAT'}
          </span>
          {hasVat && !exported && (
            <span style={{
              marginLeft: 8, fontSize: 10, fontWeight: 700,
              color: '#d97706', background: '#fef3c7',
              padding: '1px 7px', borderRadius: 99, border: '1px solid #fde68a',
            }}>
              Chưa xuất
            </span>
          )}
          {exported && (
            <span style={{
              marginLeft: 8, fontSize: 10, fontWeight: 700,
              color: '#15803d', background: '#dcfce7',
              padding: '1px 7px', borderRadius: 99, border: '1px solid #86efac',
            }}>
              ✅ Đã xuất {ord.vatExportedAt ? `· ${ord.vatExportedAt}` : ''}
            </span>
          )}
        </div>

        {hasVat && !exported && (
          <button
            className="btn btn-sm"
            style={{ background: '#16a34a', color: '#fff', border: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
            onClick={() => onMarkExported(ord.id)}
          >
            ✅ Đánh dấu đã xuất VAT
          </button>
        )}
      </div>

      {/* Thông tin VAT chi tiết */}
      {hasVat && ord.vatCompany && (
        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
          {[
            { label: 'Đơn vị', value: ord.vatCompany },
            { label: 'MST', value: ord.vatTaxCode },
            { label: 'Địa chỉ', value: ord.vatAddress },
            { label: 'Email HĐ', value: ord.vatEmail },
            ord.vatBuyer && { label: 'Người mua', value: ord.vatBuyer },
          ].filter(Boolean).map(item => (
            <div key={item.label} style={{ fontSize: 11 }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>{item.label}: </span>
              <span style={{ color: '#1e293b', fontWeight: 700 }}>{item.value || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Order card — dùng trong cả 2 tab ─────────────────────────
function OrderCard({ ord, showApprove, onApprove, onReject, onRecordPayment, onMarkVatExported, recordingId, setRecordingId }) {
  const isPending    = ord.wfStatus === 'pending_kt';
  const wf           = WF_LABEL[ord.wfStatus] || { label: ord.wfStatus, color: '#64748b' };
  const paid         = ord.ktPaidAmount || 0;   // KT đã ghi nhận
  const deposit      = ord.deposit      || 0;   // tiền cọc (KD đã nhận khi tạo đơn)
  const total        = ord.grandTotal   || 0;
  const netDue       = total - deposit;          // số KT cần thu (sau khi trừ cọc)
  const remaining    = netDue - paid;            // còn lại KT chưa thu
  const totalReceived = deposit + paid;          // tổng đã về tay công ty
  const paidPct      = total ? Math.round(totalReceived / total * 100) : 0;
  const isRecording  = recordingId === ord.id;

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        className="ord-card"
        style={{
          borderLeft: `4px solid ${isPending ? '#f59e0b' : '#059669'}`,
          borderRadius: isRecording ? '10px 10px 0 0' : 10,
          marginBottom: 0,
        }}
      >
        {/* Header */}
        <div className="ord-card-head">
          <span className="ord-code">{ord.code}</span>
          <span className="ord-name">{ord.name}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: wf.color,
            background: wf.color + '14', border: `1px solid ${wf.color}40`,
            borderRadius: 5, padding: '2px 8px',
          }}>{wf.label}</span>
          <span className="ord-amount">{fmt(total)}</span>
        </div>

        {/* Meta */}
        <div className="ord-meta">
          <div className="ord-meta-item">
            <div className="ord-meta-label">KD phụ trách</div>
            <div className="ord-meta-val">{ord.emp}</div>
          </div>
          <div className="ord-meta-item">
            <div className="ord-meta-label">Loại đơn</div>
            <div className="ord-meta-val">{ord.orderType || '–'}</div>
          </div>
          <div className="ord-meta-item">
            <div className="ord-meta-label">Thanh toán</div>
            <div className="ord-meta-val">{ord.payMethod || '–'}</div>
          </div>
          <div className="ord-meta-item">
            <div className="ord-meta-label">Ngày tạo</div>
            <div className="ord-meta-val">{fmtDate(ord.createdAt)}</div>
          </div>
          {ord.deposit > 0 && (
            <div className="ord-meta-item">
              <div className="ord-meta-label">Tiền cọc</div>
              <div className="ord-meta-val" style={{ color: '#7c3aed', fontWeight: 700 }}>
                {fmt(ord.deposit)}
              </div>
            </div>
          )}
        </div>

        {/* Tracker wfStatus */}
        <WfStepper wfStatus={ord.wfStatus} />

        {/* VAT Info */}
        <VatSection ord={ord} onMarkExported={onMarkVatExported} />

        {/* Thanh toán — luôn hiện khi có tổng đơn */}
        {total > 0 && (
          <div style={{ margin: '0 16px 12px' }}>
            {ord.ktApproved ? (
              /* Đã duyệt: progress bar — tính cả cọc vào phần đã thu */
              <>
                <div style={{ height: 7, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99, transition: 'width .3s',
                    width: `${Math.min(paidPct, 100)}%`,
                    background: paidPct >= 100 ? '#16a34a' : 'linear-gradient(90deg,#7c3aed,#a855f7)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11 }}>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>
                    ✅ Đã thu: {fmt(totalReceived)}
                    {deposit > 0 && (
                      <span style={{ color: '#7c3aed', fontWeight: 600, marginLeft: 4 }}>
                        (cọc {fmt(deposit)}{paid > 0 ? ` + KT ${fmt(paid)}` : ''})
                      </span>
                    )}
                  </span>
                  <span style={{ fontWeight: 800, color: remaining > 0 ? '#dc2626' : '#16a34a' }}>
                    {remaining > 0 ? `💸 Còn lại: ${fmt(remaining)}` : '🎉 Đã đủ'}
                  </span>
                </div>
              </>
            ) : (
              /* Chờ duyệt: hiện số KT cần thu (đã trừ cọc) */
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#fffbeb', borderRadius: 8, padding: '7px 12px',
                border: '1px solid #fde68a',
              }}>
                <div>
                  <div style={{ fontSize: 11, color: '#92400e', fontWeight: 600 }}>
                    💰 KT cần thu
                  </div>
                  {deposit > 0 && (
                    <div style={{ fontSize: 10, color: '#b45309', marginTop: 2 }}>
                      Tổng {fmt(total)} − cọc {fmt(deposit)}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#d97706' }}>
                  {fmt(deposit > 0 ? netDue : total)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="ord-actions">
          {isPending && showApprove ? (
            <>
              <button className="btn btn-green" onClick={() => onApprove(ord.id)}>
                ✅ Phê duyệt & Xác nhận
              </button>
              <button className="btn btn-red btn-sm" onClick={() => onReject(ord.id)}>
                ❌ Từ chối
              </button>
            </>
          ) : ord.ktApproved && remaining > 0 ? (
            isRecording ? (
              <button className="btn btn-ghost btn-sm" onClick={() => setRecordingId(null)}>
                ✕ Đóng
              </button>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:10, width:'100%', flexWrap:'wrap' }}>
                <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>
                  ✅ Duyệt bởi {ord.ktApprovedBy}
                </span>
                <button
                  className="btn btn-sm"
                  style={{ background: '#7c3aed', color: '#fff', border: 'none', marginLeft: 'auto' }}
                  onClick={() => setRecordingId(ord.id)}
                >
                  💰 Ghi nhận thanh toán
                </button>
              </div>
            )
          ) : ord.ktApproved && remaining <= 0 ? (
            <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
              ✅ Duyệt: {ord.ktApprovedBy} · 💰 Đã thanh toán đầy đủ
            </span>
          ) : null}
        </div>
      </div>

      {/* Panel ghi nhận thanh toán */}
      {isRecording && (
        <PaymentPanel
          ord={ord}
          onRecord={(amount, note) => {
            onRecordPayment(ord.id, amount, note);
            setRecordingId(null);
          }}
          onClose={() => setRecordingId(null)}
        />
      )}
    </div>
  );
}

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
