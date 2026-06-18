import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import foodRoutes from './routes/food.routes';
import orderRoutes from './routes/order.routes';
import adminRoutes from './routes/admin.routes';
import { protect, authorize } from './middlewares/auth.middleware';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:3000',
    credentials: true,
  })
);

// Body Parsing Middleware
app.use(express.json({ limit: '10kb' })); // Mitigate Large Request Payload attacks

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', foodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Basic status check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Verification/Testing routes for RBAC (can be kept for audit verification)
app.get('/api/test/student-only', protect, authorize('student'), (req: Request, res: Response) => {
  res.status(200).json({ message: 'Access granted. Welcome, Student!', user: req.user });
});

app.get('/api/test/admin-only', protect, authorize('admin'), (req: Request, res: Response) => {
  res.status(200).json({ message: 'Access granted. Welcome, Admin!', user: req.user });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

export default app;

