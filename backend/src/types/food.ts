import { Document } from 'mongoose';

export interface IFoodItem extends Document {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: 'Snacks' | 'Meals' | 'Drinks';
  isVeg: boolean;
  createdAt: Date;
  updatedAt: Date;
}
