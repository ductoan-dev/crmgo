import * as notifService from '../services/notification.service.js';
import { successRes, errorRes } from '../utils/helpers.js';

export const getByUser = async (req, res) => {
  try {
    const data = await notifService.getByUser(req.user.id);
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const markRead = async (req, res) => {
  try {
    await notifService.markRead(req.params.id, req.user.id);
    successRes(res, { message: 'Đã đánh dấu đã đọc' });
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const markAllRead = async (req, res) => {
  try {
    await notifService.markAllRead(req.user.id);
    successRes(res, { message: 'Đã đánh dấu tất cả đã đọc' });
  } catch (err) {
    errorRes(res, err.message);
  }
};
