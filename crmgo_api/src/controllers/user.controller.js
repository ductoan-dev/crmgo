import * as userService from '../services/user.service.js';
import { successRes, errorRes } from '../utils/helpers.js';

export const getAll = async (req, res) => {
  try {
    const data = await userService.getAll();
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const getById = async (req, res) => {
  try {
    const data = await userService.getById(req.params.id);
    if (!data) return errorRes(res, 'Không tìm thấy người dùng', 404);
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const create = async (req, res) => {
  try {
    const data = await userService.create(req.body);
    successRes(res, data, 201);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const update = async (req, res) => {
  try {
    const data = await userService.update(req.params.id, req.body);
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const remove = async (req, res) => {
  try {
    await userService.remove(req.params.id);
    successRes(res, { message: 'Đã vô hiệu hoá tài khoản' });
  } catch (err) {
    errorRes(res, err.message);
  }
};
