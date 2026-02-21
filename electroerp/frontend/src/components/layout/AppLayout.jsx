import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1024) setSidebarOpen(false);
            else setSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-[#fafafa]">
            {/* Sidebar with higher Z-index for mobile */}
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content viewport */}
            <div
                className={`flex flex-col flex-1 overflow-hidden transition-all duration-500 ease-in-out`}
                style={{ paddingLeft: (sidebarOpen && window.innerWidth > 1024) ? '280px' : '0' }}
            >
                <Navbar onMenuClick={() => setSidebarOpen(o => !o)} sidebarOpen={sidebarOpen} />

                <main className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar relative">
                    {/* Floating ambient glow for premium feel */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[120px] -z-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-50/50 rounded-full blur-[100px] -z-10 pointer-events-none" />

                    <div className="max-w-7xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Backdrop for mobile interaction */}
            {sidebarOpen && window.innerWidth <= 1024 && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[35] transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
