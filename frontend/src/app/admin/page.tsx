'use client';

import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useGetMenuQuery, useDeleteFoodItemMutation } from '@/store/services/foodApi';
import { useGetAllOrdersQuery, useUpdateOrderStatusMutation } from '@/store/services/orderApi';
import { useGetAnalyticsQuery, useGetStudentsQuery } from '@/store/services/adminApi';
import { useGetMeQuery } from '@/store/services/authApi';
import { setCredentials, setLoading } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import FoodModal from '@/components/FoodModal';
import { IFoodItemResponse } from '@/store/services/foodApi';
import {
  TrendingUp,
  Inbox,
  Users,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Play,
  Check,
  UserCheck,
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { isAuthenticated, user, loading } = useAppSelector((state) => state.auth);

  // States
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'menu' | 'students'>('analytics');
  
  // Menu modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEditItem, setSelectedEditItem] = useState<IFoodItemResponse | null>(null);

  // 1. Fetch current profile if not loaded
  const { data: meData, isFetching: isMeFetching } = useGetMeQuery(undefined, {
    skip: isAuthenticated,
  });

  useEffect(() => {
    if (meData?.success && meData.user) {
      dispatch(setCredentials(meData.user));
    } else if (!isMeFetching && !isAuthenticated) {
      dispatch(setLoading(false));
      router.replace('/login');
    }
  }, [meData, isMeFetching, isAuthenticated, dispatch, router]);

  // Route protection
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    } else if (isAuthenticated && user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, user, loading, router]);

  // 2. Fetch data based on active tab or generally
  const {
    data: analyticsData,
    isLoading: isAnalyticsLoading,
    refetch: refetchAnalytics,
  } = useGetAnalyticsQuery(undefined, {
    skip: !isAuthenticated || user?.role !== 'admin',
  });

  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    refetch: refetchOrders,
  } = useGetAllOrdersQuery(undefined, {
    skip: !isAuthenticated || user?.role !== 'admin',
    pollingInterval: 5000, // Poll orders every 5s for live admin alerts!
  });

  const {
    data: menuData,
    isLoading: isMenuLoading,
    refetch: refetchMenu,
  } = useGetMenuQuery(undefined, {
    skip: !isAuthenticated || user?.role !== 'admin',
  });

  const {
    data: studentsData,
    isLoading: isStudentsLoading,
    refetch: refetchStudents,
  } = useGetStudentsQuery(undefined, {
    skip: !isAuthenticated || user?.role !== 'admin',
  });

  // Mutations
  const [deleteFoodItem, { isLoading: isDeleting }] = useDeleteFoodItemMutation();
  const [updateOrderStatus, { isLoading: isStatusUpdating }] = useUpdateOrderStatusMutation();

  if (loading || isMeFetching || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-amber-500 animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this food item?')) return;
    try {
      await deleteFoodItem(id).unwrap();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleStatusTransition = async (orderId: string, currentStatus: string) => {
    let nextStatus = '';
    if (currentStatus === 'Pending') nextStatus = 'Preparing';
    else if (currentStatus === 'Preparing') nextStatus = 'Ready for Pickup';
    else if (currentStatus === 'Ready for Pickup') nextStatus = 'Completed';

    if (!nextStatus) return;

    try {
      await updateOrderStatus({ id: orderId, status: nextStatus }).unwrap();
      refetchAnalytics(); // Update stats
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedEditItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: IFoodItemResponse) => {
    setSelectedEditItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <Navbar />

      {/* Add / Edit Food Modal */}
      <FoodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editItem={selectedEditItem}
      />

      <div className="flex-grow flex flex-col md:flex-row max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 gap-8">
        
        {/* Left Nav Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab workspace Panel */}
        <main className="flex-grow bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm min-h-[500px]">
          
          {/* TAB 1: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-xl text-slate-800">Operational Analytics</h3>
                <button
                  onClick={() => refetchAnalytics()}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={10} />
                  <span>Refresh</span>
                </button>
              </div>

              {isAnalyticsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-28 bg-slate-50 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  
                  {/* Total Sales widget */}
                  <div className="p-5 bg-gradient-to-tr from-amber-500/10 to-rose-500/10 border border-amber-100 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Revenue</p>
                      <p className="font-display font-extrabold text-2xl text-slate-800 leading-none mt-1">
                        ₹{(analyticsData?.analytics?.totalSales || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Active Orders widget */}
                  <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                      <Inbox size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Orders</p>
                      <p className="font-display font-extrabold text-2xl text-slate-800 leading-none mt-1">
                        {analyticsData?.analytics?.activeOrders || 0}
                      </p>
                    </div>
                  </div>

                  {/* Registered Students widget */}
                  <div className="p-5 bg-green-50/50 border border-green-100 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white shadow-md shadow-green-500/20">
                      <Users size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Students Registered</p>
                      <p className="font-display font-extrabold text-2xl text-slate-800 leading-none mt-1">
                        {analyticsData?.analytics?.totalStudents || 0}
                      </p>
                    </div>
                  </div>

                </div>
              )}

              {/* Operations Overview Box */}
              <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-5 mt-6">
                <h4 className="text-sm font-bold text-slate-700 mb-2">Canteen Operations Status</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Analytics cards reflect real-time live data. Total sales are calculated strictly based on completed orders. Active orders represent items currently in prep, cooking queue, or ready for customer collection.
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: LIVE ORDERS FEED */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-800">Live Incoming Orders</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Polls active orders every 5s automatically</p>
                </div>
                <button
                  onClick={() => refetchOrders()}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={10} />
                  <span>Refresh</span>
                </button>
              </div>

              {isOrdersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-28 bg-slate-50 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : ordersData?.count === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs">
                  No orders placed in the system yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {ordersData?.data.map((order) => {
                    const studentInfo = order.student as any;
                    const dateString = new Date(order.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    // Order Actions
                    let actionBtnLabel = '';
                    let actionBtnIcon = null;
                    if (order.status === 'Pending') {
                      actionBtnLabel = 'Start Preparing';
                      actionBtnIcon = Play;
                    } else if (order.status === 'Preparing') {
                      actionBtnLabel = 'Mark Ready';
                      actionBtnIcon = Check;
                    } else if (order.status === 'Ready for Pickup') {
                      actionBtnLabel = 'Complete Order';
                      actionBtnIcon = CheckCircle;
                    }

                    return (
                      <div
                        key={order._id}
                        className={`border rounded-2xl p-5 hover:shadow-md transition-all duration-200 ${
                          order.status === 'Ready for Pickup'
                            ? 'ring-2 ring-green-500/20 border-green-300 bg-green-50/10'
                            : 'border-slate-200/80 bg-white'
                        }`}
                      >
                        {/* Order Meta Header */}
                        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-800">#{order._id.slice(-8)}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">{dateString}</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-600 mt-1">
                              Student: {studentInfo?.name || 'Unknown'} ({studentInfo?.email || 'N/A'})
                            </p>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border tracking-wide uppercase ${
                            order.status === 'Pending'
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : order.status === 'Preparing'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : order.status === 'Ready for Pickup'
                              ? 'bg-green-50 text-green-700 border-green-200 animate-pulse'
                              : 'bg-slate-50 text-slate-400 border-slate-100'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        {/* Order Items list */}
                        <div className="space-y-1.5 pl-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-xs text-slate-700 flex justify-between">
                              <span>
                                {item.name} <span className="text-slate-400 font-bold ml-1">x{item.quantity}</span>
                              </span>
                              <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Order Footer & Transition Action Trigger */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3">
                          <div className="text-sm">
                            <span className="text-xs text-slate-400 font-semibold mr-1">Grand Total:</span>
                            <span className="font-extrabold text-slate-800">₹{order.totalPrice.toFixed(2)}</span>
                          </div>

                          {/* Action button */}
                          {actionBtnLabel && (() => {
                            const ActionIcon = actionBtnIcon;
                            return (
                              <button
                                onClick={() => handleStatusTransition(order._id, order.status)}
                                className="px-4 py-2 bg-slate-900 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98] transition-all"
                              >
                                {ActionIcon && <span className="scale-90"><ActionIcon size={12} /></span>}
                                <span>{actionBtnLabel}</span>
                              </button>
                            );
                          })()}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MENU CRUD OPERATIONS */}
          {activeTab === 'menu' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-800">Menu Management</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Edit, create, and update food records</p>
                </div>
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <Plus size={14} />
                  <span>Create Item</span>
                </button>
              </div>

              {isMenuLoading ? (
                <div className="h-64 rounded-2xl bg-slate-50 animate-pulse" />
              ) : menuData?.count === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
                  No food items in the database yet. Click "Create Item" to add some!
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200/60 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200/60">
                        <th className="p-4">Name</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Stock</th>
                        <th className="p-4">Type</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {menuData?.data.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-bold text-slate-800">{item.name}</td>
                          <td className="p-4 font-semibold text-slate-500">{item.category}</td>
                          <td className="p-4 font-extrabold text-slate-800">₹{item.price.toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                              item.stock <= 0 
                                ? 'bg-rose-50 text-rose-700' 
                                : item.stock <= 5 
                                ? 'bg-amber-50 text-amber-700' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {item.stock}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${item.isVeg ? 'text-green-600' : 'text-rose-600'}`}>
                              {item.isVeg ? 'Veg' : 'Non-Veg'}
                            </span>
                          </td>
                          <td className="p-4 flex items-center justify-center gap-2.5">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-slate-500 hover:text-amber-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                              title="Edit item"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item._id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                              title="Delete item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REGISTERED STUDENTS LIST */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-800">Student Profiles & Spending</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Comprehensive registration audit records</p>
                </div>
                <button
                  onClick={() => refetchStudents()}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={10} />
                  <span>Refresh</span>
                </button>
              </div>

              {isStudentsLoading ? (
                <div className="h-64 rounded-2xl bg-slate-50 animate-pulse" />
              ) : studentsData?.count === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
                  No registered student data found in the system.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200/60 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200/60">
                        <th className="p-4">Name</th>
                        <th className="p-4">College Email ID</th>
                        <th className="p-4">Total Spending</th>
                        <th className="p-4">Registration Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {studentsData?.data.map((student) => {
                        const dateString = new Date(student.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        });

                        return (
                          <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500/10 to-rose-500/10 flex items-center justify-center text-amber-600">
                                <UserCheck size={14} />
                              </div>
                              <span>{student.name}</span>
                            </td>
                            <td className="p-4 font-semibold text-slate-500">{student.email}</td>
                            <td className="p-4 font-extrabold text-amber-600">₹{student.totalSpent.toFixed(2)}</td>
                            <td className="p-4 text-xs text-slate-400">{dateString}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
