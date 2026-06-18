import { apiSlice } from './api';

export interface IOrderItem {
  foodItem: string;
  name: string;
  quantity: number;
  price: number;
}

export interface IOrderResponse {
  _id: string;
  student: string | { _id: string; name: string; email: string };
  items: IOrderItem[];
  totalPrice: number;
  status: 'Pending' | 'Preparing' | 'Ready for Pickup' | 'Completed';
  createdAt: string;
  updatedAt: string;
}

export const orderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    placeOrder: builder.mutation<{ success: boolean; message: string; data: IOrderResponse }, { items: { foodItem: string; quantity: number }[] }>({
      query: (body) => ({
        url: '/orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Order', id: 'LIST' },
        { type: 'FoodItem', id: 'LIST' }, // stock counts changed
        { type: 'Analytics', id: 'STATS' },
      ],
    }),
    getMyOrders: builder.query<{ success: boolean; count: number; data: IOrderResponse[] }, void>({
      query: () => '/orders/my-orders',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Order' as const, id: _id })),
              { type: 'Order', id: 'LIST' },
            ]
          : [{ type: 'Order', id: 'LIST' }],
    }),
    getAllOrders: builder.query<{ success: boolean; count: number; data: IOrderResponse[] }, void>({
      query: () => '/orders',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Order' as const, id: _id })),
              { type: 'Order', id: 'LIST' },
            ]
          : [{ type: 'Order', id: 'LIST' }],
    }),
    updateOrderStatus: builder.mutation<{ success: boolean; message: string; data: IOrderResponse }, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
        { type: 'Analytics', id: 'STATS' },
      ],
    }),
  }),
});

export const {
  usePlaceOrderMutation,
  useGetMyOrdersQuery,
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
} = orderApi;
