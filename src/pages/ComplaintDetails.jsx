import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, RefreshCw, User, Package, Calendar } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

const ComplaintDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadComplaint = async () => {
        setLoading(true);
        try {
            // Load Products from API
            const response = await fetch(import.meta.env.VITE_API_URL);
            const data = await response.json();
            let productsMap = {};
            if (data.status === "200" && data.DataRec) {
                data.DataRec.forEach(p => { productsMap[`API-${p.ProductID}`] = p.ProductName; });
            }

            // Load Complaints from LocalStorage
            const localComplaints = JSON.parse(localStorage.getItem('localComplaints') || '[]');
            const found = localComplaints.find(c => c.complaint_id === id);

            if (found) {
                // Find customer name
                const users = JSON.parse(localStorage.getItem('ace_store_users') || '[]');
                const customer = users.find(u => u.id === found.customer_id);
                
                setComplaint({
                    ...found,
                    customer_name: customer?.name || 'Unknown',
                    product_name: productsMap[found.product_id] || 'Unknown Product',
                    history: Array.isArray(found.history) ? found.history : []
                });
            } else {
                setError('Complaint not found.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/complaints');
            return;
        }
        loadComplaint();
    }, [id, user]);

    const handleStatusUpdate = (newStatus) => {
        const localComplaints = JSON.parse(localStorage.getItem('localComplaints') || '[]');
        const updated = localComplaints.map(c => {
            if (c.complaint_id === id) {
                return {
                    ...c,
                    status: newStatus,
                    history: [...(c.history || []), { status: newStatus, at: new Date().toISOString(), by: user.id }]
                };
            }
            return c;
        });
        localStorage.setItem('localComplaints', JSON.stringify(updated));
        loadComplaint();
    };

    if (loading) return <div className="p-10"><SkeletonLoader type="card" count={1} /></div>;
    if (error || !complaint) return <div className="p-10 text-center"><p className="text-red-500 mb-4">{error}</p><button onClick={() => navigate('/complaints')} className="px-4 py-2 bg-slate-800 text-white rounded-lg">Back</button></div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/complaints')} className="p-2 bg-white rounded-full border border-slate-200 text-slate-600"><ArrowLeft size={20} /></button>
                    <h1 className="text-2xl font-bold text-slate-800">Ticket #{complaint.complaint_id}</h1>
                </div>
                <div className="flex gap-2">
                    {complaint.status !== 'RESOLVED' ? (
                        <button onClick={() => handleStatusUpdate('RESOLVED')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold"><CheckCircle size={18} /> Resolve</button>
                    ) : (
                        <button onClick={() => handleStatusUpdate('PENDING')} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"><RefreshCw size={18} /> Re-open</button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4"><div className="p-3 bg-slate-100 rounded-lg"><User size={24} /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Customer</p><p className="font-bold text-slate-800">{complaint.customer_name}</p></div></div>
                        <div className="flex items-center gap-4"><div className="p-3 bg-red-50 rounded-lg text-red-600"><Package size={24} /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Product</p><p className="font-bold text-slate-800">{complaint.product_name}</p></div></div>
                        <div className="flex items-center gap-4"><div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Calendar size={24} /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Date</p><p className="font-bold text-slate-800">{new Date(complaint.created_at).toLocaleDateString()}</p></div></div>
                        <div className="flex items-center gap-4"><div className={`p-3 rounded-lg ${complaint.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{complaint.status === 'RESOLVED' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}</div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Status</p><p className="font-bold text-slate-800">{complaint.status}</p></div></div>
                    </div>
                    <div className="glass-panel p-6"><h3 className="font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Description</h3><p className="text-slate-700 whitespace-pre-wrap">{complaint.description}</p>
                        {complaint.images?.length > 0 && <div className="mt-8">
                            <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Attachments</h3>
                            <div className="flex gap-4">{complaint.images.map((img, i) => <a key={i} href={img} target="_blank" rel="noreferrer"><img src={img} className="w-48 h-48 object-cover rounded-xl border border-slate-100 hover:shadow-lg transition-all" /></a>)}</div>
                        </div>}
                    </div>
                </div>
                <div className="lg:col-span-1 border-l border-slate-100 pl-6 space-y-6"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Clock size={20} className="text-red-500" /> Timeline</h3>
                    <div className="relative pl-4 border-l border-slate-200 space-y-6 ml-2">
                        {complaint.history.map((h, i) => (
                            <div key={i} className="relative pl-4"><div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow ${h.status === 'RESOLVED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><p className="text-sm font-bold text-slate-800">{h.status}</p><p className="text-[10px] text-slate-400">{new Date(h.at).toLocaleString()}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplaintDetails;
