import { useState, useEffect } from 'react';
import { Calendar, Download, FileText, IndianRupee, PieChart, ShieldCheck, TrendingDown, TrendingUp, ChevronDown, Activity } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const fmtRs = (n) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n || 0)}`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function GSTReport() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [summary, setSummary] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get(`/gst/summary?month=${month}&year=${year}`),
            api.get(`/gst/ledger?month=${month}&year=${year}&limit=100`),
        ]).then(([sumRes, ledRes]) => {
            setSummary(sumRes.data.data);
            setLedger(ledRes.data.data);
        }).catch(() => toast.error('Failed to anchor GST data'))
            .finally(() => setLoading(false));
    }, [month, year]);

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tax Protocol Report</h1>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                        GST Surveillance for Fiscal Period {MONTHS[month - 1]} {year}
                    </p>
                </div>
                <div className="flex bg-white p-1.5 rounded-2xl border border-slate-50 shadow-sm gap-1">
                    <div className="relative group">
                        <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
                            className="pl-4 pr-10 py-2.5 bg-slate-50 border border-transparent rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:bg-white focus:border-blue-500 appearance-none transition-all cursor-pointer">
                            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative group">
                        <select value={year} onChange={e => setYear(parseInt(e.target.value))}
                            className="pl-4 pr-10 py-2.5 bg-slate-50 border border-transparent rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:bg-white focus:border-blue-500 appearance-none transition-all cursor-pointer">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-48 rounded-[2.5rem]" />)}
                </div>
            ) : summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Input Tax Credit Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm p-8 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <TrendingDown size={20} />
                                </div>
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Input Tax Credit</h3>
                            </div>
                            <p className="text-3xl font-black text-slate-900">{fmtRs(summary.input?.totalGST || 0)}</p>
                            <div className="mt-8 space-y-2.5 border-t border-slate-50 pt-6">
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                    <span>Taxable Value</span>
                                    <span className="text-slate-900">{fmtRs(summary.input?.totalTaxable)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                    <span>CGST / SGST</span>
                                    <span className="text-slate-900">{fmtRs(summary.input?.totalCGST)} (×2)</span>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                            <ShieldCheck size={80} />
                        </div>
                    </div>

                    {/* Output Tax Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm p-8 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <TrendingUp size={20} />
                                </div>
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Liability (Output)</h3>
                            </div>
                            <p className="text-3xl font-black text-slate-900">{fmtRs(summary.output?.totalGST || 0)}</p>
                            <div className="mt-8 space-y-2.5 border-t border-slate-50 pt-6">
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                    <span>Taxable Value</span>
                                    <span className="text-slate-900">{fmtRs(summary.output?.totalTaxable)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                    <span>Total IGST</span>
                                    <span className="text-slate-900">{fmtRs(summary.output?.totalIGST)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 p-8 opacity-5 group-hover:-rotate-12 transition-transform duration-500">
                            <Activity size={80} />
                        </div>
                    </div>

                    {/* Net Status Card */}
                    <div className={`rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/10 ${(summary.netPayable || 0) > 0 ? 'bg-slate-900' : 'bg-emerald-600'}`}>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6 opacity-60">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <PieChart size={20} />
                                </div>
                                <h3 className="text-[11px] font-black uppercase tracking-widest">Protocol Status</h3>
                            </div>
                            <p className="text-3xl font-black">{fmtRs(Math.abs(summary.netPayable || 0))}</p>
                            <div className="mt-8 space-y-2.5 border-t border-white/10 pt-6">
                                <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                                    {(summary.netPayable || 0) > 0
                                        ? '⚠️ NET TRANSIT PAYABLE TO GOVERNMENT'
                                        : '✅ SURPLUS INPUT CREDIT DETECTED'}
                                </p>
                                <p className="text-[9px] font-medium opacity-40 uppercase tracking-widest">Calculated via Output Protocol − ITC Offset</p>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 p-4 translate-x-1/4 -translate-y-1/4 opacity-10">
                            <IndianRupee size={160} />
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[3rem] border border-slate-50 shadow-sm overflow-hidden mt-8">
                <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Transaction Ledger</h2>
                        <p className="text-[10px] px-1 font-black text-slate-400 uppercase tracking-widest mt-1">GSTR Sequence Matrix — {MONTHS[month - 1]} {year}</p>
                    </div>
                    <button className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-500 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                        <Download size={14} /> Export Protocol
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/20 shadow-inner">
                                <th className="px-10 py-6">Timestamp</th>
                                <th className="px-4 py-6 text-center">Protocol</th>
                                <th className="px-4 py-6">Reference ID</th>
                                <th className="px-4 py-6">Counterparty</th>
                                <th className="px-4 py-6 text-right">Taxable Load</th>
                                <th className="px-4 py-6 text-right">CGST</th>
                                <th className="px-4 py-6 text-right">SGST</th>
                                <th className="px-4 py-6 text-right">IGST</th>
                                <th className="px-10 py-6 text-right">Tax Integrity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {ledger.map((e, i) => (
                                <tr key={i} className="group hover:bg-slate-50/30 transition-colors">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                <Calendar size={14} />
                                            </div>
                                            <span className="text-xs font-black text-slate-600">{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6 text-center">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${e.type === 'OUTPUT' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-blue-50 border-blue-100 text-blue-600'
                                            }`}>
                                            {e.type === 'OUTPUT' ? 'SALE' : 'PURCHASE'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-6">
                                        <div className="font-mono text-[10px] font-black text-slate-400 group-hover:text-slate-900 transition-colors">{e.referenceNo}</div>
                                    </td>
                                    <td className="px-4 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-[8px] font-black text-slate-400 uppercase tracking-tighter border border-slate-100 italic">{(e.party?.name || 'C')[0]}</div>
                                            <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{e.party?.name || 'CASH SALE'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6 text-right font-bold text-slate-400">{fmtRs(e.taxableAmount)}</td>
                                    <td className="px-4 py-6 text-right text-[10px] font-black text-slate-400">{e.cgst > 0 ? fmtRs(e.cgst) : '—'}</td>
                                    <td className="px-4 py-6 text-right text-[10px] font-black text-slate-400">{e.sgst > 0 ? fmtRs(e.sgst) : '—'}</td>
                                    <td className="px-4 py-6 text-right text-[10px] font-black text-slate-400">{e.igst > 0 ? fmtRs(e.igst) : '—'}</td>
                                    <td className="px-10 py-6 text-right font-black text-slate-900">{fmtRs(e.totalGST)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {ledger.length === 0 && !loading && (
                    <div className="py-20 flex flex-col items-center justify-center bg-slate-50/20">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-slate-100 mb-4 shadow-sm">
                            <FileText size={32} />
                        </div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest italic">Zero fiscal events registered for this sequence</p>
                    </div>
                )}
            </div>
        </div>
    );
}
