import * as orderService from '../services/order.service.js';
import { successRes, errorRes } from '../utils/helpers.js';

export const getAll = async (req, res) => {
  try {
    const data = await orderService.getAll({ role: req.user.role, empId: req.user.id });
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const getById = async (req, res) => {
  try {
    const data = await orderService.getById(req.params.id);
    if (!data) return errorRes(res, 'Không tìm thấy đơn hàng', 404);
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const create = async (req, res) => {
  try {
    const data = await orderService.create(req.body, req.user.id);
    successRes(res, data, 201);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const update = async (req, res) => {
  try {
    const data = await orderService.update(req.params.id, req.body);
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

// Advance workflow status
export const advance = async (req, res) => {
  try {
    const { note } = req.body;
    const data = await orderService.updateStatus(
      req.params.id,
      req.user.id,
      req.user.role,
      note || ''
    );
    successRes(res, data);
  } catch (err) {
    const isPermission = err.message.includes('quyền') || err.message.includes('Forbidden');
    errorRes(res, err.message, isPermission ? 403 : 400);
  }
};

// KT: ghi nhận thanh toán
export const recordPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) return errorRes(res, 'Số tiền không hợp lệ', 400);
    const data = await orderService.recordPayment(req.params.id, Number(amount));
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

// SMGR: giao đơn cho NCC
export const smgrAssign = async (req, res) => {
  try {
    const { nccName, expectDate, note } = req.body;
    if (!nccName) return errorRes(res, 'Thiếu tên NCC', 400);
    const data = await orderService.smgrAssign(req.params.id, req.user.id, { nccName, expectDate, note });
    successRes(res, data);
  } catch (err) {
    const isPermission = err.message.includes('quyền');
    errorRes(res, err.message, isPermission ? 403 : 400);
  }
};

// Prod: cập nhật field báo giá / defect của NCC
export const prodFields = async (req, res) => {
  try {
    const data = await orderService.updateProdFields(req.params.id, req.body);
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message, 400);
  }
};

// KT: từ chối đơn hàng
export const rejectOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const data = await orderService.rejectOrder(req.params.id, req.user.id, reason || '');
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};
