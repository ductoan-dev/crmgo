import React, { useState } from 'react';

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

export default VatSection;
