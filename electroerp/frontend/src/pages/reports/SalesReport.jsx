import { useState, useEffect, useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, FileText, BarChart3, Filter,
    Calendar, IndianRupee, PieChart as PieIcon, Activity, Users, Package, Clock
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const fmtRs = (n) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0)}`;
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SalesReport() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    useEffect(() => {
        setLoading(true);
        api.get(`/reports/analytics?days=${days}`)
            .then(r => setAnalytics(r.data.data))
            .catch(() => toast.error('Failed to anchor analytics stream'))
            .finally(() => setLoading(false));
    }, [days]);

    // Generate LeetCode-style horizontal activity data
    const activityGrid = useMemo(() => {
        if (!analytics?.activity) return [];
        
        // Target: Last 26 weeks (~6 months)
        const weeks = 26;
        const totalDays = weeks * 7;
        const grid = [];
        const today = new Date();
        today.setHours(0,0,0,0);

        // Find the start date (most recent Sunday)
        const dayOfWeek = today.getDay();
        const endDate = new Date(today);
        
        for(let i = 0; i < weeks; i++) {
            const week = [];
            for(let j = 0; j < 7; j++) {
                // Calculate back from end date
                const d = new Date(endDate);
                d.setDate(endDate.getDate() - (((weeks - 1 - i) * 7) + (6 - j)));
                const dateStr = d.toISOString().split('T')[0];
                const data = analytics.activity.find(a => a.date === dateStr);
                week.push({
                    date: dateStr,
                    count: data?.count || 0,
                    day: d.toLocaleString('en-us', { weekday: 'short' })
                });
            }
            grid.push(week);
        }
        return grid;
    }, [analytics]);

    if (loading && !analytics) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">Synchronizing Intelligence...</p>
                </div>
            </div>
        );
    }

    const { daily, categories, products, customers } = analytics;

    // Derived Stats
    const totalRev = daily.reduce((acc, d) => acc + d.revenue, 0);
    const totalProfit = daily.reduce((acc, d) => acc + d.profit, 0);
    const avgMargin = totalRev > 0 ? (totalProfit / totalRev * 100).toFixed(1) : 0;

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20 px-4">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Yield Intelligence</h1>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                        Strategic Revenue & Profit Optimization
                    </p>
                </div>
                <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    {[7, 30, 90, 365].map(v => (
                        <button
                            key={v}
                            onClick={() => setDays(v)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${days === v ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
                        >
                            {v === 365 ? '1 Year' : `${v} Days`}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Network Revenue', value: fmtRs(totalRev), icon: IndianRupee, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Strategic Profit', value: fmtRs(totalProfit), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Efficiency Margin', value: `${avgMargin}%`, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Active Reach', value: customers.totalUnique, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all group overflow-hidden relative">
                        <div className="relative z-10">
                            <div className={`w-12 h-12 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform`}>
                                <kpi.icon size={20} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                            <p className="text-3xl font-black text-slate-900">{kpi.value}</p>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-slate-50 rounded-full opacity-40 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Area Chart */}
                <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-slate-50 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Revenue Dynamics</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Temporal Flux of Gross Performance</p>
                        </div>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={daily}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                                <Tooltip
                                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '1.5rem', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}
                                    formatter={(v) => fmtRs(v)}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorProf)" name="Profit" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart */}
                <div className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-sm flex flex-col items-center">
                    <div className="w-full mb-10 text-center">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Resource Allocation</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Category Contribution Index</p>
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categories.length > 0 ? categories : [{categoryName: 'Empty', revenue: 1}]}
                                    dataKey="revenue"
                                    nameKey="categoryName"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                >
                                    {categories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-full mt-6 space-y-2">
                        {categories.slice(0, 4).map((c, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    {c.categoryName || 'Unclassified'}
                                </div>
                                <span className="text-slate-900">{((c.revenue / totalRev) * 100).toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Horizontal Activity Map (LeetCode Style) */}
            <div className="bg-white rounded-[3.5rem] p-12 border border-slate-50 shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 mb-10">
                     <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                        <Calendar size={20} />
                     </div>
                     <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Operational Activity Map</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Yearly Intensity Distribution Matrix</p>
                     </div>
                </div>

                <div className="flex justify-center">
                    <div className="w-full overflow-x-auto pb-6 scrollbar-thin">
                        <div className="flex gap-1.5 min-w-max">
                            {/* Day labels column */}
                            <div className="flex flex-col justify-between py-6 pr-4 text-[8px] font-black text-slate-300 uppercase h-[130px]">
                                <span>Mon</span>
                                <span>Wed</span>
                                <span>Fri</span>
                            </div>
                            
                            {/* The Grid - Weeks as Columns */}
                            {activityGrid.map((week, wIdx) => (
                                <div key={wIdx} className="flex flex-col gap-1.5">
                                    {week.map((day, dIdx) => {
                                        const intensity = day.count;
                                        const opacity = Math.min(intensity * 0.2 + 0.1, 1);
                                        return (
                                            <div 
                                                key={dIdx} 
                                                title={`${day.date}: ${intensity} Transactions`}
                                                className="w-3.5 h-3.5 rounded-[3px] transition-all hover:ring-2 hover:ring-blue-600 cursor-crosshair"
                                                style={{ 
                                                    backgroundColor: intensity > 0 ? '#2563eb' : '#f8fafc',
                                                    opacity: intensity > 0 ? opacity : 1
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                        
                        {/* Month labels footer */}
                        <div className="flex gap-1.5 min-w-max pl-[45px] mt-4">
                             {activityGrid.map((week, wIdx) => {
                                 // Show month name every 4 weeks
                                 if (wIdx % 4 === 0) {
                                     const month = new Date(week[0].date).toLocaleString('default', { month: 'short' });
                                     return <span key={wIdx} className="w-[84px] text-[10px] font-bold text-slate-400 uppercase tracking-widest">{month}</span>;
                                 }
                                 return null;
                             })}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-8 pr-4">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Minimal</span>
                    <div className="flex gap-1">
                        {[0.1, 0.4, 0.7, 1.0].map(o => (
                            <div key={o} className="w-3 h-3 rounded-[2px] bg-blue-600" style={{ opacity: o }} />
                        ))}
                    </div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Peak Load</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Bar Chart */}
                <div className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-sm">
                    <div className="mb-10">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Financial Yields</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Product Contribution vs Realized Gain</p>
                    </div>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={products} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}} width={100} />
                                <Tooltip 
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '1rem' }}
                                    itemStyle={{ fontSize: 10, fontWeight: 900, color: '#fff' }}
                                />
                                <Bar dataKey="profit" fill="#10b981" radius={[0, 10, 10, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Consumer Matrix */}
                <div className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-sm">
                    <div className="mb-10 text-center">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Consumer Matrix</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">CRM Loyalty & Reach Index</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6 items-center">
                        <div className="space-y-6">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 items-center justify-center flex flex-col">
                                <Users size={24} className="text-blue-600 mb-2" />
                                <p className="text-[9px] font-black text-slate-400 uppercase">Named Clients</p>
                                <p className="text-3xl font-black text-slate-900">{customers.distribution.namedBills}</p>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 items-center justify-center flex flex-col">
                                <TrendingUp size={24} className="text-emerald-600 mb-2" />
                                <p className="text-[9px] font-black text-slate-400 uppercase">Avg Value</p>
                                <p className="text-3xl font-black text-slate-900">{fmtRs(totalRev / (daily.length || 1))}</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Auth Integrity</p>
                                <div className="relative w-32 h-32 mx-auto">
                                    <svg viewBox="0 0 36 36" className="w-32 h-32">
                                        <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <path 
                                            className="text-blue-500" 
                                            strokeDasharray={`${(customers.distribution.namedBills / (customers.distribution.totalBills||1)*100).toFixed(0)}, 100`} 
                                            strokeWidth="3" 
                                            strokeLinecap="round" 
                                            stroke="currentColor" 
                                            fill="none" 
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center font-black text-xl">
                                        {((customers.distribution.namedBills / (customers.distribution.totalBills||1))*100).toFixed(0)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
