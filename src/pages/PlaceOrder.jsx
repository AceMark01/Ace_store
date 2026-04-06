import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, CreditCard, Trash2, ShoppingCart, Heart, Package, MapPin, ChevronRight } from 'lucide-react';
import AddToCartModal from '../components/AddToCartModal';
import SkeletonLoader from '../components/SkeletonLoader';

const PlaceOrder = () => {
    const { user } = useAuth();
    const { cart, removeFromCart, updateQty, clearCart } = useCart();
    const location = useLocation();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [activeTab, setActiveTab] = useState('favorites');
    const [cartModalProduct, setCartModalProduct] = useState(null);
    const [address, setAddress] = useState('');
    const [paymentType, setPaymentType] = useState('COD');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const [showAddressModal, setShowAddressModal] = useState(false);

    const [addressFields, setAddressFields] = useState({
        id: null,
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        landmark: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India'
    });

    const API_URL = 'http://eksai12.ddns.net:8786/ek_api/googleAutomation/PriceList.ashx';

    useEffect(() => {
        if (location.state?.openCartTab) setActiveTab('cart');
    }, [location.state]);

    useEffect(() => {
        const loadData = async () => {
            if (user?.id) {
                // Fetch products from API to show favorites
                setLoading(true);
                try {
                    const response = await fetch(API_URL);
                    const data = await response.json();
                    if (data.status === "200" && data.DataRec) {
                        const allApiProducts = data.DataRec.map(p => ({
                            product_id: `API-${p.ProductID}`,
                            name: p.ProductName,
                            price: p.NewMRP || 0,
                            category: p.SubCat || p.ProdGroup || 'General',
                            stock: p.Pack || 100
                        }));
                        
                        const storedFavs = JSON.parse(localStorage.getItem(`favorites_${user.id}`) || '[]');
                        setFavoriteIds(new Set(storedFavs));
                        setProducts(allApiProducts.filter(p => storedFavs.includes(p.product_id)));
                    }
                } catch (err) {
                    console.error("Error loading products in PlaceOrder:", err);
                }

                // Load address from user object or local storage
                if (user.deliveryAddress) {
                    const a = user.deliveryAddress;
                    const addrStr = `${a.address || ''}, ${a.city || ''}, ${a.district || a.state || ''} - ${a.postalCode || ''}`.trim();
                    setAddress(addrStr);
                    setAddressFields({
                        full_name: user.name || '',
                        phone: user.phone || '',
                        address_line1: a.address || '',
                        address_line2: a.district || '',
                        city: a.city || '',
                        state: a.state || '',
                        postal_code: a.postalCode || '',
                        country: 'India'
                    });
                }
            }
            setLoading(false);
        };
        loadData();
    }, [user]);

    const handleSaveAddress = () => {
        if (!addressFields.full_name || !addressFields.phone || !addressFields.address_line1 || !addressFields.city || !addressFields.state || !addressFields.postal_code) {
            alert('Please fill out all required fields.');
            return;
        }

        const mergedAddress = [
            addressFields.address_line1,
            addressFields.address_line2,
            addressFields.landmark,
            addressFields.city,
            addressFields.state,
            addressFields.postal_code
        ].filter(Boolean).join(', ');

        setAddress(mergedAddress);
        setShowAddressModal(false);
    };

    const handleCheckout = (e) => {
        e.preventDefault();
        if (cart.length === 0) return;
        if (!address) {
            alert("Please set a delivery address first.");
            setShowAddressModal(true);
            return;
        }
        
        setIsSubmitting(true);
        
        const existingOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
        
        const newOrders = cart.map((item, index) => ({
            order_id: 'O' + Date.now().toString().slice(-6) + index.toString().padStart(2, '0') + Math.floor(Math.random() * 100),
            customer_id: user.id,
            product_id: item.product.product_id,
            product_name: item.product.name,
            quantity: item.qty,
            amount: item.finalAmount,
            address,
            payment_type: paymentType,
            status: 'PENDING',
            created_at: new Date().toISOString()
        }));

        localStorage.setItem('localOrders', JSON.stringify([...existingOrders, ...newOrders]));
        
        setIsSubmitting(false);
        clearCart();
        alert(`Successfully placed ${cart.length} order(s)!`);
        navigate('/orders');
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.finalAmount, 0);

    const toggleFavorite = (e, productId) => {
        e.stopPropagation();
        const next = new Set(favoriteIds);
        next.delete(productId);
        setFavoriteIds(next);
        localStorage.setItem(`favorites_${user.id}`, JSON.stringify(Array.from(next)));
    };

    const filteredFavorites = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-0 min-h-[calc(100vh-8rem)] animate-fade-in-up">
            <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10">
                <button
                    className={`px-6 py-3.5 font-semibold text-sm transition-all focus:outline-none flex items-center gap-2 border-b-2 ${activeTab === 'favorites' ? 'text-rose-600 border-rose-500' : 'text-slate-400 border-transparent hover:text-slate-700 hover:border-slate-200'}`}
                    onClick={() => setActiveTab('favorites')}
                >
                    <Heart size={16} className={activeTab === 'favorites' ? 'fill-rose-500 text-rose-500' : ''} />
                    My Favorites
                    {products.length > 0 && <span className="text-xs font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{products.length}</span>}
                </button>
                <button
                    className={`px-6 py-3.5 font-semibold text-sm transition-all focus:outline-none flex items-center gap-2 border-b-2 ${activeTab === 'cart' ? 'text-rose-600 border-rose-500' : 'text-slate-400 border-transparent hover:text-slate-700 hover:border-slate-200'}`}
                    onClick={() => setActiveTab('cart')}
                >
                    <ShoppingCart size={16} />
                    Cart
                    {cart.length > 0 && <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'cart' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>{cart.length}</span>}
                </button>
            </div>

            {activeTab === 'favorites' && (
                <div className="pt-6 space-y-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search favorites..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="glass-input pl-9 py-2 text-sm w-full"
                        />
                    </div>

                    {loading ? (
                        <div className="mt-8"><SkeletonLoader type="card" count={4} /></div>
                    ) : filteredFavorites.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                            <Heart size={48} className="text-slate-200 mb-3" />
                            <p className="font-semibold text-slate-500">No favorites yet</p>
                            <button onClick={() => navigate('/all-products')} className="mt-4 text-sm font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1">
                                Browse Catalog <ChevronRight size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredFavorites.map(product => (
                                <div key={product.product_id} className="glass-card group overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1" onClick={() => setCartModalProduct(product)}>
                                    <div className="relative h-52 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shrink-0">
                                        <img src={product.image || 'https://placehold.co/400?text=Product'} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <button onClick={(e) => toggleFavorite(e, product.product_id)} className="absolute top-3 right-3 p-2 bg-white/70 hover:bg-white/90 backdrop-blur-sm rounded-full shadow-sm z-20"><Heart size={16} className="fill-red-500 text-red-500" /></button>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="text-base font-bold text-slate-800 leading-tight line-clamp-1 mb-1">{product.name}</h3>
                                        <div className="mt-auto flex items-end justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                                                <span className="text-xl font-black text-slate-900 tracking-tight">₹{product.price?.toLocaleString()}</span>
                                            </div>
                                            <button disabled={product.stock <= 0} className={`px-4 py-2 font-bold text-[13px] rounded-lg shadow-sm transition-all ${product.stock <= 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 shadow-indigo-900/5 hover:-translate-y-0.5'}`}>
                                                {product.stock <= 0 ? 'Out of Stock' : 'Add to cart'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'cart' && (
                <div className="pt-6 flex flex-col lg:flex-row gap-8 items-start">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <ShoppingCart size={18} className="text-slate-400" /> Cart Items
                            <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{cart.length}</span>
                        </h2>
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <ShoppingBag size={48} className="text-slate-200 mb-4" />
                                <p className="font-semibold text-slate-500">Your cart is empty</p>
                                <button onClick={() => setActiveTab('favorites')} className="mt-4 text-sm font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1">My Favorites <ChevronRight size={14} /></button>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {cart.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 py-4 group">
                                        <img src={item.product.image || 'https://placehold.co/100'} alt={item.product.name} className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-100 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 text-sm truncate">{item.product.name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">₹{item.product.price} / unit</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <input type="number" min="1" value={item.qty} onChange={e => updateQty(item.id, e.target.value)} className="glass-input w-20 text-base font-medium text-center" />
                                        </div>
                                        <div className="text-right flex-shrink-0 min-w-[70px]">
                                            <p className="font-bold text-slate-900">₹{item.finalAmount.toLocaleString()}</p>
                                            <button onClick={() => removeFromCart(item.id)} className="mt-1 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {cart.length > 0 && (
                        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-5 sticky top-24">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Order Summary</h3>
                            <div className="space-y-2 text-sm">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between text-slate-500">
                                        <span className="truncate max-w-[160px]">{item.product.name} × {item.qty}</span>
                                        <span className="font-medium text-slate-700">₹{item.finalAmount.toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between font-bold text-slate-900">
                                    <span>Total</span>
                                    <span>₹{cartTotal.toLocaleString()}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-2"><MapPin size={12} /> Delivery Address</label>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700">{address || "No address selected"}</div>
                                <button onClick={() => setShowAddressModal(true)} className="mt-2 w-full text-sm font-semibold text-rose-600 border border-rose-200 py-2 rounded-lg hover:bg-rose-50 transition">Change Address</button>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Payment</label>
                                <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border w-full bg-slate-900 text-white border-slate-900"><Package size={14} /> COD</button>
                            </div>
                            <button disabled={isSubmitting} onClick={handleCheckout} className={`w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-60 cursor-not-allowed grayscale' : ''}`}>
                                {isSubmitting ? 'Placing Order...' : `Place Order · ₹${cartTotal.toLocaleString()}`}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <AddToCartModal product={cartModalProduct} onClose={() => setCartModalProduct(null)} onAdded={() => { setActiveTab('cart'); }} />

            {showAddressModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
                        <h3 className="text-lg font-bold text-slate-800">Delivery Address</h3>
                        <input placeholder="Full Name *" value={addressFields.full_name} onChange={(e) => setAddressFields({ ...addressFields, full_name: e.target.value })} className="glass-input w-full" />
                        <input placeholder="Phone Number *" value={addressFields.phone} onChange={(e) => setAddressFields({ ...addressFields, phone: e.target.value })} className="glass-input w-full" />
                        <input placeholder="Address Line 1 *" value={addressFields.address_line1} onChange={(e) => setAddressFields({ ...addressFields, address_line1: e.target.value })} className="glass-input w-full" />
                        <input placeholder="Address Line 2 (Optional)" value={addressFields.address_line2} onChange={(e) => setAddressFields({ ...addressFields, address_line2: e.target.value })} className="glass-input w-full" />
                        <div className="grid grid-cols-2 gap-3">
                            <input placeholder="City *" value={addressFields.city} onChange={(e) => setAddressFields({ ...addressFields, city: e.target.value })} className="glass-input w-full" />
                            <input placeholder="State *" value={addressFields.state} onChange={(e) => setAddressFields({ ...addressFields, state: e.target.value })} className="glass-input w-full" />
                        </div>
                        <input placeholder="PIN / Postal Code *" value={addressFields.postal_code} onChange={(e) => setAddressFields({ ...addressFields, postal_code: e.target.value })} className="glass-input w-full" />
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowAddressModal(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-semibold">Cancel</button>
                            <button onClick={handleSaveAddress} className="flex-1 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlaceOrder;
