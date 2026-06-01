// ══ CRMGO Constants — migrated from single-file HTML ══════════

export const DB_KEYS = {
  leads:          'crmgo_leads',
  opps:           'crmgo_opps',
  orders:         'crmgo_orders',
  userDb:         'crmgo_user_db',
  businesses:     'crmgo_businesses',
  suppliers:      'crmgo_suppliers',
  notifications:  'crmgo_notifications',
  perfTargets:    'crmgo_perf_targets',
  salesSettings:  'crmgo_sales_settings',
  champMonth:     'crmgo_champ_month',
  champWeek:      'crmgo_champ_week',
  champShown:     'crmgo_champ_shown',
  mktCosts:       'crmgo_mkt_costs',
};

// ── Tỉnh / Thành phố Việt Nam ───────────────────────────────
export const VIETNAM_REGIONS = [
  // Miền Bắc
  'Hà Nội','Hải Phòng','Quảng Ninh','Bắc Ninh','Bắc Giang',
  'Thái Nguyên','Vĩnh Phúc','Phú Thọ','Hòa Bình','Hà Nam',
  'Hưng Yên','Hải Dương','Nam Định','Thái Bình','Ninh Bình',
  // Miền Trung
  'Thanh Hóa','Nghệ An','Hà Tĩnh','Quảng Bình','Quảng Trị',
  'Thừa Thiên Huế','Đà Nẵng','Quảng Nam','Quảng Ngãi',
  'Bình Định','Phú Yên','Khánh Hòa','Ninh Thuận','Bình Thuận',
  // Miền Nam
  'TP. Hồ Chí Minh','Bình Dương','Đồng Nai','Long An',
  'Bà Rịa - Vũng Tàu','Tây Ninh','Bình Phước',
  'Cần Thơ','An Giang','Tiền Giang','Vĩnh Long','Bến Tre',
  'Đồng Tháp','Hậu Giang','Sóc Trăng','Kiên Giang',
  'Trà Vinh','Bạc Liêu','Cà Mau',
];

export const CATS = [
  'Thiết kế','In nhanh','Offset','Hộp sóng','Hộp mềm',
  'Hộp cứng','Quà tặng','Ấn phẩm khác',
];

export const CAT_CLR = {
  'Thiết kế':'#E8380D','In nhanh':'#f59e0b','Offset':'#2563eb',
  'Hộp sóng':'#059669','Hộp mềm':'#7c3aed','Hộp cứng':'#0891b2',
  'Quà tặng':'#db2777','Ấn phẩm khác':'#78716c',
};

export const EMP_CLR = ['#E8380D','#2563eb','#059669','#7c3aed','#d97706'];

export const STATUS_CFG = [
  { label:'Tiếp cận',       color:'#64748b', bg:'#f8fafc' },
  { label:'Đã tư vấn',      color:'#2563eb', bg:'#eff6ff' },
  { label:'Chốt đơn',       color:'#16a34a', bg:'#f0fdf4' },
  { label:'Không tiếp tục', color:'#dc2626', bg:'#fef2f2' },
  { label:'Hủy đơn',        color:'#dc2626', bg:'#fef2f2' },
  { label:'Tạm dừng',       color:'#d97706', bg:'#fffbeb' },
  { label:'Chờ thanh toán', color:'#7c3aed', bg:'#f5f3ff' },
  { label:'Đã thanh toán',  color:'#16a34a', bg:'#f0fdf4' },
];

export const WF_LABEL = {
  pending_kt:   { label:'⏳ Chờ KT duyệt',  color:'#f59e0b' },
  kt_approved:  { label:'✅ KT đã duyệt',   color:'#059669' },
  in_design:    { label:'🎨 Đang thiết kế', color:'#db2877' },
  design_done:  { label:'✅ Thiết kế xong', color:'#16a34a' },
  in_production:{ label:'🏭 Sản xuất',      color:'#0d9488' },
  supplier_sent:{ label:'📤 Gửi NCC',       color:'#7c3aed' },
  in_warehouse: { label:'📦 Về kho',        color:'#059669' },
  delivered:    { label:'🎉 Đã giao',       color:'#16a34a' },
};

