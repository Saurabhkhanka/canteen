import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ICartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface CartState {
  items: ICartItem[];
}

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<Omit<ICartItem, 'quantity'>>) {
      const existingItem = state.items.find((item) => item._id === action.payload._id);
      if (existingItem) {
        if (existingItem.quantity < action.payload.stock) {
          existingItem.quantity += 1;
        }
      } else {
        if (action.payload.stock > 0) {
          state.items.push({ ...action.payload, quantity: 1 });
        }
      }
    },
    decrementQuantity(state, action: PayloadAction<string>) {
      const existingItem = state.items.find((item) => item._id === action.payload);
      if (existingItem) {
        if (existingItem.quantity > 1) {
          existingItem.quantity -= 1;
        } else {
          state.items = state.items.filter((item) => item._id !== action.payload);
        }
      }
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item._id !== action.payload);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addToCart, decrementQuantity, removeFromCart, clearCart } = cartSlice.actions;

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartTotalQuantity = (state: { cart: CartState }) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);
export const selectCartTotalPrice = (state: { cart: CartState }) =>
  state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

export default cartSlice.reducer;
