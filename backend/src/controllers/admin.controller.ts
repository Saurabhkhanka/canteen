import { Request, Response } from 'express';
import { Order } from '../models/order.model';
import { User } from '../models/user.model';

// @desc    Get dashboard analytics (Total Sales, Active Orders, Registered Students)
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Calculate Total Sales (Sum of totalPrice for 'Completed' orders)
    const salesAggregation = await Order.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } },
    ]);
    const totalSales = salesAggregation.length > 0 ? salesAggregation[0].totalSales : 0;

    // 2. Count Active Orders (Status != Completed)
    const activeOrders = await Order.countDocuments({
      status: { $in: ['Pending', 'Preparing', 'Ready for Pickup'] },
    });

    // 3. Count Registered Students
    const totalStudents = await User.countDocuments({ role: 'student' });

    res.status(200).json({
      success: true,
      analytics: {
        totalSales,
        activeOrders,
        totalStudents,
      },
    });
  } catch (error) {
    console.error('Get Analytics Error:', (error as Error).message);
    res.status(500).json({ message: 'Error computing dashboard analytics.' });
  }
};

// @desc    Get registered student records and spending histories
// @route   GET /api/admin/students
// @access  Private/Admin
export const getStudentData = async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('Get Student Data Error:', (error as Error).message);
    res.status(500).json({ message: 'Error retrieving student data list.' });
  }
};
