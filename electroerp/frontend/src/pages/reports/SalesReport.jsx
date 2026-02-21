import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, FileText, BarChart3, Filter, Calendar, IndianRupee, PieChart, Activity } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const fmtRs = (n) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0)}`;

export default function SalesReport() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [groupBy, setGroupBy] = useState('day');
    const [range, setRange] = useState({ startDate: '', endDate: '' });

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ groupBy, ...Object.fromEntries(Object.entries(range).filter(([, v]) => v)) });
        api.get(`/reports/sales?${params}`)
            .then(r => setData(r.data.data))
            .catch(() => toast.error('Failed to anchor sales sequence'))
            .finally(() => setLoading(false));
    }, [groupBy, range]);

    const totals = data.reduce((acc, d) => ({
        revenue: acc.revenue + d.revenue,
        profit: acc.profit + d.profit,
        gst: acc.gst + d.totalGST,
        bills: acc.bills + d.billCount,
    }), { revenue: 0, profit: 0, gst: 0, bills: 0 });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Market Intelligence</h1>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
                        Strategic Revenue & Performance Analysis
                    </p>
                </div>
                <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-50 shadow-sm gap-2">
                    <input type="date" value={range.startDate} onChange={e => setRange(r => ({ ...r, startDate: e.target.value }))}
                        className="px-4 py-2 bg-slate-50 border border-transparent rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner" />
                    <input type="date" value={range.endDate} onChange={e => setRange(r => ({ ...r, endDate: e.target.value }))}
                        className="px-4 py-2 bg-slate-50 border border-transparent rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner" />
                    <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-slate-900/10 cursor-pointer transition-all">
                        <option value="day">Daily Flux</option>
                        <option value="month">Monthly Cycle</option>
                    </select>
                </div>
            </div>

            {/* Elite Summary Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Aggregate Revenue', value: fmtRs(totals.revenue), clr: 'bg-blue-600', sub: 'Gross Inflow', icon: IndianRupee },
                    { label: 'Strategic Profit', value: fmtRs(totals.profit), clr: 'bg-emerald-600', sub: 'Net Appreciation', icon: TrendingUp },
                    { label: 'Tax Aggregator', value: fmtRs(totals.gst), clr: 'bg-slate-900', sub: 'GST Custody', icon: PieChart },
                    { label: 'Volume Matrix', value: totals.bills, clr: 'bg-blue-500', sub: 'Transactions', icon: Activity },
                ].map(c => (
                    <div key={c.label} className="bg-white rounded-[2rem] border border-slate-50 shadow-sm p-6 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
                            <p className="text-2xl font-black text-slate-900">{c.value}</p>
                            <div className="mt-6 flex items-center justify-between">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.sub}</span>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg ${c.clr} transform group-hover:scale-110 transition-transform`}>
                                    <c.icon size={14} />
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                    </div>
                ))}
            </div>

            {/* Visual Analytics Engine */}
            <div className="bg-white rounded-[3rem] border border-slate-50 shadow-sm p-10 relative overflow-hidden">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Growth Projection Matrix</h2>
                        <p className="text-[10px] px-1 font-black text-slate-400 uppercase tracking-widest mt-1 italic">Interpreting Revenue vs Profit Yield</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-600/30" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profit</span>
                        </div>
                    </div>
                </div>

                <div className="h-[320px] w-full">
                    {loading ? (
                        <div className="skeleton h-full w-full rounded-[2rem]" />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="vRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="vPro" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="8 8" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="_id"
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={15}
                                />
                                <YAxis
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: '#0f172a',
                                        borderRadius: '1.5rem',
                                        border: 'none',
                                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                                        padding: '1.5rem'
                                    }}
                                    itemStyle={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                    labelStyle={{ fontSize: '12px', fontWeight: 900, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}
                                    formatter={(v) => fmtRs(v)}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={4} fill="url(#vRev)" name="Revenue" />
                                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={4} fill="url(#vPro)" name="Profit" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Tabular Analysis */}
            <div className="bg-white rounded-[3rem] border border-slate-50 shadow-sm overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16} className="text-blue-600" /> Historical Performance Matrix
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/20">
                                <th className="px-10 py-6">Epoch / Period</th>
                                <th className="px-5 py-6 text-center">Transactions</th>
                                <th className="px-5 py-6 text-right">Revenue Load</th>
                                <th className="px-5 py-6 text-right text-red-500">Attrition (Disc)</th>
                                <th className="px-5 py-6 text-right text-amber-500">Tax Custody</th>
                                <th className="px-5 py-6 text-right text-emerald-600">Pure Appreciation</th>
                                <th className="px-10 py-6 text-right">Unit Index</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan={7} className="px-10 py-6"><div className="skeleton h-10 w-full rounded-2xl" /></td></tr>)
                            ) : data.map((row, i) => (
                                <tr key={i} className="group hover:bg-slate-50/30 transition-colors">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all flex items-center justify-center font-black text-[10px] italic">
                                                {row._id.slice(-2)}
                                            </div>
                                            <span className="font-black text-slate-700 tracking-tight">{row._id}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-6 text-center font-black text-slate-500">{row.billCount}</td>
                                    <td className="px-5 py-6 text-right font-black text-blue-600">{fmtRs(row.revenue)}</td>
                                    <td className="px-5 py-6 text-right font-bold text-red-400">{fmtRs(row.discountGiven)}</td>
                                    <td className="px-5 py-6 text-right font-bold text-amber-500">{fmtRs(row.totalGST)}</td>
                                    <td className="px-5 py-6 text-right font-black text-emerald-600">{fmtRs(row.profit)}</td>
                                    <td className="px-10 py-6 text-right">
                                        <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-900 transition-colors">{fmtRs(row.avgBillValue)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && data.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center bg-slate-50/10">
                        <BarChart3 size={48} className="text-slate-100 mb-4" />
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Matrix Void Detected for this Sequence</p>
                    </div>
                )}
            </div>
        </div>
    );
}
