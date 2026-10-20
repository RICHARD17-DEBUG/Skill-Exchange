import { Router } from 'express';
import { getCreditSummary, getTransactionHistory } from '../controllers/creditController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/summary', getCreditSummary);
router.get('/history', getTransactionHistory);

export default router;