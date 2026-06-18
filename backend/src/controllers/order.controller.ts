import { Request, Response } from 'express';
import { FoodItem } from '../models/food.model';
import { Order } from '../models/order.model';
import { User } from '../models/user.model';
import { sendOrderConfirmationEmail } from '../utils/email';

// @desc    Place a new order (Student Only)
// @route   POST /api/orders
// @access  Private/Student
export const placeOrder = async (req: Request, res: Response): Promise<void> => {
  const decrementedItems: { id: string; quantity: number }[] = [];

  try {
    const { items } = req.body; // Array of { foodItem: string, quantity: number }

    // 1. Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Order must contain at least one item.' });
      return;
    }

    const orderItemsList = [];
    let calculatedTotalPrice = 0;

    // 2. First pass: Verify all items exist and have sufficient stock
    for (const item of items) {
      const { foodItem: foodItemId, quantity } = item;

      if (!foodItemId || !quantity || quantity <= 0) {
        res.status(400).json({ message: 'Each item must have a valid food item ID and a positive quantity.' });
        return;
      }

      const foodItem = await FoodItem.findById(foodItemId);
      if (!foodItem) {
        res.status(404).json({ message: `Food item with ID ${foodItemId} not found.` });
        return;
      }

      if (foodItem.stock < quantity) {
        res.status(400).json({
          message: `Insufficient stock for ${foodItem.name}. Available: ${foodItem.stock}, Requested: ${quantity}`,
        });
        return;
      }

      // Snapshot the price and info
      orderItemsList.push({
        foodItem: foodItem._id,
        name: foodItem.name,
        quantity,
        price: foodItem.price,
      });

      calculatedTotalPrice += foodItem.price * quantity;
    }

    // 3. Second pass: Atomically decrement stock for each item (prevent race conditions)
    for (const item of orderItemsList) {
      const updatedFood = await FoodItem.findOneAndUpdate(
        { _id: item.foodItem, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updatedFood) {
        // Rollback previous decrements if this one fails (atomic simulation)
        for (const rolledBackItem of decrementedItems) {
          await FoodItem.findByIdAndUpdate(rolledBackItem.id, {
            $inc: { stock: rolledBackItem.quantity },
          });
        }
        res.status(400).json({
          message: `Stock update conflict. Try placing your order again.`,
        });
        return;
      }

      decrementedItems.push({ id: item.foodItem.toString(), quantity: item.quantity });
    }

    // 4. Create the Order document
    const order = await Order.create({
      student: req.user!._id,
      items: orderItemsList,
      totalPrice: calculatedTotalPrice,
      status: 'Pending',
    });

    // 5. Update Student profile total spending history
    await User.findByIdAndUpdate(req.user!._id, {
      $inc: { totalSpent: calculatedTotalPrice },
    });

    // Send email confirmation asynchronously (fire-and-forget)
    sendOrderConfirmationEmail(
      req.user!.email,
      req.user!.name,
      order._id.toString(),
      orderItemsList,
      calculatedTotalPrice
    ).catch((err) => {
      console.error(`Failed to send order confirmation email: ${err.message}`);
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error) {
    console.error('Place Order Error:', (error as Error).message);

    // Rollback stock decrements on unexpected error
    for (const rolledBackItem of decrementedItems) {
      try {
        await FoodItem.findByIdAndUpdate(rolledBackItem.id, {
          $inc: { stock: rolledBackItem.quantity },
        });
      } catch (rollbackError) {
        console.error('Failed to rollback stock for item:', rolledBackItem.id);
      }
    }

    res.status(500).json({ message: 'Error processing your order.' });
  }
};

// @desc    Get order history for authenticated student
// @route   GET /api/orders/my-orders
// @access  Private/Student
export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ student: req.user!._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error('Get My Orders Error:', (error as Error).message);
    res.status(500).json({ message: 'Error retrieving order history.' });
  }
};

// @desc    Get all orders (Admin Only)
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find()
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error('Get All Orders Error:', (error as Error).message);
    res.status(500).json({ message: 'Error retrieving active orders.' });
  }
};

// @desc    Update status of an order (Admin Only)
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Validate inputs
    if (!status) {
      res.status(400).json({ message: 'Please provide status to update.' });
      return;
    }

    const validStatuses = ['Pending', 'Preparing', 'Ready for Pickup', 'Completed'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: 'Invalid order status.' });
      return;
    }

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: 'Invalid order ID.' });
      return;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('student', 'name email');

    if (!updatedOrder) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Update Order Status Error:', (error as Error).message);
    res.status(500).json({ message: 'Error updating order status.' });
  }
};
