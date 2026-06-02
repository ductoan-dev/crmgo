import React, { useState, useRef, useEffect } from 'react';
import { CONTACT_STATUSES } from '../../utils/constants';

/* ═══════════════════════════════════════════════════════════════
   STATUS BADGE (click để đổi)
═══════════════════════════════════════════════════════════════ */
export function StatusBadge({ status, onClick }) {
  const cfg = CONTACT_STATUSES.find(s => s.value === status)
           || CONTACT_STATUSES[0];
  return (
    <button
      onClick={onClick}
      title="Click để đổi trạng thái"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 99, cursor: 'pointer',
        fontSize: 11, fontWeight: 700,
        color: cfg.color, background: cfg.bg,
        border: `1.5px solid ${cfg.color}55`,
        fontFamily: 'inherit', transition: 'opacity .1s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '.72'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <span>{cfg.icon}</span> {cfg.label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STATUS DROPDOWN (position fixed — không bị clip bởi overflow)
═══════════════════════════════════════════════════════════════ */
export function StatusDropdown({ lead, top, left, onClose, onSelect }) {
  const ref = useRef(null);

  useEffect(() => {
    const tid = setTimeout(() => {
      const fn = (e) => {
        if (ref.current && !ref.current.contains(e.target)) onClose();
      };
      document.addEventListener('mousedown', fn);
      ref.current._cleanup = () => document.removeEventListener('mousedown', fn);
    }, 0);
    return () => {
      clearTimeout(tid);
      ref.current?._cleanup?.();
    };
  }, []);

  const safeLeft = Math.min(left, window.innerWidth - 230);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', top, left: safeLeft,
        zIndex: 800,
        background: '#fff', borderRadius: 10,
        boxShadow: '0 8px 30px rgba(0,0,0,.18)',
        border: '1px solid #e5e7eb',
        padding: 5, minWidth: 218,
      }}
    >
      {CONTACT_STATUSES.map(s => {
        const active = (lead.contactStatus || 'chua_lh') === s.value;
        return (
          <button
            key={s.value}
            onClick={() => onSelect(s.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              width: '100%', textAlign: 'left',
              padding: '8px 10px', borderRadius: 7, border: 'none',
              background: active ? s.bg : 'transparent',
              color: active ? s.color : '#374151',
              fontWeight: active ? 700 : 500,
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f9fafb'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ width: 18, textAlign: 'center', fontSize: 13 }}>{s.icon}</span>
            <span style={{ flex: 1 }}>{s.label}</span>
            {active && <span style={{ fontSize: 11, color: s.color }}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}
