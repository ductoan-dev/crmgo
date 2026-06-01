import { Notification } from '../db/models/index.js';

export const getByUser = (userId) =>
  Notification.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit: 50,
  });

export const markRead = (id, userId) =>
  Notification.update({ is_read: true }, { where: { id, user_id: userId } });

export const markAllRead = (userId) =>
  Notification.update({ is_read: true }, { where: { user_id: userId, is_read: false } });

export const push = (userId, { type, title, message, ref_type, ref_id }) =>
  Notification.create({ user_id: userId, type, title, message, ref_type, ref_id });
