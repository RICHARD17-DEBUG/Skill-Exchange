import { Router } from 'express';
import { 
  createBooking, 
  acceptBooking, 
  rejectBooking, 
  cancelBooking, 
  completeSession, 
  getUserBookings, 
  getBookingById 
} from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createBooking);
router.get('/', getUserBookings);
router.get('/:id', getBookingById);
router.put('/:id/accept', acceptBooking);
router.put('/:id/reject', rejectBooking);
router.put('/:id/cancel', cancelBooking);
router.put('/:id/complete', completeSession);

export default router;