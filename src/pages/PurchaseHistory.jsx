import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Package, Calendar, Tag, CreditCard, Box, TrendingUp, Users } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

const PurchaseHistory = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Redirection if not admin
        if (user && user.role !== 'admin') {
            navigate('/all-products');
            return;
        }

        loadProductAndHistory();
    }, [id, user]);

    const loadProductAndHistory = async () => {
        try {
            setLoading(true);
            setError('');

            // 1. Fetch Product from Supabase
            const { data: productData, error: dbError } = await supabase
                .from('products')
                .select('*')
                .eq('product_id', id)
                .single();

            if (dbError) throw dbError;

            if (productData) {
                setProduct({
                    product_id: productData.product_id,
                    name: productData.name,
                    price: productData.price,
                    category: productData.category,
                    image: productData.image_url,
                    description: productData.description || '',
                    launchDate: productData.created_at, // Use created_at as launch date because launch_date doesn't exist anymore 
                    stock: 100 // Default stock
                });
            } else {
                throw new Error("Product not found");
            }

            // 2. Fetch Orders from Supabase
            const { data: allOrders, error: ordersError } = await supabase
                .from('orders')
                .select('*, users!customer_id (first_name, email)')
                .eq('product_id', id)
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            const enrichedOrders = (allOrders || []).map(o => ({
                ...o,
                customer_name: o.users?.first_name || o.users?.email || o.customer_id
            }));
            setOrders(enrichedOrders);

        } catch (err) {
            console.error("Error loading purchase history:", err);
            setError('Failed to load product details or history.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-fade-in-up p-4">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse"></div>
                    <div className="w-48 h-8 bg-slate-200 rounded animate-pulse"></div>
                </div>
                <SkeletonLoader type="card" count={1} className="w-full h-48" />
                <SkeletonLoader type="stats" count={4} />
                <SkeletonLoader type="table" count={5} />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="text-center py-12">
                <div className="text-red-500 mb-4">{error || 'Product not found.'}</div>
                <button
                    onClick={() => navigate('/all-products')}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
                >
                    Back to Products
                </button>
            </div>
        );
    }

    // Calculate Metrics
    const totalUnitsSold = orders.reduce((sum, order) => sum + order.quantity, 0);
    const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
    const totalOrders = orders.length;

    // Unique Customers count
    const uniqueCustomers = new Set(orders.map(o => o.customer_id)).size;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header / Back Button */}
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={() => navigate('/all-products')}
                    className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 transition-colors text-slate-600"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        Product Details & History
                    </h1>
                </div>
            </div>

            {/* Product Overview Card */}
            <div className="glass-panel p-6 flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-48 h-48 bg-slate-50 rounded-xl rounded-lg overflow-hidden shrink-0 border border-slate-100 relative">
                    <img
                        src={product.image || product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://placehold.co/400?text=Product' }}
                    />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-white text-[10px] font-bold uppercase">
                        {product.category}
                    </div>
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0">
                            <h2 className="text-2xl font-bold text-slate-800 truncate pr-4">{product.name}</h2>
                            <p className="text-slate-500 text-sm font-medium">ID: {product.product_id}</p>
                        </div>
                        <div className="text-2xl font-bold text-red-600 shrink-0">₹{product.price}</div>
                    </div>

                    <div className="mt-4 pb-4 border-b border-slate-100 flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-700 mb-1">Description:</h4>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-all">
                            {product.description || "No description provided."}
                        </p>
                    </div>

                    <div className="flex gap-4 mt-4 opacity-80">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                            <Calendar size={14} />
                            Launched: {new Date(product.launchDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                            <Box size={14} />
                            Stock: {product.stock}
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
                        <p className="text-xl font-bold text-slate-800">₹{totalRevenue.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Units Sold</p>
                        <p className="text-xl font-bold text-slate-800">{totalUnitsSold}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <Tag size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Orders</p>
                        <p className="text-xl font-bold text-slate-800">{totalOrders}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Unique Buyers</p>
                        <p className="text-xl font-bold text-slate-800">{uniqueCustomers}</p>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="glass-panel overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b border-slate-200">
                    <h3 className="font-bold text-slate-800 text-lg">Purchase Log</h3>
                </div>

                {orders.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 border-t border-slate-100">
                        No purchase history found for this product.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-semibold">Order ID</th>
                                    <th className="p-4 font-semibold">Date</th>
                                    <th className="p-4 font-semibold">Customer</th>
                                    <th className="p-4 font-semibold text-right">Qty</th>
                                    <th className="p-4 font-semibold text-right">Amount (₹)</th>
                                    <th className="p-4 font-semibold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map(order => (
                                    <tr key={order.order_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-slate-800">{order.order_id}</td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {new Date(order.created_at).toLocaleDateString()}
                                            <span className="text-xs text-slate-400 block">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 font-medium">{order.customer_name}</td>
                                        <td className="p-4 text-sm text-slate-800 font-bold text-right">{order.quantity}</td>
                                        <td className="p-4 text-sm text-emerald-600 font-bold text-right">{order.amount.toLocaleString()}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border 
                                                ${order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                    order.status === 'CANCELLED' || order.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-200' :
                                                        order.status === 'DISPATCHED' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                            'bg-amber-50 text-amber-600 border-amber-200'}`}
                                            >
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PurchaseHistory;
