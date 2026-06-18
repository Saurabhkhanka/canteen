import { apiSlice } from './api';

export interface IFoodItemResponse {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: 'Snacks' | 'Meals' | 'Drinks';
  isVeg: boolean;
  createdAt: string;
  updatedAt: string;
}

export const foodApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMenu: builder.query<{ success: boolean; count: number; data: IFoodItemResponse[] }, { category?: string; isVeg?: boolean; search?: string } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          if (params.category) queryParams.set('category', params.category);
          if (params.isVeg !== undefined) queryParams.set('isVeg', String(params.isVeg));
          if (params.search) queryParams.set('search', params.search);
        }
        return {
          url: `/menu?${queryParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'FoodItem' as const, id: _id })),
              { type: 'FoodItem', id: 'LIST' },
            ]
          : [{ type: 'FoodItem', id: 'LIST' }],
    }),
    createFoodItem: builder.mutation<{ success: boolean; message: string; data: IFoodItemResponse }, Partial<IFoodItemResponse>>({
      query: (body) => ({
        url: '/menu',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'FoodItem', id: 'LIST' }, { type: 'Analytics', id: 'STATS' }],
    }),
    updateFoodItem: builder.mutation<{ success: boolean; message: string; data: IFoodItemResponse }, { id: string; body: Partial<IFoodItemResponse> }>({
      query: ({ id, body }) => ({
        url: `/menu/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'FoodItem', id },
        { type: 'FoodItem', id: 'LIST' },
      ],
    }),
    deleteFoodItem: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/menu/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'FoodItem', id: 'LIST' }, { type: 'Analytics', id: 'STATS' }],
    }),
  }),
});

export const {
  useGetMenuQuery,
  useCreateFoodItemMutation,
  useUpdateFoodItemMutation,
  useDeleteFoodItemMutation,
} = foodApi;
