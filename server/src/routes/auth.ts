import { Router } from 'express';
import { register, login, getMe, updateProfile, switchRole, requestVerification } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/switch-role', authenticate, switchRole);
router.post('/request-verification', authenticate, requestVerification);

export default router;