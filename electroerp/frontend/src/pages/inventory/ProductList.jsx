import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit, AlertTriangle, Package, Layers, IndianRupee, Tag, BarChart3, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const fmtRs = (n) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n || 0)}`;

export default function ProductList() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ page: 1, limit: 25, search: '', category: '' });
    const [categories, setCategories] = useState([]);
    const [meta, setMeta] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [editProduct, setEditProduct] = useState(null);

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')));
            const [prodRes, catRes] = await Promise.all([
                api.get(`/products?${params}`),
                api.get('/categories'),
            ]);
            setProducts(prodRes.data.data);
            setMeta(prodRes.data.meta || {});
            setCategories(catRes.data.data);
        } catch { toast.error('Failed to load products'); }
        finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { loadProducts(); }, [loadProducts]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inventory</h1>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                        {meta.total || 0} items in stock
                    </p>
                </div>
                <button
                    onClick={() => { setEditProduct(null); setShowModal(true); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl text-sm font-bold shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]"
                >
                    <Plus size={18} /> Add Product
                </button>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-50 shadow-sm p-4 flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[280px]">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={filters.search}
                        onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                        placeholder="Search by SKU, Name or Brand..."
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                    />
                </div>
                <select
                    value={filters.category}
                    onChange={e => setFilters(f => ({ ...f, category: e.target.value, page: 1 }))}
                    className="px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none min-w-[180px]"
                >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/50">
                                <th className="px-8 py-5">product details</th>
                                <th className="px-5 py-5 text-right">valuation</th>
                                <th className="px-5 py-5 text-center">tax</th>
                                <th className="px-5 py-5 text-center">inventory</th>
                                <th className="px-5 py-5 text-center">status</th>
                                <th className="px-8 py-5 text-right">actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? Array(8).fill(0).map((_, i) => (
                                <tr key={i}><td colSpan={6} className="px-8 py-4"><div className="skeleton h-12 w-full rounded-2xl" /></td></tr>
                            )) : products.map(p => {
                                const isLowStock = p.stockQty <= p.minStockQty;
                                return (
                                    <tr key={p._id} className="group hover:bg-slate-50/20 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isLowStock ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{p.name}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                                                        <span className="text-slate-300 font-mono">{p.sku}</span> • {p.brand || 'No Brand'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 text-right">
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-slate-900">{fmtRs(p.sellingPrice)}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">Cost: {fmtRs(p.costPrice)}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 text-center">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black tracking-wider">
                                                GST {p.gstRate}%
                                            </span>
                                        </td>
                                        <td className="px-5 py-5 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <div className={`flex items-center gap-1.5 font-black text-sm ${isLowStock ? 'text-amber-500' : 'text-slate-900'}`}>
                                                    {isLowStock && <AlertTriangle size={14} />}
                                                    {p.stockQty} <span className="text-[10px] text-slate-400 font-medium">{p.unit}</span>
                                                </div>
                                                {isLowStock && <p className="text-[10px] text-amber-400 font-bold uppercase mt-0.5 tracking-tighter">critically low</p>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                                {p.isActive ? 'Available' : 'Archived'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => { setEditProduct(p); setShowModal(true); }}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white hover:shadow-lg hover:text-blue-600 transition-all border border-transparent hover:border-slate-100 shadow-sm"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <ProductModal
                    product={editProduct}
                    categories={categories}
                    onClose={() => setShowModal(false)}
                    onSaved={() => { setShowModal(false); loadProducts(); }}
                />
            )}
        </div>
    );
}

function ProductModal({ product, categories, onClose, onSaved }) {
    const [form, setForm] = useState(product || {
        name: '', sku: '', brand: '', unit: 'pcs', costPrice: '', sellingPrice: '',
        mrp: '', gstRate: 18, hsnCode: '', stockQty: 0, minStockQty: 5, category: '', description: '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (product) await api.put(`/products/${product._id}`, form);
            else await api.post('/products', form);
            toast.success(product ? 'Product vault updated' : 'Product initialized in inventory');
            onSaved();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save product pulse');
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] overflow-y-auto px-4 py-8 md:py-16" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="flex items-center justify-center min-h-full">
                <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-8 duration-300">
                    <div className="flex items-center justify-between p-8 border-b border-slate-50">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{product ? 'Edit Entity' : 'New Inventory Entity'}</h2>
                            <p className="text-sm text-slate-400 mt-1 font-medium italic">Configure product specs and tax logic</p>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95">✕</button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { key: 'name', label: 'Product Narrative*', colSpan: 'md:col-span-2', icon: Package },
                                { key: 'sku', label: 'SKU / Global ID*', icon: BarChart3 },
                                { key: 'brand', label: 'Brand Identity', icon: Tag },
                                { key: 'category', label: 'Classification', type: 'select', icon: Layers },
                                { key: 'hsnCode', label: 'HSN Tax Protocol', icon: ShieldCheck },
                                { key: 'costPrice', label: 'Unit Valuation*', type: 'number', icon: IndianRupee },
                                { key: 'sellingPrice', label: 'Market Listing*', type: 'number', icon: IndianRupee },
                                { key: 'mrp', label: 'Static MSRP', type: 'number', icon: IndianRupee },
                                { key: 'gstRate', label: 'GST Logic (%)', type: 'select-gst', icon: ShieldCheck },
                                { key: 'stockQty', label: 'Stock Buffer', type: 'number', icon: Package },
                                { key: 'minStockQty', label: 'Alert Threshold', type: 'number', icon: AlertTriangle },
                                { key: 'unit', label: 'Measurement Unit', icon: Tag },
                            ].map(f => (
                                <div key={f.key} className={f.colSpan || ''}>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">{f.label}</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                                            {f.icon && <f.icon size={18} />}
                                        </div>
                                        {f.type === 'select' ? (
                                            <select
                                                value={form.category || ''}
                                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none"
                                            >
                                                <option value="">Select Classification</option>
                                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                            </select>
                                        ) : f.type === 'select-gst' ? (
                                            <select
                                                value={form.gstRate}
                                                onChange={e => setForm(f => ({ ...f, gstRate: parseInt(e.target.value) }))}
                                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none"
                                            >
                                                {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}% GST</option>)}
                                            </select>
                                        ) : (
                                            <input
                                                type={f.type || 'text'}
                                                value={form[f.key] || ''}
                                                onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                                                required={f.label.includes('*')}
                                                placeholder={`Enter ${f.label.toLowerCase().replace('*', '')}`}
                                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-12 bg-slate-50/50 p-2 rounded-[2rem] border border-slate-100/50">
                            <button type="button" onClick={onClose} className="flex-1 py-4.5 text-slate-500 rounded-2xl text-sm font-black hover:bg-white hover:shadow-sm transition-all">
                                CANCEL
                            </button>
                            <button type="submit" disabled={saving} className="flex-1 py-4.5 bg-blue-600 text-white rounded-[1.25rem] text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                                {saving ? (
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    product ? 'UPDATE CORE' : 'INITIALIZE ENTITY'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
