import { useEffect, useState, useCallback } from 'react';
import { Search, Download, Eye, XCircle, Filter, FileText, Calendar, User, IndianRupee, ArrowRight, Wallet, CreditCard, Smartphone } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const fmtRs = (n) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n || 0)}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const statusStyles = {
    paid: 'bg-emerald-100 text-emerald-700',
    credit: 'bg-red-100 text-red-700',
    partial: 'bg-amber-100 text-amber-700',
};

const modeIcons = {
    cash: Wallet,
    upi: Smartphone,
    card: CreditCard,
};

export default function BillHistory() {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ total: 0, page: 1 });
    const [filters, setFilters] = useState({ page: 1, limit: 20, search: '', paymentStatus: '' });

    const loadBills = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
            const { data } = await api.get(`/bills?${params}`);
            setBills(data.data);
            setMeta(data.meta || {});
        } catch { toast.error('Failed to load transaction history'); }
        finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { loadBills(); }, [loadBills]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sales Deployment Logs</h1>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
                        {meta.total || 0} recorded transactions
                    </p>
                </div>
                <div className="flex bg-white p-1 rounded-2xl border border-slate-50 shadow-sm">
                    {['', 'paid', 'credit', 'partial'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilters(f => ({ ...f, paymentStatus: s, page: 1 }))}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filters.paymentStatus === s
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {s || 'All States'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[300px] group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        value={filters.search}
                        onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                        placeholder="Search Bill Index, Customer identity or matrix..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-50 rounded-2xl text-sm font-medium shadow-sm focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/50">
                                <th className="px-8 py-5">bill identifier</th>
                                <th className="px-5 py-5 text-center">deployment</th>
                                <th className="px-5 py-5">client entity</th>
                                <th className="px-5 py-5 text-right">valuation</th>
                                <th className="px-5 py-5 text-center">protocol</th>
                                <th className="px-8 py-5 text-right">matrix</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(8).fill(0).map((_, i) => (
                                    <tr key={i}><td colSpan={6} className="px-8 py-4"><div className="skeleton h-12 w-full rounded-2xl" /></td></tr>
                                ))
                            ) : bills.map(bill => (
                                <tr key={bill._id} className="group hover:bg-slate-50/20 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                                <FileText size={16} />
                                            </div>
                                            <p className="font-mono text-xs font-black text-slate-900 uppercase tracking-tighter">{bill.billNumber}</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                            <Calendar size={12} className="text-blue-500" />
                                            {fmtDate(bill.billDate)}
                                        </div>
                                    </td>
                                    <td className="px-5 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                {(bill.customer?.name || 'W')[0]}
                                            </div>
                                            <span className="font-bold text-slate-700">{bill.customer?.name || 'Walk-in Client'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 text-right">
                                        <p className="font-black text-slate-900">{fmtRs(bill.grandTotal)}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Tax Incl: {fmtRs(bill.totalGST)}</p>
                                    </td>
                                    <td className="px-5 py-5 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${statusStyles[bill.paymentStatus]}`}>
                                                {bill.paymentStatus}
                                            </span>
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                                                {(() => {
                                                    const Icon = modeIcons[bill.paymentMode] || Wallet;
                                                    return <Icon size={10} />;
                                                })()}
                                                {bill.paymentMode}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <a href={`/api/bills/${bill._id}/pdf`} target="_blank" rel="noreferrer"
                                            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white hover:shadow-xl transition-all inline-flex active:scale-95">
                                            <Download size={16} />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && bills.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center bg-white">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-4">
                            <XCircle size={32} />
                        </div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Historical Sequence Data Missing</p>
                    </div>
                )}

                {meta.total > filters.limit && (
                    <div className="flex flex-col md:flex-row items-center justify-between px-8 py-6 border-t border-slate-50 bg-slate-50/20 gap-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Syncing: {(filters.page - 1) * filters.limit + 1} – {Math.min(filters.page * filters.limit, meta.total)} <span className="text-slate-200 mx-2">|</span> Universe: {meta.total}
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                                disabled={filters.page <= 1}
                                className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-100 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                            >
                                Revert
                            </button>
                            <button
                                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                                disabled={filters.page * filters.limit >= meta.total}
                                className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white rounded-xl disabled:opacity-40 hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                            >
                                Advance
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
