import { Router } from 'express';
import { 
  createReview, 
  getListingReviews, 
  getProviderReviews, 
  moderateReview 
} from '../controllers/reviewController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/listing/:listingId', getListingReviews);
router.get('/provider/:providerId', getProviderReviews);
router.post('/', authenticate, createReview);
router.put('/:id/moderate', authenticate, authorize('admin'), moderateReview);

export default router;