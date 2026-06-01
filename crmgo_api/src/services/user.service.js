import bcrypt from 'bcrypt';
import { User } from '../db/models/index.js';

export const getAll = () =>
  User.findAll({ attributes: { exclude: ['password_hash'] }, order: [['id', 'ASC']] });

export const getById = (id) =>
  User.findByPk(id, { attributes: { exclude: ['password_hash'] } });

export const create = async ({ username, name, password, role, is_leader, permissions }) => {
  const password_hash = await bcrypt.hash(password, 10);
  return User.create({ username, name, password_hash, role, is_leader, permissions });
};

export const update = async (id, data) => {
  if (data.password) {
    data.password_hash = await bcrypt.hash(data.password, 10);
    delete data.password;
  }
  const [, [user]] = await User.update(data, { where: { id }, returning: true });
  return user;
};

export const remove = (id) => User.update({ is_active: false }, { where: { id } });