export const WF_PROD = [
  'pending_kt','kt_approved','in_production',
  'supplier_sent','in_warehouse','delivered',
];

export const ROLE_LBL = {
  sales:  '💼 Kinh doanh',
  mkt:    '📣 Marketing',
  cskh:   '🤝 CSKH',
  ketoan: '💰 Kế toán',
  design: '🎨 Thiết kế',
  kho:    '📦 Kho',
  smgr:   '🗂️ Quản lý NCC',
  prod:   '🏭 Nhà cung cấp',
  admin:  '🔴 Admin',
};

export const ROLE_COLOR = {
  sales:  'var(--primary)',
  mkt:    'var(--mkt)',
  cskh:   'var(--cskh)',
  ketoan: 'var(--ktoan)',
  design: 'var(--design)',
  kho:    'var(--kho)',
  smgr:   'var(--smgr)',
  prod:   'var(--prod)',
  admin:  'var(--admin)',
};

// ── Demo accounts (all pass: 123456) ─────────────────────────
export const DEMO_ACCOUNTS = [
  { username:'nhanvien1', name:'Nguyễn Văn An',     role:'sales',  pass:'123456' },
  { username:'nhanvien2', name:'Trần Thị Bích',     role:'sales',  pass:'123456' },
  { username:'nhanvien3', name:'Lê Minh Tuấn',      role:'sales',  pass:'123456' },
  { username:'mkt1',      name:'Lê Thị Thu Hà',     role:'mkt',    pass:'123456' },
  { username:'mkt2',      name:'Nguyễn Minh Khôi',  role:'mkt',    pass:'123456' },
  { username:'cskh1',     name:'Trần Phương Anh',   role:'cskh',   pass:'123456' },
  { username:'ketoan1',   name:'Phạm Thị Ngân',     role:'ketoan', pass:'123456' },
  { username:'design1',   name:'Hoàng Thị Lan',     role:'design', pass:'123456' },
  { username:'design2',   name:'Trần Quang Minh',   role:'design', pass:'123456' },
  { username:'kho1',      name:'Nguyễn Thị Hoa',    role:'kho',    pass:'123456' },
  { username:'quanly1',   name:'Quản lý Hệ thống',  role:'smgr',   pass:'123456' },
  { username:'admin1',    name:'Admin Dashboard',   role:'admin',  pass:'123456' },
  { username:'sanxuat1',  name:'Công ty In Tân Tiến',    role:'prod', pass:'123456', supplier:'Công ty In Tân Tiến' },
  { username:'sanxuat2',  name:'In & Bao Bì Minh Khoa',  role:'prod', pass:'123456', supplier:'In & Bao Bì Minh Khoa' },
  { username:'sanxuat3',  name:'PrintPro Việt Nam',       role:'prod', pass:'123456', supplier:'PrintPro Việt Nam' },
];

export const SUPPLIERS_DEFAULT = [
  { id:1, name:'Công ty In Tân Tiến',   username:'sanxuat1', cats:['In nhanh','Offset','Thiết kế'] },
  { id:2, name:'In & Bao Bì Minh Khoa', username:'sanxuat2', cats:['Hộp sóng','Hộp mềm','Hộp cứng'] },
  { id:3, name:'PrintPro Việt Nam',      username:'sanxuat3', cats:['Quà tặng','Ấn phẩm khác','Thiết kế'] },
];

export const ORDER_TYPES = [
  { value:'in-an',   label:'🖨️ In ấn' },
  { value:'thiet-ke',label:'🎨 Thiết kế' },
  { value:'lam-mau', label:'📦 Làm mẫu' },
  { value:'ban-le',  label:'🛍️ Bán lẻ' },
];

