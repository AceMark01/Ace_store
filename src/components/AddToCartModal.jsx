import React, { useState, useEffect } from 'react';
import { X, Plus, ShoppingCart, Package, Loader2, Tag, AlertCircle, RefreshCw } from 'lucide-react';
import { useCart } from '../context/CartContext';

const AddToCartModal = ({ product, onClose, onAdded }) => {
    const { addToCart } = useCart();
    const [schemes, setSchemes] = useState([]);
    const [qtyStr, setQtyStr] = useState('1');
    const [selectedSchemeId, setSelectedSchemeId] = useState('');
    const [couponInput, setCouponInput] = useState('');
    const [manualScheme, setManualScheme] = useState(null);
    const [loadingSchemes, setLoadingSchemes] = useState(true);
    const [couponError, setCouponError] = useState('');

    useEffect(() => {
        setQtyStr('1'); setSelectedSchemeId(''); setCouponInput(''); setManualScheme(null); setCouponError('');
    }, [product]);

    useEffect(() => {
        const fetchSchemes = () => {
            setLoadingSchemes(true);
            const now = new Date().toISOString().split('T')[0];
            const localSchemes = JSON.parse(localStorage.getItem('localSchemes') || '[]');
            const active = localSchemes.filter(s => s.valid_from <= now && s.valid_to >= now);
            const applicable = active.filter(s => !s.applicable_products || s.applicable_products.length === 0 || s.applicable_products.includes(product.product_id));
            setSchemes(applicable);
            setLoadingSchemes(false);
        };
        if (product) fetchSchemes();
    }, [product]);

    const handleCouponLookup = (code) => {
        if (!code) { setManualScheme(null); setCouponError(''); return; }
        const now = new Date().toISOString().split('T')[0];
        const localSchemes = JSON.parse(localStorage.getItem('localSchemes') || '[]');
        const found = localSchemes.find(s => s.scheme_id === code && s.valid_from <= now && s.valid_to >= now);

        if (!found) {
            setManualScheme(null); setCouponError('Invalid/Expired code');
        } else if (found.applicable_products?.length > 0 && !found.applicable_products.includes(product.product_id)) {
            setManualScheme(null); setCouponError('Not applicable');
        } else {
            setManualScheme(found); setSelectedSchemeId(found.scheme_id); setCouponError('');
        }
    };

    if (!product) return null;

    const parsedQty = parseInt(qtyStr, 10) || 1;
    const gross = product.price * parsedQty;
    const selectedScheme = (manualScheme && manualScheme.scheme_id === selectedSchemeId) ? manualScheme : schemes.find(s => s.scheme_id === selectedSchemeId);
    const discount = selectedScheme ? (gross * selectedScheme.discount_percent / 100) : 0;
    const finalAmount = gross - discount;

    const handleAdd = () => {
        addToCart(product, parsedQty, selectedScheme || null);
        if (onAdded) onAdded();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ShoppingCart size={20} className="text-red-500" /> Add to Cart</h3>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"><X size={18} /></button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <img src={product.image || product.image_url} className="w-16 h-16 rounded-xl object-cover bg-white" onError={e => e.target.src = 'https://placehold.co/100'} />
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800 line-clamp-1">{product.name}</h4>
                            <p className="text-xs text-slate-400 font-mono">{product.product_id}</p>
                            <p className="font-black text-slate-900 mt-1">₹{product.price.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Quantity</label>
                            <input type="number" min="1" value={qtyStr} onChange={e => setQtyStr(e.target.value)} className="glass-input w-full font-bold" />
                        </div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Coupon Code</label>
                            <input list="schemes-list" value={couponInput} onChange={e => { setCouponInput(e.target.value); const m = schemes.find(s => s.scheme_id === e.target.value); if(m) setSelectedSchemeId(m.scheme_id); }} onBlur={() => handleCouponLookup(couponInput)} placeholder="Code..." className="glass-input w-full text-sm" />
                            <datalist id="schemes-list">{schemes.map(s => <option key={s.scheme_id} value={s.scheme_id}>{s.name} ({s.discount_percent}%)</option>)}</datalist>
                        </div>
                    </div>
                    {couponError && <p className="text-[10px] font-bold text-red-500 uppercase px-1">{couponError}</p>}
                    {selectedScheme && !couponError && <p className="text-[10px] font-bold text-emerald-500 uppercase px-1">Applied: {selectedScheme.discount_percent}% Off</p>}

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total</p><p className="text-2xl font-black text-slate-900">₹{finalAmount.toLocaleString()}</p></div>
                        <button onClick={handleAdd} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all">Add to Cart</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddToCartModal;
