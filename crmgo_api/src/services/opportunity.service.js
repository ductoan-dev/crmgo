import { Opportunity, Lead, Business, User, Quote, Order } from '../db/models/index.js';
import { genCode } from '../utils/helpers.js';

const include = [
  { model: User,     as: 'emp',      attributes: ['id', 'name', 'role'] },
  { model: Lead,     as: 'lead',     attributes: ['id', 'code', 'customer_name'] },
  { model: Business, as: 'business', attributes: ['id', 'name'] },
  { model: Quote,    as: 'quotes' },
];

export const getAll = ({ empId, role }) => {
  const where = role === 'sales' ? { emp_id: empId } : {};
  return Opportunity.findAll({ where, include, order: [['created_at', 'DESC']] });
};

export const getById = (id) => Opportunity.findByPk(id, { include });

export const create = async (data, empId) => {
  const code = genCode('OPP');
  return Opportunity.create({ ...data, code, emp_id: empId });
};

export const update = (id, data) =>
  Opportunity.update(data, { where: { id } }).then(() => Opportunity.findByPk(id, { include }));

export const remove = (id) => Opportunity.destroy({ where: { id } });
