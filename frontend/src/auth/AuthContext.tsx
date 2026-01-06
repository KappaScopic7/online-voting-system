import React from 'react';
import { apiMe } from '../api/client';
import { clearToken } from './tokenStore';
import type { MeResponse } from '../api/types';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

type AuthState = {
    status: AuthStatus;
    me: MeResponse | null;
    refresh: () => Promise<void>;
    logout: () => void;
};

const AuthContext = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = React.useState<AuthStatus>('checking');
    const [me, setMe] = React.useState<MeResponse | null>(null);

    const refresh = React.useCallback(async () => {
        setStatus('checking');
        try {
            const r = await apiMe();
            // ここは方針：本人未リンクなら unauthenticated 扱い（リンク画面は後回し）
            if (!r.identityLinked) {
                setMe(r);
                setStatus('unauthenticated');
                return;
            }
            setMe(r);
            setStatus('authenticated');
        } catch {
            setMe(null);
            setStatus('unauthenticated');
        }
    }, []);

    React.useEffect(() => {
        refresh();
    }, [refresh]);

    const logout = React.useCallback(() => {
        clearToken();
        setMe(null);
        setStatus('unauthenticated');
    }, []);

    return (
        <AuthContext.Provider value={{ status, me, refresh, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = React.useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
