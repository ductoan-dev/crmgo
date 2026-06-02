import React from 'react';
import { WF_LABEL } from '../../utils/constants';

// ── Thứ tự bước workflow ─────────────────────────────────────
export const WF_STEPS_ORDER = [
  'pending_kt','kt_approved','in_design','design_done',
  'in_production','supplier_sent','in_warehouse','delivered',
];
export const WF_SHORT = {
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

export default WfStepper;
