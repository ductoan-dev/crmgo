import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const OrderWorkflow = sequelize.define('OrderWorkflow', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  from_status: { type: DataTypes.STRING(50), allowNull: true },
  to_status: { type: DataTypes.STRING(50), allowNull: false },
  note: { type: DataTypes.TEXT, comment: 'Ghi chú khi chuyển trạng thái' },
  order_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'orders', key: 'id' },
    onDelete: 'CASCADE',
  },
  actor_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL',
  },
}, {
  tableName: 'order_workflows',
});

export default OrderWorkflow;
