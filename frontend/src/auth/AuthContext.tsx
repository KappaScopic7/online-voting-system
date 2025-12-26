// frontend/src/auth/AuthContext.tsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getAccessToken, clearAccessToken } from './tokenStore';

type AuthContextValue = {
    token: string | null;
    isAuthenticated: boolean;
    logout: () => void;
    refresh: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(() => getAccessToken());

    // 他タブログアウト対応
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'accessToken') {
                setToken(e.newValue);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const refresh = useCallback(() => {
        setToken(getAccessToken());
    }, []);

    const logout = useCallback(() => {
        clearAccessToken();
        setToken(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                token,
                isAuthenticated: !!token,
                logout,
                refresh,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
}
