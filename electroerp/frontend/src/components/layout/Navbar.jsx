import { Menu, Bell, LogOut, Moon, Sun, ChevronDown, Search, Plus, User, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Navbar({ onMenuClick, sidebarOpen }) {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notifOpen, setNotifOpen] = useState(false);

    useEffect(() => {
        api.get('/notifications').then(r => setNotifications(r.data.data || [])).catch(() => { });
    }, []);

    const markAllRead = async () => {
        await api.patch('/notifications/read-all');
        setNotifications([]);
    };

    return (
        <header className="h-24 px-10 flex items-center justify-between sticky top-0 z-30 bg-[#fafafa]/80 backdrop-blur-xl border-b border-slate-100">
            {/* Control & Identity */}
            <div className="flex items-center gap-8">
                <button
                    onClick={onMenuClick}
                    className="group flex flex-col gap-1.5 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-blue-200 transition-all active:scale-95"
                >
                    <div className={`h-0.5 bg-slate-900 transition-all duration-300 ${sidebarOpen ? 'w-6' : 'w-4'}`} />
                    <div className={`h-0.5 bg-slate-900 transition-all duration-300 ${sidebarOpen ? 'w-4' : 'w-6'}`} />
                    <div className={`h-0.5 bg-slate-900 transition-all duration-300 ${sidebarOpen ? 'w-6' : 'w-4'}`} />
                </button>

                <div className="hidden md:flex items-center gap-3">
                    <div className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/10">
                        <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck size={12} className="text-blue-500" /> Authorized Environment
                        </p>
                    </div>
                </div>
            </div>

            {/* Utility Matrix */}
            <div className="flex items-center gap-6">
                {/* Search Interaction */}
                <div className="hidden lg:flex items-center gap-3 bg-white border border-slate-100 rounded-[1.25rem] px-5 py-2.5 shadow-sm group focus-within:border-blue-200 focus-within:ring-8 focus-within:ring-blue-500/5 transition-all">
                    <Search size={16} className="text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Protocol Search..."
                        className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-800 placeholder:text-slate-300 w-48"
                    />
                </div>

                {/* Notification Node */}
                <div className="relative">
                    <button
                        onClick={() => setNotifOpen(o => !o)}
                        className={`relative w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all ${notifOpen ? 'bg-slate-900 text-white shadow-xl' : 'bg-white border border-slate-100 text-slate-400 hover:border-blue-200'}`}
                    >
                        <Bell size={18} />
                        {notifications.length > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse border-2 border-white" />
                        )}
                    </button>

                    {notifOpen && (
                        <div className="absolute right-0 top-16 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Surveillance Feed</span>
                                {notifications.length > 0 && (
                                    <button onClick={markAllRead} className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest">Wipe All</button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center">
                                        <ShieldCheck size={32} className="text-slate-100 mb-2" />
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Zero Feed Latency</p>
                                    </div>
                                ) : notifications.map(n => (
                                    <div key={n._id} className="px-8 py-5 border-b border-slate-50 hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{n.title}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter leading-relaxed">{n.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Identity Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(o => !o)}
                        className={`flex items-center gap-4 pl-4 pr-6 py-2.5 rounded-[1.25rem] transition-all border ${dropdownOpen ? 'bg-slate-900 border-slate-900 shadow-xl' : 'bg-white border-slate-100 hover:border-blue-200'}`}
                    >
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center border border-white/50 overflow-hidden shadow-sm">
                            <span className="text-slate-900 font-black text-sm">{(user?.name?.charAt(0) || 'U').toUpperCase()}</span>
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className={`text-[11px] font-black tracking-tighter uppercase leading-none ${dropdownOpen ? 'text-white' : 'text-slate-900'}`}>{user?.name}</p>
                            <p className={`text-[9px] font-black uppercase tracking-widest mt-1 opacity-60 ${dropdownOpen ? 'text-blue-400' : 'text-slate-400'}`}>{user?.role?.name}</p>
                        </div>
                        <ChevronDown size={14} className={`transition-transform duration-300 ${dropdownOpen ? 'rotate-180 text-blue-500' : 'text-slate-300'}`} />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 top-16 w-56 bg-white rounded-3xl shadow-2xl border border-slate-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            <div className="p-4">
                                <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100/50 mb-2">
                                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{user?.name}</p>
                                    <p className="text-[9px] font-medium text-slate-400 truncate mt-1">{user?.email}</p>
                                </div>
                                <button
                                    onClick={logout}
                                    className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-red-50 hover:bg-red-500 text-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest group"
                                >
                                    <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" /> Sign Out Matrix
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
