import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CONTACT_STATUSES } from '../../utils/constants';

/* ─────────────────────────────────────────────────────────────
   Trạng thái bắt buộc hiện popup nhập lý do
───────────────────────────────────────────────────────────── */
export const NEED_NOTE_STATUSES = ['ko_lh', 'ko_nghe', 'ko_trien'];

export const NOTE_PRESETS = {
  ko_lh: [
    'Số máy không liên lạc được',
    'Thuê bao không liên lạc được',
    'Số máy sai / không tồn tại',
    'Gọi nhiều lần không nghe',
    'Zalo không nhận',
    'Email không có phản hồi',
  ],
  ko_nghe: ['Máy bận', 'Không nghe — lần 1', 'Không nghe — lần 2', 'Số máy không đúng', 'Máy tắt'],
  ko_trien: ['Không có nhu cầu', 'Đã có nhà cung cấp', 'Ngân sách không phù hợp', 'Chưa có kế hoạch', 'Liên hệ lại sau'],
};

export const STATUS_NOTE_LABEL = {
  ko_lh:    'Lý do không liên hệ được',
  ko_nghe:  'Lý do không nghe máy',
  ko_trien: 'Lý do không triển khai',
};

/* ═══════════════════════════════════════════════════════════════
   POPUP NHẬP LÝ DO
═══════════════════════════════════════════════════════════════ */
function ContactNotePopup({ leadName, status, prevNote, onSave, onSkip }) {
  const [note, setNote] = useState(prevNote || '');
  const taRef = useRef(null);

  const statusCfg = CONTACT_STATUSES.find(s => s.value === status);
  const presets   = NOTE_PRESETS[status] || [];
  const label     = STATUS_NOTE_LABEL[status] || 'Ghi lý do';
  const isKoLh    = status === 'ko_lh';
  const accentClr = isKoLh ? '#dc2626' : '#d97706';
  const headerBg  = isKoLh ? '#fef2f2' : '#fffbeb';

  useEffect(() => {
    setTimeout(() => taRef.current?.focus(), 80);
    const esc = (e) => { if (e.key === 'Escape') onSkip(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);

  const togglePreset = (p) => {
    setNote(prev => {
      const lines = prev.trim() ? prev.trim().split('\n') : [];
      if (lines.includes(p)) {
        return lines.filter(l => l !== p).join('\n');
      } else {
        return [...lines, p].join('\n');
      }
    });
    taRef.current?.focus();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(4px)',
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onSkip(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460,
        boxShadow: '0 32px 80px rgba(0,0,0,.25)',
        overflow: 'hidden',
        animation: 'modalIn .18s ease',
      }}>
        <div style={{
          padding: '18px 20px 14px',
          background: headerBg,
          borderBottom: `2px solid ${accentClr}20`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: accentClr, marginBottom: 4 }}>
              {isKoLh ? '🚫 Không liên hệ được' : '📝 Ghi lý do liên hệ'}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              Khách hàng: <strong style={{ color: '#111827' }}>{leadName}</strong>
              {statusCfg && (
                <span style={{ marginLeft: 6, fontWeight: 700, color: accentClr }}>
                  → {statusCfg.icon} {statusCfg.label}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onSkip}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 20, color: '#9ca3af', lineHeight: 1, padding: 0,
            }}
          >✕</button>
        </div>

        <div style={{ padding: '18px 20px 14px' }}>
          {presets.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 7, textTransform: 'uppercase', letterSpacing: .5 }}>
                Chọn nhanh
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {presets.map(p => {
                  const selected = note.split('\n').map(l => l.trim()).includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePreset(p)}
                      style={{
                        padding: '5px 11px', fontSize: 11, fontWeight: 600,
                        borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
                        border: `1.5px solid ${selected ? accentClr : '#e5e7eb'}`,
                        background: selected ? (isKoLh ? '#fef2f2' : '#fffbeb') : '#f9fafb',
                        color: selected ? accentClr : '#6b7280',
                        transition: 'all .1s',
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label style={{
              fontSize: 11, fontWeight: 700, color: '#6b7280',
              display: 'block', marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: .5,
            }}>
              {label}
            </label>
            <textarea
              ref={taRef}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Nhập lý do cụ thể... (không bắt buộc)"
              rows={3}
              style={{
                width: '100%', resize: 'vertical',
                padding: '10px 13px', fontSize: 13,
                border: `1.5px solid #e5e7eb`, borderRadius: 9,
                fontFamily: 'inherit', outline: 'none',
                lineHeight: 1.6, transition: 'border-color .15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = accentClr}
              onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>

        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #f3f4f6',
          background: '#f9fafb',
          display: 'flex', gap: 8, justifyContent: 'flex-end',
        }}>
          <button
            onClick={onSkip}
            style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 600,
              background: 'transparent', border: '1.5px solid #e5e7eb',
              borderRadius: 8, cursor: 'pointer', color: '#6b7280', fontFamily: 'inherit',
            }}
          >
            Bỏ qua
          </button>
          <button
            onClick={() => onSave(note.trim())}
            style={{
              padding: '8px 20px', fontSize: 13, fontWeight: 700,
              background: accentClr, border: 'none',
              borderRadius: 8, cursor: 'pointer', color: '#fff', fontFamily: 'inherit',
              boxShadow: `0 2px 8px ${accentClr}40`,
            }}
          >
            💾 Lưu lý do
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContactNotePopup;