// ── Loại cơ hội (tiles trong AddOppModal) ───────────────────
export const OPP_TYPES = [
  { value:'in-an',    label:'In ấn',    icon:'🖨️', desc:'In offset, in nhanh, kỹ thuật số' },
  { value:'lam-mau',  label:'Làm mẫu',  icon:'🧪', desc:'Sản xuất thử, proofing, mẫu mới' },
  { value:'thiet-ke', label:'Thiết kế', icon:'🎨', desc:'Thiết kế bao bì, nhận diện thương hiệu' },
  { value:'ban-le',   label:'Bán lẻ',   icon:'🛍️', desc:'Bán lẻ, giao hàng trực tiếp' },
];

// ── Danh mục sản phẩm cho cơ hội ───────────────────────────
export const OPP_CATS = [
  { value:'van-phong',  label:'Văn phòng',  icon:'💼', color:'#d97706' },
  { value:'bao-bi',     label:'Bao bì',     icon:'📦', color:'#ea580c' },
  { value:'quang-cao',  label:'Quảng cáo',  icon:'📣', color:'#7c3aed' },
  { value:'le-tet',     label:'Lễ Tết',     icon:'🎁', color:'#dc2626' },
  { value:'xuat-ban',   label:'Xuất bản',   icon:'📗', color:'#16a34a' },
  { value:'thu-cong',   label:'Thủ công',   icon:'✂️', color:'#0891b2' },
];

// ── Chân dung khách hàng ────────────────────────────────────
export const CUSTOMER_PROFILES = [
  { value:'nong-san',    label:'Nông sản',       icon:'🌾' },
  { value:'yen',         label:'Yến',            icon:'🍯' },
  { value:'ruou',        label:'Rượu',           icon:'🍾' },
  { value:'hr',          label:'HR',             icon:'📋' },
  { value:'hr300',       label:'HR300',          icon:'🖨️' },
  { value:'htx',         label:'HTX',            icon:'🤝' },
  { value:'qua-tang',    label:'Đơn vị quà tặng',icon:'🎁' },
  { value:'marketer',    label:'Marketer',       icon:'📣' },
  { value:'khach-san',   label:'Khách sạn',      icon:'🏨' },
  { value:'nha-hang',    label:'Nhà hàng',       icon:'🍽️' },
  { value:'spa',         label:'Spa / Thẩm mỹ', icon:'💆' },
  { value:'giao-duc',    label:'Giáo dục',       icon:'🎓' },
  { value:'ceo',         label:'CEO / Chủ DN',   icon:'👔' },
  { value:'ke-toan',     label:'Kế toán',        icon:'📊' },
  { value:'phong-mua',   label:'Phòng mua',      icon:'🛒' },
  { value:'khac',        label:'Khác',           icon:'📌' },
];

// ── Đơn vị tính ─────────────────────────────────────────────
export const UNITS = ['cái','tờ','cuốn','bộ','hộp','túi','kg','m²','thùng','lố'];

export const CONTACT_STATUSES = [
  { value:'chua_lh',  label:'Chưa liên hệ',         color:'#64748b', bg:'#f8fafc',  icon:'○' },
  { value:'da_lh',    label:'Đã liên hệ',            color:'#2563eb', bg:'#eff6ff',  icon:'✓' },
  { value:'dat_hen',  label:'Đặt hẹn',               color:'#7c3aed', bg:'#f5f3ff',  icon:'📅' },
  { value:'ko_lh',    label:'Không liên hệ được',    color:'#dc2626', bg:'#fff1f2',  icon:'✕' },
  { value:'ko_nghe',  label:'Không nghe máy',        color:'#d97706', bg:'#fffbeb',  icon:'🔇' },
  { value:'ko_trien', label:'Không triển khai',      color:'#78716c', bg:'#f5f5f4',  icon:'⊗' },
  { value:'da_chuyen',label:'Đã chuyển cơ hội',      color:'#16a34a', bg:'#f0fdf4',  icon:'→' },
];

