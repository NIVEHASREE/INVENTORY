import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingCart, History, Package, Truck,
    FileText, BarChart3, Receipt, Users, Activity, Menu, Zap,
    ChevronRight, LogOut, ShieldCheck, Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
    { label: 'Control Center', to: '/', icon: LayoutDashboard },
    { label: 'Terminals', to: '/billing', icon: ShoppingCart },
    { label: 'Transmission Logs', to: '/billing/history', icon: History },
    { label: 'Asset Matrix', to: '/inventory', icon: Package },
    { label: 'Vector Partners', to: '/suppliers', icon: Truck },
    { label: 'Acquisitions', to: '/purchases', icon: FileText },
    { label: 'Tax Surveillance', to: '/gst', icon: Receipt },
    { label: 'Yield Analytics', to: '/reports', icon: BarChart3 },
    { label: 'Authority Units', to: '/users', icon: Users, roles: ['ADMIN'] },
    { label: 'Surveillance Feed', to: '/activity-logs', icon: Activity, roles: ['ADMIN'] },
];

export default function Sidebar({ open, onClose }) {
    const { user, logout } = useAuth();
    const roleName = user?.role?.name;

    const visibleItems = navItems.filter(item =>
        !item.roles || item.roles.includes(roleName)
    );

    return (
        <aside className={`fixed top-0 left-0 h-full w-[280px] bg-slate-900 z-[40] flex flex-col shadow-2xl transition-all duration-500 ease-in-out border-r border-slate-800
      ${open ? 'translate-x-0' : '-translate-x-full'}`}>

            {/* Elite Branding */}
            <div className="flex items-center gap-4 px-8 py-10">
                <div className="relative group">
                    <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center relative border border-white/10 shadow-inner">
                        <Zap size={22} className="text-white fill-white/20" />
                    </div>
                </div>
                <div>
                    <h1 className="text-white font-black text-xl tracking-tighter leading-none">VANGUARD</h1>
                    <p className="text-blue-500/60 text-[10px] font-black tracking-[0.3em] mt-1.5 uppercase">Electro ERP</p>
                </div>
            </div>

            {/* Navigation Matrix */}
            <nav className="flex-1 overflow-y-auto py-2 px-4 space-y-1.5 custom-scrollbar">
                <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Core Protocols</p>
                {visibleItems.map(({ label, to, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        onClick={() => window.innerWidth <= 1024 && onClose()}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group
               ${isActive
                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {Icon && <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-500'} transition-colors`} />}
                                <span className="flex-1 tracking-widest">{label}</span>
                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-lg animate-pulse" />}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Authority Profile */}
            <div className="p-6 mt-auto">
                <div className="bg-slate-800/40 rounded-[2rem] p-5 border border-slate-700/30">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center border border-slate-500/20 shadow-lg">
                                <span className="text-white font-black text-lg">{(user?.name?.charAt(0) || 'U').toUpperCase()}</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-black uppercase tracking-tight truncate">{user?.name || 'Authorized Unit'}</p>
                            <p className="text-blue-500/60 text-[9px] font-black uppercase tracking-widest truncate mt-0.5">{roleName || 'Protocol Access'}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all text-[10px] font-black uppercase tracking-widest group border border-slate-700/50 hover:border-red-500/20"
                    >
                        <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" /> Sign Out Matrix
                    </button>
                </div>
            </div>
        </aside>
    );
}
