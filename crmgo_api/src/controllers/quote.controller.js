import * as quoteService from '../services/quote.service.js';
import { successRes, errorRes } from '../utils/helpers.js';

export const getByOpp = async (req, res) => {
  try {
    const data = await quoteService.getByOpp(req.params.oppId);
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const create = async (req, res) => {
  try {
    const data = await quoteService.create(req.params.oppId, req.body, req.user.id);
    successRes(res, data, 201);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const update = async (req, res) => {
  try {
    const data = await quoteService.update(req.params.id, req.body);
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const remove = async (req, res) => {
  try {
    await quoteService.remove(req.params.id);
    successRes(res, { message: 'Đã xoá báo giá' });
  } catch (err) {
    errorRes(res, err.message);
  }
};
