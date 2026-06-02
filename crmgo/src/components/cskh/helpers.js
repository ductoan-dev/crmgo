import {
  DEMO_ACCOUNTS,
  CHANNEL_CFG,
  CONTACT_STATUSES,
} from '../../utils/constants';

// ── Derived constants ──────────────────────────────────────────
export const SALES_LIST = DEMO_ACCOUNTS.filter(a => a.role === 'sales');
export const CHANNELS   = Object.entries(CHANNEL_CFG).map(([v, c]) => ({ value: v, label: `${c.icon} ${c.label}` }));

export const LOAI_KHACH = [
  { value: 'doanh_nghiep', label: '🏢 Doanh nghiệp' },
  { value: 'ca_nhan',      label: '👤 Cá nhân' },
  { value: 'ho_kinh_doanh',label: '🏪 Hộ kinh doanh' },
  { value: 'to_chuc',      label: '🏛️ Tổ chức / NGO' },
];

export const NGANH_LIST = [
  'Bán lẻ / Thương mại','Sản xuất','Thực phẩm & Đồ uống',
  'Nông nghiệp','Dược phẩm / Y tế','Giáo dục',
  'Khách sạn / Du lịch','Nhà hàng / F&B','Xây dựng / Vật liệu',
  'Logistics / Vận chuyển','Tài chính / Ngân hàng','Bất động sản',
  'Công nghệ','Khác',
];

export const NGAN_SACH_LIST = [
  'Chưa xác định','Dưới 5 triệu','5 – 20 triệu',
  '20 – 50 triệu','50 – 100 triệu','Trên 100 triệu',
];

export const THOI_DIEM_LIST = [
  'Chưa xác định','Ngay lập tức','Trong tuần này',
  'Trong tháng này','1 – 3 tháng tới','Trên 3 tháng',
];

export const UU_TIEN_LIST = [
  { value: 'cao',        label: '🔴 Cao' },
  { value: 'trung_binh', label: '🟡 Trung bình' },
  { value: 'thap',       label: '🟢 Thấp' },
];

export const CSKH_STATUSES = CONTACT_STATUSES.filter(s => s.value !== 'da_chuyen');

// ── Helper: số ngày đến sinh nhật tiếp theo ───────────────────
export function daysUntilBirthday(birthday) {
  if (!birthday) return null;
  const parts = birthday.split('-');
  if (parts.length < 3) return null;
  const month = parseInt(parts[1], 10);
  const day   = parseInt(parts[2], 10);
  if (!month || !day) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let bday = new Date(today.getFullYear(), month - 1, day);
  if (bday < today) bday = new Date(today.getFullYear() + 1, month - 1, day);
  return Math.floor((bday - today) / 86400000);
}

// ── Auto-assign KD ────────────────────────────────────────────
export function autoAssignKd(phone, company, leads, orders) {
  const CUTOFF = Date.now() - 18 * 30 * 24 * 3_600_000;
  const norm   = (p) => (p || '').replace(/\D/g, '');
  const pNorm  = norm(phone);

  const existing =
    (pNorm && leads.find(l => norm(l.phone) === pNorm)) ||
    (company?.trim() && leads.find(l =>
      l.company?.trim().toLowerCase() === company.trim().toLowerCase()
    ));

  if (existing?.assignedTo && SALES_LIST.some(s => s.name === existing.assignedTo)) {
    const kdName = existing.assignedTo;
    const active = orders.some(o =>
      o.emp === kdName && new Date(o.createdAt).getTime() > CUTOFF
    );
    if (active) {
      return { name: kdName, badge: '🔁 Giữ KD', color: '#059669',
               reason: `KD cũ · có đơn trong 18 tháng gần nhất` };
    }
    const expiredKd = kdName;
    if (!SALES_LIST.length) return { name: '', badge: '–', color: '#9ca3af', reason: 'Chưa có KD' };
    const loads = SALES_LIST
      .map(s => ({ name: s.name, count: leads.filter(l => l.assignedTo === s.name).length }))
      .sort((a, b) => a.count - b.count || a.name.localeCompare(b.name));
    return {
      name:   loads[0].name,
      badge:  '🔄 Tái phân',
      color:  '#d97706',
      reason: `KD cũ (${expiredKd}) không có đơn >18 tháng · tái phân sang ${loads[0].name}`,
    };
  }

  if (!SALES_LIST.length) return { name: '', badge: '–', color: '#9ca3af', reason: 'Chưa có KD' };

  const loads = SALES_LIST
    .map(s => ({ name: s.name, count: leads.filter(l => l.assignedTo === s.name).length }))
    .sort((a, b) => a.count - b.count || a.name.localeCompare(b.name));

  return {
    name:   loads[0].name,
    badge:  '🆕 Phân mới',
    color:  '#2563eb',
    reason: `Lead mới · phân theo tải (${loads[0].count} lead hiện tại)`,
  };
}
