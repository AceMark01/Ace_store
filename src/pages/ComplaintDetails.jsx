import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
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
        try {
            setLoading(true);
            setError('');

            const { data, error: fetchError } = await supabase
                .from('complaints')
                .select('*, users!customer_id (first_name, email), products!product_id (name)')
                .eq('complaint_id', id)
                .single();

            if (fetchError) throw fetchError;

            if (data) {
                const enriched = {
                    ...data,
                    customer_name: data.users?.first_name || data.users?.email || data.customer_id,
                    product_name: data.products?.name || 'Unknown Product',
                    history: Array.isArray(data.history) ? data.history : []
                };
                setComplaint(enriched);
            } else {
                setError('Complaint not found.');
            }
        } catch (err) {
            console.error("Error fetching complaint details:", err);
            setError('Failed to load complaint details.');
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

    const handleStatusUpdate = async (newStatus) => {
        const newHistory = [...complaint.history, { status: newStatus, at: new Date().toISOString(), by: user.id }];

        const { error: updateError } = await supabase
            .from('complaints')
            .update({
                status: newStatus,
                history: newHistory
            })
            .eq('complaint_id', id);

        if (updateError) {
            console.error("Failed to update status", updateError);
            alert("Failed to update status.");
        } else {
            loadComplaint();
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-fade-in-up p-4">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse"></div>
                    <div className="w-48 h-8 bg-slate-200 rounded animate-pulse"></div>
                </div>
                <SkeletonLoader type="card" count={1} className="w-full h-48" />
                <SkeletonLoader type="stats" count={2} />
            </div>
        );
    }

    if (error || !complaint) {
        return (
            <div className="text-center py-12">
                <div className="text-red-500 mb-4">{error || 'Complaint not found.'}</div>
                <button
                    onClick={() => navigate('/complaints')}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
                >
                    Back to Complaints
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header / Back Button */}
            <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/complaints')}
                        className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 transition-colors text-slate-600 border border-slate-200"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            Ticket #{complaint.complaint_id}
                        </h1>
                    </div>
                </div>

                {/* Admin Actions */}
                <div className="flex gap-2">
                    {complaint.status !== 'RESOLVED' && (
                        <button
                            onClick={() => handleStatusUpdate('RESOLVED')}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                        >
                            <CheckCircle size={18} /> Mark as Resolved
                        </button>
                    )}
                    {complaint.status === 'RESOLVED' && (
                        <button
                            onClick={() => handleStatusUpdate('PENDING')}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 border border-slate-200 shadow-sm rounded-xl font-bold hover:bg-slate-200 transition-colors"
                        >
                            <RefreshCw size={18} /> Re-open Ticket
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Col: Details & Description */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Meta Info */}
                    <div className="glass-panel p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                                <User size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Customer</p>
                                <p className="text-lg font-semibold text-slate-800">{complaint.customer_name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-50 rounded-lg text-red-600">
                                <Package size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Product</p>
                                <p className="text-lg font-semibold text-slate-800">{complaint.product_name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Date Submitted</p>
                                <p className="text-lg font-semibold text-slate-800">{new Date(complaint.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${complaint.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                {complaint.status === 'RESOLVED' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Current Status</p>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-block ${complaint.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                    complaint.status === 'IN-PROGRESS' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                        'bg-amber-100 text-amber-700 border border-amber-200'
                                    }`}>
                                    {complaint.status}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description & Images */}
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Issue Description</h3>
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {complaint.description}
                        </p>

                        {complaint.images && complaint.images.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Attached Attachments</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {complaint.images.map((imgUrl, i) => (
                                        <a key={i} href={imgUrl} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg transition-all">
                                            <img src={imgUrl} alt="Attachment" className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Col: Timeline */}
                <div className="lg:col-span-1 border-l border-slate-200 pl-0 lg:pl-6 max-h-[800px] overflow-y-auto custom-scrollbar">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Clock size={20} className="text-red-500" />
                        Status Timeline
                    </h3>
                    
                    <div className="relative pl-4 border-l-2 border-slate-100 space-y-8 pb-4">
                        {complaint.history.map((event, index) => (
                            <div key={index} className="relative pl-6">
                                <div className={`absolute -left-[27px] top-0 p-1.5 rounded-full border-2 border-white shadow-sm z-10 
                                    ${event.status === 'RESOLVED' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                                    {event.status === 'RESOLVED' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                </div>
                                <div className="flex flex-col bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                    <span className="text-sm font-bold text-slate-800 mb-1">{event.status}</span>
                                    <span className="text-xs text-slate-500 mb-1">{new Date(event.at).toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded w-fit">By User: {event.by}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ComplaintDetails;
