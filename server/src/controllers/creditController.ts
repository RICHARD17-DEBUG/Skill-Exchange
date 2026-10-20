import { Response } from 'express';
import { CreditTransaction } from '../models/CreditTransaction';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const getCreditSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select('creditBalance creditsEarned creditsSpent');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const recentTransactions = await CreditTransaction.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      summary: {
        creditBalance: user.creditBalance,
        creditsEarned: user.creditsEarned,
        creditsSpent: user.creditsSpent,
        recentTransactions
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, page = '1', limit = '20' } = req.query;

    const query: any = { user: req.userId };
    if (type && type !== 'all') {
      query.type = type;
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.max(1, parseInt(String(limit), 10));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      CreditTransaction.find(query)
        .populate('relatedBooking', 'bookingReference date startTime durationMinutes')
        .populate('relatedListing', 'title category')
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