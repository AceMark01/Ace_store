import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
        if (user && user.role !== 'admin') {
            navigate('/all-products');
            return;
        }
        loadProductAndHistory();
    }, [id, user]);

    const loadProductAndHistory = async () => {
        setLoading(true);
        try {
            // Load Product from API
            const response = await fetch(import.meta.env.VITE_API_URL);
            const data = await response.json();
            let foundProduct = null;
            if (data.status === "200" && data.DataRec) {
                const p = data.DataRec.find(item => `API-${item.ProductID}` === id);
                if (p) {
                    const overrides = JSON.parse(localStorage.getItem('productOverrides') || '{}')[id] || {};
                    foundProduct = {
                        product_id: id,
                        name: p.ProductName,
                        price: p.NewMRP || 0,
                        category: p.SubCat || p.ProdGroup || 'General',
                        image: overrides.image || 'https://placehold.co/400?text=Product',
                        description: overrides.description || `Product Group: ${p.ProdGroup}.`,
                        launchDate: '2024-01-01',
                        stock: p.Pack || 100
                    };
                }
            }

            if (!foundProduct) {
                // Check custom products
                const customProducts = JSON.parse(localStorage.getItem('customProducts') || '[]');
                foundProduct = customProducts.find(p => p.product_id === id);
            }

            if (foundProduct) {
                setProduct(foundProduct);
                // Load Orders from LocalStorage
                const localOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
                const filtered = localOrders.filter(o => o.product_id === id);
                setOrders(filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            } else {
                setError("Product not found");
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10"><SkeletonLoader type="card" count={1} /></div>;
    if (error || !product) return <div className="p-10 text-center"><p className="text-red-500 mb-4">{error}</p><button onClick={() => navigate('/all-products')} className="px-4 py-2 bg-slate-800 text-white rounded-lg">Back</button></div>;

    const totalUnitsSold = orders.reduce((sum, o) => sum + o.quantity, 0);
    const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
    const uniqueCustomers = new Set(orders.map(o => o.customer_id)).size;

    return (
        <div className="space-y-6 animate-fade-in-up md:p-4">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/all-products')} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 transition-colors"><ArrowLeft size={20} /></button>
                <h1 className="text-2xl font-bold text-slate-800">Product Performance</h1>
            </div>

            <div className="glass-panel p-6 flex flex-col md:flex-row gap-6">
                <img src={product.image} className="w-full md:w-48 h-48 object-cover rounded-xl border border-slate-100" />
                <div className="flex-1">
                    <div className="flex justify-between mb-4"><div><h2 className="text-2xl font-bold text-slate-800">{product.name}</h2><p className="text-slate-500 text-sm">{product.product_id}</p></div><div className="text-2xl font-black text-red-600">₹{product.price.toLocaleString()}</div></div>
                    <p className="text-sm text-slate-600 mb-4">{product.description}</p>
                    <div className="flex gap-4"><span className="text-xs bg-slate-100 px-3 py-1 rounded-lg">Category: {product.category}</span><span className="text-xs bg-slate-100 px-3 py-1 rounded-lg">Stock: {product.stock}</span></div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[ {l:'Revenue', v:'₹'+totalRevenue.toLocaleString(), i:TrendingUp, c:'blue'}, {l:'Units', v:totalUnitsSold, i:Package, c:'emerald'}, {l:'Orders', v:orders.length, i:Tag, c:'purple'}, {l:'Buyers', v:uniqueCustomers, i:Users, c:'amber'} ].map((s,i) => (
                    <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className={`p-3 bg-${s.c}-50 text-${s.c}-600 rounded-lg`}><s.i size={24} /></div>
                        <div><p className="text-xs text-slate-400 font-bold uppercase">{s.l}</p><p className="text-lg font-black text-slate-800">{s.v}</p></div>
                    </div>
                ))}
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b border-slate-200"><h3 className="font-bold text-slate-800">Purchase Log</h3></div>
                {orders.length === 0 ? <p className="p-8 text-center text-slate-500">No purchase history found.</p> :
                    <table className="w-full text-left border-collapse"><thead className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400"><tr><th className="p-4">Customer</th><th className="p-4 text-right">Qty</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Status</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{orders.map(o => (
                        <tr key={o.order_id} className="hover:bg-slate-50/50">
                            <td className="p-4 text-sm font-bold text-slate-800">{o.customer_name}<span className="text-[10px] block opacity-50 font-normal">{new Date(o.created_at).toLocaleDateString()}</span></td>
                            <td className="p-4 text-sm text-right font-black">{o.quantity}</td>
                            <td className="p-4 text-sm text-right text-emerald-600 font-black">₹{o.amount.toLocaleString()}</td>
                            <td className="p-4 text-center"><span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-slate-100 border border-slate-200">{o.status}</span></td>
                        </tr>
                    ))}</tbody></table>}
            </div>
        </div>
    );
};

export default PurchaseHistory;
