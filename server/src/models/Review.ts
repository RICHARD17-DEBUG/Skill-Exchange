import mongoose, { Document, Schema } from 'mongoose';

export type ReviewStatus = 'approved' | 'flagged' | 'hidden';

export interface IReview extends Document {
  booking: mongoose.Types.ObjectId;
  skillListing: mongoose.Types.ObjectId;
  reviewer: mongoose.Types.ObjectId; // Learner
  provider: mongoose.Types.ObjectId;
  rating: number; // 1 to 5
  comment: string;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  booking: { 
    type: Schema.Types.ObjectId, 
    ref: 'Booking', 
    required: true, 
    unique: true, // Only 1 review per booking!
    index: true 
  },
  skillListing: { 
    type: Schema.Types.ObjectId, 
    ref: 'SkillListing', 
    required: true, 
    index: true 
  },
  reviewer: { 
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
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 1000 
  },
  status: { 
    type: String, 
    enum: ['approved', 'flagged', 'hidden'], 
    default: 'approved' 
  }
}, {
  timestamps: true
});

ReviewSchema.index({ provider: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ skillListing: 1, status: 1, createdAt: -1 });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);