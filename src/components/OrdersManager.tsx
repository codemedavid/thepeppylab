import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Package, XCircle, Truck,
  Search, RefreshCw, Eye, Trash2,
  ChevronDown, Edit, Save, Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';


interface OrderItem {
  product_id: string;
  product_name: string;
  variation_id: string | null;
  variation_name: string | null;
  quantity: number;
  price: number;
  total: number;
  is_complete_set?: boolean;
  isCompleteSet?: boolean;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_barangay: string;
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
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [filterOrderStatus, setFilterOrderStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Order>>({});

  useEffect(() => {
    if (selectedOrder) {
      setEditFormData(selectedOrder);
      setIsEditing(false);
    }
  }, [selectedOrder]);

  const handleSaveOrder = async () => {
    if (!selectedOrder || !editFormData) return;

    try {
      setIsProcessing(true);

      const updates = {
        customer_name: editFormData.customer_name ?? selectedOrder.customer_name,
        customer_email: editFormData.customer_email ?? selectedOrder.customer_email,
        customer_phone: editFormData.customer_phone ?? selectedOrder.customer_phone,
        shipping_address: editFormData.shipping_address ?? selectedOrder.shipping_address,
        shipping_barangay: editFormData.shipping_barangay ?? selectedOrder.shipping_barangay,
        shipping_city: editFormData.shipping_city ?? selectedOrder.shipping_city,
        shipping_state: editFormData.shipping_state ?? selectedOrder.shipping_state,
        shipping_zip_code: editFormData.shipping_zip_code ?? selectedOrder.shipping_zip_code,
        shipping_location: editFormData.shipping_location ?? selectedOrder.shipping_location,
        notes: editFormData.notes ?? selectedOrder.notes,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', selectedOrder.id);

      if (error) throw error;

      // Update local state
      const updatedOrder = { ...selectedOrder, ...updates };
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
      setSelectedOrder(updatedOrder);
      setIsEditing(false);
      alert('Order details updated successfully.');
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order details.');
    } finally {
      setIsProcessing(false);
    }
  };


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

    // Filter by Payment Status
    if (filterPaymentStatus !== 'all') {
      filtered = filtered.filter(o => o.payment_status === filterPaymentStatus);
    }

    // Filter by Order Status
    if (filterOrderStatus !== 'all') {
      filtered = filtered.filter(o => o.order_status === filterOrderStatus);
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
  }, [orders, filterPaymentStatus, filterOrderStatus, searchQuery]);

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

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {/* Payment Status Filter */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10">
              <Filter className="w-4 h-4" />
            </div>
            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="input-field !pl-10 text-sm w-full appearance-none cursor-pointer relative"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Order Status Filter */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10">
              <Package className="w-4 h-4" />
            </div>
            <select
              value={filterOrderStatus}
              onChange={(e) => setFilterOrderStatus(e.target.value)}
              className="input-field !pl-10 text-sm w-full appearance-none cursor-pointer relative"
            >
              <option value="all">All Orders</option>
              <option value="new">Unfulfilled</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
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
                        <span
                          className="font-bold text-gray-900 group-hover:text-theme-accent transition-colors cursor-pointer"
                          title="View Details"
                          onClick={() => setSelectedOrder(order)}
                        >
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
                      <div
                        className="font-bold text-theme-accent cursor-pointer hover:underline"
                        onClick={() => setSelectedOrder(order)}
                      >
                        {order.order_number || `#${order.id.slice(0, 8).toUpperCase()}`}
                      </div>
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditing ? 'Edit Order Details' : 'Order Details'}
                </h2>
                <p className="text-sm text-theme-accent font-semibold mt-1">
                  {selectedOrder.order_number || `#${selectedOrder.id.slice(0, 8).toUpperCase()}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-theme-accent transition-colors"
                    title="Edit Details"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                  title="Close"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Customer & Shipping */}
                <div className="space-y-8">
                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm">
                        <Package className="w-4 h-4 text-theme-accent" />
                      </div>
                      Customer Information
                    </h3>

                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Name</label>
                          <input
                            type="text"
                            value={editFormData.customer_name || ''}
                            onChange={e => setEditFormData({ ...editFormData, customer_name: e.target.value })}
                            className="input-field w-full text-sm py-1.5"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email</label>
                          <input
                            type="email"
                            value={editFormData.customer_email || ''}
                            onChange={e => setEditFormData({ ...editFormData, customer_email: e.target.value })}
                            className="input-field w-full text-sm py-1.5"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Phone</label>
                          <input
                            type="tel"
                            value={editFormData.customer_phone || ''}
                            onChange={e => setEditFormData({ ...editFormData, customer_phone: e.target.value })}
                            className="input-field w-full text-sm py-1.5"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-theme-accent/10 flex items-center justify-center text-theme-accent font-bold">
                            {selectedOrder.customer_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{selectedOrder.customer_name}</p>
                            <p className="text-sm text-gray-500">Customer</p>
                          </div>
                        </div>
                        <div className="h-px bg-gray-200 my-2" />
                        <div className="grid gap-2 text-sm">
                          <div className="flex items-start gap-3">
                            <span className="text-gray-500 w-20 shrink-0">Email:</span>
                            <span className="font-medium text-gray-900 break-all">{selectedOrder.customer_email}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="text-gray-500 w-20 shrink-0">Phone:</span>
                            <span className="font-medium text-gray-900">{selectedOrder.customer_phone}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="text-gray-500 w-20 shrink-0">Contact:</span>
                            <span className="font-medium text-gray-900 capitalize">{selectedOrder.contact_method || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shipping Info */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm">
                        <Truck className="w-4 h-4 text-theme-accent" />
                      </div>
                      Shipping Details
                    </h3>

                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Address</label>
                          <textarea
                            value={editFormData.shipping_address || ''}
                            onChange={e => setEditFormData({ ...editFormData, shipping_address: e.target.value })}
                            className="input-field w-full text-sm py-1.5 min-h-[60px]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Barangay</label>
                          <input
                            type="text"
                            value={editFormData.shipping_barangay || ''}
                            onChange={e => setEditFormData({ ...editFormData, shipping_barangay: e.target.value })}
                            className="input-field w-full text-sm py-1.5"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">City</label>
                            <input
                              type="text"
                              value={editFormData.shipping_city || ''}
                              onChange={e => setEditFormData({ ...editFormData, shipping_city: e.target.value })}
                              className="input-field w-full text-sm py-1.5"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Zip Code</label>
                            <input
                              type="text"
                              value={editFormData.shipping_zip_code || ''}
                              onChange={e => setEditFormData({ ...editFormData, shipping_zip_code: e.target.value })}
                              className="input-field w-full text-sm py-1.5"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">State/Province</label>
                            <input
                              type="text"
                              value={editFormData.shipping_state || ''}
                              onChange={e => setEditFormData({ ...editFormData, shipping_state: e.target.value })}
                              className="input-field w-full text-sm py-1.5"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Location</label>
                            <select
                              value={editFormData.shipping_location || ''}
                              onChange={e => setEditFormData({ ...editFormData, shipping_location: e.target.value })}
                              className="input-field w-full text-sm py-1.5"
                            >
                              <option value="NCR">NCR</option>
                              <option value="LUZON">Luzon</option>
                              <option value="VISAYAS_MINDANAO">Visayas/Mindanao</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Notes</label>
                          <textarea
                            value={editFormData.notes || ''}
                            onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                            className="input-field w-full text-sm py-1.5"
                            rows={2}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                          <span className="text-gray-500 w-20 shrink-0">Address:</span>
                          <span className="font-medium text-gray-900">{selectedOrder.shipping_address}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-gray-500 w-20 shrink-0">Barangay:</span>
                          <span className="font-medium text-gray-900">{selectedOrder.shipping_barangay}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-gray-500 w-20 shrink-0">City/State:</span>
                          <span className="font-medium text-gray-900">
                            {selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_zip_code}
                          </span>
                        </div>
                        {selectedOrder.shipping_location && (
                          <div className="flex items-start gap-3">
                            <span className="text-gray-500 w-20 shrink-0">Location:</span>
                            <span className="font-medium text-theme-accent bg-theme-accent/5 px-2 py-0.5 rounded">
                              {selectedOrder.shipping_location}
                            </span>
                          </div>
                        )}
                        {selectedOrder.notes && (
                          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                            <p className="text-xs font-bold text-yellow-800 uppercase mb-1">Order Notes</p>
                            <p className="text-gray-700 italic">"{selectedOrder.notes}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Items & Summary */}
                <div className="space-y-8">
                  {/* Order Items */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                      Order Items
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full ml-auto">
                        {selectedOrder.order_items.length} items
                      </span>
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Item</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-500">Qty</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">Price</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedOrder.order_items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50">
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900">{item.product_name}</p>
                                {item.variation_name && (
                                  <p className="text-xs text-gray-500">{item.variation_name}</p>
                                )}
                                <div className="mt-1">
                                  {(item.is_complete_set || item.isCompleteSet) ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      Complete Set
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                      Vial Only
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-gray-600">x{item.quantity}</td>
                              <td className="px-4 py-3 text-right text-gray-600">₱{item.price.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right font-medium text-gray-900">₱{item.total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50/50 border-t border-gray-200">
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right text-gray-500">Subtotal</td>
                            <td className="px-4 py-2 text-right font-medium text-gray-900">
                              ₱{selectedOrder.total_price.toLocaleString()}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right text-gray-500">Shipping Fee</td>
                            <td className="px-4 py-2 text-right font-medium text-gray-900">
                              ₱{(selectedOrder.shipping_fee || 0).toLocaleString()}
                            </td>
                          </tr>
                          <tr className="bg-gray-50 border-t border-gray-200">
                            <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-900">Grand Total</td>
                            <td className="px-4 py-3 text-right text-lg font-bold text-theme-accent">
                              ₱{(selectedOrder.total_price + (selectedOrder.shipping_fee || 0)).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Payment Proof */}
                  {selectedOrder.payment_proof_url && (
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm">
                          <Eye className="w-4 h-4 text-theme-accent" />
                        </div>
                        Payment Proof
                      </h3>
                      <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white">
                        <img
                          src={selectedOrder.payment_proof_url}
                          alt="Payment Proof"
                          className="w-full max-h-[300px] object-contain bg-gray-100"
                        />
                        <a
                          href={selectedOrder.payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <span className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform">
                            <Eye className="w-4 h-4" /> View Full Image
                          </span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Status Controls */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Payment Status</label>
                      <select
                        value={selectedOrder.payment_status}
                        onChange={(e) => handleUpdatePaymentStatus(selectedOrder.id, e.target.value)}
                        disabled={isProcessing}
                        className={`w-full p-2 rounded-lg border-0 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-theme-accent text-sm font-medium ${selectedOrder.payment_status === 'paid' ? 'text-green-700 bg-green-50 ring-green-200' : 'text-yellow-700 bg-yellow-50 ring-yellow-200'
                          }`}
                      >
                        <option value="pending">Pending Payment</option>
                        <option value="paid">Payment Received</option>
                      </select>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Order Status</label>
                      <select
                        value={selectedOrder.order_status}
                        onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                        disabled={isProcessing}
                        className="w-full p-2 rounded-lg border-0 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-theme-accent text-sm font-medium"
                      >
                        <option value="new">Unfulfilled</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <div className="text-xs text-gray-400">
                Created: {new Date(selectedOrder.created_at).toLocaleString()}
              </div>
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setEditFormData(selectedOrder);
                        setIsEditing(false);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                      disabled={isProcessing}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveOrder}
                      className="btn-primary px-6 py-2 flex items-center gap-2"
                      disabled={isProcessing}
                    >
                      <Save className="w-4 h-4" />
                      {isProcessing ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="btn-primary px-6 py-2"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManager;
