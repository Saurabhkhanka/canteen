import { Router } from 'express';
import { getAnalytics, getStudentData } from '../controllers/admin.controller';
import { protect, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Apply protect & authorize('admin') to all routes in this router (least privilege)
router.use(protect);
router.use(authorize('admin'));

router.get('/analytics', getAnalytics);
router.get('/students', getStudentData);

export default router;
