import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, FileText, IndianRupee, TrendingDown, TrendingUp, Filter } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const fmtRs = (n) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n || 0)}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function SupplierLedger() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [supplier, setSupplier] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [supRes, ledRes] = await Promise.all([
                    api.get(`/suppliers`),
                    api.get(`/suppliers/${id}/ledger`),
                ]);
                const sup = supRes.data.data.find(s => s._id === id);
                setSupplier(sup);
                setEntries(ledRes.data.data);
            } catch { toast.error('Failed to load ledger infrastructure'); }
            finally { setLoading(false); }
        };
        load();
    }, [id]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3.5 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{supplier?.name || 'Partner'} Ledger</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <FileText size={12} /> ID: {id.slice(-6).toUpperCase()}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Statement of Account</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[2rem] p-6 text-white min-w-[280px] shadow-xl shadow-slate-900/20 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Aggregate Outstanding</p>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-black ${supplier?.currentBalance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {fmtRs(Math.abs(supplier?.currentBalance || 0)).replace('₹', '')}
                            </span>
                            <span className="text-xs font-bold text-slate-500">INR</span>
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 text-slate-800/10 group-hover:scale-110 group-hover:text-blue-500/10 transition-transform duration-500">
                        <IndianRupee size={120} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <BookOpen size={16} className="text-blue-600" /> Transaction Timeline
                            </h3>
                            <button className="text-slate-400 hover:text-slate-600">
                                <Filter size={18} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] border-b border-slate-50">
                                        <th className="px-8 py-5">Date</th>
                                        <th className="px-5 py-5 text-center">Type</th>
                                        <th className="px-5 py-5">Reference</th>
                                        <th className="px-5 py-5 text-right">Debit</th>
                                        <th className="px-5 py-5 text-right">Credit</th>
                                        <th className="px-8 py-5 text-right">Running Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        Array(6).fill(0).map((_, i) => <tr key={i}><td colSpan={6} className="px-8 py-4"><div className="skeleton h-12 w-full rounded-2xl" /></td></tr>)
                                    ) : entries.map((e, i) => (
                                        <tr key={i} className="group hover:bg-slate-50/20 transition-colors">
                                            <td className="px-8 py-5 font-bold text-slate-600">{fmtDate(e.createdAt)}</td>
                                            <td className="px-5 py-5 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${e.type === 'payment' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                                        e.type === 'purchase' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                                                    }`}>
                                                    {e.type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-5">
                                                <div className="font-mono text-xs text-slate-400 group-hover:text-blue-500 transition-colors">{e.referenceNo || 'N/A'}</div>
                                                <div className="text-[10px] text-slate-400 truncate max-w-[150px] font-medium mt-1">{e.narration}</div>
                                            </td>
                                            <td className="px-5 py-5 text-right font-black text-red-500">{e.debit > 0 ? fmtRs(e.debit) : '-'}</td>
                                            <td className="px-5 py-5 text-right font-black text-emerald-500">{e.credit > 0 ? fmtRs(e.credit) : '-'}</td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="font-black text-slate-900">{fmtRs(e.balance)}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {!loading && entries.length === 0 && (
                            <div className="py-20 flex flex-col items-center justify-center bg-white">
                                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-4">
                                    <BookOpen size={32} />
                                </div>
                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Zero historical data found</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] border border-slate-50 p-6 space-y-6 shadow-sm">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Performance Metrics</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shadow-sm">
                                        <TrendingDown size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Debits</p>
                                        <p className="font-black text-slate-800">{fmtRs(entries.reduce((s, e) => s + (e.debit || 0), 0))}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm">
                                        <TrendingUp size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Credits</p>
                                        <p className="font-black text-slate-800">{fmtRs(entries.reduce((s, e) => s + (e.credit || 0), 0))}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Last Activity</p>
                                <p className="text-sm font-black">{entries[0] ? fmtDate(entries[0].createdAt) : 'None'}</p>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <BookOpen size={64} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
