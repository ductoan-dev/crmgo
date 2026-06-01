import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const Lead = sequelize.define('Lead', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(20), unique: true, comment: 'Auto-generated: LEADMMDDxxxx' },
  customer_name: { type: DataTypes.STRING(150), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(100) },
  contact_status: {
    type: DataTypes.ENUM('chua_lh', 'da_lh', 'dat_hen', 'ko_lh', 'ko_nghe', 'ko_trien', 'da_chuyen'),
    defaultValue: 'chua_lh',
  },
  temperature: {
    type: DataTypes.ENUM('hot', 'warm', 'cold'),
    defaultValue: 'warm',
  },
  source: { type: DataTypes.STRING(100), comment: 'Nguồn tiếp cận / Kênh' },
  area:   { type: DataTypes.STRING(100), comment: 'Khu vực / Tỉnh-thành' },
  note: { type: DataTypes.TEXT },
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