export const CHANNEL_CFG = {
  facebook:   { label:'Facebook',   icon:'📘', color:'#1877f2', bg:'#eff6ff' },
  zalo:       { label:'Zalo',       icon:'💬', color:'#0068ff', bg:'#e8f4ff' },
  website:    { label:'Website',    icon:'🌐', color:'#059669', bg:'#f0fdf4' },
  referral:   { label:'Giới thiệu', icon:'🤝', color:'#7c3aed', bg:'#f5f3ff' },
  coldcall:   { label:'Cold Call',  icon:'📞', color:'#dc2626', bg:'#fef2f2' },
  truc_tiep:  { label:'Trực tiếp',  icon:'⚡', color:'#d97706', bg:'#fffbeb' },
  other:      { label:'Khác',       icon:'📌', color:'#64748b', bg:'#f8fafc' },
};

export const TEMP_CFG = {
  hot:  { icon:'🔥', color:'#dc2626', bg:'#fef2f2', label:'Hot' },
  warm: { icon:'⚡', color:'#d97706', bg:'#fffbeb', label:'Warm' },
  cold: { icon:'❄️', color:'#2563eb', bg:'#eff6ff', label:'Cold' },
};

// ── 🧪 TEST MODE — đặt true để test với ngưỡng 1 phút ──────
//    Sau khi test xong, đặt lại false để về production
const OVERDUE_TEST_MODE = false;

// ── Ngưỡng quá hạn theo nhiệt độ (giờ) ──────────────────────
// Production: Hot=2h | Warm=24h | Cold=48h
// Test mode : tất cả = 1 phút (1/60 giờ)
export const OVERDUE_HOURS = OVERDUE_TEST_MODE
  ? { hot: 1 / 60, warm: 1 / 60, cold: 1 / 60 }   // 🧪 1 phút
  : { hot: 2,      warm: 24,     cold: 48      };   // production

// Thông báo lại sau bao giờ — test: 0 (luôn notify lại), prod: 6h
export const OVERDUE_RESEND_HOURS = OVERDUE_TEST_MODE ? 0 : 6;

// ── 🧪 TEST MODE — đơn hàng quá hạn ────────────────────────
//    Đặt true để test với ngưỡng 1 phút, false = production
const ORDER_OVERDUE_TEST_MODE = false;

// Ngưỡng quá hạn theo workflow status (giờ)
// pending_kt: 4h | kt_approved: 24h | in_design: 48h | design_done: 12h
// in_production: 72h | supplier_sent: 48h | in_warehouse: 24h
export const ORDER_OVERDUE_HOURS = ORDER_OVERDUE_TEST_MODE
  ? { pending_kt:1/60, kt_approved:1/60, in_design:1/60, design_done:1/60,
      in_production:1/60, supplier_sent:1/60, in_warehouse:1/60 }
  : { pending_kt:4, kt_approved:24, in_design:48, design_done:12,
      in_production:72, supplier_sent:48, in_warehouse:24 };

// Thông báo lại sau bao giờ — test: 0, prod: 8h
export const ORDER_OVERDUE_RESEND_HOURS = ORDER_OVERDUE_TEST_MODE ? 0 : 8;

// ── 🧪 TEST MODE — đơn "In nhanh" chưa báo giá ──────────────
//    Đặt true để test với ngưỡng 1 phút, false = production
const NCC_QUOTE_TEST_MODE = false;

// Hạn báo giá đơn "In nhanh" (giờ) — production: 24h | test: 1 phút
export const NCC_QUOTE_DEADLINE_HOURS = NCC_QUOTE_TEST_MODE ? 1 / 60 : 24;

// Thông báo lại sau bao giờ — test: 0, prod: 8h
export const NCC_QUOTE_RESEND_HOURS = NCC_QUOTE_TEST_MODE ? 0 : 8;
