import { Document, Types } from 'mongoose';

export interface IOrderItem {
  foodItem: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  student: Types.ObjectId;
  items: IOrderItem[];
  totalPrice: number;
  status: 'Pending' | 'Preparing' | 'Ready for Pickup' | 'Completed';
  createdAt: Date;
  updatedAt: Date;
}
