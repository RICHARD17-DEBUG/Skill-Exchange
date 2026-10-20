import { Router } from 'express';
import { 
  getProviderAvailability, 
  getMyAvailability, 
  addAvailabilitySlot, 
  deleteAvailabilitySlot 
} from '../controllers/availabilityController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/provider/:providerId', getProviderAvailability);
router.get('/my/slots', authenticate, getMyAvailability);
router.post('/', authenticate, addAvailabilitySlot);
router.delete('/:id', authenticate, deleteAvailabilitySlot);

export default router;