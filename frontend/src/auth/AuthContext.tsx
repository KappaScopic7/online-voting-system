// frontend/src/auth/AuthContext.tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearAccessToken, getAccessToken, onTokenChanged } from './tokenStore';
import { ApiError, fetchMe, type Me } from '../api/authClient';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
    token: string | null;
    status: AuthStatus;
    isAuthenticated: boolean;
    me: Me | null;
    logout: () => void;
    refresh: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(() => getAccessToken());
    const [status, setStatus] = useState<AuthStatus>(() =>
        token ? 'checking' : 'unauthenticated',
    );
    const [me, setMe] = useState<Me | null>(null);

    const verify = useCallback(async () => {
        const t = getAccessToken();
        setToken(t);

        if (!t) {
            setMe(null);
            setStatus('unauthenticated');
            return;
        }

        setStatus('checking');
        try {
            const meData = await fetchMe();
            setMe(meData);
            setStatus('authenticated');
        } catch (e: unknown) {
            if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
                clearAccessToken();
            }
            setMe(null);
            setStatus('unauthenticated');
        }
    }, []);

    const refresh = useCallback(() => {
        void verify();
    }, [verify]);

    useEffect(() => {
        void verify();

        const off = onTokenChanged(() => {
            void verify();
        });

        const onStorage = (e: StorageEvent) => {
            if (e.key === 'accessToken') void verify();
        };

        window.addEventListener('storage', onStorage);
        return () => {
            off();
            window.removeEventListener('storage', onStorage);
        };
    }, [verify]);

    const logout = useCallback(() => {
        clearAccessToken();
        setToken(null);
        setMe(null);
        setStatus('unauthenticated');
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            token,
            status,
            isAuthenticated: status === 'authenticated',
            me,
            logout,
            refresh,
        }),
        [token, status, me, logout, refresh],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
