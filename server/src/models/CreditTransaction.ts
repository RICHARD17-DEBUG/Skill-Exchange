import mongoose, { Document, Schema } from 'mongoose';

export type TransactionType = 
  | 'initial_grant' 
  | 'session_redemption' 
  | 'session_refund' 
  | 'teaching_reward' 
  | 'admin_adjustment';

export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface ICreditTransaction extends Document {
  transactionId: string;
  user: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number; // positive = credit gained, negative = credit spent
  balanceAfter: number;
  relatedBooking?: mongoose.Types.ObjectId;
  relatedListing?: mongoose.Types.ObjectId;
  description: string;
  status: TransactionStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const CreditTransactionSchema = new Schema<ICreditTransaction>({
  transactionId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  type: { 
    type: String, 
    enum: [
      'initial_grant', 
      'session_redemption', 
      'session_refund', 
      'teaching_reward', 
      'admin_adjustment'
    ], 
    required: true,
    index: true
  },
  amount: { 
    type: Number, 
    required: true 
  },
  balanceAfter: { 
    type: Number, 
    required: true, 
    min: [0, 'Credit balance after transaction cannot be negative'] 
  },
  relatedBooking: { 
    type: Schema.Types.ObjectId, 
    ref: 'Booking' 
  },
  relatedListing: { 
    type: Schema.Types.ObjectId, 
    ref: 'SkillListing' 
  },
  description: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['completed', 'pending', 'failed'], 
    default: 'completed' 
  },
  metadata: { 
    type: Schema.Types.Mixed, 
    default: {} 
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

CreditTransactionSchema.index({ user: 1, createdAt: -1 });

export const CreditTransaction = mongoose.model<ICreditTransaction>('CreditTransaction', CreditTransactionSchema);