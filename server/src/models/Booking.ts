import mongoose, { Document, Schema } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

export interface IBooking extends Document {
  bookingReference: string;
  learner: mongoose.Types.ObjectId;
  provider: mongoose.Types.ObjectId;
  skillListing: mongoose.Types.ObjectId;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  creditCost: number; // Skill credits
  status: BookingStatus;
  meetingLink: string;
  learnerNotes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  cancelledBy?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  creditDeducted: boolean;
  creditRefunded: boolean;
  creditRewarded: boolean;
  hasReview: boolean;
  confirmedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  bookingReference: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  learner: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  provider: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  skillListing: { 
    type: Schema.Types.ObjectId, 
    ref: 'SkillListing', 
    required: true, 
    index: true 
  },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  creditCost: { 
    type: Number, 
    required: true, 
    min: [0, 'Credit cost cannot be negative'] 
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'], 
    default: 'pending',
    index: true
  },
  meetingLink: { type: String, default: '' },
  learnerNotes: { type: String, default: '' },
  rejectionReason: { type: String, default: '' },
  cancellationReason: { type: String, default: '' },
  cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  cancelledAt: { type: Date },
  creditDeducted: { type: Boolean, default: false },
  creditRefunded: { type: Boolean, default: false },
  creditRewarded: { type: Boolean, default: false },
  hasReview: { type: Boolean, default: false },
  confirmedAt: { type: Date },
  completedAt: { type: Date }
}, {
  timestamps: true
});

BookingSchema.index({ provider: 1, date: 1, startTime: 1, status: 1 });
BookingSchema.index({ learner: 1, date: 1, startTime: 1, status: 1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);