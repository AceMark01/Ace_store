import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, X, Truck, PackageCheck, AlertCircle, Calendar, FileText, Package } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

const CustomerOrder = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'pending');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingOrderId, setProcessingOrderId] = useState(null);
    const highlightRef = useRef(null);

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modalAction, setModalAction] = useState(null); 
    const [formData, setFormData] = useState({ vehicleNo: '', expectedDate: '', proof: '', receivedBy: '' });

    const refreshData = useCallback(async () => {
        setLoading(true);
        try {
            // Load Products from API
            const response = await fetch('http://eksai12.ddns.net:8786/ek_api/googleAutomation/PriceList.ashx');
            const data = await response.json();
            let apiProductsMap = {};
            if (data.status === "200" && data.DataRec) {
                data.DataRec.forEach(p => {
                    apiProductsMap[`API-${p.ProductID}`] = {
                        name: p.ProductName,
                        image: 'https://placehold.co/400?text=Product',
                        category: p.SubCat || p.ProdGroup || 'General'
                    };
                });
            }

            // Load Orders from LocalStorage
            const localOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
            const enriched = localOrders.map(o => {
                const p = apiProductsMap[o.product_id] || { name: 'Unknown Product', image: 'https://placehold.co/400?text=Product', category: 'General' };
                return {
                    ...o,
                    product_name: p.name,
                    product_image: p.image,
                    product_category: p.category
                };
            });
            setOrders(enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshData();
        window.addEventListener('ri_data_changed', refreshData);
        return () => window.removeEventListener('ri_data_changed', refreshData);
    }, [refreshData]);

    if (user?.role !== 'admin') return <div className="p-10 text-center text-red-500 font-bold">Access Denied</div>;

    const updateStatus = (orderId, status, extra = {}) => {
        setProcessingOrderId(orderId);
        const localOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
        const updated = localOrders.map(o => o.order_id === orderId ? { ...o, status, updated_at: new Date().toISOString(), ...extra } : o);
        localStorage.setItem('localOrders', JSON.stringify(updated));
        window.dispatchEvent(new Event('ri_data_changed'));
        setProcessingOrderId(null);
    };

    const handleApprove = (id) => updateStatus(id, 'APPROVED');
    const handleReject = (id) => updateStatus(id, 'REJECTED');

    const submitModal = () => {
        const extra = modalAction === 'dispatch' 
            ? { vehicle_num: formData.vehicleNo, expected_delivery: formData.expectedDate }
            : { received_by: formData.receivedBy, note: formData.proof };
        updateStatus(selectedOrder.order_id, modalAction === 'dispatch' ? 'DISPATCHED' : 'DELIVERED', extra);
        setModalAction(null); setSelectedOrder(null);
    };

    const filteredOrders = useMemo(() => {
        switch (activeTab) {
            case 'pending': return orders.filter(o => o.status === 'PENDING');
            case 'approved': return orders.filter(o => o.status === 'APPROVED');
            case 'dispatched': return orders.filter(o => o.status === 'DISPATCHED');
            case 'delivered': return orders.filter(o => o.status === 'DELIVERED');
            case 'cancelled': return orders.filter(o => o.status === 'CANCELLED' || o.status === 'REJECTED');
            default: return [];
        }
    }, [orders, activeTab]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex gap-2 border-b border-slate-100 overflow-x-auto">
                {['pending', 'approved', 'dispatched', 'delivered', 'cancelled'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-3 text-sm font-bold capitalize whitespace-nowrap transition-all ${activeTab === t ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50' : 'text-slate-400'}`}>
                        {t === 'pending' ? 'Approval' : t === 'approved' ? 'Dispatch' : t === 'dispatched' ? 'Delivery' : t} Pending
                    </button>
                ))}
            </div>

            <div className="space-y-5">
                {loading ? <SkeletonLoader type="list" count={3} /> : filteredOrders.length === 0 ? <p className="text-center py-20 text-slate-400">No orders found.</p> :
                    filteredOrders.map(o => (
                        <div key={o.order_id} className="bg-white rounded-2xl border border-slate-100 p-5 md:flex gap-6 items-center hover:shadow-xl transition-all">
                            <img src={o.product_image} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">#{o.order_id} <span className="text-slate-900 font-bold">{o.customer_name}</span></div>
                                <h3 className="font-bold text-slate-800">{o.product_name}</h3>
                                <div className="flex gap-3 text-xs text-slate-500 font-medium"><span>Qty: {o.quantity}</span><span className="text-red-600 font-bold">₹{o.amount.toLocaleString()}</span></div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                {o.status === 'PENDING' && <><button onClick={() => handleApprove(o.order_id)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Approve</button><button onClick={() => handleReject(o.order_id)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">Reject</button></>}
                                {o.status === 'APPROVED' && <button onClick={() => { setSelectedOrder(o); setModalAction('dispatch'); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Dispatch</button>}
                                {o.status === 'DISPATCHED' && <button onClick={() => { setSelectedOrder(o); setModalAction('deliver'); }} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold">Mark Delivered</button>}
                            </div>
                        </div>
                    ))}
            </div>

            {modalAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-sm space-y-6 shadow-2xl animate-fade-in-up">
                        <h3 className="text-xl font-bold text-slate-800 capitalize">{modalAction} Order</h3>
                        {modalAction === 'dispatch' ? (
                            <div className="space-y-4">
                                <input className="glass-input w-full" placeholder="Vehicle No" value={formData.vehicleNo} onChange={e => setFormData({ ...formData, vehicleNo: e.target.value })} />
                                <input type="date" className="glass-input w-full" value={formData.expectedDate} onChange={e => setFormData({ ...formData, expectedDate: e.target.value })} />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <input className="glass-input w-full" placeholder="Received By" value={formData.receivedBy} onChange={e => setFormData({ ...formData, receivedBy: e.target.value })} />
                                <input className="glass-input w-full" placeholder="Note/Proof" value={formData.proof} onChange={e => setFormData({ ...formData, proof: e.target.value })} />
                            </div>
                        )}
                        <div className="flex gap-3"><button onClick={submitModal} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200">Confirm</button><button onClick={() => setModalAction(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerOrder;
