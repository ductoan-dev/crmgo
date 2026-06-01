import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const Supplier = sequelize.define('Supplier', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  cats: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Danh mục sản phẩm nhà cung cấp xử lý',
  },
  phone: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(100) },
  address: { type: DataTypes.TEXT },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    unique: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL',
    comment: 'Tài khoản prod đăng nhập của NCC',
  },
}, {
  tableName: 'suppliers',
});

export default Supplier;
