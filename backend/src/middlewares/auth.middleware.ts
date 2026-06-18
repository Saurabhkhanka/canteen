import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';

interface IDecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

// Protect middleware to ensure the request is authenticated
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  // 1. Check if token exists in authorization header and starts with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: 'Access denied. No authentication token provided.' });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('CRITICAL: JWT_SECRET environment variable is missing.');
      res.status(500).json({ message: 'Internal server configuration error.' });
      return;
    }

    // 2. Verify token explicitly restricting to HS256 algorithm
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
    }) as IDecodedToken;

    // 3. Find user in the database (exclude password)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401).json({ message: 'The user belonging to this token no longer exists.' });
      return;
    }

    // 4. Attach user to Request object
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', (error as Error).message);
    res.status(401).json({ message: 'Authentication failed. Invalid or expired token.' });
  }
};

// Authorize middleware to enforce role-based access control (RBAC)
export const authorize = (...roles: ('student' | 'admin')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized. Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      return;
    }

    next();
  };
};
