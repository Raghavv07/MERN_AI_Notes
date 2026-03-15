import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/userModel.ts';

interface JwtPayload {
  userId: string;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protectRoute = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      res.status(401).json({ message: 'Unauthorized - No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (!decoded) {
      res.status(401).json({ message: 'Unauthorized - Invalid token' });
      return;
    }

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Unauthorized - Invalid token' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Unauthorized - Token expired' });
      return;
    }
    console.log('Error in protectRoute middleware:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
