import { Request, Response } from 'express';
import { Review } from '../models/Review';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { SkillListing } from '../models/SkillListing';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating || !comment) {
      res.status(400).json({ success: false, message: 'Please provide booking ID, rating (1-5), and feedback comment.' });
      return;
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5 stars.' });
      return;
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    if (booking.learner.toString() !== req.userId) {
      res.status(403).json({ success: false, message: 'Only the learner who booked the session can submit feedback.' });
      return;
    }

    if (booking.status !== 'completed') {
      res.status(400).json({ success: false, message: 'Reviews can only be submitted for completed sessions.' });
      return;
    }

    // Duplicate review prevention
    const existing = await Review.findOne({ booking: booking._id });
    if (existing) {
      res.status(400).json({ success: false, message: 'You have already submitted a review for this session.' });
      return;
    }

    const review = await Review.create({
      booking: booking._id,
      skillListing: booking.skillListing,
      reviewer: req.userId,
      provider: booking.provider,
      rating: numRating,
      comment: comment.trim(),
      status: 'approved'
    });

    booking.hasReview = true;
    await booking.save();

    // Recalculate provider average rating
    const providerReviews = await Review.find({ provider: booking.provider, status: 'approved' });
    const avgProviderRating = providerReviews.reduce((acc, r) => acc + r.rating, 0) / providerReviews.length;

    await User.findByIdAndUpdate(booking.provider, {
      'providerProfile.rating': Math.round(avgProviderRating * 10) / 10,
      'providerProfile.reviewCount': providerReviews.length
    });

    // Recalculate listing average rating
    const listingReviews = await Review.find({ skillListing: booking.skillListing, status: 'approved' });
    const avgListingRating = listingReviews.reduce((acc, r) => acc + r.rating, 0) / listingReviews.length;

    await SkillListing.findByIdAndUpdate(booking.skillListing, {
      rating: Math.round(avgListingRating * 10) / 10,
      reviewCount: listingReviews.length
    });

    // Notify provider
    await Notification.create({
      user: booking.provider,
      title: 'New Review Received!',
      message: `${req.user?.name || 'A learner'} rated your session ${numRating} stars: "${comment.substring(0, 60)}..."`,
      type: 'review_received',
      link: '/provider/reviews'
    });

    const populatedReview = await Review.findById(review._id)
      .populate('reviewer', 'name avatar')
      .populate('skillListing', 'title');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. Provider rating updated.',
      review: populatedReview
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getListingReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { listingId } = req.params;
    const reviews = await Review.find({ skillListing: listingId, status: 'approved' })
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProviderReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { providerId } = req.params;
    const reviews = await Review.find({ provider: providerId, status: 'approved' })
      .populate('reviewer', 'name avatar')
      .populate('skillListing', 'title category')
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const moderateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'flagged', 'hidden'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid moderation status.' });
      return;
    }

    const review = await Review.findByIdAndUpdate(id, { status }, { new: true });
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found.' });
      return;
    }

    res.json({ success: true, message: `Review status changed to ${status}.`, review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};