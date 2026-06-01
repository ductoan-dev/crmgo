import { Router } from 'express';
import { loginCtrl, refreshCtrl, meCtrl, logoutCtrl } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.post('/login',   loginCtrl);          // Đăng nhập → accessToken + refreshToken
router.post('/refresh', refreshCtrl);        // Cấp accessToken mới từ refreshToken
router.post('/logout',  logoutCtrl);         // Đăng xuất (client xóa token)
router.get('/me',       authenticate, meCtrl); // Lấy thông tin user hiện tại

export default router;
