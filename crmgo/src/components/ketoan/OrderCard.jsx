import React, { useState } from 'react';
import { WF_LABEL } from '../../utils/constants';
import { fmt, fmtDate } from '../../utils/helpers';
import WfStepper from './WfStepper';
import VatSection from './VatSection';
import PaymentPanel from './PaymentPanel';

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

export default OrderCard;
