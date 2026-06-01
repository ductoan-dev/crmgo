// ══ Utility functions — migrated from single-file HTML ══════

// Format số tiền VNĐ
export const fmt = (n) => {
  const num = Number(n) || 0;
  return num.toLocaleString('vi-VN') + '₫';
};

// Format số có dấu chấm phân cách (không có ₫)
export const fmtNum = (n) =>
  String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// Parse số từ chuỗi có dấu chấm phân cách
export const parseNum = (str) =>
  parseInt(String(str).replace(/\D/g, ''), 10) || 0;

// Tạo mã đơn hàng
export const genCode = (prefix = 'ORD') => {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const ts = String(Date.now()).slice(-4);
  return `${prefix}${mm}${dd}${ts}`;
};

// Format ngày giờ
export const fmtDate = (d) => {
  if (!d) return '–';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date)) return '–';
  return date.toLocaleDateString('vi-VN');
};

export const fmtDateTime = (d) => {
  if (!d) return '–';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date)) return '–';
  return date.toLocaleString('vi-VN');
};

// Số ngày giữa 2 ngày
export const daysBetween = (a, b) =>
  Math.floor((new Date(b) - new Date(a)) / 86400000);

// Pluralize tiếng Việt
export const plural = (n, singular) => `${n} ${singular}`;

// Lấy initials từ tên
export const initials = (name = '') =>
  name.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase();

// Random màu từ palette
export const empColor = (index) => {
  const colors = ['#E8380D','#2563eb','#059669','#7c3aed','#d97706'];
  return colors[index % colors.length];
};

// Check if date is overdue
export const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

// Số giờ kể từ khi tạo lead
export const leadAgeHours = (lead) =>
  (Date.now() - new Date(lead.createdAt).getTime()) / 3_600_000;

// Kiểm tra lead có quá hạn chưa liên hệ không
export const isLeadOverdue = (lead, OVERDUE_HOURS) => {
  if (lead.contactStatus !== 'chua_lh') return false;
  const threshold = OVERDUE_HOURS[lead.temp || 'warm'] ?? 24;
  return leadAgeHours(lead) >= threshold;
};

// Format số giờ thành chuỗi dễ đọc
export const fmtHours = (h) => {
  const hrs = Math.floor(h);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  const rem  = hrs % 24;
  return rem > 0 ? `${days}n ${rem}h` : `${days} ngày`;
};

// Truncate text
export const truncate = (str, max = 40) =>
  str && str.length > max ? str.slice(0, max) + '...' : str;

// Deep clone
export const clone = (obj) => JSON.parse(JSON.stringify(obj));

// Debounce
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// Auth helpers
export const getUser = (username, password) => {
  const { DEMO_ACCOUNTS } = require('./constants');
  return DEMO_ACCOUNTS.find(
    u => u.username === username && u.pass === password
  ) || null;
};

// LocalStorage helpers with error handling
export const lsGet = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

export const lsSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch { return false; }
};

export const lsDel = (key) => {
  try { localStorage.removeItem(key); return true; }
  catch { return false; }
};

// WF history entry
export const makeWfEntry = (step, by, note = '') => ({
  step, by: by || '–',
  at: new Date().toLocaleString('vi-VN'),
  note,
});
