import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, AlertCircle, ArrowLeft, ExternalLink, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import Footer from '../components/Footer';

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
    order_items: OrderItem[];
    total_price: number;
    payment_method_name: string | null;
    payment_status: string;
    order_status: string;
    tracking_number: string | null;
    courier_name: string | null;
    shipping_notes: string | null;
    created_at: string;
}

const ORDER_STATUSES = ['new', 'confirmed', 'processing', 'shipped', 'delivered'];

const COURIER_TRACKING_URLS: Record<string, string> = {
    'LBC': 'https://www.lbcexpress.com/track/?tracking_no=',
    'J&T': 'https://www.jtexpress.ph/trajectoryQuery?waybillNo=',
    'FedEx': 'https://www.fedex.com/fedextrack/?trknbr=',
    'DHL': 'https://www.dhl.com/ph-en/home/tracking/tracking-express.html?submit=1&tracking-id=',
    'Ninja Van': 'https://www.ninjavan.co/en-ph/tracking?id=',
    'Grab Express': 'https://www.grab.com/ph/express/',
    'Lalamove': 'https://www.lalamove.com/philippines/manila/en/track',
};

const OrderTracking: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        setError(null);
        setSearched(true);

        try {
            // Search by order_number or id
            const { data, error: fetchError } = await supabase
                .from('orders')
                .select('*')
                .or(`order_number.ilike.%${searchQuery.trim()}%,id.eq.${searchQuery.trim()}`)
                .limit(1)
                .single();

            if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                    setOrder(null);
                    setError('No order found with that Order ID. Please check and try again.');
                } else {
                    throw fetchError;
                }
            } else {
                setOrder(data);
            }
        } catch (err) {
            console.error('Error searching order:', err);
            setError('Unable to search for order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIndex = (status: string) => {
        return ORDER_STATUSES.indexOf(status.toLowerCase());
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'new': return 'bg-blue-500';
            case 'confirmed': return 'bg-indigo-500';
            case 'processing': return 'bg-yellow-500';
            case 'shipped': return 'bg-purple-500';
            case 'delivered': return 'bg-green-500';
            case 'cancelled': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid': return 'text-green-600 bg-green-100';
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            case 'failed': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getTrackingUrl = (courier: string | null, trackingNumber: string | null) => {
        if (!courier || !trackingNumber) return null;
        const baseUrl = COURIER_TRACKING_URLS[courier];
        if (!baseUrl) return null;
        return `${baseUrl}${trackingNumber}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-theme-bg flex flex-col">
            <Header cartItemsCount={0} onCartClick={() => { }} onMenuClick={() => { }} />

            <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
                {/* Back Link */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-theme-accent hover:text-theme-text transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Shop
                </Link>

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border-2 border-theme-secondary shadow-soft mb-4">
                        <Package className="w-4 h-4 text-theme-accent" />
                        <span className="text-sm font-medium text-gray-600">Order Tracking</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-theme-text mb-3">
                        Track Your Order
                    </h1>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Enter your Order ID to check the status of your order and get real-time updates.
                    </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-10">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter your Order ID (e.g., ORD-12345)"
                            className="w-full px-5 py-4 pl-12 rounded-xl border-2 border-theme-secondary focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 outline-none transition-all text-lg"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <button
                            type="submit"
                            disabled={loading || !searchQuery.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-2 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Searching...' : 'Track'}
                        </button>
                    </div>
                </form>

                {/* Error State */}
                {error && searched && (
                    <div className="max-w-xl mx-auto mb-8">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Order Details */}
                {order && (
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Status Progress */}
                        <div className="bg-white rounded-2xl border-2 border-theme-secondary p-6 md:p-8 shadow-soft">
                            <h2 className="text-xl font-semibold text-theme-text mb-6">Order Status</h2>

                            {order.order_status.toLowerCase() === 'cancelled' ? (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                                    <AlertCircle className="w-6 h-6 text-red-500" />
                                    <div>
                                        <p className="font-medium text-red-700">Order Cancelled</p>
                                        <p className="text-sm text-red-600">This order has been cancelled.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Progress Line */}
                                    <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" />
                                    <div
                                        className="absolute top-5 left-0 h-1 bg-theme-accent rounded-full transition-all duration-500"
                                        style={{ width: `${(getStatusIndex(order.order_status) / (ORDER_STATUSES.length - 1)) * 100}%` }}
                                    />

                                    {/* Status Steps */}
                                    <div className="relative flex justify-between">
                                        {ORDER_STATUSES.map((status, index) => {
                                            const isActive = index <= getStatusIndex(order.order_status);
                                            const isCurrent = status === order.order_status.toLowerCase();
                                            return (
                                                <div key={status} className="flex flex-col items-center">
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                                                                ? isCurrent
                                                                    ? `${getStatusColor(status)} text-white ring-4 ring-offset-2 ring-theme-accent/30`
                                                                    : `${getStatusColor(status)} text-white`
                                                                : 'bg-gray-200 text-gray-400'
                                                            }`}
                                                    >
                                                        {status === 'new' && <Clock className="w-5 h-5" />}
                                                        {status === 'confirmed' && <CheckCircle className="w-5 h-5" />}
                                                        {status === 'processing' && <Package className="w-5 h-5" />}
                                                        {status === 'shipped' && <Truck className="w-5 h-5" />}
                                                        {status === 'delivered' && <CheckCircle className="w-5 h-5" />}
                                                    </div>
                                                    <span className={`mt-2 text-xs md:text-sm font-medium capitalize ${isActive ? 'text-theme-text' : 'text-gray-400'}`}>
                                                        {status}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Order Info Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Order Details */}
                            <div className="bg-white rounded-2xl border-2 border-theme-secondary p-6 shadow-soft">
                                <h3 className="text-lg font-semibold text-theme-text mb-4">Order Details</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Order ID</span>
                                        <span className="font-medium text-theme-text">{order.order_number || order.id.slice(0, 8)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Order Date</span>
                                        <span className="font-medium text-theme-text">{formatDate(order.created_at)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Payment Status</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getPaymentStatusColor(order.payment_status)}`}>
                                            {order.payment_status}
                                        </span>
                                    </div>
                                    {order.payment_method_name && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Payment Method</span>
                                            <span className="font-medium text-theme-text">{order.payment_method_name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Shipping Info */}
                            <div className="bg-white rounded-2xl border-2 border-theme-secondary p-6 shadow-soft">
                                <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-theme-accent" />
                                    Shipping Address
                                </h3>
                                <div className="space-y-1 text-gray-600">
                                    <p className="font-medium text-theme-text">{order.customer_name}</p>
                                    <p>{order.shipping_address}</p>
                                    <p>{order.shipping_city}, {order.shipping_state} {order.shipping_zip_code}</p>
                                    <p className="pt-2">{order.customer_phone}</p>
                                    <p>{order.customer_email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tracking Info */}
                        {(order.tracking_number || order.courier_name || order.shipping_notes) && (
                            <div className="bg-white rounded-2xl border-2 border-theme-secondary p-6 shadow-soft">
                                <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
                                    <Truck className="w-5 h-5 text-theme-accent" />
                                    Shipping & Tracking
                                </h3>
                                <div className="space-y-4">
                                    {order.courier_name && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-500">Courier:</span>
                                            <span className="font-medium text-theme-text">{order.courier_name}</span>
                                        </div>
                                    )}
                                    {order.tracking_number && (
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="text-gray-500">Tracking Number:</span>
                                            <span className="font-mono font-medium text-theme-text bg-gray-100 px-3 py-1 rounded">
                                                {order.tracking_number}
                                            </span>
                                            {getTrackingUrl(order.courier_name, order.tracking_number) && (
                                                <a
                                                    href={getTrackingUrl(order.courier_name, order.tracking_number)!}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-theme-accent hover:underline font-medium"
                                                >
                                                    Track with {order.courier_name}
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    {order.shipping_notes && (
                                        <div className="pt-2 border-t border-gray-100">
                                            <p className="text-gray-500 mb-1 text-sm">Shipping Notes:</p>
                                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{order.shipping_notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Order Items */}
                        <div className="bg-white rounded-2xl border-2 border-theme-secondary p-6 shadow-soft">
                            <h3 className="text-lg font-semibold text-theme-text mb-4">Items Ordered</h3>
                            <div className="divide-y divide-gray-100">
                                {order.order_items.map((item, index) => (
                                    <div key={index} className="py-3 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-theme-text">{item.product_name}</p>
                                            {item.variation_name && (
                                                <p className="text-sm text-gray-500">{item.variation_name}</p>
                                            )}
                                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-medium text-theme-text">{formatCurrency(item.total)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t-2 border-theme-secondary mt-4 pt-4 flex justify-between items-center">
                                <span className="text-lg font-semibold text-theme-text">Total</span>
                                <span className="text-xl font-bold text-theme-accent">{formatCurrency(order.total_price)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!order && searched && !error && (
                    <div className="text-center py-12">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No order found. Please check your Order ID and try again.</p>
                    </div>
                )}

                {/* Initial State */}
                {!searched && (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-theme-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-10 h-10 text-theme-accent" />
                        </div>
                        <p className="text-gray-600 max-w-md mx-auto">
                            Enter your Order ID above to see your order status, shipping details, and tracking information.
                        </p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default OrderTracking;
