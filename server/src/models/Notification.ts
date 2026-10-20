import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 
  | 'booking_request' 
  | 'booking_accepted' 
  | 'booking_rejected' 
  | 'booking_cancelled' 
  | 'session_completed' 
  | 'credit_earned' 
  | 'credit_spent' 
  | 'review_received' 
  | 'verification_update'
  | 'system';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: [
      'booking_request', 
      'booking_accepted', 
      'booking_rejected', 
      'booking_cancelled', 
      'session_completed', 
      'credit_earned', 
      'credit_spent', 
      'review_received',
      'verification_update',
      'system'
    ], 
    required: true 
  },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);