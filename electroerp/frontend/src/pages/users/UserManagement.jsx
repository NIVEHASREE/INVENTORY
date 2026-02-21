import { useState, useEffect } from 'react';
import { Plus, ToggleLeft, ToggleRight, UserCircle, Mail, Phone, Shield, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get('/users'),
                api.get('/roles').catch(() => ({ data: { data: [] } }))
            ]);
            setUsers(usersRes.data.data);
            setRoles(rolesRes.data.data?.length ? rolesRes.data.data : [
                { _id: 'admin_role', name: 'ADMIN' },
                { _id: 'manager_role', name: 'MANAGER' },
                { _id: 'cashier_role', name: 'CASHIER' }
            ]);
        } catch { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const toggleStatus = async (userId) => {
        try {
            await api.patch(`/users/${userId}/toggle-status`);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !u.isActive } : u));
            toast.success('Status updated');
        } catch { toast.error('Failed to toggle status'); }
    };

    const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Users</h1>
                    <p className="text-slate-500 text-sm mt-1">{users.length} active team members</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-3.5 rounded-2xl text-sm font-bold shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98]"
                >
                    <Plus size={18} /> New Access
                </button>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-50 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/50">
                            <th className="px-8 py-5">identity</th>
                            <th className="px-5 py-5">contact</th>
                            <th className="px-5 py-5">authority</th>
                            <th className="px-5 py-5">activity</th>
                            <th className="px-5 py-5">status</th>
                            <th className="px-8 py-5 text-right">control</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? Array(5).fill(0).map((_, i) => (
                            <tr key={i}><td colSpan={6} className="px-8 py-4"><div className="skeleton h-12 w-full rounded-2xl" /></td></tr>
                        )) : users.map(u => (
                            <tr key={u._id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-900 group-hover:from-blue-600 group-hover:to-blue-700 group-hover:text-white transition-all duration-300 font-black text-lg shadow-sm">
                                            {u.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{u.name}</p>
                                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{u.role?.name}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-5">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                            <Mail size={12} className="text-slate-300" /> {u.email}
                                        </div>
                                        {u.phone && (
                                            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                                <Phone size={11} className="text-slate-300" /> {u.phone}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${u.role?.name === 'ADMIN' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {u.role?.name === 'ADMIN' ? <ShieldCheck size={14} /> : <Shield size={14} />}
                                        </div>
                                        <span className="font-bold text-slate-700 text-xs tracking-wide">{u.role?.name}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-5 text-slate-400 text-xs font-medium">
                                    {u.lastLogin ? fmtDate(u.lastLogin) : 'Pending first access'}
                                </td>
                                <td className="px-5 py-5">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {u.isActive ? 'Online' : 'Restricted'}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button
                                        onClick={() => toggleStatus(u._id)}
                                        className={`transition-all active:scale-90 ${u.isActive ? 'text-emerald-500' : 'text-slate-300'}`}
                                        title={u.isActive ? 'Deactivate user' : 'Activate user'}
                                    >
                                        {u.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && <AddUserModal roles={roles} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
        </div>
    );
}

function AddUserModal({ roles, onClose, onSaved }) {
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', roleId: '' });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/users', form);
            toast.success('Access granted successfully');
            onSaved();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to create user'); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] overflow-y-auto px-4 py-8 md:py-16" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="flex items-center justify-center min-h-full">
                <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl relative overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-8 duration-300">
                    <div className="flex items-center justify-between p-8 border-b border-slate-50">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Grant Access</h2>
                            <p className="text-sm text-slate-400 mt-1 font-medium">Create system credentials</p>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95">✕</button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {[
                            { key: 'name', label: 'Full Display Name*', req: true, icon: UserCircle },
                            { key: 'email', label: 'Work Email Address*', req: true, icon: Mail },
                            { key: 'password', label: 'Safety Password*', req: true, type: 'password', icon: ShieldCheck },
                            { key: 'phone', label: 'Contact Phone', icon: Phone }
                        ].map(f => (
                            <div key={f.key}>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">{f.label}</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                                        <f.icon size={18} />
                                    </div>
                                    <input
                                        type={f.type || 'text'}
                                        value={form[f.key]}
                                        onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                                        required={f.req}
                                        placeholder={`Enter ${f.label.toLowerCase().replace('*', '')}`}
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5"
                                    />
                                </div>
                            </div>
                        ))}
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Access Authority*</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                                    <Shield size={18} />
                                </div>
                                <select
                                    value={form.roleId}
                                    onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))}
                                    required
                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none"
                                >
                                    <option value="">Select an authority level</option>
                                    {roles.map(r => <option key={r._id || r.name} value={r._id}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-12 bg-slate-50/50 p-2 rounded-[2rem] border border-slate-100/50">
                            <button type="button" onClick={onClose} className="flex-1 py-4.5 text-slate-500 rounded-2xl text-sm font-black hover:bg-white hover:shadow-sm transition-all">
                                CANCEL
                            </button>
                            <button type="submit" disabled={saving} className="flex-1 py-4.5 bg-slate-900 text-white rounded-[1.25rem] text-sm font-black hover:bg-black shadow-xl shadow-slate-900/30 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                                {saving ? (
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    'AUTHORIZE'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
