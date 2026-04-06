import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { syncProductsFromAPI } from '../utils/productSync';

const AdminDashboard = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncResult(null);
        try {
            const result = await syncProductsFromAPI();
            setSyncResult(result);
            if (result.success) {
                // Dispatch event so other pages know to reload
                window.dispatchEvent(new Event('ri_data_changed'));
            }
        } catch (err) {
            setSyncResult({ success: false, error: err.message });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
            
            {/* API Sync Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <RefreshCw size={80} />
                </div>
                
                <h2 className="text-xl font-bold text-slate-800 mb-2">Product API Sync</h2>
                <p className="text-slate-500 mb-6 max-w-lg italic">
                    Fetch and sync the latest product list from the central API. This will update prices and descriptions while preserving existing images and videos.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`px-8 py-3.5 rounded-xl font-black text-[15px] shadow-lg transition-all flex items-center justify-center gap-2 tracking-wide uppercase ${
                            isSyncing 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                                : 'bg-red-600 text-white hover:bg-black hover:shadow-red-500/20 hover:-translate-y-0.5'
                        }`}
                    >
                        {isSyncing ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                SYNCING DATA...
                            </>
                        ) : (
                            <>
                                <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                                SYNC NOW
                            </>
                        )}
                    </button>

                    {syncResult && (
                        <div className={`flex items-center gap-2.5 px-6 py-3 rounded-xl border animate-fade-in font-bold text-sm ${
                            syncResult.success 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm' 
                                : 'bg-rose-50 text-rose-700 border-rose-100 shadow-sm'
                        }`}>
                            {syncResult.success ? (
                                <>
                                    <CheckCircle size={18} />
                                    SYNC COMPLETE: {syncResult.count} PRODUCTS UPDATED
                                </>
                            ) : (
                                <>
                                    <AlertCircle size={18} />
                                    SYNC FAILED: {syncResult.error}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-8 border border-slate-100">
                <p className="text-gray-600 mb-6">
                    Welcome to the Admin Dashboard. Current system performance overview:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100 shadow-sm group hover:scale-[1.02] transition-transform">
                        <h3 className="font-bold text-red-800 text-xs uppercase tracking-widest mb-1 opacity-60">Total Revenue</h3>
                        <p className="text-3xl font-black text-slate-900 mt-1 italic tracking-tighter">₹4,52,231.89</p>
                    </div>
                    <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 shadow-sm group hover:scale-[1.02] transition-transform">
                        <h3 className="font-bold text-indigo-800 text-xs uppercase tracking-widest mb-1 opacity-60">Active Users</h3>
                        <p className="text-3xl font-black text-slate-900 mt-1 italic tracking-tighter">2,345</p>
                    </div>
                    <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 shadow-sm group hover:scale-[1.02] transition-transform">
                        <h3 className="font-bold text-emerald-800 text-xs uppercase tracking-widest mb-1 opacity-60">New Orders</h3>
                        <p className="text-3xl font-black text-slate-900 mt-1 italic tracking-tighter">12</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

