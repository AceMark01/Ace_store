import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

const NOTIFICATION_TYPES = {
    success: { color: 'emerald', bgGradient: 'from-emerald-50 to-emerald-100/50', borderColor: 'border-l-emerald-500', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', badgeColor: 'bg-emerald-100 text-emerald-700' },
    warning: { color: 'amber', bgGradient: 'from-amber-50 to-amber-100/50', borderColor: 'border-l-amber-500', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', badgeColor: 'bg-amber-100 text-amber-700' },
    info: { color: 'blue', bgGradient: 'from-blue-50 to-blue-100/50', borderColor: 'border-l-blue-500', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', badgeColor: 'bg-blue-100 text-blue-700' },
    error: { color: 'rose', bgGradient: 'from-rose-50 to-rose-100/50', borderColor: 'border-l-rose-500', iconBg: 'bg-rose-100', iconColor: 'text-rose-600', badgeColor: 'bg-rose-100 text-rose-700' },
};

const STATUS_CONFIG = {
    PENDING: { type: 'info', adminTitle: 'New Order Received', userTitle: 'Order Placed', adminDesc: (o) => `New order ${o.order_id} received from ${o.customer_name}.`, userDesc: (o) => `Your order ${o.order_id} has been placed successfully.`, tab: 'pending' },
    APPROVED: { type: 'success', adminTitle: 'Order Approved', userTitle: 'Order Approved', adminDesc: (o) => `Order ${o.order_id} from ${o.customer_name} has been approved.`, userDesc: (o) => `Your order ${o.order_id} has been approved.`, tab: 'approved' },
    DISPATCHED: { type: 'info', adminTitle: 'Order Dispatched', userTitle: 'Order Dispatched', adminDesc: (o) => `Order ${o.order_id} for ${o.customer_name} has been dispatched.`, userDesc: (o) => `Your order ${o.order_id} has been dispatched.`, tab: 'dispatched' },
    DELIVERED: { type: 'success', adminTitle: 'Order Delivered', userTitle: 'Order Delivered', adminDesc: (o) => `Order ${o.order_id} has been delivered to ${o.customer_name}.`, userDesc: (o) => `Your order ${o.order_id} has been delivered.`, tab: 'delivered' },
    CANCELLED: { type: 'error', adminTitle: 'Order Cancelled', userTitle: 'Order Cancelled', adminDesc: (o) => `Order ${o.order_id} from ${o.customer_name} has been cancelled.`, userDesc: (o) => `Your order ${o.order_id} has been cancelled.`, tab: 'cancelled' },
    REJECTED: { type: 'error', adminTitle: 'Order Rejected', userTitle: 'Order Rejected', adminDesc: (o) => `Order ${o.order_id} from ${o.customer_name} has been rejected.`, userDesc: (o) => `Your order ${o.order_id} has been rejected.`, tab: 'cancelled' },
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [readIds, setReadIds] = useState(() => JSON.parse(localStorage.getItem('ri_read_notifications') || '[]'));
    const [dismissedIds, setDismissedIds] = useState(() => JSON.parse(localStorage.getItem('ri_dismissed_notifications') || '[]'));

    useEffect(() => { localStorage.setItem('ri_read_notifications', JSON.stringify(readIds)); }, [readIds]);
    useEffect(() => { localStorage.setItem('ri_dismissed_notifications', JSON.stringify(dismissedIds)); }, [dismissedIds]);

    const fetchNotifications = useCallback(() => {
        if (!user) return;
        const localOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
        const filteredOrders = user.role === 'admin' ? localOrders : localOrders.filter(o => o.customer_id === user.id);
        
        const orderNotifications = filteredOrders.map(order => {
            const status = order.status || 'PENDING';
            const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
            const nId = `order-${order.order_id}-${status}`;
            return {
                id: nId, orderId: order.order_id, type: config.type,
                title: user.role === 'admin' ? config.adminTitle : config.userTitle,
                message: user.role === 'admin' ? config.adminDesc(order) : config.userDesc(order),
                timestamp: new Date(order.updated_at || order.created_at),
                read: readIds.includes(nId), isDismissed: dismissedIds.includes(nId),
                status, tab: config.tab, customerName: order.customer_name
            };
        }).filter(n => !n.isDismissed);

        setNotifications(orderNotifications.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50));
    }, [user, readIds, dismissedIds]);

    useEffect(() => {
        if (!user) return;
        fetchNotifications();
        window.addEventListener('ri_data_changed', fetchNotifications);
        return () => window.removeEventListener('ri_data_changed', fetchNotifications);
    }, [fetchNotifications, user]);

    const unreadCount = notifications.filter(n => !n.read).length;
    const removeNotification = (id) => setDismissedIds(prev => [...new Set([...prev, id])]);
    const markAsRead = (id) => setReadIds(prev => [...new Set([...prev, id])]);
    const markAllAsRead = () => setReadIds(notifications.map(n => n.id));
    const clearAll = () => setDismissedIds(notifications.map(n => n.id));
    const togglePanel = () => setIsOpen(!isOpen);
    const closePanel = () => setIsOpen(false);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, isOpen, removeNotification, markAsRead, markAllAsRead, clearAll, togglePanel, closePanel, NOTIFICATION_TYPES, fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};