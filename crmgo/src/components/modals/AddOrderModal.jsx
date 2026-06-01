import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useDataStore, useUIStore } from '../../store';
import { ORDER_TYPES, CATS } from '../../utils/constants';
import { fmt, fmtNum, parseNum } from '../../utils/helpers';

const PAY_METHODS = ['Chuyển khoản', 'Tiền mặt', 'Công nợ', 'COD'];
const VAT_RATES   = [
  { label: 'Không VAT', value: 0 },
  { label: 'VAT 8%',    value: 8 },
  { label: 'VAT 10%',   value: 10 },
];

// price & qty lưu dạng string để không bị mất focus khi gõ
const emptyLine = () => ({
  id:    Date.now() + Math.random(),
  name:  '',
  unit:  'cái',
  qty:   '1',    // string — tránh snap về 1 khi xoá
  price: '',     // string — tránh cursor nhảy khi format
});

// Helper: lấy giá trị số từ dòng sản phẩm
const lineQty   = (l) => Math.max(1, parseInt(l.qty,  10) || 0);
const linePrice = (l) => parseNum(l.price);

export default function AddOrderModal({ initialOppId = null }) {
  const user       = useAuthStore(s => s.user);
  const opps       = useDataStore(s => s.opps);
  const addOrder   = useDataStore(s => s.addOrder);
  const closeModal = useUIStore(s => s.closeModal);
  const modal      = useUIStore(s => s.modal);

  // Dữ liệu truyền vào từ modal (oppId hoặc từ lead)
  const oppIdFromModal = modal?.data?.oppId  ?? initialOppId;
  const nameFromModal  = modal?.data?.name   || '';
  const phoneFromModal = modal?.data?.phone  || '';

  const [form, setForm] = useState({
    oppId:     oppIdFromModal ? Number(oppIdFromModal) : '',
    name:      nameFromModal,
    phone:     phoneFromModal,
    address:   '',
    orderType: 'In nhanh',
    payMethod: 'Chuyển khoản',
    deposit:   '',   // string
    vatRate:   0,
    note:      '',
    // ── VAT invoice info ──────────────────────────────────────
    vatRequired:  false,  // true = lấy hoá đơn VAT
    vatCompany:   '',     // Tên đơn vị trên hoá đơn
    vatTaxCode:   '',     // MST
    vatAddress:   '',     // Địa chỉ xuất hoá đơn
    vatEmail:     '',     // Email nhận hoá đơn điện tử
    vatBuyer:     '',     // Người mua (nếu cá nhân)
  });
  const [lines, setLines] = useState([emptyLine()]);
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  // Auto-fill từ cơ hội đã chọn
  const selectedOpp = useMemo(() =>
    opps.find(o => o.id === Number(form.oppId)), [opps, form.oppId]
  );

  const handleOppChange = (oppId) => {
    const opp = opps.find(o => o.id === Number(oppId));
    if (opp) {
      setForm(prev => ({
        ...prev,
        oppId:  Number(oppId),
        name:   opp.khachHang || opp.customer_name || prev.name,
        phone:  opp.soDienThoai || prev.phone,
        // KHÔNG override orderType — user chọn thủ công từ dropdown CATS
      }));
    } else {
      setForm(prev => ({ ...prev, oppId: '', name: '', phone: '' }));
    }
  };

  // Line operations
  const setLine    = (id, field, val) =>
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: val } : l));
  const addLine    = () => setLines(prev => [...prev, emptyLine()]);
  const removeLine = (id) =>
    setLines(prev => prev.length > 1 ? prev.filter(l => l.id !== id) : prev);

  // Format giá khi blur (mất focus) — chỉ lúc đó mới thêm dấu chấm
  const handlePriceBlur = (id, rawVal) => {
    const num = parseNum(rawVal);
    setLine(id, 'price', num > 0 ? fmtNum(num) : '');
  };

  // Format tiền cọc khi blur
  const handleDepositBlur = (rawVal) => {
    const num = parseNum(rawVal);
    set('deposit', num > 0 ? fmtNum(num) : '');
  };

  // ── Tính tiền ────────────────────────────────────────────────
  const subtotal   = lines.reduce((s, l) => s + lineQty(l) * linePrice(l), 0);
  const vatAmount  = Math.round(subtotal * (form.vatRate || 0) / 100);
  const grandTotal = subtotal + vatAmount;
  const depositAmt = parseNum(form.deposit) || 0;
  const remaining  = grandTotal - depositAmt;

  const handleSave = async () => {
    if (!form.name.trim())               { toast.error('Vui lòng nhập tên khách hàng'); return; }
    if (lines.some(l => !l.name.trim())) { toast.error('Vui lòng nhập tên sản phẩm cho tất cả dòng'); return; }
    if (form.vatRequired && !form.vatCompany.trim()) { toast.error('Nhập tên đơn vị trên hoá đơn VAT'); return; }
    if (form.vatRequired && !form.vatTaxCode.trim()) { toast.error('Nhập mã số thuế (MST)'); return; }
    if (form.vatRequired && !form.vatAddress.trim()) { toast.error('Nhập địa chỉ xuất hoá đơn VAT'); return; }
    setSaving(true);
    try {
      // Normalize lines về số trước khi lưu
      const normalizedLines = lines.map(l => ({
        ...l,
        qty:   lineQty(l),
        price: linePrice(l),
      }));
      await addOrder({
        ...form,
        customerName: form.name,
        oppId:        form.oppId || null,
        emp:          user?.name,
        lines:        normalizedLines,
        subtotal,
        vatRate:      form.vatRate,
        vatAmount,
        grandTotal,
        deposit:      depositAmt,
        orderType:    form.orderType,
        type:         form.orderType,
      });
      toast.success(`✅ Đã tạo đơn hàng cho "${form.name}"`);
      closeModal();
    } catch (e) {
      toast.error(`Lỗi: ${e.message || 'Có lỗi khi tạo đơn hàng'}`);
    } finally {
      setSaving(false);
    }
  };

  // Style chung cho input trong bảng sản phẩm
  const lineInputStyle = { padding: '6px 10px', fontSize: 13 };

  return (
    <div>
      <div className="modal-title">📋 Tạo Đơn Hàng</div>

      {/* Liên kết cơ hội */}
      <div className="fi-group" style={{ marginBottom: 16 }}>
        <label className="fi-label">Từ cơ hội (nếu có)</label>
        <select className="fi" value={form.oppId} onChange={e => handleOppChange(e.target.value)}>
          <option value="">-- Tạo đơn độc lập --</option>
          {opps.filter(o => o.status !== 6 && o.status !== 7).map(o => (
            <option key={o.id} value={o.id}>
              {o.code} — {o.khachHang || o.chungloai}
            </option>
          ))}
        </select>
      </div>

      <div className="form-grid">
        {/* Tên khách hàng */}
        <div className="fi-group">
          <label className="fi-label">Tên khách hàng <span style={{ color: 'red' }}>*</span></label>
          <input
            className="fi"
            placeholder="Nguyễn Văn A / Công ty ABC"
            value={form.name}
            onChange={e => set('name', e.target.value)}
          />
        </div>

        {/* SĐT */}
        <div className="fi-group">
          <label className="fi-label">Số điện thoại</label>
          <input
            className="fi"
            placeholder="0912 345 678"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
          />
        </div>

        {/* Địa chỉ giao hàng */}
        <div className="fi-group" style={{ gridColumn: '1 / -1' }}>
          <label className="fi-label">Địa chỉ giao hàng</label>
          <input
            className="fi"
            placeholder="Số nhà, tên đường, quận, thành phố..."
            value={form.address}
            onChange={e => set('address', e.target.value)}
          />
        </div>

        {/* Loại đơn */}
        <div className="fi-group">
          <label className="fi-label">Loại đơn hàng</label>
          <select className="fi" value={form.orderType} onChange={e => set('orderType', e.target.value)}>
            {CATS.map(c => (
              <option key={c} value={c}>
                {c}{c === 'In nhanh' ? ' ⚡ (báo giá 24h)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Thanh toán */}
        <div className="fi-group">
          <label className="fi-label">Phương thức thanh toán</label>
          <select className="fi" value={form.payMethod} onChange={e => set('payMethod', e.target.value)}>
            {PAY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Tiền cọc — raw string, format khi blur */}
        <div className="fi-group">
          <label className="fi-label">Tiền cọc (₫)</label>
          <input
            className="fi"
            placeholder="0"
            value={form.deposit}
            onChange={e => set('deposit', e.target.value)}
            onBlur={e  => handleDepositBlur(e.target.value)}
            inputMode="numeric"
          />
        </div>
      </div>

      {/* ── Dòng sản phẩm ── */}
      <div style={{ margin: '16px 0 8px', fontWeight: 700, fontSize: 13 }}>
        📦 Sản phẩm / Dịch vụ
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 90px 72px 140px 32px',
          gap: 6, padding: '8px 12px',
          background: '#f8fafc', borderBottom: '1px solid var(--border)',
          fontSize: 11, fontWeight: 700, color: 'var(--text2)',
        }}>
          <span>Tên sản phẩm / dịch vụ</span>
          <span>Đơn vị</span>
          <span style={{ textAlign: 'right' }}>Số lượng</span>
          <span style={{ textAlign: 'right' }}>Đơn giá (₫)</span>
          <span />
        </div>

        {lines.map((line, idx) => (
          <div key={line.id} style={{
            display: 'grid', gridTemplateColumns: '1fr 90px 72px 140px 32px',
            gap: 6, padding: '6px 12px',
            borderBottom: idx < lines.length - 1 ? '1px solid #f1f5f9' : 'none',
            alignItems: 'center',
          }}>
            {/* Tên sản phẩm */}
            <input
              className="fi"
              style={lineInputStyle}
              placeholder={`Sản phẩm ${idx + 1}...`}
              value={line.name}
              onChange={e => setLine(line.id, 'name', e.target.value)}
            />

            {/* Đơn vị tính */}
            <input
              className="fi"
              style={lineInputStyle}
              placeholder="cái"
              value={line.unit}
              onChange={e => setLine(line.id, 'unit', e.target.value)}
            />

            {/* Số lượng — lưu string, không dùng type=number để tránh snap */}
            <input
              className="fi"
              style={{ ...lineInputStyle, textAlign: 'right' }}
              placeholder="1"
              inputMode="numeric"
              value={line.qty}
              onChange={e => setLine(line.id, 'qty', e.target.value.replace(/[^\d]/g, ''))}
              onBlur={e  => {
                const n = parseInt(e.target.value, 10);
                setLine(line.id, 'qty', String(n > 0 ? n : 1));
              }}
            />

            {/* Đơn giá — lưu string, format khi blur */}
            <input
              className="fi"
              style={{ ...lineInputStyle, textAlign: 'right' }}
              placeholder="0"
              inputMode="numeric"
              value={line.price}
              onChange={e => setLine(line.id, 'price', e.target.value.replace(/[^\d.]/g, ''))}
              onFocus={e  => {
                // Khi focus: bỏ dấu chấm để gõ thoải mái
                const raw = String(parseNum(e.target.value) || '');
                setLine(line.id, 'price', raw === '0' ? '' : raw);
              }}
              onBlur={e => handlePriceBlur(line.id, e.target.value)}
            />

            {/* Xoá dòng */}
            <button
              onClick={() => removeLine(line.id)}
              style={{
                background: 'none', border: 'none',
                color: lines.length === 1 ? '#cbd5e1' : '#ef4444',
                fontSize: 16, cursor: lines.length === 1 ? 'default' : 'pointer',
                padding: 0, lineHeight: 1,
              }}
              disabled={lines.length === 1}
            >✕</button>
          </div>
        ))}

        {/* ── Tổng / VAT ── */}
        <div style={{ borderTop: '1px solid var(--border)', background: '#f8fafc' }}>

          {/* VAT selector + tạm tính */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderBottom: '1px solid #f1f5f9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>Thuế VAT:</span>
              <div style={{ display: 'flex', gap: 5 }}>
                {VAT_RATES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => set('vatRate', r.value)}
                    style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all .1s',
                      border: form.vatRate === r.value ? '2px solid var(--primary)' : '1.5px solid #e2e8f0',
                      background: form.vatRate === r.value ? 'var(--primary-pale)' : '#fff',
                      color: form.vatRate === r.value ? 'var(--primary)' : '#64748b',
                    }}
                  >{r.label}</button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>
              Tạm tính: <strong>{fmt(subtotal)}</strong>
            </div>
          </div>

          {/* Tổng + VAT + Cọc + Còn lại */}
          <div style={{ padding: '8px 12px' }}>
            {form.vatRate > 0 && (
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: 12,
                fontSize: 12, color: '#64748b', marginBottom: 6,
              }}>
                <span>VAT {form.vatRate}%:</span>
                <span style={{ fontWeight: 700, minWidth: 110, textAlign: 'right' }}>
                  + {fmt(vatAmount)}
                </span>
              </div>
            )}

            <div style={{
              display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12,
              fontSize: 14,
              paddingBottom: depositAmt > 0 ? 8 : 0,
              borderBottom:  depositAmt > 0 ? '1px dashed #e2e8f0' : 'none',
              marginBottom:  depositAmt > 0 ? 8 : 0,
            }}>
              <span style={{ color: 'var(--text2)', fontWeight: 600 }}>Tổng cộng:</span>
              <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 18, minWidth: 110, textAlign: 'right' }}>
                {fmt(grandTotal)}
              </span>
            </div>

            {depositAmt > 0 && (
              <>
                <div style={{
                  display: 'flex', justifyContent: 'flex-end', gap: 12,
                  fontSize: 12, color: '#64748b', marginBottom: 6,
                }}>
                  <span>Đã cọc:</span>
                  <span style={{ fontWeight: 700, color: '#16a34a', minWidth: 110, textAlign: 'right' }}>
                    − {fmt(depositAmt)}
                  </span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12,
                  fontSize: 14, padding: '6px 10px', borderRadius: 8,
                  background: remaining > 0 ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${remaining > 0 ? '#fecaca' : '#bbf7d0'}`,
                }}>
                  <span style={{ fontWeight: 700, color: remaining > 0 ? '#dc2626' : '#16a34a' }}>
                    {remaining > 0 ? '💳 Còn lại:' : '✅ Đã thanh toán đủ'}
                  </span>
                  {remaining > 0 && (
                    <span style={{ fontWeight: 800, color: '#dc2626', fontSize: 18, minWidth: 110, textAlign: 'right' }}>
                      {fmt(remaining)}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <button className="btn btn-ghost btn-sm" onClick={addLine} style={{ marginBottom: 12 }}>
        + Thêm dòng sản phẩm
      </button>

      {/* ── Thông tin xuất hoá đơn VAT ── */}
      <div style={{
        border: '1px solid #e2e8f0', borderRadius: 10,
        overflow: 'hidden', marginBottom: 14,
      }}>
        {/* Toggle header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: form.vatRequired ? '#f0fdf4' : '#f8fafc',
          cursor: 'pointer',
        }}
          onClick={() => set('vatRequired', !form.vatRequired)}
        >
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
              🧾 Hoá đơn VAT
            </span>
            <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>
              {form.vatRequired ? 'Khách lấy hoá đơn VAT' : 'Khách không lấy hoá đơn'}
            </span>
          </div>
          <div style={{
            width: 40, height: 22, borderRadius: 11, position: 'relative',
            background: form.vatRequired ? '#16a34a' : '#cbd5e1',
            transition: 'background .2s', cursor: 'pointer', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', top: 3, left: form.vatRequired ? 20 : 3,
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
            }} />
          </div>
        </div>

        {/* TH2: không lấy — chỉ hiện badge */}
        {!form.vatRequired && (
          <div style={{ padding: '8px 14px', background: '#fafafa' }}>
            <span style={{
              fontSize: 11, color: '#64748b', fontWeight: 600,
              padding: '3px 10px', background: '#f1f5f9',
              borderRadius: 99, border: '1px solid #e2e8f0',
            }}>
              ⊘ Không xuất hoá đơn VAT
            </span>
          </div>
        )}

        {/* TH1: lấy VAT — nhập đầy đủ thông tin */}
        {form.vatRequired && (
          <div style={{ padding: '14px', background: '#fff' }}>
            <div className="form-grid">
              <div className="fi-group" style={{ gridColumn: '1 / -1' }}>
                <label className="fi-label">Tên đơn vị trên hoá đơn <span style={{ color: 'red' }}>*</span></label>
                <input
                  className="fi"
                  placeholder="Công ty TNHH / Cá nhân..."
                  value={form.vatCompany}
                  onChange={e => set('vatCompany', e.target.value)}
                />
              </div>
              <div className="fi-group">
                <label className="fi-label">Mã số thuế (MST) <span style={{ color: 'red' }}>*</span></label>
                <input
                  className="fi"
                  placeholder="0123456789"
                  value={form.vatTaxCode}
                  onChange={e => set('vatTaxCode', e.target.value.replace(/\D/g, ''))}
                  maxLength={14}
                />
              </div>
              <div className="fi-group">
                <label className="fi-label">Email nhận hoá đơn điện tử</label>
                <input
                  className="fi"
                  type="email"
                  placeholder="ketoan@company.com"
                  value={form.vatEmail}
                  onChange={e => set('vatEmail', e.target.value)}
                />
              </div>
              <div className="fi-group" style={{ gridColumn: '1 / -1' }}>
                <label className="fi-label">Địa chỉ xuất hoá đơn <span style={{ color: 'red' }}>*</span></label>
                <input
                  className="fi"
                  placeholder="Số nhà, tên đường, quận, tỉnh/thành phố..."
                  value={form.vatAddress}
                  onChange={e => set('vatAddress', e.target.value)}
                />
              </div>
              <div className="fi-group">
                <label className="fi-label">Người mua (nếu cá nhân)</label>
                <input
                  className="fi"
                  placeholder="Để trống nếu xuất theo công ty"
                  value={form.vatBuyer}
                  onChange={e => set('vatBuyer', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ghi chú */}
      <div className="fi-group">
        <label className="fi-label">Ghi chú đơn hàng</label>
        <textarea
          className="fi"
          rows={2}
          placeholder="Yêu cầu đặc biệt, hạn giao hàng..."
          value={form.note}
          onChange={e => set('note', e.target.value)}
          style={{ resize: 'vertical' }}
        />
      </div>

      {/* Actions */}
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={closeModal}>Huỷ</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving
            ? '⏳ Đang tạo...'
            : depositAmt > 0
              ? `📋 Tạo đơn · Còn lại ${fmt(remaining)}`
              : `📋 Tạo đơn · ${fmt(grandTotal)}`}
        </button>
      </div>
    </div>
  );
}
