import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Plus, Minus, Trash2, Printer, RotateCcw, CheckCircle, Loader2, Barcode, ShoppingCart, IndianRupee, User, Zap, CreditCard, Wallet, Smartphone, Layers, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

const fmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtRs = (n) => `₹${fmt(n)}`;

function calculateItemTotals(item) {
    const gross = item.sellingPrice * item.quantity;
    const discountAmt = (gross * (item.discount || 0)) / 100;
    const taxable = gross - discountAmt;
    const gst = (taxable * item.gstRate) / 100;
    return { taxable, gst, total: taxable + gst };
}

export default function BillingScreen() {
    const { items, addItem, batchAddItems, updateItem, removeItem, clearCart } = useCart();
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [customer, setCustomer] = useState({ name: '', phone: '', gstin: '' });
    const [paymentMode, setPaymentMode] = useState('cash');
    const [isInterstate, setIsInterstate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [lastBill, setLastBill] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [productsInCategory, setProductsInCategory] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [uploadingExcel, setUploadingExcel] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    const [excelPreview, setExcelPreview] = useState(null);
    const searchRef = useRef(null);
    const fileInputRef = useRef(null);
    const debouncedSearch = useDebounce(search, 350);

    useEffect(() => {
        api.get('/categories').then(r => setCategories(r.data.data || [])).catch(() => { });
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
        const handler = (e) => {
            if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        if (!debouncedSearch.trim()) { setResults([]); return; }
        setSearching(true);
        api.get(`/products/search?q=${debouncedSearch}`)
            .then(r => setResults(r.data.data || []))
            .catch(() => { })
            .finally(() => setSearching(false));
    }, [debouncedSearch]);

    const handleAddProduct = (product) => {
        addItem(product);
        setSearch('');
        setResults([]);
        toast.success(`Allocated ${product.name} to POS`, { duration: 1500 });
    };

    const totals = items.reduce((acc, item) => {
        const t = calculateItemTotals(item);
        return {
            subtotal: acc.subtotal + item.sellingPrice * item.quantity,
            discount: acc.discount + ((item.sellingPrice * item.quantity * (item.discount || 0)) / 100),
            taxable: acc.taxable + t.taxable,
            gst: acc.gst + t.gst,
            total: acc.total + t.total,
        };
    }, { subtotal: 0, discount: 0, taxable: 0, gst: 0, total: 0 });

    const grandTotal = Math.round(totals.total);

    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = async () => {
        if (items.length === 0) { toast.error('POS sequence requires item allocation'); return; }
        setSubmitting(true);
        try {
            const { data } = await api.post('/bills', {
                customer,
                items: items.map(i => ({
                    product: i.product,
                    quantity: i.quantity,
                    sellingPrice: i.sellingPrice,
                    discount: i.discount || 0,
                })),
                paymentMode,
                paymentStatus: 'paid',
                amountPaid: grandTotal,
                amountDue: 0,
                isInterstate,
            });
            setLastBill(data.data);
            setShowSuccess(true);
            toast.success(`Transaction ${data.data.billNumber} finalized`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Finalization failure');
        } finally { setSubmitting(false); }
    };

    const handleNewBill = () => {
        clearCart();
        setCustomer({ name: '', phone: '', gstin: '' });
        setLastBill(null);
        setShowSuccess(false);
    };

    const handlePrintInvoice = async () => {
        if (!lastBill) return;
        try {
            const response = await api.get(`/bills/${lastBill._id}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
        } catch (err) {
            toast.error('Failed to prepare invoice for printing');
        }
    };

    const handleDownloadInvoice = async () => {
        if (!lastBill) return;
        try {
            const response = await api.get(`/bills/${lastBill._id}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice_${lastBill.billNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error('Failed to download invoice');
        }
    };

    const handleDownloadTemplate = async () => {
        setDownloadingTemplate(true);
        try {
            // Fetch all active products
            const response = await api.get('/products?limit=5000');
            const products = response.data.data;

            // Generate template format
            const templateData = products.map(p => ({
                'Product Name': p.name,
                'SKU': p.sku,
                'Quantity': 0
            }));

            const ws = XLSX.utils.json_to_sheet(templateData);
            
            // Set cell widths for better readability
            ws['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 15 }];
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "BillingTemplate");
            
            XLSX.writeFile(wb, "ElectroERP_Billing_Template.xlsx");
            toast.success("Excel Template Downloaded");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate Excel Template");
        } finally {
            setDownloadingTemplate(false);
        }
    };

    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingExcel(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // Expected columns: SKU, Qty (or Quantity)
            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

            if (jsonData.length === 0) {
                toast.error('Excel file is empty.');
                return;
            }
            // Fetch products to match SKUs.
            // Note: For a very large catalog, we might need a paginated approach or an endpoint to fetch by list of SKUs.
            // Using a limit of 5000 as a reasonable bound for typical SMB inventories.
            const response = await api.get('/products?limit=5000');
            const allProducts = response.data.data;
            let previewData = [];
            let matchedCount = 0;
            let missingSkus = [];

            jsonData.forEach(row => {
                // Handle different possible column names for SKU and Qty (case-insensitive keys).
                const keys = Object.keys(row);
                const skuKey = keys.find(k => k.trim().toLowerCase() === 'sku' || k.trim().toLowerCase() === 'barcode');
                const qtyKey = keys.find(k => k.trim().toLowerCase() === 'qty' || k.trim().toLowerCase() === 'quantity');

                const skuNumber = skuKey ? String(row[skuKey]).trim() : null;

                if (skuNumber) {
                    const qty = qtyKey ? parseInt(row[qtyKey], 10) : 0;
                    
                    // Ignore rows with invalid, zero, or negative quantity
                    if (isNaN(qty) || qty <= 0) return;

                    const matchedProduct = allProducts.find(p => p.sku === skuNumber);

                    if (matchedProduct) {
                        const cartItem = items.find(i => i.product === matchedProduct._id);
                        const currentCartQty = cartItem ? cartItem.quantity : 0;
                        const available = Math.max(0, matchedProduct.stockQty - currentCartQty);
                        
                        let status = 'valid';
                        let issue = null;

                        if (qty > available) {
                            status = 'warning';
                            issue = `Req: ${qty}, Avail: ${available}`;
                        } else if (available === 0) {
                            status = 'error';
                            issue = 'Out of stock';
                        }

                        previewData.push({
                            sku: skuNumber,
                            product: matchedProduct,
                            requestedQty: qty,
                            availableQty: matchedProduct.stockQty,
                            status,
                            issue
                        });
                        matchedCount++;
                    } else {
                        previewData.push({
                            sku: skuNumber,
                            product: null,
                            requestedQty: qty,
                            availableQty: 0,
                            status: 'error',
                            issue: 'Not found in inventory'
                        });
                        missingSkus.push(skuNumber);
                    }
                }
            });

            if (previewData.length > 0) {
                setExcelPreview(previewData);
                if (missingSkus.length > 0) {
                     toast.error(`Could not find ${missingSkus.length} SKUs from sheet.`, { duration: 4000 });
                } else {
                     toast.success(`Processed Excel. Please review items.`, { duration: 2000 });
                }
            } else {
                toast.error('No valid SKU data found in file.');
            }

        } catch (error) {
            console.error(error);
            toast.error('Failed to parse Excel file.');
        } finally {
            setUploadingExcel(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleConfirmExcel = () => {
        if (!excelPreview) return;
        
        const validItems = excelPreview.filter(p => p.product);
        const cartItemsToAdd = validItems.map(p => {
            const cartItem = items.find(i => i.product === p.product._id);
            const currentCartQty = cartItem ? cartItem.quantity : 0;
            const available = Math.max(0, p.product.stockQty - currentCartQty);
            const addQty = Math.min(p.requestedQty, available);
            return { product: p.product, qty: Math.max(addQty, 0) };
        }).filter(item => item.qty > 0);

        if (cartItemsToAdd.length > 0) {
            batchAddItems(cartItemsToAdd);
            toast.success(`Allocated ${cartItemsToAdd.length} products to POS.`);
        } else {
            toast.error('No products had sufficient stock to add.', { id: 'preview-error' });
        }

        setExcelPreview(null);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full max-h-[calc(100vh-100px)]">
            {/* Left Panel: Inventory Lookup & Identity */}
            <div className="w-full lg:w-80 flex flex-col gap-6">
                <div className="bg-white rounded-[2rem] border border-slate-50 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Barcode size={14} className="text-blue-600" /> POS Lookup
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDownloadTemplate}
                                disabled={downloadingTemplate}
                                className="flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-xl font-bold text-[10px] hover:bg-blue-100 hover:scale-105 transition-all disabled:opacity-50 uppercase tracking-widest shadow-sm"
                                title="Download Excel template for bulk load"
                            >
                                {downloadingTemplate ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <Download size={12} className="mr-1.5" />}
                                Template
                            </button>
                            <input 
                                type="file" 
                                accept=".xlsx, .xls, .csv" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleExcelUpload} 
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingExcel}
                                className="flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-xl font-bold text-[10px] hover:bg-emerald-100 hover:scale-105 transition-all disabled:opacity-50 uppercase tracking-widest shadow-sm"
                                title="Upload bulk products via Excel"
                            >
                                {uploadingExcel ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <Upload size={12} className="mr-1.5" />}
                                Excel Load
                            </button>
                            <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg font-black font-mono shadow-sm">F2</span>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            ref={searchRef}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Scan or type..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all"
                        />
                        {searching && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />}
                    </div>

                    <div className="overflow-y-auto max-h-[30vh] lg:max-h-[40vh] space-y-1 pr-1 custom-scrollbar">
                        {results.map(product => (
                            <button
                                key={product._id}
                                onClick={() => handleAddProduct(product)}
                                className="w-full text-left p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group flex items-center justify-between gap-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{product.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{product.sku}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-black text-slate-900 group-hover:scale-105 transition-transform">{fmtRs(product.sellingPrice)}</p>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">In: {product.stockQty}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-50 shadow-sm p-6 space-y-4">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                        <Layers size={14} className="text-blue-600" /> Category Matrix
                    </h2>
                    <div className="space-y-3">
                        <div className="relative group">
                            <select
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Select Channel Category</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-blue-600 transition-colors">
                                <Plus size={14} />
                            </div>
                        </div>

                        {selectedCategory && (
                            <div className="relative group animate-in slide-in-from-top-2 duration-300">
                                <select
                                    value=""
                                    onChange={e => {
                                        const p = productsInCategory.find(prod => prod._id === e.target.value);
                                        if (p) handleAddProduct(p);
                                        setSelectedCategory('');
                                    }}
                                    className="w-full px-5 py-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm font-bold text-blue-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>{loadingProducts ? 'Retrieving Protocols...' : 'Select Target Product'}</option>
                                    {productsInCategory.map(p => (
                                        <option key={p._id} value={p._id}>
                                            {p.name} - {fmtRs(p.sellingPrice)}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400">
                                    <Zap size={14} className="animate-pulse" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-50 shadow-sm p-6 space-y-4">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                        <User size={14} className="text-blue-600" /> Identity Logic
                    </h2>
                    <div className="space-y-3">
                        {[
                            { key: 'name', placeholder: 'Individual/Entity Name' },
                            { key: 'phone', placeholder: 'Contact Matrix (+91...)' },
                            { key: 'gstin', placeholder: 'Tax Portal ID (GSTIN)' },
                        ].map(f => (
                            <input
                                key={f.key}
                                value={customer[f.key]}
                                onChange={e => setCustomer(c => ({ ...c, [f.key]: e.target.value }))}
                                placeholder={f.placeholder}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Center: Deployment Cart */}
            <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 bg-slate-50/20">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Deployment Cart</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{items.length} positions allocated</p>
                    </div>
                    {items.length > 0 && (
                        <button onClick={clearCart} className="flex items-center gap-2 group text-slate-400 hover:text-red-500 transition-colors">
                            <span className="text-[10px] font-black uppercase tracking-widest">Wipe State</span>
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-red-50 transition-colors">
                                <RotateCcw size={14} />
                            </div>
                        </button>
                    )}
                </div>

                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-200">
                        <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                            <ShoppingCart size={48} />
                        </div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Matrix is Empty</p>
                        <p className="text-[11px] font-medium text-slate-300 mt-2">Initialize POS through identity or scan</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                                <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-8 py-5">System Resource</th>
                                    <th className="px-3 py-5 text-center">Load</th>
                                    <th className="px-3 py-5 text-right">Unit Val</th>
                                    <th className="px-3 py-5 text-right">Disc %</th>
                                    <th className="px-3 py-5 text-right">Aggregate</th>
                                    <th className="px-8 py-5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {items.map((item, idx) => {
                                    const { taxable, gst, total } = calculateItemTotals(item);
                                    return (
                                        <tr key={item.product} className="group hover:bg-slate-50/10 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all text-xs">
                                                        {item.productName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">{item.productName}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.sku}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-5">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => item.quantity <= 1 ? removeItem(item.product) : updateItem(item.product, { quantity: item.quantity - 1 })}
                                                        className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all active:scale-90"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={e => updateItem(item.product, { quantity: Math.min(parseInt(e.target.value) || 1, item.stockQty) })}
                                                        className="w-16 text-center text-sm font-black bg-white border border-slate-100 rounded-xl py-2 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
                                                    />
                                                    <button
                                                        onClick={() => item.quantity < item.stockQty && updateItem(item.product, { quantity: item.quantity + 1 })}
                                                        className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all active:scale-90"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-3 py-5 text-right font-black text-slate-900">{fmtRs(item.sellingPrice)}</td>
                                            <td className="px-3 py-5 text-right">
                                                <input
                                                    type="number"
                                                    value={item.discount || 0}
                                                    onChange={e => updateItem(item.product, { discount: parseFloat(e.target.value) || 0 })}
                                                    className="w-16 text-right text-xs font-black bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                                />
                                            </td>
                                            <td className="px-3 py-5 text-right">
                                                <p className="font-black text-slate-900 text-sm">{fmtRs(total)}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Tax: {fmtRs(gst)}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <button onClick={() => removeItem(item.product)} className="w-10 h-10 flex items-center justify-center text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Right Panel: Protocol Summary */}
            <div className="w-full lg:w-80 flex flex-col gap-6">
                <div className="bg-white rounded-[2rem] border border-slate-50 shadow-sm p-6 flex-1 flex flex-col">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 mb-6 flex items-center gap-2">
                        <Zap size={14} className="text-blue-600" /> Protocol Summary
                    </h2>

                    <div className="space-y-4 text-sm flex-1">
                        {[
                            { label: 'Subtotal Acquisition', val: fmtRs(totals.subtotal), clr: 'text-slate-500' },
                            { label: 'Protocol Discount', val: `-${fmtRs(totals.discount)}`, clr: 'text-red-500' },
                            { label: 'Valuation Sub', val: fmtRs(totals.taxable), clr: 'text-slate-500' },
                            { label: 'Aggregate GST', val: fmtRs(totals.gst), clr: 'text-amber-600' },
                        ].map(row => (
                            <div key={row.label} className="flex justify-between items-center group">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{row.label}</span>
                                <span className={`font-black tracking-tight ${row.clr}`}>{row.val}</span>
                            </div>
                        ))}

                        <div className="border-t border-slate-50 pt-6 mt-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Final Valuation</p>
                            <div className="flex justify-between items-baseline p-4 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-900/10">
                                <span className="text-2xl font-black">{fmt(grandTotal)}</span>
                                <span className="text-[10px] font-black text-slate-500 uppercase">INR</span>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Transmission Logic</p>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { mode: 'cash', icon: Wallet },
                                    { mode: 'upi', icon: Smartphone },
                                    { mode: 'card', icon: CreditCard }
                                ].map(({ mode, icon: Icon }) => (
                                    <button
                                        key={mode}
                                        onClick={() => setPaymentMode(mode)}
                                        className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all gap-2 capitalize
                                            ${paymentMode === mode
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/20 active:scale-95'
                                                : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        <Icon size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{mode}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interstate Logic (IGST)</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">{isInterstate ? 'ACTIVE PROTOCOL' : 'LOCAL SEQUENCE'}</p>
                            </div>
                            <button
                                onClick={() => setIsInterstate(i => !i)}
                                className={`w-12 h-6 rounded-full transition-all relative p-1 shadow-inner ${isInterstate ? 'bg-blue-500' : 'bg-slate-200'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${isInterstate ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    {lastBill && (
                        <button
                            onClick={() => window.open(`/api/bills/${lastBill._id}/pdf`, '_blank')}
                            className="w-16 h-full bg-white border border-slate-100 rounded-[1.25rem] flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-lg transition-all"
                            title="Export last sequence"
                        >
                            <Printer size={20} />
                        </button>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || items.length === 0}
                        className="flex-1 bg-slate-900 hover:bg-black disabled:opacity-50 text-white py-5 rounded-[1.25rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/40 transition-all active:scale-95"
                    >
                        {submitting ? <Loader2 size={18} className="animate-spin text-blue-500" /> : <CheckCircle size={18} className="text-emerald-500" />}
                        {submitting ? 'DEPLOYING...' : 'FINALIZE BILL'}
                    </button>
                </div>
            </div>
            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" />
                    <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-10 text-center">
                        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 ring-emerald-50/50">
                            <CheckCircle size={48} strokeWidth={2.5} />
                        </div>

                        <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Bill Generated Successfully</h3>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-10">Transactional Protocol: {lastBill?.billNumber}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={handleDownloadInvoice}
                                className="flex items-center justify-center gap-3 bg-slate-50 hover:bg-slate-100 text-slate-600 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                            >
                                <ShoppingCart size={20} className="text-blue-500" /> Download Invoice
                            </button>
                            <button
                                onClick={handlePrintInvoice}
                                className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all active:scale-95"
                            >
                                <Printer size={20} className="text-blue-200" /> Print Invoice
                            </button>
                        </div>

                        <button
                            onClick={handleNewBill}
                            className="w-full mt-6 bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Plus size={20} className="text-emerald-400" /> Initiate New Bill
                        </button>

                        <p className="mt-8 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Protocol finalized at {new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            )}

            {/* Excel Preview Modal */}
            {excelPreview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setExcelPreview(null)} />
                    <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center backdrop-blur-md">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    <Layers size={22} className="text-blue-600" /> Excel Upload Preview
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Review item matrix before pos allocation</p>
                            </div>
                            <button onClick={() => setExcelPreview(null)} className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                                    <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                        <th className="px-8 py-5">Identified Resource</th>
                                        <th className="px-4 py-5 font-mono">SKU ID</th>
                                        <th className="px-4 py-5 text-right">Req Load</th>
                                        <th className="px-4 py-5 text-right">Sys Avail</th>
                                        <th className="px-8 py-5 text-right">Sequence Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {excelPreview.map((item, idx) => (
                                        <tr key={idx} className={`group transition-colors ${item.status === 'valid' ? 'hover:bg-slate-50/50' : item.status === 'warning' ? 'bg-amber-50/30 hover:bg-amber-50' : 'bg-red-50/30 hover:bg-red-50'}`}>
                                            <td className="px-8 py-4">
                                                {item.product ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] transition-all
                                                            ${item.status === 'valid' ? 'bg-blue-50 text-blue-600' : item.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                                                            {item.product.name.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-slate-900">{item.product.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="font-bold text-slate-400 italic">Unidentified Resource</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 font-mono text-[11px] font-bold text-slate-500">{item.sku}</td>
                                            <td className="px-4 py-4 text-right font-black text-slate-900">{item.requestedQty}</td>
                                            <td className="px-4 py-4 text-right font-black">
                                                {item.product ? (
                                                    <span className={item.availableQty < item.requestedQty ? 'text-amber-600' : 'text-slate-500'}>
                                                        {item.availableQty}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                {item.status === 'valid' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                                        <CheckCircle size={12} /> Valid
                                                    </span>
                                                ) : item.status === 'warning' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest cursor-help" title={item.issue}>
                                                        <Zap size={12} /> Limited
                                                        <span className="text-[9px] lowercase opacity-80 max-w-[100px] truncate ml-1">{item.issue}</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest cursor-help" title={item.issue}>
                                                        <Minus size={12} /> Error
                                                        <span className="text-[9px] lowercase opacity-80 max-w-[100px] truncate ml-1">{item.issue}</span>
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="p-6 md:p-8 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Valid entries will be capped at system availability
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setExcelPreview(null)}
                                    className="px-6 py-3 bg-white border border-slate-100 rounded-xl font-black text-xs text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    Abort
                                </button>
                                <button
                                    onClick={handleConfirmExcel}
                                    className="px-8 py-3 bg-slate-900 border border-slate-900 rounded-xl font-black text-xs text-white uppercase tracking-[0.1em] hover:bg-black hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <CheckCircle size={16} className="text-emerald-400" /> Confirm & Inject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
