import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react';

const schema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await login(data.email, data.password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-950">
            {/* Left panel - branding */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-300 rounded-full blur-3xl" />
                </div>
                <div className="relative">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                            <Zap size={20} className="text-white" />
                        </div>
                        <span className="text-white font-bold text-xl">ElectroERP</span>
                    </div>
                </div>
                <div className="relative">
                    <h2 className="text-white text-4xl font-bold leading-tight mb-4">
                        Manage Your Electrical Shop{' '}
                        <span className="text-blue-300">Smarter</span>
                    </h2>
                    <p className="text-blue-200 text-lg">
                        Complete ERP solution with billing, inventory, GST tracking, and powerful analytics.
                    </p>
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        {[
                            { label: 'Instant Billing', desc: 'QR + PDF invoices' },
                            { label: 'GST Ready', desc: 'Input & Output tracking' },
                            { label: 'Live Stock', desc: 'Real-time inventory' },
                            { label: 'Analytics', desc: 'Revenue & profit charts' },
                        ].map(item => (
                            <div key={item.label} className="bg-white/10 rounded-xl p-4 border border-white/10">
                                <p className="text-white font-semibold text-sm">{item.label}</p>
                                <p className="text-blue-200 text-xs mt-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="relative text-blue-300/50 text-xs">
                    © 2026 ElectroERP. All rights reserved.
                </p>
            </div>

            {/* Right panel - login form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                            <Zap size={18} className="text-white" />
                        </div>
                        <span className="text-white font-bold text-xl">ElectroERP</span>
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl">
                        <div className="mb-8">
                            <h1 className="text-white text-2xl font-bold">Sign In</h1>
                            <p className="text-slate-400 text-sm mt-1">Enter your credentials to continue</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="admin@electroerp.com"
                                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                                {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        {...register('password')}
                                        type={showPwd ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd(o => !o)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                    >
                                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 size={16} className="animate-spin" />}
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                            <p className="text-slate-400 text-xs text-center">Demo credentials</p>
                            <p className="text-slate-300 text-xs text-center mt-1">
                                <span className="text-blue-400">admin@electroerp.com</span> / <span className="text-blue-400">Admin@123</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
