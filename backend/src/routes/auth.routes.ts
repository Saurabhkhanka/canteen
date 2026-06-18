import { Router } from 'express';
import { registerStudent, login } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Public routes for user onboarding & authentication
router.post('/register', registerStudent);
router.post('/login', login);

// Protected route to fetch current user profile
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user!._id,
      name: req.user!.name,
      email: req.user!.email,
      role: req.user!.role,
      totalSpent: req.user!.totalSpent,
    },
  });
});

export default router;

