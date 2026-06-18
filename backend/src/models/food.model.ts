import { Schema, model } from 'mongoose';
import { IFoodItem } from '../types/food';

const foodItemSchema = new Schema<IFoodItem>(
  {
    name: {
      type: String,
      required: [true, 'Food item name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock availability is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Snacks', 'Meals', 'Drinks'],
        message: '{VALUE} is not a valid category',
      },
    },
    isVeg: {
      type: Boolean,
      required: [true, 'Veg/Non-Veg status is required'],
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const FoodItem = model<IFoodItem>('FoodItem', foodItemSchema);
