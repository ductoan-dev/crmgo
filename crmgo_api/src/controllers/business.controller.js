import * as businessService from '../services/business.service.js';
import { successRes, errorRes } from '../utils/helpers.js';

export const getAll = async (req, res) => {
  try {
    const data = await businessService.getAll();
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const getById = async (req, res) => {
  try {
    const data = await businessService.getById(req.params.id);
    if (!data) return errorRes(res, 'Không tìm thấy doanh nghiệp', 404);
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const create = async (req, res) => {
  try {
    const data = await businessService.create(req.body, req.user.id);
    successRes(res, data, 201);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const update = async (req, res) => {
  try {
    const data = await businessService.update(req.params.id, req.body);
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const remove = async (req, res) => {
  try {
    await businessService.remove(req.params.id);
    successRes(res, { message: 'Đã xoá doanh nghiệp' });
  } catch (err) {
    errorRes(res, err.message);
  }
};
