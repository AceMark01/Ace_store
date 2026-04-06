import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, AlertCircle, CheckCircle, Clock, Check, RefreshCw, Image as ImageIcon, Loader2, Calendar, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SkeletonLoader from '../components/SkeletonLoader';

const Complaints = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [expandedComplaint, setExpandedComplaint] = useState(null);

    const [description, setDescription] = useState('');
    const [productId, setProductId] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const loadData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Load Products from API
            const response = await fetch(import.meta.env.VITE_API_URL);
            const data = await response.json();
            if (data.status === "200" && data.DataRec) {
                const apiProducts = data.DataRec.map(p => ({
                    product_id: `API-${p.ProductID}`,
                    name: p.ProductName,
                    category: p.SubCat || p.ProdGroup || 'General'
                }));
                setProducts(apiProducts);

                // Load Complaints from LocalStorage
                const localComplaints = JSON.parse(localStorage.getItem('localComplaints') || '[]');
                const filtered = user.role === 'admin' ? localComplaints : localComplaints.filter(c => c.customer_id === user.id);
                
                const enriched = filtered.map(c => {
                    const p = apiProducts.find(pr => pr.product_id === c.product_id);
                    return {
                        ...c,
                        product_name: p?.name || 'Unknown Product',
                        product_category: p?.category || 'General',
                        product_image: 'https://placehold.co/400?text=Product'
                    };
                });
                setComplaints(enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!productId || !description) return;
        setIsSubmitting(true);
        try {
            const localComplaints = JSON.parse(localStorage.getItem('localComplaints') || '[]');
            const newComplaint = {
                complaint_id: "C" + Date.now().toString().slice(-6),
                customer_id: user.id,
                product_id: productId,
                description: description,
                images: imagePreview ? [imagePreview] : [],
                status: "PENDING",
                created_at: new Date().toISOString(),
                history: [{ status: "PENDING", at: new Date().toISOString(), by: user.id }]
            };
            localStorage.setItem('localComplaints', JSON.stringify([...localComplaints, newComplaint]));
            setDescription(''); setProductId(''); setImagePreview(null); setShowForm(false);
            loadData();
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (s) => {
        switch (s) {
            case 'RESOLVED': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'IN-PROGRESS': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'CANCELLED': return 'bg-slate-100 text-slate-500 border-slate-200';
            default: return 'bg-amber-50 text-amber-600 border-amber-200';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Complaints & Support</h2>
                {user?.role !== 'admin' && <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-red-600 text-white rounded-xl shadow-lg font-bold">{showForm ? 'Cancel' : 'New Ticket'}</button>}
            </div>

            {showForm && (
                <div className="glass-panel p-6 animate-fade-in-down space-y-4">
                    <select className="glass-input w-full" value={productId} onChange={e => setProductId(e.target.value)} required>
                        <option value="">Select Product...</option>
                        {products.map(p => <option key={p.product_id} value={p.product_id}>{p.name} ({p.product_id})</option>)}
                    </select>
                    <textarea className="glass-input w-full h-32 resize-none" placeholder="Describe your issue..." value={description} onChange={e => setDescription(e.target.value)} required />
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center relative hover:bg-slate-50 transition-colors">
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
                        {imagePreview ? <img src={imagePreview} className="h-20 mx-auto rounded" /> : <div className="text-slate-400"><ImageIcon className="mx-auto" /> <p className="text-xs">Attach image</p></div>}
                    </div>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold flex justify-center items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} Submit Ticket</button>
                </div>
            )}

            <div className="space-y-4">
                {loading ? <SkeletonLoader type="list" count={3} /> : complaints.length === 0 ? <p className="text-center py-20 text-slate-500">No support tickets found.</p> :
                    complaints.map(c => (
                        <div key={c.complaint_id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all">
                            <div className="p-5 flex gap-4 cursor-pointer" onClick={() => setExpandedComplaint(expandedComplaint === c.complaint_id ? null : c.complaint_id)}>
                                <div className="w-16 h-16 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0">
                                    <Package size={24} className="text-slate-300" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(c.status)}`}>{c.status}</span><span className="text-xs text-slate-400">#{c.complaint_id}</span></div>
                                    <h3 className="font-bold text-slate-800 truncate">{c.product_name}</h3>
                                    <p className="text-xs text-slate-500 line-clamp-1">{c.description}</p>
                                </div>
                                <div className="self-center">{expandedComplaint === c.complaint_id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                            </div>
                            {expandedComplaint === c.complaint_id && (
                                <div className="p-5 border-t border-slate-50 bg-slate-50/30 space-y-4 animate-fade-in">
                                    <div className="bg-white p-4 rounded-xl border border-slate-100"><p className="text-sm text-slate-700">{c.description}</p></div>
                                    {c.images?.length > 0 && <div className="flex gap-2">{c.images.map((img, i) => <img key={i} src={img} className="w-20 h-20 object-cover rounded-lg border border-slate-200" />)}</div>}
                                    <div className="space-y-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">History</p>
                                        <div className="relative pl-4 border-l border-slate-200 space-y-4 ml-2">
                                            {c.history.map((h, i) => (
                                                <div key={i} className="relative pl-4"><div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-slate-200 border-2 border-white shadow-sm"></div><p className="text-xs font-bold text-slate-800">{h.status}</p><p className="text-[10px] text-slate-400">{new Date(h.at).toLocaleString()}</p></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default Complaints;
