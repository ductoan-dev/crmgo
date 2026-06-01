import * as supplierService from '../services/supplier.service.js';
import { successRes, errorRes } from '../utils/helpers.js';

export const getAll = async (req, res) => {
  try {
    const data = await supplierService.getAll();
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const getById = async (req, res) => {
  try {
    const data = await supplierService.getById(req.params.id);
    if (!data) return errorRes(res, 'Không tìm thấy nhà cung cấp', 404);
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const create = async (req, res) => {
  try {
    const data = await supplierService.create(req.body);
    successRes(res, data, 201);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const update = async (req, res) => {
  try {
    const data = await supplierService.update(req.params.id, req.body);
    successRes(res, data);
  } catch (err) {
    errorRes(res, err.message);
  }
};

export const remove = async (req, res) => {
  try {
    await supplierService.remove(req.params.id);
    successRes(res, { message: 'Đã vô hiệu hoá nhà cung cấp' });
  } catch (err) {
    errorRes(res, err.message);
  }
};

// Smgr gửi đơn cho NCC
export const sendOrder = async (req, res) => {
  try {
    const { orderId, data } = req.body;
    const result = await supplierService.sendOrder(
      orderId,
      req.params.id,
      req.user.id,
      data || {}
    );
    successRes(res, result, 201);
  } catch (err) {
    errorRes(res, err.message);
  }
};

// NCC cập nhật trạng thái đơn của họ
export const updateSupplierOrderStatus = async (req, res) => {
  try {
    const { status, error_note } = req.body;
    const result = await supplierService.updateSupplierOrderStatus(
      req.params.soId,
      status,
      error_note
    );
    successRes(res, result);
  } catch (err) {
    errorRes(res, err.message);
  }
};
