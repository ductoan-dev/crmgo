import * as oppService from '../services/opportunity.service.js';
import { successRes, errorRes } from '../utils/helpers.js';

export const getAll = async (req, res) => {
  try {
    const data = await oppService.getAll({ empId: req.user.id, role: req.user.role });
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const getById = async (req, res) => {
  try {
    const data = await oppService.getById(req.params.id);
    if (!data) return errorRes(res, 'Không tìm thấy cơ hội', 404);
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const create = async (req, res) => {
  try {
    const data = await oppService.create(req.body, req.user.id);
    successRes(res, data, 201);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const update = async (req, res) => {
  try {
    const data = await oppService.update(req.params.id, req.body);
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const remove = async (req, res) => {
  try {
    await oppService.remove(req.params.id);
    successRes(res, { message: 'Đã xoá cơ hội' });
  } catch (err) {
    errorRes(res, err.message);
  }
};
