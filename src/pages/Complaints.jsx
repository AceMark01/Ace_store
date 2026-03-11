import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, AlertCircle, CheckCircle, Clock, Check, RefreshCw, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SkeletonLoader from '../components/SkeletonLoader';

const Complaints = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form
    const [description, setDescription] = useState('');
    const [productId, setProductId] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const loadData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch products for the dropdown (only needed columns)
            const { data: pData } = await supabase.from('products').select('product_id, name').order('name');
            if (pData) setProducts(pData);

            // Fetch complaints
            let query = supabase.from('complaints').select('*').order('created_at', { ascending: false });
            if (user.role !== 'admin') {
                query = query.eq('customer_id', user.id);
            }
            const { data: cData, error } = await query;
            if (!error && cData) {
                const formatted = cData.map(c => ({
                    ...c,
                    history: Array.isArray(c.history) ? c.history : []
                }));
                setComplaints(formatted);
            }
        } catch (err) {
            console.error("Error fetching complaints:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Image must be less than 5MB");
                return;
            }
            setImageFile(file);
        }
    };

    const uploadImage = async (file) => {
        if (!file) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('complaints_images')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('complaints_images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!productId || !description) return;
        setIsSubmitting(true);

        let uploadedImageUrl = null;
        try {
            if (imageFile) {
                uploadedImageUrl = await uploadImage(imageFile);
            }

            const newComplaint = {
                complaint_id: "C" + Date.now().toString().slice(-6),
                customer_id: user.id,
                product_id: productId,
                description: description,
                images: uploadedImageUrl ? [uploadedImageUrl] : [],
                status: "PENDING",
                created_at: new Date().toISOString(),
                history: [{ status: "PENDING", at: new Date().toISOString(), by: user.id }]
            };

            const { error } = await supabase.from('complaints').insert([newComplaint]);

            if (error) {
                alert('Failed to submit complaint. Please try again.');
                console.error(error);
            } else {
                setDescription('');
                setProductId('');
                setImageFile(null);
                setShowForm(false);
                loadData();
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred during submission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        const complaint = complaints.find(c => c.complaint_id === id);
        if (!complaint) return;

        const newHistory = [...complaint.history, { status: newStatus, at: new Date().toISOString(), by: user.id }];

        const { error } = await supabase
            .from('complaints')
            .update({
                status: newStatus,
                history: newHistory
            })
            .eq('complaint_id', id);

        if (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status.");
        } else {
            loadData();
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                {user?.role !== 'admin' && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all font-medium"
                    >
                        {showForm ? 'Cancel' : 'New Complaint'}
                    </button>
                )}
            </div>

            {showForm && user?.role !== 'admin' && (
                <div className="glass-panel p-6 animate-fade-in-down">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Submit a New Complaint</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
                            <select
                                value={productId}
                                onChange={e => setProductId(e.target.value)}
                                className="w-full glass-input"
                                required
                            >
                                <option value="">Select Product...</option>
                                {products.map(p => (
                                    <option key={p.product_id} value={p.product_id}>{p.name} ({p.product_id})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full glass-input h-32 resize-none"
                                placeholder="Please describe your issue..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Attach Image (Optional)</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-red-400 transition-colors bg-white/50">
                                <div className="space-y-2 text-center">
                                    {imageFile ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 mb-2">
                                                <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium">{imageFile.name}</p>
                                            <button type="button" onClick={() => setImageFile(null)} className="text-xs text-red-500 hover:text-red-700 mt-1">Remove</button>
                                        </div>
                                    ) : (
                                        <>
                                            <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                                            <div className="flex text-sm text-slate-600 justify-center">
                                                <label className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none">
                                                    <span>Upload a file</span>
                                                    <input type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-md disabled:opacity-50"
                            >
                                <Send size={18} />
                                <span>{isSubmitting ? 'Submitting...' : 'Submit Ticket'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {loading ? (
                    <SkeletonLoader type="table" count={3} />
                ) : complaints.length === 0 ? (
                    <p className="text-slate-500 text-center py-10">No complaints found.</p>
                ) : (
                    complaints.map(complaint => (
                        <div 
                            key={complaint.complaint_id} 
                            onClick={() => {
                                if (user?.role === 'admin') navigate(`/complaints/${complaint.complaint_id}`);
                            }}
                            className={`glass-card p-6 border-l-4 border-l-transparent transition-all ${user?.role === 'admin' ? 'cursor-pointer hover:border-l-red-500 hover:shadow-md' : ''}`}
                        >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex gap-4">
                                    <div className={`p-3 rounded-full h-fit flex-shrink-0 ${complaint.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {complaint.status === 'RESOLVED' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-800 text-lg">Ticket #{complaint.complaint_id}</h4>
                                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">Prod: {complaint.product_id}</span>
                                        </div>
                                        <p className="text-slate-600 mb-3">{complaint.description}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-400">
                                            <span>Date: {new Date(complaint.created_at).toLocaleDateString()}</span>
                                            {complaint.history.length > 1 && (
                                                <span className="flex items-center gap-1 text-slate-500">
                                                    <Clock size={12} /> Last Update: {new Date(complaint.history[complaint.history.length - 1].at).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${complaint.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        complaint.status === 'IN-PROGRESS' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                            'bg-amber-50 text-amber-600 border border-amber-100'
                                        }`}>
                                        {complaint.status}
                                    </div>

                                    {user?.role === 'admin' && (
                                        <div className="flex gap-2 mt-2">
                                            {/* Status buttons removed from here; admins will manage status in details page */}
                                            <span className="text-sm text-red-600 underline cursor-pointer font-medium mt-2">View Details</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Complaints;

