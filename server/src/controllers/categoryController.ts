import { Request, Response } from 'express';
import { SkillCategory } from '../models/SkillCategory';
import { AuthRequest } from '../middleware/auth';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await SkillCategory.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, icon } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Category name is required.' });
      return;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existing = await SkillCategory.findOne({ slug });
    if (existing) {
      res.status(400).json({ success: false, message: 'Category with this name already exists.' });
      return;
    }

    const category = await SkillCategory.create({
      name,
      slug,
      description: description || '',
      icon: icon || 'BookOpen'
    });

    res.status(201).json({ success: true, message: 'Category created successfully.', category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, icon, isActive } = req.body;

    const category = await SkillCategory.findById(id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    if (name) {
      category.name = name;
      category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    res.json({ success: true, message: 'Category updated successfully.', category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await SkillCategory.findByIdAndDelete(id);
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};