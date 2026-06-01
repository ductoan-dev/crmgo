import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const Opportunity = sequelize.define('Opportunity', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(20), unique: true, comment: 'Auto-generated: OPPMMDDxxxx' },
  customer_name: { type: DataTypes.STRING(150) },
  status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '0=Tiếp cận, 1=Đã tư vấn, 2=Chốt đơn, 3=Không tiếp tục, 4=Hủy, 5=Tạm dừng, 6=Chờ TT, 7=Đã TT',
  },
  kha_nang: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 50,
    comment: 'Xác suất chốt đơn 0-100%',
  },
  images: { type: DataTypes.JSON, defaultValue: [] },
  note: { type: DataTypes.TEXT },
  emp_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'RESTRICT',
  },
  lead_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'leads', key: 'id' },
    onDelete: 'SET NULL',
  },
  business_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'businesses', key: 'id' },
    onDelete: 'SET NULL',
  },
}, {
  tableName: 'opportunities',
});

export default Opportunity;
