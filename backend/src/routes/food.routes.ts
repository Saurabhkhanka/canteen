import { Router } from 'express';
import { getMenu, createFoodItem, updateFoodItem, deleteFoodItem } from '../controllers/food.controller';
import { protect, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Public routes for fetching the food menu
router.get('/', getMenu);

// Admin-only routes for menu management (CRUD)
router.post('/', protect, authorize('admin'), createFoodItem);
router.put('/:id', protect, authorize('admin'), updateFoodItem);
router.delete('/:id', protect, authorize('admin'), deleteFoodItem);

export default router;
