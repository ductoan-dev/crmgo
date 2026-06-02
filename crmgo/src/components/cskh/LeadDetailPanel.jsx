import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore } from '../../store';
import { CONTACT_STATUSES, TEMP_CFG, CHANNEL_CFG } from '../../utils/constants';
import { daysUntilBirthday } from './helpers';
import { TempBadge, InfoRow } from './StatusBadge';

/* ═══════════════════════════════════════════════════════════════
   PANEL CHI TIẾT
   — Hiển thị thông tin đầy đủ + đính kèm + lịch sử chăm sóc CSKH
═══════════════════════════════════════════════════════════════ */
export default function LeadDetailPanel({ lead: initialLead, onClose }) {
  const user       = useAuthStore(s => s.user);
  const updateLead = useDataStore(s => s.updateLead);

  const [lead,     setLead]     = useState(initialLead);
  const [attName,  setAttName]  = useState('');
  const [attUrl,   setAttUrl]   = useState('');
  const [callDate, setCallDate] = useState(new Date().toISOString().slice(0, 10));
  const [callNote, setCallNote] = useState('');
  const [addingCall, setAddingCall] = useState(false);

  const attachments = lead.attachments || [];
  const cskhCalls   = (Array.isArray(lead.cskhCalls) ? lead.cskhCalls : []).slice().sort((a, b) =>
    new Date(b.callDate || b.createdAt) - new Date(a.callDate || a.createdAt)
  );

  const statusCfg  = CONTACT_STATUSES.find(s => s.value === lead.contactStatus) || CONTACT_STATUSES[0];
  const tempCfg    = TEMP_CFG[lead.temp || 'warm'];
  const channelCfg = CHANNEL_CFG[lead.channel] || null;
  const bdayDays   = daysUntilBirthday(lead.birthday);

  const addAtt = async () => {
    if (!attUrl.trim()) { toast.error('Nhập URL / Link trước'); return; }
    const updated = [...attachments, {
      id: Date.now(), type: 'link',
      url:     attUrl.trim(),
      name:    attName.trim() || attUrl.trim(),
      addedAt: new Date().toISOString(),
    }];
    await updateLead(lead.id, { attachments: updated });
    setLead(p => ({ ...p, attachments: updated }));
    setAttUrl(''); setAttName('');
    toast.success('Đã thêm đính kèm');
  };

  const removeAtt = async (id) => {
    const updated = attachments.filter(a => a.id !== id);
    await updateLead(lead.id, { attachments: updated });
    setLead(p => ({ ...p, attachments: updated }));
    toast.success('Đã xoá đính kèm');
  };

  const handleAddCall = async () => {
    if (!callNote.trim()) { toast.error('Vui lòng nhập ghi chú cuộc gọi'); return; }
    setAddingCall(true);
    try {
      const newCall = {
        id:        Date.now(),
        callDate:  callDate,
        callNote:  callNote.trim(),
        callBy:    user?.name || 'CSKH',
        createdAt: new Date().toISOString(),
      };
      const updatedCalls = [...(Array.isArray(lead.cskhCalls) ? lead.cskhCalls : []), newCall];
      await updateLead(lead.id, { cskhCalls: updatedCalls });
      setLead(p => ({ ...p, cskhCalls: updatedCalls }));
      setCallNote('');
      setCallDate(new Date().toISOString().slice(0, 10));
      toast.success('✅ Đã lưu lịch chăm sóc');
    } catch {
      toast.error('Không thể lưu');
    } finally {
      setAddingCall(false);
    }
  };

  const removeCall = async (id) => {
    const updated = (Array.isArray(lead.cskhCalls) ? lead.cskhCalls : []).filter(c => c.id !== id);
    await updateLead(lead.id, { cskhCalls: updated });
    setLead(p => ({ ...p, cskhCalls: updated }));
    toast.success('Đã xoá');
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580,
        boxShadow: '0 32px 80px rgba(0,0,0,.22)',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          padding: '18px 24px 14px',
          background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
          borderRadius: '16px 16px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{lead.name}</div>
            {lead.company && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>🏢 {lead.company}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>

          {/* Cảnh báo sinh nhật gần */}
          {bdayDays !== null && bdayDays <= 5 && (
            <div style={{
              marginBottom: 16, padding: '12px 16px',
              background: bdayDays === 0 ? '#fdf2f8' : '#fffbeb',
              border: `1.5px solid ${bdayDays === 0 ? '#f9a8d4' : '#fcd34d'}`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>{bdayDays === 0 ? '🎉' : '🎂'}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: bdayDays === 0 ? '#9d174d' : '#92400e' }}>
                  {bdayDays === 0
                    ? 'Hôm nay là sinh nhật khách hàng!'
                    : `Còn ${bdayDays} ngày nữa là sinh nhật!`
                  }
                </div>
                <div style={{ fontSize: 11, color: '#78716c', marginTop: 1 }}>
                  Chuẩn bị lời chúc + voucher / quà tặng cho {lead.name}
                </div>
              </div>
            </div>
          )}

          {/* Thông tin cơ bản */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <InfoRow icon="📞" label="Số điện thoại" value={lead.phone} />
            <InfoRow icon="✉️" label="Email"          value={lead.email} />
            <InfoRow icon="📍" label="Khu vực"        value={lead.area} />
            <InfoRow icon="🛍️" label="Sản phẩm"       value={lead.product} />
            <InfoRow icon="👤" label="NV phụ trách"   value={lead.assignedTo} />
            {lead.nganh    && <InfoRow icon="🏭" label="Ngành"        value={lead.nganh} />}
            {lead.nganSach && <InfoRow icon="💰" label="Ngân sách"    value={lead.nganSach} />}
            {lead.thoiDiem && <InfoRow icon="⏰" label="Thời điểm"    value={lead.thoiDiem} />}
            {lead.birthday && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 3 }}>🎂 Sinh nhật</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                  {lead.birthday}
                  {bdayDays !== null && (
                    <span style={{
                      marginLeft: 8, fontSize: 11,
                      color: bdayDays <= 5 ? '#db2777' : '#6b7280',
                    }}>
                      ({bdayDays === 0 ? 'Hôm nay!' : `còn ${bdayDays} ngày`})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Kênh */}
          {channelCfg && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 5 }}>📣 Kênh tiếp cận</div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 11px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                color: channelCfg.color, background: channelCfg.bg, border: `1px solid ${channelCfg.color}30`,
              }}>
                {channelCfg.icon} {channelCfg.label}
              </span>
            </div>
          )}

          {/* Trạng thái */}
          <div style={{
            padding: '14px 16px', borderRadius: 10, marginBottom: 18,
            background: '#f9fafb', border: '1px solid #e5e7eb',
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#9ca3af',
              textTransform: 'uppercase', letterSpacing: .5, marginBottom: 9,
            }}>
              Trạng thái liên hệ — 🔒 KD cập nhật · CSKH chỉ xem
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                color: statusCfg.color, background: statusCfg.bg,
                border: `1.5px solid ${statusCfg.color}44`,
              }}>
                {statusCfg.icon} {statusCfg.label}
              </span>
              <TempBadge temp={lead.temp} />
            </div>
            {lead.contactNote && (
              <div style={{
                marginTop: 9, fontSize: 12, color: '#92400e',
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 6, padding: '7px 10px',
              }}>
                📝 {lead.contactNote}
              </div>
            )}
          </div>

          {/* Ghi chú */}
          {lead.note && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 5 }}>📋 Ghi chú / Nhu cầu</div>
              <div style={{
                fontSize: 13, color: '#374151', lineHeight: 1.6,
                background: '#f9fafb', borderRadius: 8, padding: '10px 12px', border: '1px solid #e5e7eb',
              }}>
                {lead.note}
              </div>
            </div>
          )}

          {/* ── LỊCH SỬ CHĂM SÓC CSKH ── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>📞 Lịch sử chăm sóc CSKH</span>
              {cskhCalls.length > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#2563eb',
                  background: '#eff6ff', border: '1px solid #bfdbfe',
                  borderRadius: 99, padding: '1px 8px',
                }}>
                  {cskhCalls.length} lần
                </span>
              )}
            </div>

            {/* Form thêm call */}
            <div style={{
              background: '#f8fafc', border: '1.5px solid #e2e8f0',
              borderRadius: 10, padding: 14, marginBottom: 14,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10 }}>
                + Ghi nhận lần chăm sóc mới
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>NGÀY GỌI</div>
                  <input
                    type="date"
                    className="fi"
                    style={{ marginTop: 0 }}
                    value={callDate}
                    onChange={e => setCallDate(e.target.value)}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>GHI CHÚ KẾT QUẢ CUỘC GỌI <span style={{ color: 'red' }}>*</span></div>
                  <textarea
                    className="fi"
                    rows={3}
                    placeholder="Khách hàng phản hồi thế nào? Nhu cầu mới? Hẹn gọi lại...?"
                    value={callNote}
                    onChange={e => setCallNote(e.target.value)}
                    style={{ resize: 'none', marginTop: 0 }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleAddCall}
                  disabled={addingCall || !callNote.trim()}
                  style={{
                    padding: '7px 18px', borderRadius: 8, fontWeight: 700,
                    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                    background: !callNote.trim() ? '#e2e8f0' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                    color: !callNote.trim() ? '#94a3b8' : '#fff',
                  }}
                >
                  {addingCall ? '⏳...' : '💾 Lưu lịch chăm sóc'}
                </button>
              </div>
            </div>

            {/* Danh sách calls */}
            {cskhCalls.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '20px 0', color: '#9ca3af',
                fontSize: 12, fontStyle: 'italic', background: '#fafafa',
                borderRadius: 8, border: '1px dashed #e2e8f0',
              }}>
                📭 Chưa có lịch sử chăm sóc · Ghi nhận ở trên sau mỗi lần gọi điện
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cskhCalls.map((c, idx) => (
                  <div key={c.id} style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: idx === 0 ? '#eff6ff' : '#f9fafb',
                    border: idx === 0 ? '1.5px solid #bfdbfe' : '1px solid #e5e7eb',
                    position: 'relative',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: '#1d4ed8',
                            background: '#eff6ff', border: '1px solid #bfdbfe',
                            borderRadius: 5, padding: '1px 8px',
                          }}>
                            📅 {c.callDate}
                          </span>
                          <span style={{ fontSize: 11, color: '#6b7280' }}>
                            bởi {c.callBy}
                          </span>
                          {idx === 0 && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: '#16a34a',
                              background: '#f0fdf4', border: '1px solid #bbf7d0',
                              borderRadius: 4, padding: '1px 6px',
                            }}>
                              Mới nhất
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: 13, color: '#374151', lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                        }}>
                          {c.callNote}
                        </div>
                      </div>
                      <button
                        onClick={() => removeCall(c.id)}
                        title="Xoá"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#9ca3af', fontSize: 13, padding: '2px 4px',
                          borderRadius: 4, flexShrink: 0,
                          transition: 'color .1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                        onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── ĐÍNH KÈM ── */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 10 }}>
              📎 Tài liệu / Hình ảnh / Link khách hàng cung cấp
            </div>
            <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
              <input className="fi" style={{ flex: 1, marginTop: 0 }}
                placeholder="Tên / Mô tả"
                value={attName} onChange={e => setAttName(e.target.value)} />
              <input className="fi" style={{ flex: 2, marginTop: 0 }}
                placeholder="URL / Link"
                value={attUrl} onChange={e => setAttUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAtt(); } }} />
              <button type="button" onClick={addAtt} style={{
                padding: '0 14px', borderRadius: 8, border: 'none',
                background: '#2563eb', color: '#fff', fontWeight: 700,
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}>+ Thêm</button>
            </div>
            {attachments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {attachments.map(a => (
                  <div key={a.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 8,
                    background: '#eff6ff', border: '1.5px solid #bfdbfe',
                  }}>
                    <span style={{ fontSize: 18 }}>🔗</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a href={a.url} target="_blank" rel="noreferrer" style={{
                        fontSize: 13, fontWeight: 600, color: '#1d4ed8', textDecoration: 'none',
                        display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {a.name}
                      </a>
                      {a.name !== a.url && (
                        <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.url}
                        </div>
                      )}
                    </div>
                    <button onClick={() => removeAtt(a.id)} style={{
                      background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6,
                      cursor: 'pointer', color: '#dc2626', fontSize: 11, fontWeight: 700,
                      padding: '3px 8px', fontFamily: 'inherit',
                    }}>Xoá</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 12, fontStyle: 'italic' }}>
                📭 Chưa có tài liệu · Nhập link ở trên để thêm
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
