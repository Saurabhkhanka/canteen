import { Request, Response } from 'express';
import { FoodItem } from '../models/food.model';

// @desc    Get all menu items with search and filters
// @route   GET /api/menu
// @access  Public
export const getMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, isVeg, search } = req.query;
    const filterQuery: any = {};

    // Filter by Category
    if (category) {
      filterQuery.category = category;
    }

    // Filter by Veg / Non-Veg
    if (isVeg !== undefined) {
      filterQuery.isVeg = isVeg === 'true';
    }

    // Search by Name or Description (using regex, case-insensitive)
    if (search) {
      filterQuery.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } },
      ];
    }

    const foodItems = await FoodItem.find(filterQuery).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: foodItems.length,
      data: foodItems,
    });
  } catch (error) {
    console.error('Get Menu Error:', (error as Error).message);
    res.status(500).json({ message: 'Error retrieving menu items. Please try again.' });
  }
};

// @desc    Create a new food item (Admin Only)
// @route   POST /api/menu
// @access  Private/Admin
export const createFoodItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, stock, category, isVeg } = req.body;

    // 1. Validate required fields
    if (!name || !description || price === undefined || stock === undefined || !category || isVeg === undefined) {
      res.status(400).json({ message: 'Please provide all required food item fields.' });
      return;
    }

    // 2. Validate numeric values
    if (price < 0 || stock < 0) {
      res.status(400).json({ message: 'Price and stock cannot be negative numbers.' });
      return;
    }

    // 3. Create food item
    const foodItem = await FoodItem.create({
      name,
      description,
      price,
      stock,
      category,
      isVeg,
    });

    res.status(201).json({
      success: true,
      message: 'Food item created successfully',
      data: foodItem,
    });
  } catch (error) {
    console.error('Create Food Item Error:', (error as Error).message);
    res.status(500).json({ message: 'Error creating food item.' });
  }
};

// @desc    Update a food item (Admin Only)
// @route   PUT /api/menu/:id
// @access  Private/Admin
export const updateFoodItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, stock, category, isVeg } = req.body;
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: 'Invalid food item ID.' });
      return;
    }

    // Validate numeric inputs
    if ((price !== undefined && price < 0) || (stock !== undefined && stock < 0)) {
      res.status(400).json({ message: 'Price and stock cannot be negative.' });
      return;
    }

    // Find and update item
    const updatedItem = await FoodItem.findByIdAndUpdate(
      id,
      { name, description, price, stock, category, isVeg },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      res.status(404).json({ message: 'Food item not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Food item updated successfully',
      data: updatedItem,
    });
  } catch (error) {
    console.error('Update Food Item Error:', (error as Error).message);
    res.status(500).json({ message: 'Error updating food item.' });
  }
};

// @desc    Delete a food item (Admin Only)
// @route   DELETE /api/menu/:id
// @access  Private/Admin
export const deleteFoodItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: 'Invalid food item ID.' });
      return;
    }

    const foodItem = await FoodItem.findByIdAndDelete(id);

    if (!foodItem) {
      res.status(404).json({ message: 'Food item not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Food item deleted successfully',
    });
  } catch (error) {
    console.error('Delete Food Item Error:', (error as Error).message);
    res.status(500).json({ message: 'Error deleting food item.' });
  }
};
