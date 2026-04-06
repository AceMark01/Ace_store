import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Clock, Truck, Package, PackageCheck, PackageX, ShoppingBag,
    ArrowUpRight, X, TrendingUp, Users, DollarSign,
    ShoppingCart, BarChart3, Award, CheckCircle2,
    AlertCircle, CircleDashed, CircleCheckBig
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SkeletonLoader from '../components/SkeletonLoader';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, PieChart,
    Pie, Cell, LineChart, Line
} from 'recharts';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [allRawOrders, setAllRawOrders] = useState([]);
    const [newProducts, setNewProducts] = useState([]);
    const [totalApiProducts, setTotalApiProducts] = useState(0);
    const [totalSystemCustomers, setTotalSystemCustomers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('products'); 
    const [orderFilter, setOrderFilter] = useState('all');

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Load Local Orders
                const localOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
                let filtered = localOrders;
                if (user.role !== 'admin') {
                    filtered = localOrders.filter(o => o.customer_id === user.id);
                }
                setAllRawOrders(filtered);

                // Load Products from API
                const response = await fetch(API_URL);
                const data = await response.json();
                if (data.status === "200" && data.DataRec) {
                    setTotalApiProducts(data.DataRec.length);
                    
                    if (user.role !== 'admin') {
                        const products = data.DataRec.slice(0, 4).map(p => ({
                            product_id: `API-${p.ProductID}`,
                            name: p.ProductName,
                            price: p.NewMRP || 0,
                            category: p.SubCat || p.ProdGroup || 'General',
                            stock: p.Pack || 100,
                            description: `Product Group: ${p.ProdGroup}.`
                        }));
                        setNewProducts(products);
                    }
                }

                // Load Total Customers
                const users = JSON.parse(localStorage.getItem('ace_store_users') || '[]');
                setTotalSystemCustomers(users.length);
            } catch (err) {
                console.error("Dashboard: Error loading local data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
        window.addEventListener('ri_data_changed', loadData);
        return () => window.removeEventListener('ri_data_changed', loadData);
    }, [user]);

    const filteredRawOrders = React.useMemo(() => {
        if (!allRawOrders) return [];
        return allRawOrders.filter(order => {
            if (!order || !order.created_at) return true;
            const orderDate = new Date(order.created_at);
            if (isNaN(orderDate.getTime())) return true;

            if (startDate) {
                const sDate = new Date(startDate);
                sDate.setHours(0, 0, 0, 0);
                if (orderDate < sDate) return false;
            }
            if (endDate) {
                const eDate = new Date(endDate);
                eDate.setHours(23, 59, 59, 999);
                if (orderDate > eDate) return false;
            }
            return true;
        });
    }, [allRawOrders, startDate, endDate]);

    const salesData = React.useMemo(() => {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayOrders = filteredRawOrders.filter(order => new Date(order.created_at).toDateString() === date.toDateString());
            last7Days.push({
                name: dateStr,
                sales: dayOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0),
                orders: dayOrders.length,
                date: date.toISOString().split('T')[0]
            });
        }
        return last7Days;
    }, [filteredRawOrders]);

    const bestSellingProducts = React.useMemo(() => {
        const productSales = filteredRawOrders.reduce((acc, order) => {
            const name = order.product_name || "Product";
            if (!acc[name]) acc[name] = { name, quantity: 0, revenue: 0, orders: 0 };
            acc[name].quantity += Number(order.quantity || 0);
            acc[name].revenue += Number(order.amount || 0);
            acc[name].orders += 1;
            return acc;
        }, {});
        return Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    }, [filteredRawOrders]);

    const categoryData = React.useMemo(() => {
        const categorySales = filteredRawOrders.reduce((acc, order) => {
            const cat = order.product_category || 'General';
            if (!acc[cat]) acc[cat] = { name: cat, value: 0, revenue: 0 };
            acc[cat].value += Number(order.quantity || 0);
            acc[cat].revenue += Number(order.amount || 0);
            return acc;
        }, {});
        return Object.values(categorySales).slice(0, 5);
    }, [filteredRawOrders]);

    const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'];

    const metrics = React.useMemo(() => {
        const totalRevenue = filteredRawOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
        const totalOrders = filteredRawOrders.length;
        const totalProductsSold = filteredRawOrders.reduce((sum, o) => sum + Number(o.quantity || 0), 0);
        return { totalRevenue, totalOrders, totalProductsSold };
    }, [filteredRawOrders]);

    const orderStatusCounts = React.useMemo(() => {
        const counts = { all: filteredRawOrders.length, pending: 0, approved: 0, dispatched: 0, delivered: 0, cancelled: 0 };
        filteredRawOrders.forEach(order => {
            const s = order.status?.toLowerCase();
            if (counts[s] !== undefined) counts[s]++;
        });
        return counts;
    }, [filteredRawOrders]);

    const filteredOrders = React.useMemo(() => {
        if (orderFilter === 'recent') return filteredRawOrders.slice(0, 5);
        if (orderFilter === 'all') return filteredRawOrders;
        return filteredRawOrders.filter(o => o.status?.toLowerCase() === orderFilter.toLowerCase());
    }, [filteredRawOrders, orderFilter]);

    const getStatusConfig = (status) => {
        switch (status) {
            case 'PENDING': return { icon: AlertCircle, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' };
            case 'APPROVED': return { icon: CircleDashed, bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100' };
            case 'DISPATCHED': return { icon: Truck, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' };
            case 'DELIVERED': return { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' };
            case 'CANCELLED': return { icon: PackageX, bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' };
            default: return { icon: Clock, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' };
        }
    };

    const renderKPIContent = () => {
        return (
            <>
                <div className="glass-card p-6 border-b-4 border-red-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/all-products')}>
                    <div className="flex items-center justify-between mb-2"><h3 className="text-slate-500 text-sm font-semibold">All Products</h3><ShoppingBag size={20} className="text-red-500" /></div>
                    <p className="text-3xl font-bold text-red-600">{totalApiProducts}</p>
                </div>
                <div className="glass-card p-6 border-b-4 border-blue-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('orders')}>
                    <div className="flex items-center justify-between mb-2"><h3 className="text-slate-500 text-sm font-semibold">Total Orders</h3><ShoppingCart size={20} className="text-blue-500" /></div>
                    <p className="text-3xl font-bold text-blue-600">{metrics.totalOrders}</p>
                </div>
                <div className="glass-card p-6 border-b-4 border-purple-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('customers')}>
                    <div className="flex items-center justify-between mb-2"><h3 className="text-slate-500 text-sm font-semibold">Total Customer</h3><Users size={20} className="text-purple-500" /></div>
                    <p className="text-3xl font-bold text-purple-600">{totalSystemCustomers}</p>
                </div>
                <div className="glass-card p-6 border-b-4 border-amber-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('products')}>
                    <div className="flex items-center justify-between mb-2"><h3 className="text-slate-500 text-sm font-semibold">Sold Product</h3><Package size={20} className="text-amber-500" /></div>
                    <p className="text-3xl font-bold text-amber-600">{metrics.totalProductsSold}</p>
                </div>
            </>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
                <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex flex-col px-4 py-2 hover:bg-slate-50 transition-colors">
                        <span className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Start</span>
                        <input type="date" className="text-sm outline-none bg-transparent" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="h-10 w-px bg-slate-200"></div>
                    <div className="flex flex-col px-4 py-2 hover:bg-slate-50 transition-colors">
                        <span className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">End</span>
                        <input type="date" className="text-sm outline-none bg-transparent" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {renderKPIContent()}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel p-6">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6"><BarChart3 size={20} className="text-blue-500" />Sales Overview</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} /></AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel p-6">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6"><Award size={20} className="text-amber-500" />Best Sellers</h2>
                    <div className="space-y-4">
                        {bestSellingProducts.map((p, i) => (
                            <div key={p.name} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold">#{i + 1}</div>
                                <div className="flex-1"><p className="text-sm font-semibold truncate">{p.name}</p><p className="text-xs text-slate-500">{p.quantity} units</p></div>
                                <div className="text-right"><p className="text-xs font-bold text-emerald-600">₹{p.revenue.toLocaleString()}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {user?.role !== 'admin' && newProducts.length > 0 && (
                <div className="glass-panel p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800">New Product Launches</h2>
                        <Link to="/new-products" className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1">View All <ArrowUpRight size={16} /></Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {newProducts.map(p => (
                            <div key={p.product_id} className="glass-card p-4 hover:-translate-y-1 transition-all cursor-pointer" onClick={() => navigate('/all-products')}>
                                <div className="h-40 bg-slate-100 rounded-lg mb-3"></div>
                                <h3 className="font-bold truncate">{p.name}</h3>
                                <p className="text-red-600 font-black">₹{p.price.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;