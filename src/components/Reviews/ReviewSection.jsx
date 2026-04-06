import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Plus, ChevronDown, ChevronUp, CloudCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';
import RatingDistribution from './RatingDistribution';
import ReviewForm from './ReviewForm';

const ReviewSection = ({ order }) => {
    const { user } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReviews = () => {
        if (!order?.product_id) return;
        setLoading(true);
        try {
            const localReviews = JSON.parse(localStorage.getItem('localReviews') || '[]');
            const productReviews = localReviews.filter(r => r.product_id === order.product_id);
            
            const users = JSON.parse(localStorage.getItem('ace_store_users') || '[]');
            const usersMap = users.reduce((acc, u) => { acc[u.id] = u; return acc; }, {});

            const formatted = productReviews.map(r => {
                const u = usersMap[r.user_id];
                return {
                    id: r.id,
                    user_name: u?.name || "Anonymous",
                    user_avatar: u?.avatar_url || null,
                    rating: r.rating,
                    date: r.created_at,
                    comment: r.description,
                    is_verified: true,
                    images: r.image_url ? [r.image_url] : [],
                    helpful_count: 0
                };
            });
            setReviews(formatted.sort((a, b) => new Date(b.date) - new Date(a.date)));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, [order?.product_id]);

    const averageRating = reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) : "0.0";

    const distribution = reviews.reduce((acc, current) => {
        acc[current.rating] = (acc[current.rating] || 0) + 1;
        return acc;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    const handleAddReview = async (newReview) => {
        if (!user) return alert("Please log in.");
        setIsSubmitting(true);
        try {
            let imageUrl = null;
            if (newReview.images?.length > 0) {
                imageUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(newReview.images[0]);
                });
            }

            const localReviews = JSON.parse(localStorage.getItem('localReviews') || '[]');
            const reviewObj = {
                id: Date.now(),
                product_id: order.product_id,
                user_id: user.id,
                rating: newReview.rating,
                description: newReview.comment,
                image_url: imageUrl,
                created_at: new Date().toISOString()
            };
            localStorage.setItem('localReviews', JSON.stringify([...localReviews, reviewObj]));
            fetchReviews();
            setShowForm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-8 border-t border-slate-100 pt-8 animate-fade-in text-left">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><MessageSquare className="text-red-500" size={20} /> Reviews</h3>
                    <div className="flex items-center gap-2 mt-1"><StarRating rating={Math.round(averageRating)} size="sm" /><span className="text-sm font-bold text-slate-700">{averageRating} / 5</span><span className="text-xs text-slate-400 font-medium">({reviews.length})</span></div>
                </div>
                {!showForm && <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"><Plus size={16} /> Write Review</button>}
            </div>

            <AnimatePresence>{showForm && <div className="mb-10"><ReviewForm productName={order.product_name} onCancel={() => setShowForm(false)} onSubmit={handleAddReview} /></div>}</AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1"><RatingDistribution ratings={distribution} /></div>
                <div className="lg:col-span-2 space-y-6">
                    {reviews.slice(0, isExpanded ? reviews.length : 2).map((review) => <ReviewCard key={review.id} review={review} />)}
                    {reviews.length > 2 && <button onClick={() => setIsExpanded(!isExpanded)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">{isExpanded ? "Show Less" : `View All ${reviews.length} Reviews`}</button>}
                </div>
            </div>
        </div>
    );
};

export default ReviewSection;
