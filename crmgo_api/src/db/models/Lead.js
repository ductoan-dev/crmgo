import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const Lead = sequelize.define('Lead', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(20), unique: true, comment: 'Auto-generated: LEADMMDDxxxx' },
  customer_name: { type: DataTypes.STRING(150), allowNull: false },
  phone:  { type: DataTypes.STRING(20) },
  email:  { type: DataTypes.STRING(100) },
  area:   { type: DataTypes.STRING(100),  comment: 'Khu vực / Tỉnh-thành' },

  contact_status: {
    type: DataTypes.ENUM('chua_lh', 'da_lh', 'dat_hen', 'ko_lh', 'ko_nghe', 'ko_trien', 'da_chuyen'),
    defaultValue: 'chua_lh',
  },
  temperature: {
    type: DataTypes.ENUM('hot', 'warm', 'cold'),
    defaultValue: 'warm',
  },
  source: { type: DataTypes.STRING(100), comment: 'Nguồn tiếp cận / Kênh' },
  note:   { type: DataTypes.TEXT },

  // ── Thông tin phân loại ──────────────────────────────────────
  nganh:      { type: DataTypes.STRING(100), comment: 'Ngành nghề khách hàng' },
  loai_khach: { type: DataTypes.STRING(50),  comment: 'Loại khách: doanh_nghiep, ca_nhan...' },
  uu_tien:    { type: DataTypes.STRING(20),  defaultValue: 'trung_binh', comment: 'cao / trung_binh / thap' },
  ngan_sach:  { type: DataTypes.STRING(50),  comment: 'Ngân sách dự kiến' },
  thoi_diem:  { type: DataTypes.STRING(50),  comment: 'Thời điểm cần' },
  product:    { type: DataTypes.STRING(100), comment: 'Sản phẩm quan tâm' },
  trang_thai: { type: DataTypes.STRING(50),  defaultValue: 'moi', comment: 'Trạng thái CSKH' },

  // ── Thông tin cá nhân ────────────────────────────────────────
  birthday: { type: DataTypes.DATEONLY, comment: 'Ngày sinh nhật (YYYY-MM-DD)' },

  // ── JSON arrays ──────────────────────────────────────────────
  chandung:    { type: DataTypes.JSON, comment: 'Chân dung khách hàng (array)' },
  cskh_calls:  { type: DataTypes.JSON, comment: 'Lịch sử chăm sóc CSKH (array)' },
  attachments: { type: DataTypes.JSON, comment: 'Tài liệu / đính kèm (array)' },

  // ── FK ───────────────────────────────────────────────────────
  emp_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'RESTRICT',
  },
  business_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'businesses', key: 'id' },
    onDelete: 'SET NULL',
  },
  transferred_to_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL',
    comment: 'KD được MKT chuyển lead sang',
  },
}, {
  tableName: 'leads',
});

export default Lead;
