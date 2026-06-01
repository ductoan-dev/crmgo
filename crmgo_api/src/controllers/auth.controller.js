import { login, refresh } from '../services/auth.service.js';
import { successRes, errorRes } from '../utils/helpers.js';

// POST /api/auth/login
export const loginCtrl = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return errorRes(res, 'Vui lòng nhập tên đăng nhập và mật khẩu');
    const data = await login(username, password);
    return successRes(res, data);
  } catch (err) {
    return errorRes(res, err.message, 401);
  }
};

// POST /api/auth/refresh
export const refreshCtrl = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorRes(res, 'Thiếu refresh token', 401);
    const data = await refresh(refreshToken);
    return successRes(res, data);
  } catch (err) {
    return errorRes(res, err.message, 401);
  }
};

// GET /api/auth/me  (yêu cầu access token hợp lệ)
export const meCtrl = (req, res) => successRes(res, req.user);

// POST /api/auth/logout
export const logoutCtrl = (_req, res) => {
  // Với stateless JWT, client tự xóa token
  // Nếu sau này thêm token blacklist (Redis) thì xử lý ở đây
  return successRes(res, { message: 'Đăng xuất thành công' });
};
