import { Router } from 'express';
import { placeOrder, getMyOrders, getAllOrders, updateOrderStatus } from '../controllers/order.controller';
import { protect, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Student routes for placing and viewing their own orders
router.post('/', protect, authorize('student'), placeOrder);
router.get('/my-orders', protect, authorize('student'), getMyOrders);

// Admin-only routes for overall order tracking & status modifications
router.get('/', protect, authorize('admin'), getAllOrders);
router.patch('/:id/status', protect, authorize('admin'), updateOrderStatus);

export default router;
