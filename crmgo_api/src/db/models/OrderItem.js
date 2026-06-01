import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';
import { PRODUCT_CATS } from '../../utils/constants.js';

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(200), allowNull: false, comment: 'Tên sản phẩm' },
  category: {
    type: DataTypes.ENUM(...PRODUCT_CATS),
    comment: 'Danh mục sản phẩm',
  },
  qty: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 1 },
  unit_price: { type: DataTypes.DECIMAL(15, 0), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(15, 0), defaultValue: 0 },
  specs: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Thông số kỹ thuật: size, chất liệu, màu sắc...',
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_design', 'design_done', 'in_production', 'done', 'error'),
    defaultValue: 'pending',
  },
  note: { type: DataTypes.TEXT },
  order_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'orders', key: 'id' },
    onDelete: 'CASCADE',
  },
  supplier_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'suppliers', key: 'id' },
    onDelete: 'SET NULL',
  },
}, {
  tableName: 'order_items',
});

export default OrderItem;
