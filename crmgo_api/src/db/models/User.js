import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  role: {
    type: DataTypes.ENUM('sales', 'mkt', 'cskh', 'ketoan', 'design', 'kho', 'smgr', 'prod', 'admin'),
    allowNull: false,
  },
  is_leader: { type: DataTypes.BOOLEAN, defaultValue: false },
  permissions: { type: DataTypes.JSON, defaultValue: {} },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'users',
});

export default User;
