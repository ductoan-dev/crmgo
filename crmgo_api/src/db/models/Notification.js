import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  type: {
    type: DataTypes.STRING(50),
    comment: 'lead_assigned | order_status | kt_approved | supplier_error | quote_added',
  },
  title: { type: DataTypes.STRING(200), allowNull: false },
  message: { type: DataTypes.TEXT },
  ref_type: {
    type: DataTypes.STRING(20),
    comment: 'Loại entity liên quan: lead | order | opp | supplier_order',
  },
  ref_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    comment: 'ID của entity liên quan',
  },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'notifications',
});

export default Notification;
