import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, TrendingDown, ShoppingCart, Package,
    AlertTriangle, Truck, ArrowRight, IndianRupee, Receipt,
    Activity, ShieldCheck, Zap, BarChart3, PieChart as PieIcon,
    Layers, Users, Calendar, Globe, Database
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);
const fmtRs = (n) => `₹${fmt(n)}`;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function StatCard({ title, value, sub, icon: Icon, trend, color = 'blue' }) {
    const config = {
        blue: { from: 'from-blue-600', to: 'to-blue-800', light: 'bg-blue-50', text: 'text-blue-600', shadow: 'shadow-blue-600/10' },
        green: { from: 'from-emerald-600', to: 'to-emerald-800', light: 'bg-emerald-50', text: 'text-emerald-600', shadow: 'shadow-emerald-600/10' },
        yellow: { from: 'from-amber-600', to: 'to-amber-800', light: 'bg-amber-50', text: 'text-amber-600', shadow: 'shadow-amber-600/10' },
        red: { from: 'from-red-600', to: 'to-red-800', light: 'bg-red-50', text: 'text-red-600', shadow: 'shadow-red-600/10' },
        purple: { from: 'from-indigo-600', to: 'to-indigo-800', light: 'bg-indigo-50', text: 'text-indigo-600', shadow: 'shadow-indigo-600/10' },
    }[color] || { from: 'from-slate-600', to: 'to-slate-800', light: 'bg-slate-50', text: 'text-slate-600', shadow: 'shadow-slate-600/10' };

    return (
        <div className="group bg-white rounded-[2.5rem] border border-slate-50 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${config.light} ${config.text} group-hover:scale-110 transition-transform`}>
                        <Icon size={20} />
                    </div>
                    {trend !== undefined && (
                        <div className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-widest flex items-center gap-1 ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h3>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900 tracking-tighter">{value}</span>
                    </div>
                    {sub && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter opacity-70">{sub}</p>}
                </div>
            </div>
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-150 transition-all duration-500 pointer-events-none`}>
                <Icon size={120} />
            </div>
        </div>
    );
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [statsRes, chartRes, topRes, catRes] = await Promise.all([
                    api.get('/reports/dashboard'),
                    api.get('/reports/sales-chart?days=30'),
                    api.get('/reports/top-products?limit=5&days=30'),
                    api.get('/reports/category-revenue?days=30'),
                ]);
                setStats(statsRes.data.data);
                setChartData(chartRes.data.data.map(d => ({
                    date: d._id,
                    revenue: d.revenue,
                    profit: d.profit,
                })));
                setTopProducts(topRes.data.data);
                setCategoryData(catRes.data.data.filter(c => c.categoryName));
            } catch (err) {
                toast.error('Failed to anchor dashboard sequence');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const statCards = stats ? [
        {
            title: "Daily Inflow",
            value: fmtRs(stats.today.revenue),
            sub: `${stats.today.bills} FINALIZED SESSIONS`,
            icon: IndianRupee, color: 'blue',
        },
        {
            title: "Yield Extraction",
            value: fmtRs(stats.today.profit),
            sub: 'NET APPRECIATION TODAY',
            icon: Zap, color: 'green',
        },
        {
            title: "Cyclical Revenue",
            value: fmtRs(stats.month.revenue),
            sub: `${stats.month.bills} MONTHLY SESSIONS`,
            icon: Activity, color: 'purple',
            trend: stats.revenueGrowth,
        },
        {
            title: "External Dues",
            value: fmtRs(stats.suppliers.totalDue),
            sub: `${stats.suppliers.dueCount} PARTNER VECTORS`,
            icon: Truck, color: 'yellow',
        },
        {
            title: "Resource Depletion",
            value: stats.inventory.lowStockCount,
            sub: `OF ${stats.inventory.totalProducts} IDENTIFIERS`,
            icon: AlertTriangle, color: stats.inventory.lowStockCount > 0 ? 'red' : 'green',
        },
        {
            title: "Credit Latency",
            value: stats.pendingBillsCount,
            sub: 'UNFINALIZED TRANSMISSIONS',
            icon: Receipt, color: 'red',
        },
    ] : [];

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            {/* Elite Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
                            <ShieldCheck size={20} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">SENTHIL MURUGAN ELECTRICALS</h1>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] ml-13 flex items-center gap-2">
                        <Globe size={12} className="text-blue-600" /> Authorized Surveillance Terminal <span className="text-slate-200">|</span> {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/billing')}
                    className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-slate-900/40 active:scale-95 group"
                >
                    <ShoppingCart size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
                    Initialize POS Session
                </button>
            </div>

            {/* Surveillance Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {loading
                    ? Array(6).fill(0).map((_, i) => (
                        <div key={i} className="rounded-[2.5rem] bg-white border border-slate-50 p-6 shadow-sm h-40">
                            <div className="skeleton h-full w-full rounded-2xl" />
                        </div>
                    ))
                    : statCards.map(card => <StatCard key={card.title} {...card} />)
                }
            </div>

            {/* Analytics Engine */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Evolution - 2/3 */}
                <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-50 shadow-sm p-10 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <BarChart3 size={20} className="text-blue-600" /> Revenue Evolution
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic ml-8">Temporal Transmission Analysis (30D)</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inflow</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Yield</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[280px] w-full relative z-10">
                        {loading ? (
                            <div className="skeleton h-full w-full rounded-[2rem]" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gPro" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="10 10" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={15} />
                                    <YAxis tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                                    <Tooltip
                                        contentStyle={{ background: '#0f172a', borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '1.5rem' }}
                                        itemStyle={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}
                                        labelStyle={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', marginBottom: '0.5rem' }}
                                        formatter={(v, name) => [fmtRs(v), name === 'revenue' ? 'Gross' : 'Net']}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={4} fill="url(#gRev)" name="revenue" />
                                    <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={4} fill="url(#gPro)" name="profit" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                        <WavesIcon />
                    </div>
                </div>

                {/* Sector Allocation - 1/3 */}
                <div className="bg-white rounded-[3rem] border border-slate-50 shadow-sm p-10 flex flex-col group">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3 mb-1">
                        <PieIcon size={20} className="text-blue-600" /> Sector Analysis
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic ml-8 mb-8">Resource Contribution Matrix</p>

                    <div className="flex-1 min-h-[280px]">
                        {loading ? (
                            <div className="skeleton h-full w-full rounded-[2rem]" />
                        ) : categoryData.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-200">
                                <PieIcon size={64} className="mb-4 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Sector Void</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} dataKey="revenue" nameKey="categoryName"
                                        cx="50%" cy="50%" outerRadius={100} innerRadius={60} stroke="none">
                                        {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: '#0f172a', borderRadius: '1.25rem', border: 'none', color: 'white', padding: '1rem' }}
                                        itemStyle={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}
                                        labelStyle={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', marginBottom: '0.25rem' }}
                                        formatter={(v) => fmtRs(v)}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        formatter={(v) => <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter px-2">{v}</span>}
                                        iconType="circle"
                                        iconSize={6}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Performance Ranking */}
            <div className="bg-white rounded-[3rem] border border-slate-50 shadow-sm p-10 overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Layers size={20} className="text-blue-600" /> High-Velocity Assets
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic ml-8">Ranking by Market Penetration (30D)</p>
                    </div>
                    <button onClick={() => navigate('/inventory')} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-all hover:translate-x-1">
                        <span className="text-[10px] font-black uppercase tracking-widest">Access All Assets</span>
                        <ArrowRight size={14} />
                    </button>
                </div>

                <div className="h-[240px] w-full">
                    {loading ? (
                        <div className="space-y-4">
                            {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-12 w-full rounded-2xl" />)}
                        </div>
                    ) : topProducts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-200">
                            <Database size={64} className="mb-4 opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Historical Sequence Data Missing</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical" margin={{ left: 120, right: 20 }}>
                                <CartesianGrid strokeDasharray="10 10" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <YAxis type="category" dataKey="productName" tick={{ fontSize: 10, fontWeight: 900, fill: '#1e293b' }} axisLine={false} tickLine={false} width={110} />
                                <Tooltip
                                    contentStyle={{ background: '#0f172a', borderRadius: '1.25rem', border: 'none', padding: '1.5rem' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}
                                    labelStyle={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', marginBottom: '0.5rem' }}
                                    cursor={{ fill: '#f8fafc', radius: 12 }}
                                    formatter={(v) => [fmtRs(v), 'Valuation']}
                                />
                                <Bar dataKey="totalRevenue" fill="#0f172a" radius={[0, 12, 12, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}

function WavesIcon() {
    return (
        <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        </svg>
    );
}
