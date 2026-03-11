import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Clock, Truck, Package, PackageCheck, ShoppingBag, ArrowUpRight, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SkeletonLoader from '../components/SkeletonLoader';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [allRawOrders, setAllRawOrders] = useState([]);
    const [newProducts, setNewProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;

            try {
                // Orders
                let orderQuery = supabase.from('orders').select('*').order('created_at', { ascending: false });
                if (user.role !== 'admin') {
                    orderQuery = orderQuery.eq('customer_id', user.id);
                }

                const { data: userOrders } = await orderQuery;

                if (userOrders) {
                    setAllRawOrders(userOrders);
                }

                // Products (Only fetch if customer, since admin doesn't see this section)
                if (user.role !== 'admin') {
                    const { data: allProducts } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(3);
                    if (allProducts) {
                        setNewProducts(allProducts);
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
        window.addEventListener('ri_data_changed', loadData);
        return () => window.removeEventListener('ri_data_changed', loadData);
    }, [user]);

    // Optimize Dashboard rendering by memoizing metrics calculations securely on the client
    const { metrics, recentOrders } = React.useMemo(() => {
        let approvalPending = 0;
        let dispatchPending = 0;
        let deliveredPending = 0;
        let totalDelivered = 0;

        allRawOrders.forEach(order => {
            const orderDate = new Date(order.created_at);

            if (startDate) {
                const sDate = new Date(startDate);
                sDate.setHours(0, 0, 0, 0);
                if (orderDate < sDate) return;
            }

            if (endDate) {
                const eDate = new Date(endDate);
                eDate.setHours(23, 59, 59, 999);
                if (orderDate > eDate) return;
            }

            if (order.status === 'PENDING') approvalPending++;
            else if (order.status === 'APPROVED') dispatchPending++;
            else if (order.status === 'DISPATCHED') deliveredPending++;
            else if (order.status === 'DELIVERED') totalDelivered++;
        });

        return {
            metrics: { approvalPending, dispatchPending, deliveredPending, totalDelivered },
            recentOrders: allRawOrders.slice(0, 5) // Kept original logic: show 5 most recent globally
        };
    }, [allRawOrders, startDate, endDate]);

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
                <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-sm w-full md:w-auto overflow-hidden">
                    <div className="flex flex-col flex-1 px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer relative">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Start Date</span>
                        <input
                            type="date"
                            className="text-sm outline-none bg-transparent text-slate-800 font-medium w-full min-w-[130px] cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="h-10 w-px bg-slate-200"></div>
                    <div className="flex flex-col flex-1 px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer relative">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">End Date</span>
                        <input
                            type="date"
                            className="text-sm outline-none bg-transparent text-slate-800 font-medium w-full min-w-[130px] cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    {(startDate || endDate) && (
                        <>
                            <div className="h-10 w-px bg-slate-200"></div>
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                className="px-4 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors h-full flex items-center justify-center gap-1 font-medium text-sm"
                                title="Reset Filters"
                            >
                                <X size={20} />
                                Clear
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Metrics Section */}
            {loading ? (
                <SkeletonLoader type="stats" count={4} />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="glass-card p-6 relative overflow-hidden group border-b-4 border-b-amber-500">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Clock size={80} className="text-amber-600" />
                        </div>
                        <h3 className="text-slate-500 font-medium mb-1">Approval Pending</h3>
                        <p className="text-3xl font-bold text-amber-600">{metrics.approvalPending}</p>
                    </div>

                    <div className="glass-card p-6 relative overflow-hidden group border-b-4 border-b-blue-500">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Package size={80} className="text-blue-600" />
                        </div>
                        <h3 className="text-slate-500 font-medium mb-1">Dispatch Pending</h3>
                        <p className="text-3xl font-bold text-blue-600">{metrics.dispatchPending}</p>
                    </div>

                    <div className="glass-card p-6 relative overflow-hidden group border-b-4 border-b-purple-500">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Truck size={80} className="text-purple-600" />
                        </div>
                        <h3 className="text-slate-500 font-medium mb-1">Delivered Pending</h3>
                        <p className="text-3xl font-bold text-purple-600">{metrics.deliveredPending}</p>
                    </div>

                    <div className="glass-card p-6 relative overflow-hidden group border-b-4 border-b-emerald-500">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <PackageCheck size={80} className="text-emerald-600" />
                        </div>
                        <h3 className="text-slate-500 font-medium mb-1">Total Delivered</h3>
                        <p className="text-3xl font-bold text-emerald-600">{metrics.totalDelivered}</p>
                    </div>
                </div>
            )}

            {/* New Product Launch Section */}
            {user?.role !== 'admin' && (
                <div className="glass-panel p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">New Product Launches</h2>
                            <p className="text-slate-500 text-sm">Check out our latest industrial innovations</p>
                        </div>
                        <Link to="/new-products" className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1">
                            View All <ArrowUpRight size={16} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {loading ? (
                            <SkeletonLoader type="card" count={3} className="col-span-full md:col-span-3 lg:col-span-4" />
                        ) : newProducts.map((product) => (
                            <div
                                key={product.product_id}
                                className="glass-card group overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1"
                                onClick={() => navigate('/place-order', { state: { preselectedProductId: product.product_id } })}
                            >
                                <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shrink-0">
                                    <img
                                        src={product.image_url || product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => { e.target.src = 'https://placehold.co/400?text=Product' }}
                                    />
                                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded shadow-sm z-10 pointer-events-none">
                                        {product.category}
                                    </div>
                                    <span className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded shadow-sm z-10">NEW</span>
                                </div>
                                <div className="p-5 flex-1 flex flex-col pt-4">
                                    <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight line-clamp-1">{product.name}</h3>
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed" title={product.description}>
                                        {product.description || 'No additional details available.'}
                                    </p>

                                    <div className="mt-auto flex items-end justify-between pt-1">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                                            <span className="text-xl font-black text-slate-900 tracking-tight">₹{product.price?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate('/place-order', { state: { preselectedProductId: product.product_id } }); }}
                                                className="px-4 py-2 bg-indigo-100 text-indigo-700 font-bold text-[13px] rounded-lg hover:bg-indigo-200 shadow-sm shadow-indigo-900/5 transition-all hover:-translate-y-0.5"
                                            >
                                                Add to cart
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Orders Preview */}
            <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Recent Orders</h2>
                    <Link to="/orders" className="text-red-600 hover:text-red-700 font-medium text-sm">View All History</Link>
                </div>
                <div className="overflow-x-auto">
                    {loading ? (
                        <SkeletonLoader type="table" count={5} />
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 text-sm">
                                    <th className="pb-3 font-medium pl-4">Order ID</th>
                                    <th className="pb-3 font-medium">Date</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium">Qty</th>
                                    <th className="pb-3 font-medium text-right pr-4">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentOrders.map((order) => (
                                    <tr key={order.order_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 pl-4 font-medium text-slate-900">{order.order_id}</td>
                                        <td className="py-4 text-slate-600">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                order.status === 'DISPATCHED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    order.status === 'APPROVED' ? 'bg-cyan-50 text-cyan-600 border-cyan-100' :
                                                        order.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-slate-50 text-slate-600 border-slate-100'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-slate-600">{order.quantity}</td>
                                        <td className="py-4 text-right pr-4 font-semibold text-slate-900">₹{order.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
