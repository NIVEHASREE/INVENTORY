import { useState, useEffect } from 'react';
import { Plus, Loader2, ArrowLeft, Trash2, Search, ShoppingCart, IndianRupee, ShieldCheck, Tag, User, FileText, Layers, Zap } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const fmtRs = (n) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n || 0)}`;

export default function NewPurchase() {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({ supplierId: '', items: [], paymentStatus: 'credit', amountPaid: 0, supplierInvoiceNo: '', notes: '', isInterstate: false });
    const [saving, setSaving] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [productsInCategory, setProductsInCategory] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    useEffect(() => {
        Promise.all([
            api.get('/suppliers'),
            api.get('/products?limit=200'),
            api.get('/categories')
        ]).then(([supRes, prodRes, catRes]) => {
            setSuppliers(supRes.data.data);
            setProducts(prodRes.data.data);
            setCategories(catRes.data.data || []);
        });
    }, []);

    useEffect(() => {
        if (!selectedCategory) { setProductsInCategory([]); return; }
        setLoadingProducts(true);
        api.get(`/products?category=${selectedCategory}&limit=100`)
            .then(r => setProductsInCategory(r.data.data || []))
            .catch(() => { })
            .finally(() => setLoadingProducts(false));
    }, [selectedCategory]);

    useEffect(() => {
        if (!productSearch.trim()) { setSearchResults([]); return; }
        const results = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 10);
        setSearchResults(results);
    }, [productSearch, products]);

    const addItem = (product) => {
        const existing = form.items.find(i => i.product === product._id);
        if (existing) {
            setForm(f => ({ ...f, items: f.items.map(i => i.product === product._id ? { ...i, quantity: i.quantity + 1 } : i) }));
        } else {
            setForm(f => ({ ...f, items: [...f.items, { product: product._id, productName: product.name, quantity: 1, purchasePrice: product.costPrice, gstRate: product.gstRate, sku: product.sku }] }));
        }
        setProductSearch('');
        setSearchResults([]);
        toast.success(`Allocated ${product.name} to list`);
    };

    const grandTotal = form.items.reduce((sum, i) => {
        const tax = i.purchasePrice * i.quantity * i.gstRate / 100;
        return sum + i.purchasePrice * i.quantity + tax;
    }, 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.supplierId) { toast.error('Selection of Supplier is mandatory'); return; }
        if (form.items.length === 0) { toast.error('Acquisition list cannot be empty'); return; }
        setSaving(true);
        try {
            await api.post('/purchases', { ...form, amountPaid: form.paymentStatus === 'paid' ? grandTotal : form.amountPaid });
            toast.success('Inventory acquisition synchronized successfully');
            navigate('/purchases');
        } catch (err) { toast.error(err.response?.data?.message || 'Synchronization failure'); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/purchases')}
                    className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sync New Purchase</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Initialize inventory load from supplier entity</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Item Selector */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <ShoppingCart size={20} className="text-blue-600" /> Allocated Items
                            </h2>
                            <span className="bg-slate-50 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-slate-400 border border-slate-100">
                                {form.items.length} positions
                            </span>
                        </div>

                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                value={productSearch}
                                onChange={e => setProductSearch(e.target.value)}
                                placeholder="Scan or type Product Name/SKU to allocate..."
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all"
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 rounded-2xl mt-2 shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    {searchResults.map(p => (
                                        <button key={p._id} type="button" onClick={() => addItem(p)}
                                            className="w-full text-left px-5 py-4 hover:bg-slate-50 text-sm flex justify-between items-center group/btn transition-colors border-b border-slate-50 last:border-0">
                                            <div>
                                                <p className="font-bold text-slate-800 group-hover/btn:text-blue-600 transition-colors">{p.name}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.sku}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-slate-900">{fmtRs(p.costPrice)}</p>
                                                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">Stock: {p.stockQty}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                    <Layers size={10} /> Category Channel
                                </label>
                                <div className="relative group">
                                    <select
                                        value={selectedCategory}
                                        onChange={e => setSelectedCategory(e.target.value)}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Inventory Sector</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                        <Plus size={14} />
                                    </div>
                                </div>
                            </div>

                            {selectedCategory && (
                                <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        <Zap size={10} /> Quick Allocation
                                    </label>
                                    <div className="relative group">
                                        <select
                                            value=""
                                            onChange={e => {
                                                const p = productsInCategory.find(prod => prod._id === e.target.value);
                                                if (p) addItem(p);
                                                setSelectedCategory('');
                                            }}
                                            className="w-full px-5 py-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl text-[13px] font-black text-blue-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>{loadingProducts ? 'Scanning Records...' : 'Select Target Asset'}</option>
                                            {productsInCategory.map(p => (
                                                <option key={p._id} value={p._id}>
                                                    {p.name} - {fmtRs(p.costPrice)}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400">
                                            <Plus size={14} className="animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {form.items.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                            <th className="py-4 pb-6">Product Pulse</th>
                                            <th className="py-4 pb-6 text-right">Quantity</th>
                                            <th className="py-4 pb-6 text-right">Unit Price</th>
                                            <th className="py-4 pb-6 text-right">Aggregate</th>
                                            <th className="py-4 pb-6" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {form.items.map((item, idx) => (
                                            <tr key={item.product} className="group/row">
                                                <td className="py-5">
                                                    <div>
                                                        <p className="font-bold text-slate-800">{item.productName}</p>
                                                        <p className="text-[10px] font-mono text-slate-400">{item.sku}</p>
                                                    </div>
                                                </td>
                                                <td className="py-5 text-right">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        min={1}
                                                        onChange={e => setForm(f => ({ ...f, items: f.items.map((i, ix) => ix === idx ? { ...i, quantity: parseInt(e.target.value) || 1 } : i) }))}
                                                        className="w-16 text-right bg-slate-50 border border-slate-100 rounded-xl py-2 px-2 text-xs font-black focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                                    />
                                                </td>
                                                <td className="py-5 text-right">
                                                    <input
                                                        type="number"
                                                        value={item.purchasePrice}
                                                        min={0}
                                                        onChange={e => setForm(f => ({ ...f, items: f.items.map((i, ix) => ix === idx ? { ...i, purchasePrice: parseFloat(e.target.value) || 0 } : i) }))}
                                                        className="w-24 text-right bg-slate-50 border border-slate-100 rounded-xl py-2 px-2 text-xs font-black focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                                    />
                                                </td>
                                                <td className="py-5 text-right font-black text-slate-900">
                                                    {fmtRs(item.purchasePrice * item.quantity * (1 + item.gstRate / 100))}
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Incl. {item.gstRate}% GST</p>
                                                </td>
                                                <td className="py-5 pl-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, ix) => ix !== idx) }))}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-200 hover:bg-red-50 hover:text-red-500 transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-16 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                                <ShoppingCart size={32} className="text-slate-200 mb-3" />
                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Awaiting item allocation</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Supplier & Config */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm p-8 space-y-6">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            Protocol Details
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Supplier Entity*</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <select
                                        value={form.supplierId}
                                        onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:border-blue-500 appearance-none transition-all"
                                        required
                                    >
                                        <option value="">Select Identity</option>
                                        {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Invoice Protocol No.</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                                        <FileText size={18} />
                                    </div>
                                    <input
                                        value={form.supplierInvoiceNo}
                                        onChange={e => setForm(f => ({ ...f, supplierInvoiceNo: e.target.value }))}
                                        placeholder="Reference code..."
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Payment Logic</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['credit', 'paid'].map(status => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, paymentStatus: status }))}
                                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${form.paymentStatus === status
                                                ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                                                : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl shadow-slate-900/40 relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">Transaction Value</h2>
                            <div className="mt-4 flex items-baseline gap-2">
                                <span className="text-4xl font-black">{fmtRs(grandTotal).replace('₹', '')}</span>
                                <span className="text-lg font-bold text-slate-500">INR</span>
                            </div>

                            <div className="mt-10 space-y-4 border-t border-slate-800 pt-6">
                                <div className="flex justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    <span>Net Acquisition</span>
                                    <span className="text-white">{fmtRs(form.items.reduce((s, i) => s + (i.purchasePrice * i.quantity), 0))}</span>
                                </div>
                                <div className="flex justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    <span>Applicable Tax (GST)</span>
                                    <span className="text-emerald-400">{fmtRs(form.items.reduce((s, i) => s + (i.purchasePrice * i.quantity * i.gstRate / 100), 0))}</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving || form.items.length === 0}
                                className="w-full mt-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.15em] transition-all active:scale-[0.98] disabled:opacity-40 disabled:grayscale flex items-center justify-center gap-3 shadow-xl shadow-blue-600/30"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                                {saving ? 'SYNCING...' : 'SYNC PURCHASE'}
                            </button>
                        </div>

                        {/* Abstract Design Elements */}
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-60 h-60 bg-slate-400/5 rounded-full blur-3xl" />
                    </div>
                </div>
            </form>
        </div>
    );
}
