import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Package, CheckCircle, XCircle, Clock, Truck,
  AlertCircle, Search, RefreshCw, Eye, Trash2,
  MoreHorizontal, Filter, ChevronDown, ChevronUp, Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useMenu } from '../hooks/useMenu';

interface OrderItem {
  product_id: string;
  product_name: string;
  variation_id: string | null;
  variation_name: string | null;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip_code: string;
  shipping_country: string;
  shipping_location: string | null;
  shipping_fee: number | null;
  order_items: OrderItem[];
  total_price: number;
  payment_method_id: string | null;
  payment_method_name: string | null;
  payment_proof_url: string | null;
  contact_method: string | null;
  order_status: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface OrdersManagerProps {
  onBack: () => void;
}

const OrdersManager: React.FC<OrdersManagerProps> = ({ onBack }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshProducts } = useMenu();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      alert('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadOrders();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleDeleteOrder = async (orderId: string) => {
    // 1. Confirm deletion
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      setIsProcessing(true);
      // 2. Delete from supabase
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      // 3. Remove from local state
      setOrders(prev => prev.filter(o => o.id !== orderId));
      alert('Order deleted successfully.');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('orders')
        .update({
          order_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Optimistic update
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, order_status: newStatus } : o
      ));

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, order_status: newStatus });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, newStatus: string) => {
    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Optimistic update
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, payment_status: newStatus } : o
      ));

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: newStatus });
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Filter by Tab (Payment Status)
    if (activeTab === 'unpaid') {
      filtered = filtered.filter(o => o.payment_status === 'pending');
    } else if (activeTab === 'paid') {
      filtered = filtered.filter(o => o.payment_status === 'paid');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.customer_name.toLowerCase().includes(query) ||
        o.customer_email.toLowerCase().includes(query) ||
        o.customer_phone.includes(query) ||
        o.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [orders, activeTab, searchQuery]);

  // View Details Modal (Simplified for now, re-using parts of old logic if needed, but keeping it inline with table view)
  // For this implementation, we will render the table primarily. 
  // If selectedOrder is set, we can show a modal or the detailed view.

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-theme-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg pb-20">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-3 md:mb-4">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-theme-accent transition-colors group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <h1 className="text-lg md:text-2xl font-bold text-theme-text">
              Orders Management
            </h1>
          </div>
          <div className="flex gap-2">
            <button className="px-3 md:px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs md:text-sm font-medium hover:border-theme-accent hover:text-theme-accent transition-all shadow-sm">
              Export CSV
            </button>
            <button
              onClick={handleRefresh}
              className="btn-primary flex items-center gap-2 text-xs md:text-sm px-3 md:px-4 py-2">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-2xl mb-4 md:mb-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by customer, product, order number or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 text-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4 md:mt-6 overflow-x-auto pb-1 no-scrollbar">
          {(['all', 'unpaid', 'paid'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab
                ? 'bg-theme-accent text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-theme-accent hover:text-theme-accent'
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'unpaid' && ' (Pending)'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1600px] mx-auto p-6">
        <div className="hidden md:block bg-white rounded-xl shadow-soft border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-10">
                    <input type="checkbox" className="rounded border-gray-300 text-theme-accent focus:ring-theme-accent cursor-pointer" />
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      No orders found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded border-gray-300 text-theme-accent focus:ring-theme-accent cursor-pointer" />
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 group-hover:text-theme-accent transition-colors cursor-pointer" title="View Details">
                          {order.order_number || `#${order.id.slice(0, 8).toUpperCase()}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-theme-accent/10 flex items-center justify-center text-xs font-bold text-theme-accent">
                            {order.customer_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                            {order.customer_phone && (
                              <div className="text-xs text-gray-500">{order.customer_phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-theme-accent">
                          ₱{(order.total_price + (order.shipping_fee || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <select
                            value={order.payment_status}
                            onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value)}
                            disabled={isProcessing}
                            className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-bold border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-theme-accent transition-all ${order.payment_status === 'paid'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <select
                            value={order.order_status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            disabled={isProcessing}
                            className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-bold border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-theme-accent transition-all ${order.order_status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.order_status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                order.order_status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            <option value="new">Unfulfilled</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 font-medium">
                          {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-[200px]">
                          <p className="font-medium truncate" title={order.shipping_address}>{order.shipping_address}</p>
                          <p className="text-xs text-gray-500">{order.shipping_city}, {order.shipping_zip_code}</p>
                          {order.shipping_location && (
                            <p className="text-[10px] uppercase tracking-wide text-theme-accent mt-0.5 font-semibold">{order.shipping_location}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={isProcessing}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-900">{filteredOrders.length}</span> order{filteredOrders.length !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-200 bg-white rounded-lg hover:border-theme-accent hover:text-theme-accent text-sm disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-500 transition-colors" disabled>Previous</button>
              <button className="px-3 py-1 border border-gray-200 bg-white rounded-lg hover:border-theme-accent hover:text-theme-accent text-sm disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-500 transition-colors" disabled>Next</button>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <>
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl shadow-soft border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-theme-accent">{order.order_number || `#${order.id.slice(0, 8).toUpperCase()}`}</div>
                      <div className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleDateString()}</div>
                    </div>
                    <button onClick={() => handleDeleteOrder(order.id)} className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Customer</span>
                      <span className="font-medium">{order.customer_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total</span>
                      <span className="font-bold text-theme-accent">₱{(order.total_price + (order.shipping_fee || 0)).toLocaleString('en-PH')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Items</span>
                      <span>{order.order_items.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Location</span>
                      <span className="text-xs text-theme-accent font-semibold">{order.shipping_location || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                    <div>
                      <label className="text-xs text-gray-500">Payment</label>
                      <select value={order.payment_status} onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value)} className={`w-full text-xs px-2 py-1 rounded mt-1 ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Status</label>
                      <select value={order.order_status} onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)} className={`w-full text-xs px-2 py-1 rounded mt-1 ${order.order_status === 'delivered' ? 'bg-green-100 text-green-700' : order.order_status === 'cancelled' ? 'bg-red-100 text-red-700' : order.order_status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        <option value="new">Unfulfilled</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-4 text-center text-sm text-gray-500">
                Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersManager;
