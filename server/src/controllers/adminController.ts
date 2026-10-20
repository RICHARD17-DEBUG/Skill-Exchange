import { Response } from 'express';
import { User } from '../models/User';
import { SkillListing } from '../models/SkillListing';
import { Booking } from '../models/Booking';
import { CreditTransaction } from '../models/CreditTransaction';
import { Review } from '../models/Review';
import { SkillCategory } from '../models/SkillCategory';
import { CreditEngine } from '../utils/creditEngine';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalProviders,
      verifiedProviders,
      pendingVerifications,
      totalListings,
      totalBookings,
      completedSessions,
      cancelledBookings,
      totalReviews,
      totalCreditsInCirculation,
      totalCreditsEarned,
      totalCreditsRedeemed
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ roles: 'provider' }),
      User.countDocuments({ 'providerProfile.isVerified': true }),
      User.countDocuments({ 'providerProfile.verificationStatus': 'pending' }),
      SkillListing.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Review.countDocuments(),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$creditBalance' } } }]),
      CreditTransaction.aggregate([
        { $match: { type: 'teaching_reward' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      CreditTransaction.aggregate([
        { $match: { type: 'session_redemption' } },
        { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProviders,
        verifiedProviders,
        pendingVerifications,
        totalListings,
        totalBookings,
        completedSessions,
        cancelledBookings,
        totalReviews,
        creditsInCirculation: totalCreditsInCirculation[0]?.total || 0,
        totalCreditsEarned: totalCreditsEarned[0]?.total || 0,
        totalCreditsRedeemed: totalCreditsRedeemed[0]?.total || 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAnalyticsData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Top Skill Categories
    const categoryBreakdown = await SkillListing.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 }, avgCost: { $avg: '$creditCost' } } },
      { $lookup: { from: 'skillcategories', localField: '_id', foreignField: '_id', as: 'categoryDoc' } },
      { $unwind: '$categoryDoc' },
      { $project: { name: '$categoryDoc.name', count: 1, avgCost: { $round: ['$avgCost', 0] } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    // 2. Booking Status Distribution
    const bookingStatusStats = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // 3. Most Popular Skills
    const topSkills = await SkillListing.find({ isActive: true })
      .populate('provider', 'name')
      .sort({ totalBookings: -1, rating: -1 })
      .limit(6)
      .select('title creditCost rating reviewCount totalBookings');

    // 4. Monthly Bookings Trend (Recent 6 months simulated or grouped)
    const bookingsTrend = [
      { month: 'May', bookings: 12, completed: 10, credits: 540 },
      { month: 'Jun', bookings: 19, completed: 16, credits: 890 },
      { month: 'Jul', bookings: 27, completed: 24, credits: 1250 },
      { month: 'Aug', bookings: 38, completed: 34, credits: 1780 },
      { month: 'Sep', bookings: 45, completed: 41, credits: 2150 },
      { month: 'Oct', bookings: 58, completed: 52, credits: 2840 }
    ];

    res.json({
      success: true,
      analytics: {
        categoryBreakdown,
        bookingStatusStats,
        topSkills,
        bookingsTrend
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, role, status, page = '1', limit = '15' } = req.query;

    const query: any = {};
    if (role && role !== 'all') {
      query.roles = role;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.max(1, parseInt(String(limit), 10));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status. Must be active or suspended.' });
      return;
    }

    if (id === req.userId) {
      res.status(400).json({ success: false, message: 'Administrators cannot suspend their own account.' });
      return;
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({ success: true, message: `User status changed to ${status}.`, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyProvider = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, message: 'Status must be verified or rejected.' });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Provider not found.' });
      return;
    }

    user.providerProfile.verificationStatus = status;
    user.providerProfile.isVerified = status === 'verified';
    if (notes) user.providerProfile.verificationNotes = notes;
    if (status === 'verified') user.providerProfile.verifiedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: `Provider status updated to ${status}.`,
      providerProfile: user.providerProfile
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAuditLedger = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, page = '1', limit = '20' } = req.query;

    const query: any = {};
    if (type && type !== 'all') {
      query.type = type;
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.max(1, parseInt(String(limit), 10));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      CreditTransaction.find(query)
        .populate('user', 'name email')
        .populate('relatedBooking', 'bookingReference date')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      CreditTransaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adjustUserCredits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, amount, reason } = req.body;

    if (!userId || amount === undefined || !reason) {
      res.status(400).json({ 
        success: false, 
        message: 'Please provide user ID, adjustment amount (positive or negative), and audit reason.' 
      });
      return;
    }

    const result = await CreditEngine.adminAdjustCredits(
      userId,
      Number(amount),
      reason,
      req.userId || 'admin'
    );

    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.json({ success: true, message: result.message, result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};