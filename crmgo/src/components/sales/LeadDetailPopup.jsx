import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { CONTACT_STATUSES, TEMP_CFG, CHANNEL_CFG, CUSTOMER_PROFILES } from '../../utils/constants';
import { fmtDate } from '../../utils/helpers';

const LOAI_KHACH_MAP = {
  doanh_nghiep:  '🏢 Doanh nghiệp',
  ca_nhan:       '👤 Cá nhân',
  ho_kinh_doanh: '🏪 Hộ kinh doanh',
  to_chuc:       '🏛️ Tổ chức / NGO',
};

const UU_TIEN_MAP = {
  cao:        '🔴 Cao',
  trung_binh: '🟡 Trung bình',
  thap:       '🟢 Thấp',
};

/* ═══════════════════════════════════════════════════════════════
   LEAD DETAIL POPUP — xem chi tiết (read-only)
   * Lịch sử CSKH không được sửa / xóa tại đây
═══════════════════════════════════════════════════════════════ */
export function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, color: '#9ca3af',
      textTransform: 'uppercase', letterSpacing: .6,
      marginBottom: 10, paddingBottom: 6,
      borderBottom: '1px solid #f3f4f6',
    }}>
      {children}
    </div>
  );
}

export function DetailField({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', marginBottom: 2, textTransform: 'uppercase', letterSpacing: .4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{children}</div>
    </div>
  );
}

