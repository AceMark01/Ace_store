import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Check, X, Truck, PackageCheck, AlertCircle, Calendar, FileText } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

const CustomerOrder = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('pending'); // pending, approved, dispatched, delivered
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modalAction, setModalAction] = useState(null); // 'dispatch', 'deliver'
    const [formData, setFormData] = useState({ vehicleNo: '', expectedDate: '', proof: '', receivedBy: '' });

    const refreshData = useCallback(async () => {
        const { data, error } = await supabase
            .from('orders')
            .select('*, users!customer_id(first_name)')
            .order('created_at', { ascending: false });
        if (data && !error) {
            const enrichedOrders = data.map(o => ({
                ...o,
                customer_name: o.users?.first_name || 'Unknown User'
            }));
            setOrders(enrichedOrders);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        refreshData();
        window.addEventListener('ri_data_changed', refreshData);
        return () => window.removeEventListener('ri_data_changed', refreshData);
    }, [refreshData]);

    if (user?.role !== 'admin') {
        return <div className="p-10 text-center text-red-500 font-bold">Access Denied: Admin Only</div>;
    }

    const updateStatus = async (orderId, status, extraFields = {}) => {
        const { error } = await supabase.from('orders').update({
            status: status,
            ...extraFields
        }).eq('order_id', orderId);

        if (error) {
            console.error("Failed to update status", error);
        } else {
            refreshData();
        }
    };

    const handleApprove = (id) => updateStatus(id, 'APPROVED');
    // For reject, we could store 'Admin Rejected' somewhere if we had a rejection_reason column. Without it, just statuses.
    const handleReject = (id) => updateStatus(id, 'REJECTED');

    const openDispatchModal = (order) => {
        setSelectedOrder(order);
        setModalAction('dispatch');
        setFormData({ vehicleNo: '', expectedDate: '', proof: '', receivedBy: '' });
    };

    const openDeliverModal = (order) => {
        setSelectedOrder(order);
        setModalAction('deliver');
        setFormData({ vehicleNo: '', expectedDate: '', proof: '', receivedBy: '' });
    };

    const submitModal = async () => {
        if (modalAction === 'dispatch') {
            await updateStatus(selectedOrder.order_id, 'DISPATCHED', {
                dispatch_info: {
                    vehicleNo: formData.vehicleNo,
                    expectedDate: formData.expectedDate,
                    by: user.id
                }
            });
        } else if (modalAction === 'deliver') {
            await updateStatus(selectedOrder.order_id, 'DELIVERED', {
                delivery_info: {
                    proof: formData.proof,
                    receivedBy: formData.receivedBy,
                    by: user.id
                }
            });
        }
        setModalAction(null);
        setSelectedOrder(null);
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

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
                {[
                    { id: 'pending', label: 'Approval Pending' },
                    { id: 'approved', label: 'Dispatch Pending' },
                    { id: 'dispatched', label: 'Delivery Pending' },
                    { id: 'delivered', label: 'Delivered Orders' },
                    { id: 'cancelled', label: 'Cancelled / Rejected' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 capitalize font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-red-50 text-red-600 border-b-2 border-red-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                <div className="space-y-4">
                    {loading ? (
                        <SkeletonLoader type="list" count={5} />
                    ) : (
                        <>
                            {filteredOrders.length === 0 && <p className="text-slate-500">No orders in this status.</p>}
                            {filteredOrders.map(order => (
                                <div key={order.order_id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:flex items-center justify-between group hover:border-red-200 transition-colors">
                                    <div className="mb-4 md:mb-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-bold text-slate-900">{order.order_id}</span>
                                            <span className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-700">
                                            Product ID: <span className="font-medium">{order.product_id}</span> × {order.quantity}
                                        </p>
                                        <p className="text-sm text-slate-700">
                                            Amount: <span className="font-bold">₹{order.amount}</span> ({order.payment_type})
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">Customer: <span className="font-semibold text-slate-700">{order.customer_name || order.customer_id}</span></p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {activeTab === 'pending' && (
                                            <>
                                                <button onClick={() => handleApprove(order.order_id)} className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium border border-green-200 hover:bg-green-100">
                                                    <Check size={16} /> Approve
                                                </button>
                                                <button onClick={() => handleReject(order.order_id)} className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-200 hover:bg-red-100">
                                                    <X size={16} /> Reject
                                                </button>
                                            </>
                                        )}
                                        {activeTab === 'approved' && (
                                            <button onClick={() => openDispatchModal(order)} className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium border border-blue-200 hover:bg-blue-100">
                                                <Truck size={16} /> Dispatch
                                            </button>
                                        )}
                                        {activeTab === 'dispatched' && (
                                            <button onClick={() => openDeliverModal(order)} className="flex items-center gap-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium border border-purple-200 hover:bg-purple-100">
                                                <PackageCheck size={16} /> Mark Delivered
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Modal Overlay */}
            {modalAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">
                            {modalAction === 'dispatch' ? 'Dispatch Order' : 'Confirm Delivery'}
                        </h3>

                        <div className="space-y-4">
                            {modalAction === 'dispatch' && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 block mb-1">Vehicle Number</label>
                                        <input
                                            type="text"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="e.g. MH-12-AB-1234"
                                            value={formData.vehicleNo}
                                            onChange={e => setFormData({ ...formData, vehicleNo: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 block mb-1">Expected Delivery</label>
                                        <input
                                            type="date"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                                            value={formData.expectedDate}
                                            onChange={e => setFormData({ ...formData, expectedDate: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            {modalAction === 'deliver' && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 block mb-1">Received By</label>
                                        <input
                                            type="text"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="Customer Name"
                                            value={formData.receivedBy}
                                            onChange={e => setFormData({ ...formData, receivedBy: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 block mb-1">Proof (Image URL / Note)</label>
                                        <input
                                            type="text"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="URL or Note"
                                            value={formData.proof}
                                            onChange={e => setFormData({ ...formData, proof: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setModalAction(null)} className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                                <button onClick={submitModal} className="flex-1 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Confirm</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerOrder;
