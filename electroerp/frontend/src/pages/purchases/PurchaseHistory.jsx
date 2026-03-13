import { useState, useEffect } from 'react';
import { Plus, Search, ShoppingBag, Calendar, User, FileText, IndianRupee, ArrowRight, Loader2, DollarSign, X, Check } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const fmtRs = (n) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n || 0)}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function PurchaseHistory() {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [suppliers, setSuppliers] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        supplierId: '',
        status: '',
        minAmount: '',
        maxAmount: '',
        search: ''
    });

    const [showModal, setShowModal] = useState(false);
    const [selectedP, setSelectedP] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        paymentAmount: '',
        paymentMode: 'CASH',
        referenceNo: '',
        date: new Date().toISOString().split('T')[0]
    });

    const navigate = useNavigate();

    const load = async (activeFilters = filters) => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            Object.keys(activeFilters).forEach(key => {
                if (activeFilters[key]) query.append(key, activeFilters[key]);
            });
            const res = await api.get(`/purchases?${query.toString()}`);
            setPurchases(res.data.data || []);
        } catch { toast.error('Failed to load purchase history'); }
        finally { setLoading(false); }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { 
        load(); 
        fetchSuppliers();
    }, []);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const runSearch = () => {
        load(filters);
    };

    const resetFilters = () => {
        const reset = {
            startDate: '',
            endDate: '',
            supplierId: '',
            status: '',
            minAmount: '',
            maxAmount: '',
            search: ''
        };
        setFilters(reset);
        load(reset);
    };

    const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

    const openPaymentModal = (purchase) => {
        setSelectedP(purchase);
        setPaymentForm({
            paymentAmount: purchase.amountDue,
            paymentMode: 'CASH',
            referenceNo: '',
            date: new Date().toISOString().split('T')[0]
        });
        setShowModal(true);
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post(`/purchases/${selectedP._id}/payments`, paymentForm);
            toast.success('Protocol Adjusted: Payment Synchronized');
            setShowModal(false);
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Payment failure');
        } finally { setSubmitting(false); }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Purchase Logs</h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {purchases.length} recorded acquisitions
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`group flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all border relative ${showFilters ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300 shadow-sm'}`}
                    >
                        <Search size={18} className={showFilters ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-500'} /> 
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-black shadow-lg">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => navigate('/purchases/new')}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl text-sm font-bold shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]"
                    >
                        <Plus size={18} /> New Order
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/40 space-y-6 animate-in slide-in-from-top-4 duration-300 overflow-visible relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] opacity-40">System Extraction Parameters</h2>
                            {activeFilterCount > 0 && (
                                <button onClick={resetFilters} className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">
                                    <X size={10} /> Clear Data
                                </button>
                            )}
                        </div>
                        <button onClick={() => setShowFilters(false)} className="text-slate-300 hover:text-red-500 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-end">
                        {/* Transaction Search */}
                        <div className="space-y-2 lg:col-span-3">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Transaction Ref.</label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={14} />
                                <input
                                    value={filters.search}
                                    onChange={e => handleFilterChange('search', e.target.value)}
                                    onKeyUp={e => e.key === 'Enter' && runSearch()}
                                    placeholder="PUR-xxxx or INV..."
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        {/* Supplier Filter */}
                        <div className="space-y-2 lg:col-span-3">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Supplier Entity</label>
                            <select
                                value={filters.supplierId}
                                onChange={e => { handleFilterChange('supplierId', e.target.value); runSearch(); }}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">All Entities</option>
                                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-2 lg:col-span-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Protocol Status</label>
                            <select
                                value={filters.status}
                                onChange={e => { handleFilterChange('status', e.target.value); runSearch(); }}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">All Statuses</option>
                                <option value="paid">PAID</option>
                                <option value="partial">PARTIAL</option>
                                <option value="credit">CREDIT</option>
                            </select>
                        </div>

                        {/* Val Range - Min */}
                        <div className="space-y-2 lg:col-span-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Min Val.</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={filters.minAmount}
                                onChange={e => handleFilterChange('minAmount', e.target.value)}
                                onKeyUp={e => e.key === 'Enter' && runSearch()}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                            />
                        </div>

                        {/* Val Range - Max */}
                        <div className="space-y-2 lg:col-span-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Max Val.</label>
                            <input
                                type="number"
                                placeholder="Any"
                                value={filters.maxAmount}
                                onChange={e => handleFilterChange('maxAmount', e.target.value)}
                                onKeyUp={e => e.key === 'Enter' && runSearch()}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                            />
                        </div>

                        {/* Date Range Start */}
                        <div className="space-y-2 lg:col-span-3">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Temporal From</label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-blue-500 transition-colors" size={14} />
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={e => handleFilterChange('startDate', e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Date Range End */}
                        <div className="space-y-2 lg:col-span-3">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Temporal To</label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-blue-500 transition-colors" size={14} />
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={e => handleFilterChange('endDate', e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Search Button */}
                        <div className="lg:col-span-6 flex items-end">
                            <button 
                                onClick={runSearch}
                                className="w-full bg-slate-900 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <Search size={14} className="text-blue-400" />
                                Initiate Filtered Extraction
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[2rem] border border-slate-50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/50">
                                <th className="px-8 py-5">transaction code</th>
                                <th className="px-5 py-5 text-center">timestamp</th>
                                <th className="px-5 py-5">supplier entity</th>
                                <th className="px-5 py-5 text-right">valuation</th>
                                <th className="px-5 py-5 text-center">status</th>
                                <th className="px-8 py-5 text-right">control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <tr key={i}><td colSpan={6} className="px-8 py-4"><div className="skeleton h-12 w-full rounded-2xl" /></td></tr>
                                ))
                            ) : purchases.map(p => (
                                <tr key={p._id} className="group hover:bg-slate-50/20 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                <ShoppingBag size={18} />
                                            </div>
                                            <div>
                                                <p className="font-mono text-xs font-black text-slate-900">{p.purchaseNumber}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">INV: {p.supplierInvoiceNo || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-slate-500 font-bold text-xs uppercase">
                                            <Calendar size={12} className="text-slate-300" />
                                            {fmtDate(p.purchaseDate)}
                                        </div>
                                    </td>
                                    <td className="px-5 py-5">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-slate-300" />
                                            <span className="font-bold text-slate-700">{p.supplier?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 text-right">
                                        <div className="space-y-0.5">
                                            <p className="font-black text-slate-900">{fmtRs(p.grandTotal)}</p>
                                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">GST: {fmtRs(p.totalGST)}</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                            p.paymentStatus === 'credit' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {p.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                                        {p.paymentStatus !== 'paid' && (
                                            <button
                                                onClick={() => openPaymentModal(p)}
                                                className="flex items-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
                                            >
                                                <DollarSign size={14} /> Record Payment
                                            </button>
                                        )}
                                        <button
                                            onClick={() => navigate(`/purchases/view/${p._id}`)}
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:bg-white hover:shadow-lg hover:text-blue-600 transition-all border border-transparent hover:border-slate-100"
                                        >
                                            <ArrowRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {!loading && purchases.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm mb-4">
                        <ShoppingBag size={32} />
                    </div>
                    <p className="text-slate-500 font-black tracking-tight uppercase text-xs">Zero acquisition data available</p>
                    <button onClick={() => navigate('/purchases/new')} className="text-blue-600 text-sm font-bold mt-3 hover:underline">Launch Entry Screen</button>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 pt-8 pb-6 flex justify-between items-center border-b border-slate-50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Record Settlement</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Acquisition Protcol: {selectedP?.purchaseNumber}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handlePaymentSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={paymentForm.date}
                                        onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Mode</label>
                                    <select
                                        value={paymentForm.paymentMode}
                                        onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none"
                                    >
                                        {['CASH', 'UPI', 'BANK', 'CHEQUE'].map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Settlement Amount (Net: {fmtRs(selectedP?.amountDue)})</label>
                                <div className="relative">
                                    <IndianRupee size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        max={selectedP?.amountDue}
                                        value={paymentForm.paymentAmount}
                                        onChange={e => setPaymentForm({ ...paymentForm, paymentAmount: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference Protocol (Optional)</label>
                                <input
                                    type="text"
                                    value={paymentForm.referenceNo}
                                    onChange={e => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all transition-all"
                                    placeholder="TXN ID / Cheque No..."
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-8 py-4 rounded-2xl bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-3 px-8 py-4 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} className="text-emerald-400" />}
                                    Crystallize Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
