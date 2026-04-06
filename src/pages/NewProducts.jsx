import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Star, Plus, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

const NewProducts = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '',
        category: 'Electrical',
        image: '',
        description: ''
    });
    const [imageError, setImageError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_URL = 'http://eksai12.ddns.net:8786/ek_api/googleAutomation/PriceList.ashx';

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            if (data.status === "200" && data.DataRec) {
                const apiProducts = data.DataRec.slice(0, 20).map(p => ({
                    product_id: `API-${p.ProductID}`,
                    name: p.ProductName,
                    price: p.NewMRP || 0,
                    category: p.SubCat || p.ProdGroup || 'General',
                    image: '',
                    description: `Product Group: ${p.ProdGroup}.`,
                    stock: p.Pack || 100
                }));
                
                // Merge with local custom products
                const customProducts = JSON.parse(localStorage.getItem('customProducts') || '[]');
                setProducts([...customProducts, ...apiProducts]);
                
                const cats = new Set(['Electrical', 'Hardware', 'Lighting', 'Tools', 'Accessories']);
                apiProducts.forEach(p => cats.add(p.category));
                setCategories(Array.from(cats).sort());
            }
        } catch (err) {
            console.error('Error fetching new products:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const handleOrder = (id) => {
        navigate('/place-order', { state: { preselectedProductId: id } });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const customProducts = JSON.parse(localStorage.getItem('customProducts') || '[]');
            const newProduct = {
                product_id: "P" + Date.now().toString().slice(-6),
                name: formData.name,
                price: Number(formData.price),
                stock: Number(formData.stock) || 0,
                category: formData.category,
                image: formData.image || 'https://placehold.co/400?text=' + encodeURIComponent(formData.name),
                description: formData.description,
                launchDate: new Date().toISOString().split('T')[0]
            };
            
            customProducts.unshift(newProduct);
            localStorage.setItem('customProducts', JSON.stringify(customProducts));
            
            loadProducts();
            setIsModalOpen(false);
            setFormData({ name: '', price: '', stock: '', category: 'Electrical', image: '', description: '' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Star className="text-amber-400 fill-amber-400" /> New Launches
                </h1>
                {user?.role === 'admin' && (
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition-all font-medium">
                        <Plus size={18} /> Launch Product
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {loading ? (
                    <SkeletonLoader type="card" count={4} className="col-span-full" />
                ) : products.map(p => (
                    <div key={p.product_id} className={`glass-card group overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1`} onClick={() => handleOrder(p.product_id)}>
                        <div className="relative h-56 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shrink-0">
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { e.target.src = 'https://placehold.co/400?text=New+Launch' }} />
                            <span className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-md z-10">NEW</span>
                            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded shadow-sm">{p.category}</div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col pt-4">
                            <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight line-clamp-1">{p.name}</h3>
                            <p className="text-sm text-slate-500 mb-4 line-clamp-3 leading-relaxed">{p.description || 'No additional details available.'}</p>
                            <div className="mt-auto flex items-end justify-between pt-1">
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Price</p><span className="text-xl font-black text-slate-900 tracking-tight">₹{p.price?.toLocaleString()}</span></div>
                                <button className={`px-5 py-2 font-bold text-[13px] rounded-lg shadow-sm transition-all ${p.stock <= 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 shadow-indigo-900/5 hover:-translate-y-0.5'}`}>
                                    {p.stock <= 0 ? 'Out of Stock' : 'Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Launch New Product</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Product Name" className="glass-input w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })} required />
                                <input type="number" placeholder="Price (₹)" className="glass-input w-full" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" placeholder="Qty" className="glass-input w-full" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} required />
                                <select className="glass-input w-full" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center relative hover:bg-slate-50 transition-colors">
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                {formData.image ? <img src={formData.image} alt="Preview" className="h-32 w-full object-contain mx-auto" /> : <div className="text-slate-400 py-4"><Upload size={32} className="mx-auto mb-2" /><p className="text-sm">Click to upload image</p></div>}
                            </div>
                            <textarea className="glass-input w-full resize-none h-24" placeholder="Description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                                {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Launching...</> : 'Launch Product'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default NewProducts;
