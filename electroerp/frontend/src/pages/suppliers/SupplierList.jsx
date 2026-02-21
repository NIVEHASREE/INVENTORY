import { useState, useEffect } from 'react';
import { Plus, Search, User, Phone, Mail, FileText, IndianRupee, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const fmtRs = (n) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n || 0)}`;

export default function SupplierList() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data.data);
        } catch { toast.error('Failed to load suppliers'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const filtered = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.phone?.includes(search) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Suppliers</h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {suppliers.length} active partnerships
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl text-sm font-bold shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]"
                >
                    <Plus size={18} /> Add New Supplier
                </button>
            </div>

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, phone or email..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-2xl skeleton" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-2/3 skeleton" />
                                    <div className="h-3 w-1/3 skeleton" />
                                </div>
                            </div>
                            <div className="h-20 skeleton rounded-2xl" />
                        </div>
                    ))
                ) : filtered.map(s => (
                    <div key={s._id}
                        onClick={() => navigate(`/suppliers/${s._id}/ledger`)}
                        className="group bg-white rounded-[2rem] p-6 border border-slate-50 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <ArrowRight size={18} />
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-slate-400 group-hover:from-blue-600 group-hover:to-blue-700 group-hover:text-white transition-all duration-300">
                                <User size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate pr-8">{s.name}</h3>
                                <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                                    <Phone size={12} /> {s.phone || 'No phone'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100/50">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance</p>
                                <p className={`text-sm font-black mt-0.5 ${s.currentBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {fmtRs(s.currentBalance)}
                                </p>
                            </div>
                            <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100/50">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terms</p>
                                <p className="text-sm font-bold text-slate-700 mt-0.5 truncate uppercase">{s.paymentTerms || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-4 text-xs text-slate-400 border-t border-slate-50 pt-4">
                            {s.email && <span className="flex items-center gap-1.5 truncate"><Mail size={12} /> {s.email}</span>}
                            {s.gstin && <span className="flex items-center gap-1.5 ml-auto"><FileText size={12} /> GST: {s.gstin}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {!loading && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm mb-4">
                        <Search size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">No suppliers match your criteria</p>
                    <button onClick={() => setSearch('')} className="text-blue-600 text-sm font-bold mt-2">Clear search</button>
                </div>
            )}

            {showModal && <SupplierModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
        </div>
    );
}

function SupplierModal({ onClose, onSaved }) {
    const [form, setForm] = useState({ name: '', phone: '', email: '', gstin: '', openingBalance: 0, paymentTerms: 'Net 30' });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/suppliers', form);
            toast.success('Supplier profile created successfully');
            onSaved();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to create supplier'); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] overflow-y-auto px-4 py-8 md:py-16" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="flex items-center justify-center min-h-full">
                <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-8 duration-300">
                    <div className="flex items-center justify-between p-8 border-b border-slate-50">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Add New Partner</h2>
                            <p className="text-sm text-slate-400 mt-1 font-medium">Initialize a new supplier ledger</p>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95 shadow-sm">✕</button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { key: 'name', label: 'Company/Supplier Name*', required: true, colSpan: 'md:col-span-2', icon: User },
                                { key: 'phone', label: 'Contact Number*', required: true, icon: Phone },
                                { key: 'email', label: 'Email Address', icon: Mail },
                                { key: 'gstin', label: 'Tax ID (GSTIN)', icon: FileText },
                                { key: 'paymentTerms', label: 'Payment Terms', icon: FileText },
                                { key: 'openingBalance', label: 'Opening Balance (₹)', type: 'number', colSpan: 'md:col-span-2', icon: IndianRupee },
                            ].map(f => (
                                <div key={f.key} className={f.colSpan || ''}>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">{f.label}</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                                            <f.icon size={18} />
                                        </div>
                                        <input
                                            type={f.type || 'text'}
                                            value={form[f.key]}
                                            onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                                            required={f.required}
                                            placeholder={`Enter ${f.label.toLowerCase().replace('*', '')}`}
                                            className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-12 bg-slate-50/50 p-2 rounded-[2rem] border border-slate-100/50">
                            <button type="button" onClick={onClose} className="flex-1 py-4.5 text-slate-500 rounded-2xl text-sm font-black hover:bg-white hover:shadow-sm transition-all active:scale-95">
                                DISCARD
                            </button>
                            <button type="submit" disabled={saving} className="flex-1 py-4.5 bg-blue-600 text-white rounded-[1.25rem] text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 tracking-widest">
                                {saving ? (
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    'ACTIVATE PROFILE'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
