import * as leadService from '../services/lead.service.js';
import { successRes, errorRes } from '../utils/helpers.js';

export const getAll = async (req, res) => {
  try {
    const data = await leadService.getAll({ empId: req.user.id, role: req.user.role });
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const getById = async (req, res) => {
  try {
    const data = await leadService.getById(req.params.id);
    if (!data) return errorRes(res, 'Không tìm thấy lead', 404);
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const create = async (req, res) => {
  try {
    const data = await leadService.create(req.body, req.user.id);
    successRes(res, data, 201);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const update = async (req, res) => {
  try {
    const data = await leadService.update(req.params.id, req.body);
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const remove = async (req, res) => {
  try {
    await leadService.remove(req.params.id);
    successRes(res, { message: 'Đã xoá lead' });
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const transfer = async (req, res) => {
  try {
    const data = await leadService.transfer(req.params.id, req.body.username);
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const convertToOpp = async (req, res) => {
  try {
    const data = await leadService.convertToOpp(req.params.id, req.user.id, req.body);
    successRes(res, data, 201);
  } catch (err) {
    errorRes(res, err.message);
  }
};
