export type UserRole = 'learner' | 'provider' | 'admin';
export type AccountStatus = 'active' | 'suspended';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface IProviderProfile {
  headline?: string;
  bio?: string;
  yearsOfExperience?: number;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  verificationStatus?: VerificationStatus;
  verificationDocuments?: string[];
  verificationNotes?: string;
  verifiedAt?: string;
}

export interface IUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  roles: UserRole[];
  currentRole: UserRole;
  creditBalance: number;
  creditsEarned: number;
  creditsSpent: number;
  interests?: string[];
  skillsToLearn?: string[];
  providerProfile?: IProviderProfile;
  status?: AccountStatus;
  createdAt?: string;
}

export interface ISkillCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
}

export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type SessionFormat = '1-on-1 Video' | 'Hands-on Lab' | 'Code Review' | 'Consultation';

export interface ISkillListing {
  _id: string;
  provider: {
    _id: string;
    name: string;
    avatar?: string;
    bio?: string;
    email?: string;
    providerProfile?: IProviderProfile;
  };
  title: string;
  slug: string;
  description: string;
  category: ISkillCategory | string;
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
  createdAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

export interface IBooking {
  _id: string;
  bookingReference: string;
  learner: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  provider: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    providerProfile?: IProviderProfile;
  };
  skillListing: ISkillListing;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  creditCost: number;
  status: BookingStatus;
  meetingLink?: string;
  learnerNotes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  creditDeducted: boolean;
  creditRefunded: boolean;
  creditRewarded: boolean;
  hasReview: boolean;
  confirmedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export type TransactionType = 
  | 'initial_grant' 
  | 'session_redemption' 
  | 'session_refund' 
  | 'teaching_reward' 
  | 'admin_adjustment';

export interface ICreditTransaction {
  _id: string;
  transactionId: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  relatedBooking?: {
    _id: string;
    bookingReference: string;
    date: string;
  };
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

export interface IReview {
  _id: string;
  booking: string;
  skillListing: string | { _id: string; title: string };
  reviewer: {
    _id: string;
    name: string;
    avatar?: string;
  };
  provider: string;
  rating: number;
  comment: string;
  status: 'approved' | 'flagged' | 'hidden';
  createdAt: string;
}

export interface IAvailabilitySlot {
  _id: string;
  provider: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface INotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}