import React from 'react';
import { CONTACT_STATUSES, TEMP_CFG } from '../../utils/constants';

export function StatusBadge({ status }) {
  const cfg = CONTACT_STATUSES.find(s => s.value === status) || CONTACT_STATUSES[0];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 99, whiteSpace: 'nowrap',
      fontSize: 11, fontWeight: 700,
      color: cfg.color, background: cfg.bg, border: `1.5px solid ${cfg.color}44`,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export function TempBadge({ temp }) {
  const cfg = TEMP_CFG[temp || 'warm'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '3px 9px', borderRadius: 99,
      fontSize: 11, fontWeight: 700,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30`,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export function InfoRow({ icon, label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 3 }}>{icon} {label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{value || '—'}</div>
    </div>
  );
}
