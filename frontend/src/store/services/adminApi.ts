import { apiSlice } from './api';

export interface IAnalyticsResponse {
  totalSales: number;
  activeOrders: number;
  totalStudents: number;
}

export interface IStudentResponse {
  _id: string;
  name: string;
  email: string;
  role: 'student';
  totalSpent: number;
  createdAt: string;
}

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAnalytics: builder.query<{ success: boolean; analytics: IAnalyticsResponse }, void>({
      query: () => '/admin/analytics',
      providesTags: [{ type: 'Analytics', id: 'STATS' }],
    }),
    getStudents: builder.query<{ success: boolean; count: number; data: IStudentResponse[] }, void>({
      query: () => '/admin/students',
      providesTags: [{ type: 'User', id: 'LIST' }],
    }),
  }),
});

export const { useGetAnalyticsQuery, useGetStudentsQuery } = adminApi;
