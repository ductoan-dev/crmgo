import { Quote, Opportunity, User } from '../db/models/index.js';

export const getByOpp = (oppId) =>
  Quote.findAll({ where: { opp_id: oppId }, order: [['version', 'ASC']] });

export const create = async (oppId, data, userId) => {
  const lastVersion = await Quote.max('version', { where: { opp_id: oppId } });
  const version = (lastVersion || 0) + 1;
  return Quote.create({ ...data, opp_id: oppId, created_by: userId, version });
};

export const update = (id, data) =>
  Quote.update(data, { where: { id } }).then(() => Quote.findByPk(id));

export const remove = (id) => Quote.destroy({ where: { id } });
