import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const Quote = sequelize.define('Quote', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  items: { type: DataTypes.JSON, defaultValue: [], comment: 'Danh sách sản phẩm báo giá' },
  total: { type: DataTypes.DECIMAL(15, 0), defaultValue: 0 },
  note: { type: DataTypes.TEXT },
  version: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 1 },
  opp_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'opportunities', key: 'id' },
    onDelete: 'CASCADE',
  },
  created_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL',
  },
}, {
  tableName: 'quotes',
});

export default Quote;
