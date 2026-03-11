import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Tag, Calendar, Gift, Plus, X, Check, History, Trash2 } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

const Schemes = () => {
    const { user } = useAuth();
    const [schemes, setSchemes] = useState([]);
    const [products, setProducts] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        discountPercent: '',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: '',
    });

    const [selectedProductIds, setSelectedProductIds] = useState([]);

    const refreshData = async () => {
        const { data: sData } = await supabase.from('schemes').select('*');
        if (sData) setSchemes(sData);

        const { data: pData } = await supabase.from('products').select('*');
        if (pData) setProducts(pData);
        setLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const toggleProductSelection = (pid) => {
        setSelectedProductIds(prev =>
            prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
        );
    };

    const handleDeactivate = async (id) => {
        if (!window.confirm("Are you sure you want to deactivate this scheme? It will move to history.")) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const newValidTo = yesterday.toISOString().split('T')[0];

        await supabase.from('schemes').update({ valid_to: newValidTo }).eq('scheme_id', id);
        refreshData();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.discountPercent || !formData.validTo) return;

        const newScheme = {
            scheme_id: 'S' + Date.now().toString().slice(-4),
            name: formData.name,
            discount_percent: Number(formData.discountPercent),
            valid_from: formData.validFrom,
            valid_to: formData.validTo,
            applicable_products: selectedProductIds
        };

        const { error } = await supabase.from('schemes').insert([newScheme]);
        if (error) {
            console.error("Error creating scheme:", error);
            alert("Error creating scheme");
            return;
        }

        refreshData();
        setIsModalOpen(false);
        setFormData({ name: '', discountPercent: '', validFrom: new Date().toISOString().split('T')[0], validTo: '' });
        setSelectedProductIds([]);
    };

    // Filter Logic
    const today = new Date().toISOString().split('T')[0];
    const activeSchemes = schemes.filter(s => s.valid_to >= today);
    const expiredSchemes = schemes.filter(s => s.valid_to < today);

    const displayedSchemes = showHistory ? expiredSchemes : activeSchemes;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">
                        {showHistory ? 'Scheme History' : 'Active Schemes & Offers'}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {showHistory ? 'Past deals and expired offers' : 'Exclusive deals just for you'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium border ${showHistory ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        <History size={18} /> {showHistory ? 'Show Active' : 'View History'}
                    </button>

                    {user?.role === 'admin' && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition-all font-medium"
                        >
                            <Plus size={18} /> Add Scheme
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <SkeletonLoader type="card" count={3} />
                ) : displayedSchemes.length === 0 ? (
                    <div className="col-span-full text-center py-10">
                        <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Tag size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500">No {showHistory ? 'expired' : 'active'} schemes found.</p>
                    </div>
                ) : (
                    displayedSchemes.map(scheme => (
                        <div key={scheme.scheme_id} className={`relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 group ${showHistory ? 'bg-slate-100 grayscale hover:grayscale-0' : 'bg-gradient-to-br from-red-500 to-rose-600 hover:shadow-xl'}`}>
                            {!showHistory && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>}

                            <div className={`relative p-6 h-full flex flex-col justify-between ${showHistory ? 'text-slate-600' : 'text-white'}`}>
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg ${showHistory ? 'bg-white' : 'bg-white/20 backdrop-blur-md'}`}>
                                                <Gift size={20} className={showHistory ? 'text-slate-400' : 'text-white'} />
                                            </div>
                                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${showHistory ? 'bg-slate-200 text-slate-500' : 'bg-white/20 backdrop-blur-md'}`}>
                                                {showHistory ? 'Expired' : 'Active'}
                                            </span>
                                        </div>
                                        {user?.role === 'admin' && !showHistory && (
                                            <button
                                                onClick={() => handleDeactivate(scheme.scheme_id)}
                                                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                                title="Deactivate Scheme"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <h3 className={`text-2xl font-bold mb-2 ${showHistory ? 'text-slate-800' : ''}`}>{scheme.name}</h3>
                                    <p className={`text-sm mb-4 ${showHistory ? 'text-slate-500' : 'text-white/90'}`}>Get {scheme.discount_percent}% Off on selected products!</p>
                                    <div className="flex flex-wrap gap-1 mb-4 max-h-20 overflow-y-auto custom-scrollbar">
                                        {scheme.applicable_products?.map((pid, idx) => (
                                            <span key={idx} className={`text-[10px] px-2 py-1 rounded ${showHistory ? 'bg-slate-200 text-slate-600' : 'bg-white/10'}`}>{pid}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className={`pt-6 border-t ${showHistory ? 'border-slate-200' : 'border-white/20'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`flex items-center gap-2 text-xs font-medium ${showHistory ? 'text-slate-400' : 'text-white/80'}`}>
                                            <Calendar size={14} />
                                            {/* Extract date part just in case it has time */}
                                            <span>Valid until {scheme.valid_to?.split('T')[0]}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/90 text-slate-800 rounded-xl p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Tag size={16} className="text-red-600" />
                                            <span className="font-bold font-mono tracking-widest">{scheme.scheme_id}</span>
                                        </div>
                                        <span className="text-xs font-bold text-red-600 uppercase">Code</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Scheme Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up flex flex-col max-h-[90vh]">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Add New Scheme</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Configure discount details and applicable products</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">

                                {/* Scheme Name */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Scheme Name</label>
                                    <input
                                        type="text"
                                        className="glass-input w-full"
                                        placeholder="e.g. Monsoon Sale"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* Discount % + Valid To */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Discount %</label>
                                        <input
                                            type="number"
                                            min="1" max="100"
                                            className="glass-input w-full"
                                            placeholder="10"
                                            value={formData.discountPercent}
                                            onChange={e => setFormData({ ...formData, discountPercent: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Valid To</label>
                                        <input
                                            type="date"
                                            className="glass-input w-full"
                                            value={formData.validTo}
                                            onChange={e => setFormData({ ...formData, validTo: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Product Selection */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Applicable Products
                                        </label>
                                        <span className="text-xs text-slate-400">
                                            {selectedProductIds.length === 0
                                                ? 'All products (none selected)'
                                                : `${selectedProductIds.length} selected`}
                                        </span>
                                    </div>

                                    {/* Selected tags */}
                                    {selectedProductIds.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {selectedProductIds.map(pid => {
                                                const p = products.find(pr => pr.product_id === pid);
                                                return (
                                                    <span key={pid} className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                                        {p?.name || pid}
                                                        <button type="button" onClick={() => toggleProductSelection(pid)} className="hover:text-rose-900 transition-colors">
                                                            <X size={11} />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Search input */}
                                    <div className="relative mb-2">
                                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                                        <input
                                            type="text"
                                            placeholder="Search products..."
                                            value={isProductDropdownOpen ? isProductDropdownOpen : ''}
                                            onChange={e => setIsProductDropdownOpen(e.target.value)}
                                            className="w-full pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 placeholder:text-slate-400"
                                        />
                                    </div>

                                    {/* Product list — inline, max height, no overflow */}
                                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                                        {(() => {
                                            const searchVal = typeof isProductDropdownOpen === 'string' ? isProductDropdownOpen.toLowerCase() : '';
                                            const filtered = products.filter(p =>
                                                p.name.toLowerCase().includes(searchVal) ||
                                                p.product_id.toLowerCase().includes(searchVal)
                                            );
                                            if (filtered.length === 0) return (
                                                <div className="py-8 text-center text-sm text-slate-400">No products found</div>
                                            );
                                            return filtered.map(p => (
                                                <div
                                                    key={p.product_id}
                                                    className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors border-b border-slate-100 last:border-0 ${selectedProductIds.includes(p.product_id) ? 'bg-rose-50' : 'hover:bg-slate-50'}`}
                                                    onClick={() => toggleProductSelection(p.product_id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedProductIds.includes(p.product_id) ? 'bg-rose-600 border-rose-600' : 'border-slate-300'}`}>
                                                            {selectedProductIds.includes(p.product_id) && <Check size={10} className="text-white" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800 leading-tight">{p.name}</p>
                                                            <p className="text-xs text-slate-400 font-mono">{p.product_id}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700 flex-shrink-0 ml-2">₹{p.price}</span>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 hover:from-red-700 hover:to-rose-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <Tag size={16} /> Create Scheme
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schemes;
