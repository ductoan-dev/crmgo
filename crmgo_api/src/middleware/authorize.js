import { errorRes } from '../utils/helpers.js';

// authorize('admin', 'sales') — cho phép các role trong danh sách
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return errorRes(res, 'Không có quyền thực hiện thao tác này', 403);
  }
  next();
};
