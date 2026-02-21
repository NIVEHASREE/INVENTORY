import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchMe = useCallback(async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) { setLoading(false); return; }
            const { data } = await api.get('/auth/me');
            setUser(data.data);
        } catch {
            localStorage.removeItem('accessToken');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMe(); }, [fetchMe]);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('accessToken', data.data.accessToken);
        setUser(data.data.user);
        return data.data;
    };

    const logout = async () => {
        try { await api.post('/auth/logout'); } catch { }
        localStorage.removeItem('accessToken');
        setUser(null);
        window.location.href = '/login';
    };

    const hasPermission = (resource, action) => {
        if (!user?.role) return false;
        if (user.role.name === 'ADMIN') return true;
        const perm = user.role.permissions?.find(p => p.resource === resource);
        return perm?.actions?.includes(action) ?? false;
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
