import { Router } from 'express';
import { 
  getSkillListings, 
  getSkillListingById, 
  createSkillListing, 
  updateSkillListing, 
  deleteSkillListing,
  getMyListings 
} from '../controllers/skillListingController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getSkillListings);
router.get('/my/listings', authenticate, getMyListings);
router.get('/:id', getSkillListingById);
router.post('/', authenticate, createSkillListing);
router.put('/:id', authenticate, updateSkillListing);
router.delete('/:id', authenticate, deleteSkillListing);

export default router;