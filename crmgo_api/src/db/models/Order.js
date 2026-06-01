import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';
import { WF_STATUSES } from '../../utils/constants.js';

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(20), unique: true, comment: 'Auto-generated: ORDMMDDxxxx' },
  type: {
    type: DataTypes.STRING(100),   // VARCHAR — chấp nhận cả CATS values ('In nhanh', 'Offset', ...)
    defaultValue: 'In nhanh',
  },
  status: {
    type: DataTypes.ENUM(...WF_STATUSES),
    defaultValue: 'pending_kt',
  },
  customer_name: { type: DataTypes.STRING(150) },
  total: { type: DataTypes.DECIMAL(15, 0), defaultValue: 0 },
  deposit: { type: DataTypes.DECIMAL(15, 0), defaultValue: 0, comment: 'Tiền đặt cọc' },
  note: { type: DataTypes.TEXT },
  deadline: { type: DataTypes.DATE },
  kt_paid_amount: { type: DataTypes.DECIMAL(15, 0), defaultValue: 0, comment: 'Tổng KT đã thu (không kể cọc)' },
  kt_rejected:    { type: DataTypes.BOOLEAN, defaultValue: false, comment: 'KT từ chối đơn' },
  kt_reject_note: { type: DataTypes.TEXT, allowNull: true, comment: 'Lý do KT từ chối' },
  // ── SMGR fields ──────────────────────────────────────────────
  smgr_ncc_name:    { type: DataTypes.STRING(150), allowNull: true },
  smgr_expect_date: { type: DataTypes.DATEONLY,    allowNull: true },
  quycach:          { type: DataTypes.TEXT,         allowNull: true },
  diadiem:          { type: DataTypes.STRING(200),  allowNull: true },
  kha_nang:         { type: DataTypes.INTEGER,      allowNull: true },
  // ── Prod / NCC fields ─────────────────────────────────────────
  ncc_quote_price:  { type: DataTypes.DECIMAL(15, 0), allowNull: true },
  ncc_quote_note:   { type: DataTypes.TEXT,            allowNull: true },
  ncc_quoted_by:    { type: DataTypes.STRING(100),     allowNull: true },
  ncc_quoted_at:    { type: DataTypes.STRING(20),      allowNull: true },
  defect:           { type: DataTypes.BOOLEAN, defaultValue: false },
  defect_note:      { type: DataTypes.TEXT,    allowNull: true },
  opp_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'opportunities', key: 'id' },
    onDelete: 'SET NULL',
  },
  quote_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'quotes', key: 'id' },
    onDelete: 'SET NULL',
  },
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
}, {
  tableName: 'orders',
});

export default Order;
