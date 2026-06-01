import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../db/models/index.js';

const ACCESS_SECRET  = process.env.JWT_SECRET         || 'crmgo_secret_2024';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET  || 'crmgo_refresh_secret_2024';
const ACCESS_EXPIRES  = process.env.JWT_EXPIRES        || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES|| '7d';

// ── Format user object để trả về client ──────────────────────
const formatUser = (user) => ({
  id:          user.id,
  username:    user.username,
  name:        user.name,
  role:        user.role,
  is_leader:   user.is_leader,
  permissions: user.permissions,
});

// ── Tạo cặp access + refresh token ───────────────────────────
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  );
  return { accessToken, refreshToken };
};

// ── Login ─────────────────────────────────────────────────────
export const login = async (username, password) => {
  const user = await User.findOne({ where: { username, is_active: true } });
  if (!user) throw new Error('Tên đăng nhập không tồn tại');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Mật khẩu không đúng');

  const { accessToken, refreshToken } = generateTokens(user);

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_EXPIRES,
    user: formatUser(user),
  };
};

// ── Refresh — cấp access token mới từ refresh token ──────────
export const refresh = async (refreshToken) => {
  if (!refreshToken) throw new Error('Refresh token không được cung cấp');

  let payload;
  try {
    payload = jwt.verify(refreshToken, REFRESH_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw new Error('Refresh token đã hết hạn, vui lòng đăng nhập lại');
    throw new Error('Refresh token không hợp lệ');
  }

  const user = await User.findByPk(payload.id);
  if (!user || !user.is_active) throw new Error('Tài khoản không hợp lệ hoặc đã bị khóa');

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

  return {
    accessToken,
    refreshToken: newRefreshToken,  // Rotate refresh token
    expiresIn: ACCESS_EXPIRES,
    user: formatUser(user),
  };
};
