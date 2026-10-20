import mongoose, { Document, Schema } from 'mongoose';

export interface ISkillCategory extends Document {
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
  createdAt: Date;
}

const SkillCategorySchema = new Schema<ISkillCategory>({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'BookOpen' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const SkillCategory = mongoose.model<ISkillCategory>('SkillCategory', SkillCategorySchema);