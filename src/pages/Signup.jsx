import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, User, Lock, Phone, MapPin, ArrowRight, ChevronDown } from 'lucide-react';

const inputClass = "w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-400 text-slate-800";
const labelClass = "text-sm font-medium text-slate-700 ml-1";

const Field = ({ icon: Icon, label, children }) => (
    <div className="space-y-2">
        <label className={labelClass}>{label}</label>
        <div className="relative group">
            <Icon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors pointer-events-none" />
            {children}
        </div>
    </div>
);

const Signup = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roleParam = searchParams.get("role") || "customer";

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        state: '',
        district: '',
        city: '',
        address: '',
        postalCode: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const { fullName, email, password, phone, state, district, city, address, postalCode } = form;
        if (!fullName || !email || !password || !phone || !state || !district || !city || !address || !postalCode) {
            setError('Please fill in all fields.');
            return;
        }

        setIsSubmitting(true);
        const result = await signup({ fullName, email, password, phone, state, district, city, address, postalCode }, roleParam);
        setIsSubmitting(false);

        if (result === true) {
            navigate('/');
        } else {
            setError(result);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-red-500/10 rounded-full blur-[100px]" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-pink-500/10 rounded-full blur-[80px]" />
                <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-lg bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 md:p-10 relative z-10 animate-fade-in-up">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-2">Create Account</h1>
                    <p className="text-slate-500 text-sm">Fill in the details below to get started.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <Field icon={Building2} label="Full Name">
                        <input type="text" className={inputClass} placeholder="Enter your full name" value={form.fullName} onChange={set('fullName')} />
                    </Field>

                    {/* Email */}
                    <Field icon={User} label="Email Address">
                        <input type="email" className={inputClass} placeholder="Your email address" value={form.email} onChange={set('email')} />
                    </Field>

                    {/* Password */}
                    <Field icon={Lock} label="Password">
                        <input type="password" className={inputClass} placeholder="Create a password" value={form.password} onChange={set('password')} />
                    </Field>

                    {/* Phone */}
                    <Field icon={Phone} label="Phone Number">
                        <input type="tel" className={inputClass} placeholder="10-digit mobile number" value={form.phone} onChange={set('phone')} />
                    </Field>

                    {/* Delivery Address Section */}
                    <div className="pt-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex-1 h-px bg-slate-200"></div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <MapPin size={13} /> Delivery Address
                            </span>
                            <div className="flex-1 h-px bg-slate-200"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            {/* State */}
                            <div className="space-y-2">
                                <label className={labelClass}>State</label>
                                <input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-400 text-slate-800" placeholder="State" value={form.state} onChange={set('state')} />
                            </div>
                            {/* District */}
                            <div className="space-y-2">
                                <label className={labelClass}>District</label>
                                <input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-400 text-slate-800" placeholder="District" value={form.district} onChange={set('district')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            {/* City */}
                            <div className="space-y-2">
                                <label className={labelClass}>City</label>
                                <input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-400 text-slate-800" placeholder="City" value={form.city} onChange={set('city')} />
                            </div>
                            {/* Postal Code */}
                            <div className="space-y-2">
                                <label className={labelClass}>Postal Code</label>
                                <input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-400 text-slate-800" placeholder="PIN code" value={form.postalCode} onChange={set('postalCode')} />
                            </div>
                        </div>

                        {/* Full Address */}
                        <div className="space-y-2">
                            <label className={labelClass}>Full Address</label>
                            <textarea
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-400 text-slate-800 resize-none"
                                placeholder="House / Street / Landmark"
                                rows={2}
                                value={form.address}
                                onChange={set('address')}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium py-3 rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group mt-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        <span>{isSubmitting ? 'Creating Account...' : 'Create Account & Sign In'}</span>
                        {!isSubmitting && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-red-600 font-medium hover:underline">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
