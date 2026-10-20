import { Request, Response } from 'express';
import { SkillListing } from '../models/SkillListing';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const getSkillListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      search, 
      category, 
      level, 
      minCredits, 
      maxCredits, 
      minRating, 
      sort = 'newest',
      page = '1',
      limit = '12'
    } = req.query;

    const query: any = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (level && level !== 'All') {
      query.proficiencyLevel = level;
    }

    if (minCredits || maxCredits) {
      query.creditCost = {};
      if (minCredits) query.creditCost.$gte = Number(minCredits);
      if (maxCredits) query.creditCost.$lte = Number(maxCredits);
    }

    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    const sortOptions: any = {};
    if (sort === 'rating') sortOptions.rating = -1;
    else if (sort === 'credits-asc') sortOptions.creditCost = 1;
    else if (sort === 'credits-desc') sortOptions.creditCost = -1;
    else if (sort === 'popular') sortOptions.totalBookings = -1;
    else sortOptions.createdAt = -1;

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.max(1, parseInt(String(limit), 10));
    const skip = (pageNum - 1) * limitNum;

    const [listings, total] = await Promise.all([
      SkillListing.find(query)
        .populate('provider', 'name avatar providerProfile')
        .populate('category', 'name slug icon')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      SkillListing.countDocuments(query)
    ]);

    res.json({
      success: true,
      listings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSkillListingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const listing = await SkillListing.findById(id)
      .populate('provider', 'name email avatar bio providerProfile')
      .populate('category', 'name slug icon');

    if (!listing) {
      res.status(404).json({ success: false, message: 'Skill listing not found.' });
      return;
    }

    res.json({ success: true, listing });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSkillListing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      title, 
      description, 
      category, 
      proficiencyLevel, 
      creditCost, 
      durationMinutes = 60,
      tags = [],
      prerequisites = [],
      learningOutcomes = [],
      sessionFormat = '1-on-1 Video'
    } = req.body;

    if (!title || !description || !category || creditCost === undefined) {
      res.status(400).json({ 
        success: false, 
        message: 'Please provide title, description, category, and credit cost.' 
      });
      return;
    }

    const cost = Number(creditCost);
    if (isNaN(cost) || cost < 5 || cost > 200) {
      res.status(400).json({ 
        success: false, 
        message: 'Skill credit cost must be between 5 and 200 credits.' 
      });
      return;
    }

    // Auto-grant provider role if needed
    const user = await User.findById(req.userId);
    if (user && !user.roles.includes('provider')) {
      user.roles.push('provider');
      await user.save();
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${Date.now().toString(36)}`;

    const listing = await SkillListing.create({
      provider: req.userId,
      title,
      slug,
      description,
      category,
      proficiencyLevel: proficiencyLevel || 'All Levels',
      creditCost: cost,
      durationMinutes,
      tags,
      prerequisites,
      learningOutcomes,
      sessionFormat,
      isActive: true,
      rating: 5.0,
      reviewCount: 0,
      totalBookings: 0
    });

    const populatedListing = await SkillListing.findById(listing._id)
      .populate('provider', 'name avatar providerProfile')
      .populate('category', 'name slug icon');

    res.status(201).json({
      success: true,
      message: 'Skill listing published successfully.',
      listing: populatedListing
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSkillListing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const listing = await SkillListing.findById(id);

    if (!listing) {
      res.status(404).json({ success: false, message: 'Skill listing not found.' });
      return;
    }

    // Only owner or admin can edit
    if (listing.provider.toString() !== req.userId && !req.user?.roles.includes('admin')) {
      res.status(403).json({ success: false, message: 'Not authorized to edit this listing.' });
      return;
    }

    const { 
      title, 
      description, 
      category, 
      proficiencyLevel, 
      creditCost, 
      durationMinutes,
      tags,
      prerequisites,
      learningOutcomes,
      sessionFormat,
      isActive 
    } = req.body;

    if (title) listing.title = title;
    if (description) listing.description = description;
    if (category) listing.category = category;
    if (proficiencyLevel) listing.proficiencyLevel = proficiencyLevel;
    if (creditCost !== undefined) {
      const cost = Number(creditCost);
      if (isNaN(cost) || cost < 5 || cost > 200) {
        res.status(400).json({ success: false, message: 'Credit cost must be between 5 and 200 credits.' });
        return;
      }
      listing.creditCost = cost;
    }
    if (durationMinutes) listing.durationMinutes = durationMinutes;
    if (tags) listing.tags = tags;
    if (prerequisites) listing.prerequisites = prerequisites;
    if (learningOutcomes) listing.learningOutcomes = learningOutcomes;
    if (sessionFormat) listing.sessionFormat = sessionFormat;
    if (isActive !== undefined) listing.isActive = isActive;

    await listing.save();

    const populated = await SkillListing.findById(listing._id)
      .populate('provider', 'name avatar providerProfile')
      .populate('category', 'name slug icon');

    res.json({
      success: true,
      message: 'Skill listing updated successfully.',
      listing: populated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSkillListing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const listing = await SkillListing.findById(id);

    if (!listing) {
      res.status(404).json({ success: false, message: 'Skill listing not found.' });
      return;
    }

    if (listing.provider.toString() !== req.userId && !req.user?.roles.includes('admin')) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this listing.' });
      return;
    }

    await SkillListing.findByIdAndDelete(id);

    res.json({ success: true, message: 'Skill listing removed successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyListings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listings = await SkillListing.find({ provider: req.userId })
      .populate('category', 'name slug icon')
      .sort({ createdAt: -1 });

    res.json({ success: true, listings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};