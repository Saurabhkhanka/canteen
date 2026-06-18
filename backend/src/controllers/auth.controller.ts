import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';

// Helper to sign JWT tokens
const generateToken = (id: string, role: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is missing from configuration.');
  }
  return jwt.sign({ id, role }, secret, {
    algorithm: 'HS256',
    expiresIn: '1d',
  });
};

// @desc    Register a new Student
// @route   POST /api/auth/register
// @access  Public
export const registerStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // 1. Basic validation
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Please provide name, email, and password.' });
      return;
    }

    // 2. Validate password strength: minimum 8 characters, at least 1 letter and 1 number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400).json({
        message: 'Password must be at least 8 characters long and contain at least one letter and one number.',
      });
      return;
    }

    // 3. Prevent duplicate emails
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'A user with this email already exists.' });
      return;
    }

    // 4. Create student (force role to 'student' to prevent privilege escalation)
    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
    });

    // 5. Generate token
    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({
      message: 'Student registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration Error:', (error as Error).message);
    res.status(500).json({ message: 'Server registration error. Please try again later.' });
  }
};

// @desc    Log in User (Admin / Student)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password.' });
      return;
    }

    // 2. Find user (explicitly check user exists)
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // 3. Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // 4. Generate token
    const token = generateToken(user._id.toString(), user.role);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login Error:', (error as Error).message);
    res.status(500).json({ message: 'Server login error. Please try again later.' });
  }
};
