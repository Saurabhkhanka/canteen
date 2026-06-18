import { Schema, model } from 'mongoose';
import { IOrder } from '../types/order';

const orderItemSchema = new Schema(
  {
    foodItem: {
      type: Schema.Types.ObjectId,
      ref: 'FoodItem',
      required: [true, 'Food item reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Food item name is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'Order items are required'],
      validate: [
        (val: any[]) => val.length > 0,
        'Order must contain at least one item',
      ],
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Preparing', 'Ready for Pickup', 'Completed'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

export const Order = model<IOrder>('Order', orderSchema);
