import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Users, Building2, Phone, MapPin, ShoppingBag, PackageCheck, XCircle } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

const CustomerDetails = () => {
    const { user } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        // Fetch all non-admin users from Supabase
        const { data: usersData } = await supabase.from('users').select('*').neq('role', 'admin');
        const customersOnly = usersData || [];

        const { data: allOrders } = await supabase.from('orders').select('customer_id, status');
        const orders = allOrders || [];

        // Fetch addresses for all customers
        const customerIds = customersOnly.map(c => c.id);
        const { data: allAddresses } = await supabase.from('user_addresses').select('*').in('user_id', customerIds);
        const addressesMap = {};
        if (allAddresses) {
            allAddresses.forEach(addr => {
                if (addr.is_default || !addressesMap[addr.user_id]) {
                    addressesMap[addr.user_id] = [addr.address_line1, addr.city, addr.address_line2, addr.state].filter(Boolean).join(', ');
                }
            });
        }

        const enriched = customersOnly.map(u => {
            const userOrders = orders.filter(o => o.customer_id === u.id);
            const totalOrders = userOrders.length;
            const completedOrders = userOrders.filter(o => o.status === 'DELIVERED').length;
            const cancelledOrders = userOrders.filter(o => o.status === 'REJECTED' || o.status === 'CANCELLED').length;

            const address = addressesMap[u.id] || '—';

            return {
                id: u.id,
                name: u.first_name || u.email,
                phone: u.phone || '—',
                address,
                totalOrders,
                completedOrders,
                cancelledOrders,
            };
        });

        setCustomers(enriched);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
        window.addEventListener('ri_data_changed', loadData);
        return () => window.removeEventListener('ri_data_changed', loadData);
    }, []);

    if (user?.role !== 'admin') {
        return <div className="p-10 text-center text-red-500 font-bold">Access Denied: Admin Only</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in-up">

            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <SkeletonLoader type="table" count={5} />
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/60">
                                    <th className="px-5 py-4 font-semibold text-slate-800 whitespace-nowrap">
                                        <span className="flex items-center gap-2"><Building2 size={15} /> Company / Name</span>
                                    </th>
                                    <th className="px-5 py-4 font-semibold text-slate-800 whitespace-nowrap">
                                        <span className="flex items-center gap-2"><Phone size={15} /> Phone</span>
                                    </th>
                                    <th className="px-5 py-4 font-semibold text-slate-800 whitespace-nowrap">
                                        <span className="flex items-center gap-2"><MapPin size={15} /> Address</span>
                                    </th>
                                    <th className="px-5 py-4 font-semibold text-slate-800 text-center whitespace-nowrap">
                                        <span className="flex items-center justify-center gap-2"><ShoppingBag size={15} /> Total Orders</span>
                                    </th>
                                    <th className="px-5 py-4 font-semibold text-slate-800 text-center whitespace-nowrap">
                                        <span className="flex items-center justify-center gap-2"><PackageCheck size={15} /> Completed</span>
                                    </th>
                                    <th className="px-5 py-4 font-semibold text-slate-800 text-center whitespace-nowrap">
                                        <span className="flex items-center justify-center gap-2"><XCircle size={15} /> Cancelled</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {customers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-16 text-slate-400">
                                            No customers found.
                                        </td>
                                    </tr>
                                )}
                                {customers.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-800">{c.name}</p>
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">{c.phone}</td>
                                        <td className="px-5 py-4 text-slate-600 max-w-[220px]">
                                            <p className="line-clamp-2">{c.address}</p>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-block bg-slate-100 text-slate-700 font-semibold text-sm px-3 py-1 rounded-full">
                                                {c.totalOrders}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-block bg-emerald-50 text-emerald-700 font-semibold text-sm px-3 py-1 rounded-full border border-emerald-100">
                                                {c.completedOrders}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-block bg-red-50 text-red-600 font-semibold text-sm px-3 py-1 rounded-full border border-red-100">
                                                {c.cancelledOrders}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerDetails;
