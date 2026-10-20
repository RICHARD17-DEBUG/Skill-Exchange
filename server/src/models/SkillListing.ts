import mongoose, { Document, Schema } from 'mongoose';

export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type SessionFormat = '1-on-1 Video' | 'Hands-on Lab' | 'Code Review' | 'Consultation';

export interface ISkillListing extends Document {
  provider: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  category: mongoose.Types.ObjectId;
  proficiencyLevel: ProficiencyLevel;
  creditCost: number; // Strictly skill credits!
  durationMinutes: number;
  tags: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  sessionFormat: SessionFormat;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  totalBookings: number;
  createdAt: Date;
  updatedAt: Date;
}

const SkillListingSchema = new Schema<ISkillListing>({
  provider: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  title: { type: String, required: true, trim: true, index: 'text' },
  slug: { type: String, required: true, lowercase: true, trim: true },
  description: { type: String, required: true },
  category: { 
    type: Schema.Types.ObjectId, 
    ref: 'SkillCategory', 
    required: true,
    index: true 
  },
  proficiencyLevel: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'], 
    default: 'All Levels' 
  },
  creditCost: { 
    type: Number, 
    required: true, 
    min: [5, 'Skill credit cost must be at least 5 credits'],
    max: [200, 'Skill credit cost cannot exceed 200 credits']
  },
  durationMinutes: { 
    type: Number, 
    required: true, 
    default: 60,
    enum: [30, 45, 60, 90, 120] 
  },
  tags: { type: [String], default: [] },
  prerequisites: { type: [String], default: [] },
  learningOutcomes: { type: [String], default: [] },
  sessionFormat: { 
    type: String, 
    enum: ['1-on-1 Video', 'Hands-on Lab', 'Code Review', 'Consultation'], 
    default: '1-on-1 Video' 
  },
  isActive: { type: Boolean, default: true, index: true },
  rating: { type: Number, default: 5.0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  totalBookings: { type: Number, default: 0, min: 0 }
}, {
  timestamps: true
});

SkillListingSchema.index({ provider: 1, title: 1 });
SkillListingSchema.index({ category: 1, creditCost: 1, rating: -1 });

export const SkillListing = mongoose.model<ISkillListing>('SkillListing', SkillListingSchema);