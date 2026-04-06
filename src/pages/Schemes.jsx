import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tag, Calendar, Gift, Plus, X, Check, History, Trash2 } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

const Schemes = () => {
    const { user } = useAuth();
    const [schemes, setSchemes] = useState([]);
    const [products, setProducts] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        discountPercent: '',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: '',
    });

    const [selectedProductIds, setSelectedProductIds] = useState([]);

    const refreshData = async () => {
        setLoading(true);
        try {
            // Load Schemes from LocalStorage
            const sData = JSON.parse(localStorage.getItem('localSchemes') || '[]');
            setSchemes(sData);

            // Load Products from API
            const response = await fetch('http://eksai12.ddns.net:8786/ek_api/googleAutomation/PriceList.ashx');
            const data = await response.json();
            if (data.status === "200" && data.DataRec) {
                const apiProducts = data.DataRec.map(p => ({
                    product_id: `API-${p.ProductID}`,
                    name: p.ProductName,
                    price: p.NewMRP || 0,
                }));
                setProducts(apiProducts);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const toggleProductSelection = (pid) => {
        setSelectedProductIds(prev =>
            prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
        );
    };

    const handleDeactivate = (id) => {
        if (!window.confirm("Are you sure?")) return;
        const sData = JSON.parse(localStorage.getItem('localSchemes') || '[]');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const newValidTo = yesterday.toISOString().split('T')[0];
        
        const updated = sData.map(s => s.scheme_id === id ? { ...s, valid_to: newValidTo } : s);
        localStorage.setItem('localSchemes', JSON.stringify(updated));
        refreshData();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const sData = JSON.parse(localStorage.getItem('localSchemes') || '[]');
        const newScheme = {
            scheme_id: 'S' + Date.now().toString().slice(-4),
            name: formData.name,
            discount_percent: Number(formData.discountPercent),
            valid_from: formData.validFrom,
            valid_to: formData.validTo,
            applicable_products: selectedProductIds
        };
        localStorage.setItem('localSchemes', JSON.stringify([...sData, newScheme]));
        refreshData();
        setIsModalOpen(false);
        setFormData({ name: '', discountPercent: '', validFrom: new Date().toISOString().split('T')[0], validTo: '' });
        setSelectedProductIds([]);
    };

    const today = new Date().toISOString().split('T')[0];
    const activeSchemes = schemes.filter(s => s.valid_to >= today);
    const expiredSchemes = schemes.filter(s => s.valid_to < today);
    const displayedSchemes = showHistory ? expiredSchemes : activeSchemes;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">{showHistory ? 'Scheme History' : 'Active Schemes & Offers'}</h2>
                    <p className="text-slate-500 text-sm">{showHistory ? 'Past deals' : 'Exclusive deals'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowHistory(!showHistory)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold ${showHistory ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}><History size={18} /> {showHistory ? 'Show Active' : 'View History'}</button>
                    {user?.role === 'admin' && <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl shadow-lg font-bold"><Plus size={18} /> Add Scheme</button>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? <SkeletonLoader type="card" count={3} /> : displayedSchemes.length === 0 ? <p className="col-span-full text-center py-10 text-slate-500">No schemes found.</p> :
                    displayedSchemes.map(s => (
                        <div key={s.scheme_id} className={`p-6 rounded-2xl relative overflow-hidden transition-all duration-300 ${showHistory ? 'bg-slate-100 text-slate-600' : 'bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-xl hover:scale-[1.02]'}`}>
                            <div className="flex justify-between mb-4">
                                <Gift size={24} />
                                {user?.role === 'admin' && !showHistory && <button onClick={() => handleDeactivate(s.scheme_id)} className="text-white/70 hover:text-white"><Trash2 size={18} /></button>}
                            </div>
                            <h3 className="text-2xl font-bold mb-1">{s.name}</h3>
                            <p className="text-white/80 font-medium mb-4">Get {s.discount_percent}% Off!</p>
                            <div className="text-xs space-y-1 mb-4 opacity-80 font-mono">
                                {s.applicable_products?.length > 0 ? <p>Applicable: {s.applicable_products.length} products</p> : <p>Applicable to all products</p>}
                                <p>Valid until {s.valid_to}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 flex justify-between items-center font-bold font-mono">
                                <span className="tracking-widest">{s.scheme_id}</span>
                                <span className="text-[10px] uppercase opacity-60">CODE</span>
                            </div>
                        </div>
                    ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg space-y-6 shadow-2xl animate-fade-in-up overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between"><div><h3 className="text-xl font-bold text-slate-800">New Scheme</h3><p className="text-sm text-slate-500">Configure details</p></div><button onClick={() => setIsModalOpen(false)}><X size={20} /></button></div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input className="glass-input w-full" placeholder="Scheme Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" className="glass-input w-full" placeholder="Discount %" value={formData.discountPercent} onChange={e => setFormData({ ...formData, discountPercent: e.target.value })} required />
                                <input type="date" className="glass-input w-full" value={formData.validTo} onChange={e => setFormData({ ...formData, validTo: e.target.value })} required />
                            </div>
                            <div className="border border-slate-100 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400"><span>Select Products</span><span>{selectedProductIds.length} Selected</span></div>
                                <input className="glass-input w-full text-sm" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar pr-2">
                                    {products.filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                                        <div key={p.product_id} onClick={() => toggleProductSelection(p.product_id)} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${selectedProductIds.includes(p.product_id) ? 'bg-red-50 text-red-700' : 'hover:bg-slate-50'}`}>
                                            <div className={`w-4 h-4 rounded border ${selectedProductIds.includes(p.product_id) ? 'bg-red-600 border-red-600' : 'border-slate-300'}`}></div>
                                            <span className="text-sm font-semibold truncate">{p.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200">Create Scheme</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schemes;
