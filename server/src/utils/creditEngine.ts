import mongoose from 'mongoose';
import { User } from '../models/User';
import { CreditTransaction, TransactionType } from '../models/CreditTransaction';
import { Booking } from '../models/Booking';

export interface CreditOperationResult {
  success: boolean;
  message: string;
  transaction?: any;
  newBalance?: number;
}

export class CreditEngine {
  /**
   * Generates a unique, non-duplicable transaction reference
   */
  private static generateTransactionId(): string {
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CTX-${timestamp}-${randomHex}`;
  }

  /**
   * Securely deducts credits from a learner for booking confirmation
   */
  public static async deductCreditsForBooking(
    bookingId: string,
    learnerId: string,
    amount: number
  ): Promise<CreditOperationResult> {
    if (amount <= 0) {
      return { success: false, message: 'Invalid credit amount. Must be positive.' };
    }

    // Atomic fetch and validate balance
    const user = await User.findById(learnerId);
    if (!user) {
      return { success: false, message: 'Learner account not found.' };
    }

    if (user.creditBalance < amount) {
      return { 
        success: false, 
        message: `Insufficient skill credits. Required: ${amount} credits, Available: ${user.creditBalance} credits.` 
      };
    }

    // Check if booking already had credits deducted to prevent duplicate deduction
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return { success: false, message: 'Associated booking not found.' };
    }

    if (booking.creditDeducted) {
      return { success: false, message: 'Credits have already been deducted for this booking.' };
    }

    // Deduct atomically
    const updatedUser = await User.findOneAndUpdate(
      { _id: learnerId, creditBalance: { $gte: amount } },
      { 
        $inc: { creditBalance: -amount, creditsSpent: amount } 
      },
      { new: true }
    );

    if (!updatedUser) {
      return { success: false, message: 'Transaction conflict: Insufficient credits or concurrent update.' };
    }

    // Mark booking as creditDeducted
    booking.creditDeducted = true;
    await booking.save();

    // Create an immutable ledger transaction
    const transaction = await CreditTransaction.create({
      transactionId: this.generateTransactionId(),
      user: user._id,
      type: 'session_redemption',
      amount: -amount,
      balanceAfter: updatedUser.creditBalance,
      relatedBooking: booking._id,
      relatedListing: booking.skillListing,
      description: `Redeemed ${amount} skill credits for session booking ${booking.bookingReference}`,
      status: 'completed',
      metadata: {
        bookingReference: booking.bookingReference,
        sessionDate: booking.date,
        durationMinutes: booking.durationMinutes
      }
    });

    return {
      success: true,
      message: `Successfully deducted ${amount} skill credits.`,
      transaction,
      newBalance: updatedUser.creditBalance
    };
  }

  /**
   * Restores credits to learner upon valid cancellation
   */
  public static async refundCreditsForBooking(
    bookingId: string,
    reason: string
  ): Promise<CreditOperationResult> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return { success: false, message: 'Booking not found.' };
    }

    if (!booking.creditDeducted) {
      return { success: false, message: 'No credits were deducted for this booking, refund not applicable.' };
    }

    if (booking.creditRefunded) {
      return { success: false, message: 'Credits for this booking have already been refunded.' };
    }

    const refundAmount = booking.creditCost;

    const updatedUser = await User.findByIdAndUpdate(
      booking.learner,
      { 
        $inc: { creditBalance: refundAmount, creditsSpent: -refundAmount } 
      },
      { new: true }
    );

    if (!updatedUser) {
      return { success: false, message: 'Learner account not found for credit refund.' };
    }

    booking.creditRefunded = true;
    await booking.save();

    const transaction = await CreditTransaction.create({
      transactionId: this.generateTransactionId(),
      user: booking.learner,
      type: 'session_refund',
      amount: refundAmount,
      balanceAfter: updatedUser.creditBalance,
      relatedBooking: booking._id,
      relatedListing: booking.skillListing,
      description: `Refunded ${refundAmount} skill credits for cancelled booking ${booking.bookingReference}. Reason: ${reason}`,
      status: 'completed',
      metadata: {
        bookingReference: booking.bookingReference,
        cancellationReason: reason
      }
    });

    return {
      success: true,
      message: `Successfully refunded ${refundAmount} skill credits.`,
      transaction,
      newBalance: updatedUser.creditBalance
    };
  }

  /**
   * Awards teaching credits to a provider when a session is completed
   */
  public static async awardCreditsForCompletedSession(
    bookingId: string
  ): Promise<CreditOperationResult> {
    const booking = await Booking.findById(bookingId).populate('skillListing');
    if (!booking) {
      return { success: false, message: 'Booking not found.' };
    }

    if (booking.status !== 'completed') {
      return { success: false, message: 'Cannot award credits: Session has not been completed.' };
    }

    if (booking.creditRewarded) {
      return { success: false, message: 'Teaching credits have already been awarded for this completed session.' };
    }

    // Default reward rule: Provider earns 100% of the session credit cost
    const rewardAmount = booking.creditCost;

    const updatedProvider = await User.findByIdAndUpdate(
      booking.provider,
      { 
        $inc: { creditBalance: rewardAmount, creditsEarned: rewardAmount } 
      },
      { new: true }
    );

    if (!updatedProvider) {
      return { success: false, message: 'Provider account not found.' };
    }

    booking.creditRewarded = true;
    await booking.save();

    const transaction = await CreditTransaction.create({
      transactionId: this.generateTransactionId(),
      user: booking.provider,
      type: 'teaching_reward',
      amount: rewardAmount,
      balanceAfter: updatedProvider.creditBalance,
      relatedBooking: booking._id,
      relatedListing: booking.skillListing,
      description: `Earned ${rewardAmount} skill credits for successfully teaching session ${booking.bookingReference}`,
      status: 'completed',
      metadata: {
        bookingReference: booking.bookingReference,
        sessionDate: booking.date
      }
    });

    return {
      success: true,
      message: `Awarded ${rewardAmount} skill credits to provider.`,
      transaction,
      newBalance: updatedProvider.creditBalance
    };
  }

  /**
   * Audited administrator credit adjustment with mandatory audit explanation
   */
  public static async adminAdjustCredits(
    userId: string,
    amount: number,
    reason: string,
    adminId: string
  ): Promise<CreditOperationResult> {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'Target user not found.' };
    }

    if (amount < 0 && user.creditBalance + amount < 0) {
      return { 
        success: false, 
        message: `Cannot deduct ${Math.abs(amount)} credits: User only has ${user.creditBalance} credits.` 
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $inc: { creditBalance: amount } 
      },
      { new: true }
    );

    if (!updatedUser) {
      return { success: false, message: 'Failed to update credit balance.' };
    }

    const transaction = await CreditTransaction.create({
      transactionId: this.generateTransactionId(),
      user: user._id,
      type: 'admin_adjustment',
      amount,
      balanceAfter: updatedUser.creditBalance,
      description: `Admin adjustment (${amount >= 0 ? '+' : ''}${amount} credits): ${reason}`,
      status: 'completed',
      metadata: {
        adjustedBy: adminId,
        reason
      }
    });

    return {
      success: true,
      message: `Successfully adjusted credits by ${amount}. New balance: ${updatedUser.creditBalance}`,
      transaction,
      newBalance: updatedUser.creditBalance
    };
  }
}