import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'learner' | 'provider' | 'admin';
export type AccountStatus = 'active' | 'suspended';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface IProviderProfile {
  headline: string;
  bio: string;
  yearsOfExperience: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  verificationDocuments: string[];
  verificationNotes?: string;
  verifiedAt?: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  roles: UserRole[];
  currentRole: UserRole;
  creditBalance: number;
  creditsEarned: number;
  creditsSpent: number;
  interests: string[];
  skillsToLearn: string[];
  providerProfile: IProviderProfile;
  status: AccountStatus;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const ProviderProfileSchema = new Schema<IProviderProfile>({
  headline: { type: String, default: '' },
  bio: { type: String, default: '' },
  yearsOfExperience: { type: Number, default: 0, min: 0 },
  rating: { type: Number, default: 5.0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  isVerified: { type: Boolean, default: false },
  verificationStatus: { 
    type: String, 
    enum: ['unverified', 'pending', 'verified', 'rejected'], 
    default: 'unverified' 
  },
  verificationDocuments: { type: [String], default: [] },
  verificationNotes: { type: String, default: '' },
  verifiedAt: { type: Date }
}, { _id: false });

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true,
    index: true 
  },
  password: { type: String, required: true, select: false },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  roles: { 
    type: [String], 
    enum: ['learner', 'provider', 'admin'], 
    default: ['learner'] 
  },
  currentRole: { 
    type: String, 
    enum: ['learner', 'provider', 'admin'], 
    default: 'learner' 
  },
  creditBalance: { 
    type: Number, 
    default: 100, 
    min: [0, 'Credit balance cannot be negative'] 
  },
  creditsEarned: { type: Number, default: 0, min: 0 },
  creditsSpent: { type: Number, default: 0, min: 0 },
  interests: { type: [String], default: [] },
  skillsToLearn: { type: [String], default: [] },
  providerProfile: { 
    type: ProviderProfileSchema, 
    default: () => ({}) 
  },
  status: { 
    type: String, 
    enum: ['active', 'suspended'], 
    default: 'active' 
  }
}, {
  timestamps: true
});

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);