import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Plus, Filter, Package, AlertCircle, Edit3, Trash2, Save, X, Image as ImageIcon, Upload, ShoppingCart, Loader2, Heart } from 'lucide-react';
import AddToCartModal from '../components/AddToCartModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SkeletonLoader from '../components/SkeletonLoader';

const AllProducts = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [likedProducts, setLikedProducts] = useState(new Set());
    const [cartModalProduct, setCartModalProduct] = useState(null);
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'Hardware',
        description: '',
        image: '',
        video_360_url: '',
        stock: 100
    });
    const [imageFile, setImageFile] = useState(null);
    const [imageError, setImageError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState({}); // Tracking carousel indices for cards
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [selectedCustomerProduct, setSelectedCustomerProduct] = useState(null);
    const [visibleCount, setVisibleCount] = useState(12);
    const observerRef = useRef();

    const API_URL = import.meta.env.VITE_API_URL;

    const getOverrides = () => JSON.parse(localStorage.getItem('productMediaOverrides') || '{}');
    const setOverrides = (newOverrides) => localStorage.setItem('productMediaOverrides', JSON.stringify(newOverrides));

    const toggleLike = (e, productId) => {
        e.stopPropagation();
        if (!user) {
            alert("Please login to favorite products.");
            return;
        }

        const next = new Set(likedProducts);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        
        setLikedProducts(next);
        localStorage.setItem(`favorites_${user.id}`, JSON.stringify(Array.from(next)));
    };

    const handleAddToCart = (e, product) => {
        e.stopPropagation();
        setCartModalProduct(product);
    };

    const handleOpenCustomerModal = (product) => {
        setSelectedCustomerProduct(product);
        setIsCustomerModalOpen(true);
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            console.log("Fetching products from API...");
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`API fetch failed: ${response.status}`);
            
            const data = await response.json();
            if (data.status !== "200" || !data.DataRec) {
                throw new Error(`API returned error: ${data.errorMsg || 'Unknown error'}`);
            }

            const apiProducts = data.DataRec;
            const overrides = getOverrides();
            
            // Extract categories
            const cats = new Set(['All']);
            apiProducts.forEach(p => cats.add(p.SubCat || p.ProdGroup || 'General'));
            setCategories(Array.from(cats).sort());

            const formatted = apiProducts.map(p => {
                const id = `API-${p.ProductID}`;
                const override = overrides[id] || {};
                
                // Consolidation of images
                let imgs = [];
                if (override.images && Array.isArray(override.images)) {
                    imgs = override.images;
                } else if (override.image) {
                    imgs = [override.image];
                }

                return {
                    product_id: id,
                    name: p.ProductName,
                    price: p.NewMRP || 0,
                    category: p.SubCat || p.ProdGroup || 'General',
                    images: imgs,
                    mainImage: imgs[0] || '',
                    video_360_url: override.video_360_url || '',
                    description: override.description || `Product Group: ${p.ProdGroup}. Base Group: ${p.BaseGroup}.`,
                    stock: p.Pack || 100
                };
            });

            setProducts(formatted);
            
            if (user) {
                const storedFavs = JSON.parse(localStorage.getItem(`favorites_${user.id}`) || '[]');
                setLikedProducts(new Set(storedFavs));
            }

        } catch (err) {
            console.error("Error loading products:", err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const filteredProducts = useMemo(() => {
        let res = products;
        if (categoryFilter !== 'All') {
            res = res.filter(p => p.category === categoryFilter);
        }
        if (localSearchTerm) {
            const lower = localSearchTerm.toLowerCase();
            res = res.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                (p.product_id && p.product_id.toLowerCase().includes(lower))
            );
        }
        return res;
    }, [products, localSearchTerm, categoryFilter]);

    const productsToDisplay = useMemo(() => {
        return filteredProducts.slice(0, visibleCount);
    }, [filteredProducts, visibleCount]);

    const lastProductRef = useCallback(node => {
        if (loading) return;
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && visibleCount < filteredProducts.length) {
                setVisibleCount(prev => prev + 12);
            }
        });
        if (node) observerRef.current.observe(node);
    }, [loading, visibleCount, filteredProducts.length]);

    useEffect(() => {
        setVisibleCount(12);
    }, [localSearchTerm, categoryFilter]);

    useEffect(() => {
        loadData();
        window.addEventListener('ri_data_changed', loadData);
        return () => window.removeEventListener('ri_data_changed', loadData);
    }, [loadData]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'image/webp' && file.type !== 'image/avif' && file.type !== 'image/jpeg' && file.type !== 'image/png') {
                setImageError('Invalid image format.');
                return;
            }
            setImageError('');
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            const overrides = getOverrides();
            const ov = overrides[product.product_id] || {};
            setFormData({
                name: product.name,
                price: product.price,
                category: product.category,
                description: product.description || '',
                images: ov.images || (ov.image ? [ov.image] : []),
                video_360_url: product.video_360_url || '',
                stock: product.stock !== undefined ? product.stock : 100
            });
        } else {
            setFormData({
                name: '',
                price: '',
                category: 'Hardware',
                description: '',
                images: [],
                video_360_url: '',
                stock: 100
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const overrides = getOverrides();
            overrides[editingProduct.product_id] = {
                images: formData.images,
                video_360_url: formData.video_360_url,
                description: formData.description
            };
            setOverrides(overrides);
            
            setIsModalOpen(false);
            loadData();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Filters */}
            <div className="glass-panel p-3 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={localSearchTerm}
                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                        className="w-full glass-input pl-10"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter size={18} className="text-slate-500" />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="glass-input cursor-pointer min-w-[200px]"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Product Grid / List */}
            {user?.role === 'admin' ? (
                loading ? (
                    <SkeletonLoader type="table" count={5} />
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200">
                                        <th className="px-6 py-3.5 text-sm font-black text-slate-500 uppercase tracking-widest">Product</th>
                                        <th className="px-6 py-3.5 text-sm font-black text-slate-500 uppercase tracking-widest">Category</th>
                                        <th className="px-6 py-3.5 text-sm font-black text-slate-500 uppercase tracking-widest">Price</th>
                                        <th className="px-6 py-3.5 text-sm font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {productsToDisplay.map((product, index) => (
                                        <tr
                                            key={product.product_id}
                                            ref={index === productsToDisplay.length - 1 ? lastProductRef : null}
                                            className="hover:bg-indigo-50/30 transition-all duration-200 cursor-pointer group"
                                        >
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-4">
                                                    {product.images && product.images.length > 0 && (
                                                        <div className="h-10 w-10 rounded-lg shadow-sm overflow-hidden shrink-0 border border-slate-200 bg-white">
                                                            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500" onError={(e) => { e.target.src = 'https://placehold.co/400?text=NA' }} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-sm md:text-base line-clamp-1 group-hover:text-red-600 transition-colors" title={product.name}>{product.name}</div>
                                                        <div className="text-xs text-slate-400 font-mono mt-0.5 bg-slate-100 inline-block px-1.5 py-0.5 rounded">{product.product_id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg uppercase tracking-wider border border-indigo-100 whitespace-nowrap shadow-sm">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="font-black text-slate-800 text-base">₹{product.price?.toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-3 text-right whitespace-nowrap">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenModal(product); }}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:shadow-sm rounded-lg transition-all"
                                                    title="Edit Product"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredProducts.length === 0 && (
                                <div className="text-center py-12 text-slate-500">
                                    No products found.
                                </div>
                            )}
                        </div>
                    </div>
                )
            ) : loading ? (
                <SkeletonLoader type="card" count={8} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            No products found.
                        </div>
                    ) : (
                        productsToDisplay.map((product, index) => (
                            <div
                                key={product.product_id}
                                ref={index === productsToDisplay.length - 1 ? lastProductRef : null}
                                className="glass-card group overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1"
                                onClick={() => handleOpenCustomerModal(product)}
                            >
                                {product.images && product.images.length > 0 && (
                                    <div className="relative h-56 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shrink-0">
                                        <div className="absolute inset-0 flex items-center justify-center p-4">
                                            <img
                                                src={product.images[currentImageIndex[product.product_id] || 0]}
                                                alt={product.name}
                                                className="w-full h-full object-contain transition-all duration-500 group-hover:scale-105"
                                                onError={(e) => { e.target.src = 'https://placehold.co/400?text=Product' }}
                                            />
                                        </div>
                                        
                                        {product.images.length > 1 && (
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 group-hover/card:opacity-100 opacity-60">
                                                {product.images.map((_, i) => (
                                                    <div 
                                                        key={i} 
                                                        className={`w-1.5 h-1.5 rounded-full transition-all ${((currentImageIndex[product.product_id] || 0) === i) ? 'bg-indigo-600 w-3' : 'bg-slate-400'}`}
                                                        onMouseEnter={(e) => { e.stopPropagation(); setCurrentImageIndex({...currentImageIndex, [product.product_id]: i}) }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded shadow-sm z-10 pointer-events-none">
                                            {product.category}
                                        </div>
                                        {product.video_360_url && (
                                            <div className="absolute top-3 left-3 bg-indigo-600/90 backdrop-blur-md text-white text-[10px] uppercase font-black px-2.5 py-1 rounded shadow-lg z-30 shadow-indigo-500/30 flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                                                360 VIEW
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => toggleLike(e, product.product_id)}
                                            className="absolute top-3 right-3 p-2 bg-white/40 hover:bg-white/90 backdrop-blur-sm rounded-full text-slate-500 hover:text-red-500 shadow-sm transition-all z-20"
                                        >
                                            <Heart size={18} className={likedProducts.has(product.product_id) ? 'fill-red-500 text-red-500' : ''} />
                                        </button>
                                    </div>
                                )}
                                <div className="p-5 flex-1 flex flex-col pt-4">
                                    {!product.image && (
                                        <div className="mb-2 bg-slate-50 text-[10px] uppercase font-bold text-slate-400 py-1 px-2.5 rounded border border-slate-100 w-fit">
                                            {product.category}
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight line-clamp-1">{product.name}</h3>
                                    <div className="mb-2"></div>
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-3 leading-relaxed" title={product.description}>
                                        {product.description || 'No additional details available.'}
                                    </p>

                                    <div className="mt-auto flex items-end justify-between pt-1">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                                            <span className="text-xl font-black text-slate-900 tracking-tight">₹{product.price?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => handleAddToCart(e, product)}
                                                className="px-5 py-2 font-bold text-[13px] rounded-lg shadow-sm transition-all bg-indigo-100 text-indigo-700 hover:bg-indigo-200 shadow-indigo-900/5 hover:-translate-y-0.5"
                                            >
                                                Add to cart
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {visibleCount < filteredProducts.length && (
                <div className="flex justify-center py-8">
                    <Loader2 size={32} className="animate-spin text-indigo-500 opacity-50" />
                </div>
            )}

            {/* Manage Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Edit Product Media</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                                <h4 className="font-bold text-slate-800 mb-1">{formData.name}</h4>
                                <p className="text-xs text-slate-500">ID: {editingProduct.product_id}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Product Images (Add Multiple)</label>
                                <div className={`border-2 border-dashed ${imageError ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:bg-slate-50'} rounded-xl p-4 text-center transition-colors relative`}>
                                    <input type="file" accept="image/*" multiple onChange={(e) => {
                                        const files = Array.from(e.target.files);
                                        files.forEach(file => {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setFormData(prev => ({ ...prev, images: [...prev.images, reader.result] }));
                                            };
                                            reader.readAsDataURL(file);
                                        });
                                    }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <div className="flex flex-col items-center justify-center text-slate-400 py-4">
                                        <Upload size={32} className="mb-2" />
                                        <p className="text-sm">Click to upload images</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-2 mt-3">
                                    {formData.images && formData.images.map((img, idx) => (
                                        <div key={idx} className="relative group aspect-square border border-slate-200 rounded-lg overflow-hidden bg-slate-100">
                                            <img src={img} alt="preview" className="w-full h-full object-cover" />
                                            <button 
                                                type="button" 
                                                onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">360 View Video URL</label>
                                <input
                                    type="text"
                                    className="glass-input w-full"
                                    placeholder="https://example.com/360-video.mp4"
                                    value={formData.video_360_url}
                                    onChange={e => setFormData({ ...formData, video_360_url: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Description Override</label>
                                <textarea
                                    className="glass-input w-full h-24 resize-none"
                                    maxLength={300}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all mt-2 flex items-center justify-center gap-2">
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Changes</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Customer Product Details Modal */}
            {isCustomerModalOpen && selectedCustomerProduct && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex justify-center items-center z-50 p-4 overflow-hidden" onClick={() => setIsCustomerModalOpen(false)}>
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fade-in-up flex flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>
                        {/* Gallery Section */}
                        <div className="w-full md:w-3/5 bg-slate-50 relative flex flex-col items-center justify-center border-r border-slate-100 p-6">
                            <button onClick={() => setIsCustomerModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-30 md:hidden"><X size={24} /></button>
                            
                            <div className="w-full h-full max-h-[400px] flex items-center justify-center relative group">
                                {selectedCustomerProduct.video_360_url ? (
                                    <iframe src={selectedCustomerProduct.video_360_url} className="w-full h-full border-none rounded-xl" title="360 View"></iframe>
                                ) : (
                                    <img 
                                        src={selectedCustomerProduct.images[currentImageIndex[selectedCustomerProduct.product_id] || 0]} 
                                        alt={selectedCustomerProduct.name} 
                                        className="max-w-full max-h-full object-contain transition-all duration-300 drop-shadow-xl"
                                    />
                                )}
                            </div>

                            {selectedCustomerProduct.images.length > 1 && (
                                <div className="mt-8 flex items-center gap-3 overflow-x-auto pb-2 px-2 custom-scrollbar no-scrollbar">
                                    {selectedCustomerProduct.images.map((img, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => setCurrentImageIndex({...currentImageIndex, [selectedCustomerProduct.product_id]: idx})}
                                            className={`w-16 h-16 rounded-xl border-2 transition-all p-1 bg-white shrink-0 shadow-sm ${ (currentImageIndex[selectedCustomerProduct.product_id] || 0) === idx ? 'border-indigo-600 scale-110 shadow-indigo-100' : 'border-transparent hover:border-slate-300'}`}
                                        >
                                            <img src={img} className="w-full h-full object-cover rounded-lg" alt={`thumb ${idx}`} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="p-8 md:w-2/5 flex flex-col h-full bg-white relative overflow-y-auto">
                            <button onClick={() => setIsCustomerModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-10 hidden md:block"><X size={20} /></button>
                            
                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 px-2 py-1 bg-indigo-50 w-fit rounded-lg">{selectedCustomerProduct.category}</div>
                            <h2 className="text-3xl font-black text-slate-900 leading-tight mb-2">{selectedCustomerProduct.name}</h2>
                            <div className="text-3xl font-black text-red-600 mb-6">₹{selectedCustomerProduct.price?.toLocaleString()}</div>
                            
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Product Description</h4>
                                <p className="text-slate-600 text-sm leading-relaxed mb-8 whitespace-pre-wrap">
                                    {selectedCustomerProduct.description || "Premium quality product with exceptional durability and design. Crafted to provide the best performance in its category."}
                                </p>
                            </div>

                            <div className="mt-auto space-y-4 pt-6 border-t border-slate-100">
                                <button
                                    onClick={(e) => {
                                        handleAddToCart(e, selectedCustomerProduct);
                                        setIsCustomerModalOpen(false);
                                    }}
                                    className="w-full py-4 font-black text-[15px] uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95"
                                >
                                    <ShoppingCart size={20} /> Add to Cart
                                </button>
                                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">Premium Quality Guaranteed</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <AddToCartModal
                product={cartModalProduct}
                onClose={() => setCartModalProduct(null)}
                onAdded={() => navigate('/place-order', { state: { openCartTab: true } })}
            />
        </div>
    );
};

export default AllProducts;