function LeadDetailPopup({ lead, onClose, onCreateOpp, onCreateOrder }) {
  const _rawCalls = lead.cskhCalls || lead.cskh_calls || [];
  const cskhCalls = (Array.isArray(_rawCalls) ? _rawCalls : [])
    .slice()
    .sort((a, b) => new Date(b.callDate || b.createdAt) - new Date(a.callDate || a.createdAt));

  const statusCfg  = CONTACT_STATUSES.find(s => s.value === (lead.contactStatus || 'chua_lh')) || CONTACT_STATUSES[0];
  const tempCfg    = TEMP_CFG[lead.temp || 'warm'];
  const channelCfg = lead.channel ? (CHANNEL_CFG[lead.channel] || null) : null;

  const chandungLabels = (Array.isArray(lead.chandung) ? lead.chandung : [])
    .map(v => { const p = CUSTOMER_PROFILES.find(x => x.value === v); return p ? `${p.icon} ${p.label}` : v; })
    .join(' · ');

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 950,
        background: 'rgba(0,0,0,.52)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,.22)',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '18px 24px 14px',
          background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
          borderRadius: '16px 16px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>{lead.name}</div>
            {lead.company && (
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>🏢 {lead.company}</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                color: statusCfg.color, background: statusCfg.bg, border: `1.5px solid ${statusCfg.color}44`,
              }}>
                {statusCfg.icon} {statusCfg.label}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                color: tempCfg.color, background: tempCfg.bg, border: `1px solid ${tempCfg.color}30`,
              }}>
                {tempCfg.icon} {tempCfg.label}
              </span>
              {cskhCalls.length > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#2563eb',
                  background: '#eff6ff', border: '1px solid #bfdbfe',
                  borderRadius: 99, padding: '3px 9px',
                }}>
                  📞 {cskhCalls.length} lần CSKH
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, color: '#9ca3af', padding: 0, lineHeight: 1,
          }}>✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

          {/* Thông tin khách hàng */}
          <SectionTitle>📋 Thông tin khách hàng</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', marginBottom: 20 }}>
            <DetailField label="Số điện thoại">
              <span style={{ color: '#7c3aed', fontWeight: 700 }}>{lead.phone || '—'}</span>
            </DetailField>
            <DetailField label="Email">{lead.email || '—'}</DetailField>
            {lead.company && <DetailField label="Công ty">{lead.company}</DetailField>}
            {lead.taxCode && <DetailField label="Mã số thuế">{lead.taxCode}</DetailField>}
            {lead.area && <DetailField label="Khu vực">📍 {lead.area}</DetailField>}
            {(lead.loaiKhach || lead.loai_khach) && (
              <DetailField label="Loại khách">
                {LOAI_KHACH_MAP[lead.loaiKhach || lead.loai_khach] || lead.loaiKhach}
              </DetailField>
            )}
            {lead.nganh && <DetailField label="Ngành">{lead.nganh}</DetailField>}
            {lead.birthday && <DetailField label="Sinh nhật">🎂 {lead.birthday}</DetailField>}
          </div>

          {/* Thông tin kinh doanh */}
          <SectionTitle>💼 Thông tin kinh doanh</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', marginBottom: 12 }}>
            {lead.product && <DetailField label="Sản phẩm quan tâm">{lead.product}</DetailField>}
            <DetailField label="Kênh tiếp cận">
              {channelCfg
                ? `${channelCfg.icon} ${channelCfg.label}`
                : (lead.customChannel || lead.channel || '—')}
            </DetailField>
            {(lead.nganSach || lead.ngan_sach) && (
              <DetailField label="Ngân sách">{lead.nganSach || lead.ngan_sach}</DetailField>
            )}
            {(lead.thoiDiem || lead.thoi_diem) && (
              <DetailField label="Thời điểm">{lead.thoiDiem || lead.thoi_diem}</DetailField>
            )}
            {(lead.uuTien || lead.uu_tien) && (
              <DetailField label="Ưu tiên">
                {UU_TIEN_MAP[lead.uuTien || lead.uu_tien] || (lead.uuTien || lead.uu_tien)}
              </DetailField>
            )}
            <DetailField label="NV phụ trách">{lead.assignedTo || lead.createdBy || '—'}</DetailField>
          </div>
          {chandungLabels && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .4 }}>
                Chân dung khách hàng
              </div>
              <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.8 }}>{chandungLabels}</div>
            </div>
          )}

          {/* Ghi chú */}
          {(lead.note || lead.contactNote) && (
            <div style={{ marginBottom: 20 }}>
              <SectionTitle>📝 Ghi chú</SectionTitle>
              {lead.note && (
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 8 }}>{lead.note}</div>
              )}
              {lead.contactNote && (
                <div style={{
                  fontSize: 12, color: '#92400e', background: '#fffbeb',
                  border: '1px solid #fde68a', borderRadius: 8,
                  padding: '8px 12px', lineHeight: 1.6,
                }}>
                  📌 Lý do liên hệ: {lead.contactNote}
                </div>
              )}
            </div>
          )}

          {/* Lịch sử CSKH — READ ONLY */}
          <SectionTitle>
            📞 Lịch sử chăm sóc CSKH
            {cskhCalls.length > 0 && (
              <span style={{
                marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#2563eb',
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 99, padding: '1px 8px',
              }}>
                {cskhCalls.length} lần
              </span>
            )}
          </SectionTitle>
          {cskhCalls.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '16px 0', color: '#9ca3af',
              fontSize: 12, fontStyle: 'italic', background: '#fafafa',
              borderRadius: 8, marginBottom: 8,
            }}>
              Chưa có lịch sử chăm sóc
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              {cskhCalls.map((c, idx) => (
                <div key={c.id} style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: idx === 0 ? '#eff6ff' : '#f9fafb',
                  border: `1px solid ${idx === 0 ? '#bfdbfe' : '#e5e7eb'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb' }}>
                      {c.callDate || fmtDate(c.createdAt)}
                    </span>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>👤 {c.callBy}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{c.callNote}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 10, color: '#b0b7c3', fontStyle: 'italic', marginBottom: 16 }}>
            * Lịch sử CSKH chỉ được thêm / xoá tại màn hình CSKH
          </div>

          {/* Meta */}
          <div style={{ fontSize: 11, color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>
            Tạo lúc: {lead.createdAt ? fmtDate(lead.createdAt) : '—'}
            {lead.createdBy && ` · Người tạo: ${lead.createdBy}`}
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #f3f4f6',
          background: '#f9fafb',
          borderRadius: '0 0 16px 16px',
          display: 'flex', gap: 8, justifyContent: 'flex-end',
          flexShrink: 0,
        }}>
          <button
            onClick={onCreateOrder}
            style={{
              padding: '9px 16px', fontSize: 13, fontWeight: 700,
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              color: '#fff', fontFamily: 'inherit',
              boxShadow: '0 2px 6px rgba(37,99,235,.28)',
            }}
          >
            📋 Tạo đơn
          </button>
          {lead.contactStatus === 'da_chuyen' ? (
            <span style={{
              fontSize: 12, fontWeight: 700, color: '#16a34a',
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 8, padding: '9px 16px',
            }}>
              ✅ Đã chuyển cơ hội
            </span>
          ) : (
            <button
              onClick={onCreateOpp}
              style={{
                padding: '9px 16px', fontSize: 13, fontWeight: 700,
                background: 'linear-gradient(135deg,#E8380D,#c42d09)',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                color: '#fff', fontFamily: 'inherit',
                boxShadow: '0 2px 6px rgba(232,56,13,.28)',
              }}
            >
              🎯 Tạo cơ hội
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '9px 16px', fontSize: 13, fontWeight: 600,
              background: '#fff', border: '1.5px solid #e5e7eb',
              borderRadius: 8, cursor: 'pointer', color: '#6b7280', fontFamily: 'inherit',
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeadDetailPopup;
