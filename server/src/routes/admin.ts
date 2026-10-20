import { Router } from 'express';
import { 
  getDashboardStats, 
  getAnalyticsData, 
  getUsers, 
  updateUserStatus, 
  verifyProvider, 
  getAuditLedger, 
  adjustUserCredits 
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalyticsData);
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/providers/:id/verify', verifyProvider);
router.get('/ledger', getAuditLedger);
router.post('/adjust-credits', adjustUserCredits);

export default router;