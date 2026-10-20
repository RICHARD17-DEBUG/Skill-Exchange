import { Response } from 'express';
import { Booking } from '../models/Booking';
import { SkillListing } from '../models/SkillListing';
import { User } from '../models/User';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { Notification } from '../models/Notification';
import { CreditEngine } from '../utils/creditEngine';
import { AuthRequest } from '../middleware/auth';

const generateBookingRef = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'BK-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
};

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      skillListingId, 
      date, 
      startTime, 
      endTime, 
      learnerNotes, 
      slotId 
    } = req.body;

    if (!skillListingId || !date || !startTime || !endTime) {
      res.status(400).json({ 
        success: false, 
        message: 'Please provide skill listing, date, start time, and end time.' 
      });
      return;
    }

    const listing = await SkillListing.findById(skillListingId);
    if (!listing || !listing.isActive) {
      res.status(404).json({ success: false, message: 'Skill listing not found or inactive.' });
      return;
    }

    // Cannot book own listing
    if (listing.provider.toString() === req.userId) {
      res.status(400).json({ success: false, message: 'You cannot book a session for your own skill listing.' });
      return;
    }

    const learner = await User.findById(req.userId);
    if (!learner) {
      res.status(404).json({ success: false, message: 'Learner account not found.' });
      return;
    }

    // Validate credit balance
    if (learner.creditBalance < listing.creditCost) {
      res.status(400).json({ 
        success: false, 
        message: `Insufficient skill credits. Required: ${listing.creditCost} credits, Current balance: ${learner.creditBalance} credits.` 
      });
      return;
    }

    // Check overlapping bookings for learner
    const learnerConflict = await Booking.findOne({
      learner: req.userId,
      date,
      startTime,
      status: { $in: ['pending', 'confirmed'] }
    });
    if (learnerConflict) {
      res.status(400).json({ 
        success: false, 
        message: 'You already have another active booking scheduled at this date and time.' 
      });
      return;
    }

    // Check overlapping bookings for provider
    const providerConflict = await Booking.findOne({
      provider: listing.provider,
      date,
      startTime,
      status: { $in: ['pending', 'confirmed'] }
    });
    if (providerConflict) {
      res.status(400).json({ 
        success: false, 
        message: 'Provider already has a session scheduled for this time slot.' 
      });
      return;
    }

    const bookingRef = generateBookingRef();
    const durationMinutes = listing.durationMinutes || 60;

    const booking = await Booking.create({
      bookingReference: bookingRef,
      learner: req.userId,
      provider: listing.provider,
      skillListing: listing._id,
      date,
      startTime,
      endTime,
      durationMinutes,
      creditCost: listing.creditCost,
      status: 'pending',
      learnerNotes: learnerNotes || '',
      meetingLink: `/meet/${bookingRef.toLowerCase()}`,
      creditDeducted: false,
      creditRefunded: false,
      creditRewarded: false
    });

    // Mark slot as booked if slotId provided
    if (slotId) {
      await AvailabilitySlot.findByIdAndUpdate(slotId, { 
        isBooked: true, 
        bookingId: booking._id 
      });
    }

    // Notify provider
    await Notification.create({
      user: listing.provider,
      title: 'New Booking Request Received',
      message: `${learner.name} requested a ${durationMinutes}-minute session for "${listing.title}" on ${date} at ${startTime}.`,
      type: 'booking_request',
      link: '/provider/sessions'
    });

    const populated = await Booking.findById(booking._id)
      .populate('provider', 'name avatar providerProfile')
      .populate('skillListing', 'title category creditCost durationMinutes');

    res.status(201).json({
      success: true,
      message: 'Booking request sent successfully. Awaiting provider confirmation.',
      booking: populated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('skillListing');

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    if (booking.provider.toString() !== req.userId && !req.user?.roles.includes('admin')) {
      res.status(403).json({ success: false, message: 'Not authorized to accept this booking.' });
      return;
    }

    if (booking.status !== 'pending') {
      res.status(400).json({ success: false, message: `Cannot accept booking with status '${booking.status}'.` });
      return;
    }

    // Deduct credits from learner atomically
    const creditResult = await CreditEngine.deductCreditsForBooking(
      booking._id.toString(),
      booking.learner.toString(),
      booking.creditCost
    );

    if (!creditResult.success) {
      res.status(400).json({ 
        success: false, 
        message: `Could not confirm booking: ${creditResult.message}` 
      });
      return;
    }

    booking.status = 'confirmed';
    booking.confirmedAt = new Date();
    await booking.save();

    // Mark any matching availability slot as booked
    await AvailabilitySlot.findOneAndUpdate(
      { provider: booking.provider, date: booking.date, startTime: booking.startTime },
      { isBooked: true, bookingId: booking._id }
    );

    // Notify learner
    await Notification.create({
      user: booking.learner,
      title: 'Booking Confirmed!',
      message: `Your session booking ${booking.bookingReference} has been confirmed. ${booking.creditCost} credits were deducted.`,
      type: 'booking_accepted',
      link: '/learner/sessions'
    });

    const updated = await Booking.findById(booking._id)
      .populate('learner', 'name email avatar')
      .populate('skillListing', 'title durationMinutes creditCost');

    res.json({
      success: true,
      message: `Booking accepted and ${booking.creditCost} skill credits securely reserved.`,
      booking: updated,
      creditResult
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const booking = await Booking.findById(id);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    if (booking.provider.toString() !== req.userId && !req.user?.roles.includes('admin')) {
      res.status(403).json({ success: false, message: 'Not authorized to reject this booking.' });
      return;
    }

    if (booking.status !== 'pending') {
      res.status(400).json({ success: false, message: `Cannot reject booking with status '${booking.status}'.` });
      return;
    }

    booking.status = 'rejected';
    booking.rejectionReason = reason || 'Provider unavailable for requested slot.';
    await booking.save();

    // Release availability slot if reserved
    await AvailabilitySlot.findOneAndUpdate(
      { bookingId: booking._id },
      { isBooked: false, $unset: { bookingId: 1 } }
    );

    // Notify learner
    await Notification.create({
      user: booking.learner,
      title: 'Booking Request Declined',
      message: `Your booking request ${booking.bookingReference} was declined by the provider. No credits were deducted.`,
      type: 'booking_rejected',
      link: '/learner/sessions'
    });

    res.json({
      success: true,
      message: 'Booking request rejected.',
      booking
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by user' } = req.body;
    const booking = await Booking.findById(id);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    const isLearner = booking.learner.toString() === req.userId;
    const isProvider = booking.provider.toString() === req.userId;
    const isAdmin = req.user?.roles.includes('admin');

    if (!isLearner && !isProvider && !isAdmin) {
      res.status(403).json({ success: false, message: 'Not authorized to cancel this booking.' });
      return;
    }

    if (['completed', 'cancelled', 'rejected'].includes(booking.status)) {
      res.status(400).json({ success: false, message: `Cannot cancel a booking with status '${booking.status}'.` });
      return;
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledBy = req.user?._id;
    booking.cancelledAt = new Date();
    await booking.save();

    // Release availability slot
    await AvailabilitySlot.findOneAndUpdate(
      { bookingId: booking._id },
      { isBooked: false, $unset: { bookingId: 1 } }
    );

    // Automatic credit refund if credits were deducted
    let refundResult = null;
    if (booking.creditDeducted && !booking.creditRefunded) {
      refundResult = await CreditEngine.refundCreditsForBooking(
        booking._id.toString(),
        `Cancellation: ${reason}`
      );
    }

    // Notify the other party
    const notifyTarget = isLearner ? booking.provider : booking.learner;
    const cancellerName = req.user?.name || 'Participant';
    await Notification.create({
      user: notifyTarget,
      title: 'Session Booking Cancelled',
      message: `Booking ${booking.bookingReference} for ${booking.date} at ${booking.startTime} was cancelled by ${cancellerName}.`,
      type: 'booking_cancelled',
      link: isLearner ? '/provider/sessions' : '/learner/sessions'
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully.' + (refundResult?.success ? ' Credits refunded to learner.' : ''),
      booking,
      refundResult
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const completeSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('skillListing');

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    if (booking.provider.toString() !== req.userId && !req.user?.roles.includes('admin')) {
      res.status(403).json({ success: false, message: 'Only the session provider or administrator can mark a session complete.' });
      return;
    }

    if (booking.status !== 'confirmed') {
      res.status(400).json({ success: false, message: `Only 'confirmed' sessions can be completed. Current status: '${booking.status}'.` });
      return;
    }

    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    // Increment booking count on listing
    await SkillListing.findByIdAndUpdate(booking.skillListing, {
      $inc: { totalBookings: 1 }
    });

    // Reward teaching credits to provider atomically
    const rewardResult = await CreditEngine.awardCreditsForCompletedSession(booking._id.toString());

    // Notify learner to leave review
    await Notification.create({
      user: booking.learner,
      title: 'Session Completed!',
      message: `Your learning session for "${(booking.skillListing as any)?.title || 'Skill'}" is marked completed. Please leave feedback!`,
      type: 'session_completed',
      link: `/learner/sessions?review=${booking._id}`
    });

    // Notify provider of credits earned
    await Notification.create({
      user: booking.provider,
      title: 'Teaching Credits Earned!',
      message: `You earned ${booking.creditCost} skill credits for completing session ${booking.bookingReference}.`,
      type: 'credit_earned',
      link: '/provider/dashboard'
    });

    res.json({
      success: true,
      message: `Session completed successfully. ${booking.creditCost} credits awarded to provider.`,
      booking,
      rewardResult
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role = 'learner', status } = req.query;

    const query: any = {};
    if (role === 'provider') {
      query.provider = req.userId;
    } else {
      query.learner = req.userId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('learner', 'name email avatar')
      .populate('provider', 'name email avatar providerProfile')
      .populate('skillListing', 'title category creditCost durationMinutes sessionFormat')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let booking: any = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(id)
        .populate('learner', 'name email avatar')
        .populate('provider', 'name email avatar providerProfile')
        .populate('skillListing');
    }

    if (!booking) {
      const sanitized = id.replace(/[-_ ]/g, '[-_ ]?');
      booking = await Booking.findOne({ 
        bookingReference: { $regex: new RegExp(`^${sanitized}$`, 'i') } 
      })
        .populate('learner', 'name email avatar')
        .populate('provider', 'name email avatar providerProfile')
        .populate('skillListing');
    }

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    const isLearner = booking.learner?._id?.toString() === req.userId || booking.learner?.toString() === req.userId;
    const isProvider = booking.provider?._id?.toString() === req.userId || booking.provider?.toString() === req.userId;
    const isAdmin = req.user?.roles.includes('admin');

    if (!isLearner && !isProvider && !isAdmin) {
      res.status(403).json({ success: false, message: 'Not authorized to view this booking.' });
      return;
    }

    res.json({ success: true, booking });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};