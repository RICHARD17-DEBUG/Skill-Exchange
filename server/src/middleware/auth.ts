import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
  role?: UserRole;
}

interface JwtPayload {
  id: string;
  role?: UserRole;
}

export const authenticate = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false, 
        message: 'Authentication required. No token provided.' 
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'skill_exchange_super_secure_jwt_secret_key_2026_xyz';
    
    const decoded = jwt.verify(token, secret) as JwtPayload;
    const user = await User.findById(decoded.id).select('+password');

    if (!user) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid session token: User not found.' 
      });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ 
        success: false, 
        message: 'Your account has been suspended by an administrator. Please contact support.' 
      });
      return;
    }

    req.user = user;
    req.userId = user._id.toString();
    req.role = user.currentRole || user.roles[0];
    next();
  } catch (error: any) {
    res.status(401).json({ 
      success: false, 
      message: 'Authentication failed. Invalid or expired token.' 
    });
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Admins have overarching privileges
    if (req.user.roles.includes('admin')) {
      return next();
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      res.status(403).json({ 
        success: false, 
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role.` 
      });
      return;
    }

    next();
  };
};