import { Request, Response } from 'express';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { AuthRequest } from '../middleware/auth';

export const getProviderAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { providerId } = req.params;
    const { startDate, endDate } = req.query;

    const query: any = { 
      provider: providerId,
      isBooked: false
    };

    if (startDate && endDate) {
      query.date = { $gte: String(startDate), $lte: String(endDate) };
    } else if (startDate) {
      query.date = { $gte: String(startDate) };
    }

    const slots = await AvailabilitySlot.find(query).sort({ date: 1, startTime: 1 });

    res.json({ success: true, slots });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const slots = await AvailabilitySlot.find({ provider: req.userId })
      .populate('bookingId')
      .sort({ date: 1, startTime: 1 });

    res.json({ success: true, slots });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addAvailabilitySlot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
      res.status(400).json({ success: false, message: 'Please provide date, start time, and end time.' });
      return;
    }

    // Check duplicate
    const existing = await AvailabilitySlot.findOne({
      provider: req.userId,
      date,
      startTime
    });

    if (existing) {
      res.status(400).json({ success: false, message: 'An availability slot already exists for this date and time.' });
      return;
    }

    const slot = await AvailabilitySlot.create({
      provider: req.userId,
      date,
      startTime,
      endTime,
      isBooked: false
    });

    res.status(201).json({ success: true, message: 'Availability slot added.', slot });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAvailabilitySlot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const slot = await AvailabilitySlot.findById(id);

    if (!slot) {
      res.status(404).json({ success: false, message: 'Slot not found.' });
      return;
    }

    if (slot.provider.toString() !== req.userId) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this slot.' });
      return;
    }

    if (slot.isBooked) {
      res.status(400).json({ success: false, message: 'Cannot delete a booked availability slot.' });
      return;
    }

    await AvailabilitySlot.findByIdAndDelete(id);

    res.json({ success: true, message: 'Availability slot removed.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};