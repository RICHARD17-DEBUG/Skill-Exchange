import mongoose, { Document, Schema } from 'mongoose';

export interface IAvailabilitySlot extends Document {
  provider: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24-hour)
  endTime: string; // HH:mm (24-hour)
  isBooked: boolean;
  bookingId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AvailabilitySlotSchema = new Schema<IAvailabilitySlot>({
  provider: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

AvailabilitySlotSchema.index({ provider: 1, date: 1, startTime: 1 }, { unique: true });

export const AvailabilitySlot = mongoose.model<IAvailabilitySlot>('AvailabilitySlot', AvailabilitySlotSchema);