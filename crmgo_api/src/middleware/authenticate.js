import jwt from 'jsonwebtoken';
import { errorRes } from '../utils/helpers.js';
import { User } from '../db/models/index.js';

export const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return errorRes(res, 'Chưa đăng nhập', 401);

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'crmgo_secret_2024');
    const user = await User.findByPk(payload.id, {
      attributes: { exclude: ['password_hash'] },
    });
    if (!user || !user.is_active) return errorRes(res, 'Tài khoản không hợp lệ', 401);
    req.user = user;
    next();
  } catch {
    return errorRes(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
  }
};
