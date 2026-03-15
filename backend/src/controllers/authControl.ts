import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authMiddle.ts';
import User, { IUser } from '../models/userModel.ts';
import { generateToken } from '../utils/jwtToken.ts';

interface SignupRequestBody {
  fullName: string;
  email: string;
  password: string;
}

interface AuthResponseData {
  user: {
    _id: mongoose.Types.ObjectId;
    fullName: string;
    email: string;
    notes: mongoose.Types.ObjectId[];
  };
}

interface ErrorResponse {
  message: string;
}

export const signup = async (
  req: Request<{}, {}, SignupRequestBody>,
  res: Response<AuthResponseData | ErrorResponse>
): Promise<void> => {
  try {
    const { fullName, email, password }: SignupRequestBody = req.body;

    // ✅ Validation checks
    if (!fullName || !email || !password) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    const existingUser: IUser | null = await User.findOne({ email });

    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const salt: string = await bcrypt.genSalt(10);
    const hashedPassword: string = await bcrypt.hash(password, salt);

    const newUser: IUser = new User({
      name: fullName,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    generateToken(newUser._id.toString(), res);

    res.status(201).json({
      user: {
        _id: newUser._id as mongoose.Types.ObjectId,
        fullName: newUser.name,
        email: newUser.email,
        notes: newUser.notes,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log('Error in signup controller:', error.message);
    } else {
      console.log('Error in signup controller:', error);
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

interface SigninRequestBody {
  email: string;
  password: string;
}

export const signin = async (
  req: Request<{}, {}, SigninRequestBody>,
  res: Response<AuthResponseData | ErrorResponse>
): Promise<void> => {
  try {
    const { email, password }: SigninRequestBody = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    const user: IUser | null = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ message: 'Invalid email or password' });
      return;
    }

    const isPasswordValid: boolean = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(400).json({ message: 'Invalid email or password' });
      return;
    }

    generateToken(user._id.toString(), res);

    res.status(200).json({
      user: {
        _id: user._id as mongoose.Types.ObjectId,
        fullName: user.name,
        email: user.email,
        notes: user.notes,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log('Error in signin controller:', error.message);
    } else {
      console.log('Error in signin controller:', error);
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response<{ message: string }>): Promise<void> => {
  try {
    res.cookie('jwt', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log('Error in logout controller:', error.message);
    } else {
      console.log('Error in logout controller:', error);
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response<AuthResponseData | ErrorResponse>
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    res.status(200).json({
      user: {
        _id: user._id as mongoose.Types.ObjectId,
        fullName: user.name,
        email: user.email,
        notes: user.notes,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log('Error in getCurrentUser controller:', error.message);
    } else {
      console.log('Error in getCurrentUser controller:', error);
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};
