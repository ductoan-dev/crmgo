import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const SupplierOrder = sequelize.define('SupplierOrder', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  items: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Chi tiết sản phẩm và số lượng gửi NCC',
  },
  total: { type: DataTypes.DECIMAL(15, 0), defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('sent', 'confirmed', 'in_production', 'done', 'error'),
    defaultValue: 'sent',
  },
  note: { type: DataTypes.TEXT },
  error_note: { type: DataTypes.TEXT, comment: 'Mô tả lỗi nếu NCC báo lỗi' },
  deadline: { type: DataTypes.DATE },
  order_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'orders', key: 'id' },
    onDelete: 'CASCADE',
  },
  supplier_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'suppliers', key: 'id' },
    onDelete: 'RESTRICT',
  },
  sent_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL',
  },
}, {
  tableName: 'supplier_orders',
});

export default SupplierOrder;
