import { useState, useEffect } from 'react';
import { Activity, Shield, User, Database, Clock, ChevronLeft, ChevronRight, Search, ListFilter, IndianRupee, ShoppingCart, Truck, Edit } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function ActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const actionIcons = {
        CREATE_BILL: { icon: ShoppingCart, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        CANCEL_BILL: { icon: Database, color: 'text-red-500', bg: 'bg-red-50' },
        CREATE_PURCHASE: { icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50' },
        UPDATE_PRODUCT: { icon: Database, color: 'text-amber-500', bg: 'bg-amber-50' },
        DEFAULT: { icon: Activity, color: 'text-slate-400', bg: 'bg-slate-50' }
    };

    useEffect(() => {
        setLoading(true);
        api.get(`/activity-logs?page=${page}&limit=30`)
            .then(r => {
                setLogs(r.data.data || []);
                setTotal(r.data.meta?.total || 0);
            })
            .catch(() => toast.error('Failed to anchor surveillance logs'))
            .finally(() => setLoading(false));
    }, [page]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Surveillance Logs</h1>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                        Strategic Audit Trail: {total} total security events
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white px-5 py-3 rounded-2xl border border-slate-50 shadow-sm flex items-center gap-3">
                        <Activity size={16} className="text-blue-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Monitoring Active</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-50 shadow-sm overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Shield size={16} className="text-blue-600" /> Security Sequence
                    </h2>
                    <div className="flex items-center gap-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {page} of {Math.ceil(total / 30)}</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/10">
                                <th className="px-10 py-6">Timestamp / Epoch</th>
                                <th className="px-5 py-6">Authority Entity</th>
                                <th className="px-5 py-6">Action / Protocol</th>
                                <th className="px-5 py-6">Target Resource</th>
                                <th className="px-10 py-6">Sequence Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(12).fill(0).map((_, i) => (
                                    <tr key={i}><td colSpan={5} className="px-10 py-5"><div className="skeleton h-10 w-full rounded-2xl" /></td></tr>
                                ))
                            ) : logs.map(log => {
                                const config = actionIcons[log.action] || actionIcons.DEFAULT;
                                return (
                                    <tr key={log._id} className="group hover:bg-slate-50/30 transition-colors">
                                        <td className="px-10 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                    <Clock size={14} />
                                                </div>
                                                <span className="text-xs font-black text-slate-500">{fmtDate(log.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase group-hover:bg-slate-900 group-hover:text-white transition-colors italic">
                                                    {(log.user?.name || 'A')[0]}
                                                </div>
                                                <span className="text-xs font-black text-slate-900 tracking-tight">{log.user?.name || 'Automated System'}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-6">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`p-1.5 rounded-lg ${config.bg} ${config.color} group-hover:scale-110 transition-transform`}>
                                                    <config.icon size={14} />
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>{log.action}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-6">
                                            <div className="flex items-center gap-2">
                                                <Database size={12} className="text-slate-300" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{log.resource}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <p className="text-[10px] font-bold text-slate-400 font-mono truncate max-w-md bg-slate-50/50 p-2 rounded-xl group-hover:bg-white group-hover:text-slate-600 transition-all border border-transparent group-hover:border-slate-100">
                                                {log.details ? JSON.stringify(log.details) : 'NO METADATA REGISTERED'}
                                            </p>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {!loading && logs.length === 0 && (
                    <div className="py-24 flex flex-col items-center justify-center bg-slate-50/10">
                        <Activity size={48} className="text-slate-100 mb-4" />
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Surveillance universe is empty</p>
                    </div>
                )}

                <div className="flex flex-col md:flex-row items-center justify-between px-10 py-8 border-t border-slate-50 bg-slate-50/20 gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Monitoring: {(page - 1) * 30 + 1} – {Math.min(page * 30, total)} <span className="text-slate-200 mx-3">|</span> Integrity Score: 100%
                    </p>
                    <div className="flex gap-4">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-8 py-3 bg-white border border-slate-100 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                        >
                            <ChevronLeft size={14} className="inline mr-2" /> Previous Sequence
                        </button>
                        <button
                            disabled={page * 30 >= total}
                            onClick={() => setPage(p => p + 1)}
                            className="px-8 py-3 bg-slate-900 border border-slate-900 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-30 hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                        >
                            Next Sequence <ChevronRight size={14} className="inline ml-2" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
