import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';

const NotTried = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchNotTried = async () => {
            if (!user) return;

            const { data: allProducts } = await supabase.from('products').select('*');
            const { data: userOrders } = await supabase.from('orders').select('product_id').eq('customer_id', user.id);

            if (allProducts && userOrders) {
                const triedProductIds = new Set(userOrders.map(o => o.product_id));
                const notTried = allProducts.filter(p => !triedProductIds.has(p.product_id));
                setProducts(notTried);
            }
        };
        fetchNotTried();
    }, [user]);

    const handleOrder = (productId) => {
        navigate('/place-order', { state: { preselectedProductId: productId } });
    };

    return (
        <div className="space-y-6 animate-fade-in-up">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-slate-500 mb-2">You have tried all our products!</p>
                        <p className="text-sm text-slate-400">Amazing customer!</p>
                    </div>
                ) : (
                    products.slice(0, 50).map((product) => (
                        <div
                            key={product.product_id}
                            className={`glass-card group overflow-hidden flex flex-col cursor-pointer transition-all ${user?.role === 'admin' ? 'hover:ring-2 hover:ring-red-500' : 'hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1'}`}
                            onClick={() => {
                                if (user?.role === 'admin') navigate(`/purchase-history/${product.product_id}`);
                                else handleOrder(product.product_id);
                            }}
                        >
                            <div className="relative h-56 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shrink-0">
                                <img
                                    src={product.image_url || product.image || 'https://placehold.co/400?text=Product'}
                                    alt={product.name}
                                    className={"w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"}
                                    onError={(e) => { e.target.src = 'https://placehold.co/400?text=Product' }}
                                />
                                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded shadow-sm">
                                    {product.category}
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col pt-4">
                                <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight line-clamp-1">{product.name}</h3>
                                {user?.role === 'admin' ? (
                                    <p className="text-xs text-slate-400 mb-4 font-mono">ID: {product.product_id}</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="text-[10px] font-bold px-2 py-0.5 border border-slate-300 rounded text-slate-600 uppercase tracking-widest">{product.category}</span>
                                    </div>
                                )}

                                {user?.role !== 'admin' && (
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-3 leading-relaxed" title={product.description}>
                                        {product.description || 'No additional details available.'}
                                    </p>
                                )}

                                <div className="mt-auto flex items-end justify-between pt-1">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                                        <span className="text-xl font-black text-slate-900 tracking-tight">₹{product.price?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOrder(product.product_id); }}
                                            className="px-5 py-2 bg-indigo-100 text-indigo-700 font-bold text-[13px] rounded-lg hover:bg-indigo-200 shadow-sm shadow-indigo-900/5 transition-all hover:-translate-y-0.5 flex items-center gap-1 whitespace-nowrap"
                                        >
                                            <span>Try This</span>
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotTried;
