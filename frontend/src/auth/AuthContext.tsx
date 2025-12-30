// frontend/src/auth/AuthContext.tsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getAccessToken, clearAccessToken, onTokenChanged } from './tokenStore';

type AuthContextValue = {
    token: string | null;
    isAuthenticated: boolean;
    logout: () => void;
    refresh: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(() => getAccessToken());

    const refresh = useCallback(() => {
        setToken(getAccessToken());
    }, []);

    // 他タブ + 同一タブ（tokenStoreイベント）対応
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'accessToken') setToken(e.newValue);
        };

        const offTokenChanged = onTokenChanged(() => {
            setToken(getAccessToken());
        });

        window.addEventListener('storage', onStorage);
        return () => {
            window.removeEventListener('storage', onStorage);
            offTokenChanged();
        };
    }, []);

    const logout = useCallback(() => {
        clearAccessToken();
        setToken(null);
    }, []);

    return (
        <AuthContext.Provider value={{ token, isAuthenticated: !!token, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
