import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/proxy',
  }),
  tagTypes: ['FoodItem', 'Order', 'User', 'Analytics'],
  endpoints: () => ({}),
});
