import { Business, User } from '../db/models/index.js';

const include = [{ model: User, as: 'creator', attributes: ['id', 'name'] }];

export const getAll = () =>
  Business.findAll({ include, order: [['name', 'ASC']] });

export const getById = (id) => Business.findByPk(id, { include });

export const create = (data, userId) =>
  Business.create({ ...data, created_by: userId });

export const update = (id, data) =>
  Business.update(data, { where: { id } }).then(() => Business.findByPk(id, { include }));

export const remove = (id) => Business.destroy({ where: { id } });
