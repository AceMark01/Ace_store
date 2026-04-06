import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight } from 'lucide-react';
import { useSearchParams } from "react-router";
import logo from '../assets/acelogo.png';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        const success = await login(username, password);
        setIsSubmitting(false);

        if (success) {
            navigate('/');
        } else {
            setError('Invalid credentials. Please check your email/phone and password.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-red-500/10 rounded-full blur-[100px]" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-pink-500/10 rounded-full blur-[80px]" />
                <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 md:p-10 relative z-10 animate-fade-in-up">
                <div className="text-center mb-10 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl bg-red-600 p-3 shadow-xl shadow-red-500/20 mb-6 group hover:rotate-6 transition-transform duration-300 ring-1 ring-white/20">
                        <img src={logo} alt="Ace Store Logo" className="w-full h-full object-contain brightness-0 invert" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-800 mb-2">Ace Store</h1>
                    <p className="text-slate-500 font-medium">Welcome back! Sign in to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 ml-1">Email Address / Phone Number</label>
                        <div className="relative group">
                            <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="Enter email or phone number"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 ml-1">Password</label>
                        <div className="relative group">
                            <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="Enter password"
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
                        className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium py-3 rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                        {!isSubmitting && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                </form>



                <p className="text-center text-sm text-slate-500 mt-6">
                    New here?{' '}
                    <Link to="/signup" className="text-red-600 font-medium hover:underline">Create an Account</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
