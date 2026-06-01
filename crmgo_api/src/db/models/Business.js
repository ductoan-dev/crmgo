import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const Business = sequelize.define('Business', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(100) },
  address: { type: DataTypes.TEXT },
  industry: { type: DataTypes.STRING(100), comment: 'Ngành nghề' },
  tax_code: { type: DataTypes.STRING(20), comment: 'Mã số thuế' },
  note: { type: DataTypes.TEXT },
  created_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL',
  },
}, {
  tableName: 'businesses',
});

export default Business;
