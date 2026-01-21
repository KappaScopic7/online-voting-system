// auth/AuthContext.tsx
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import type { MeResponse } from "./api/auth";
import { fetchMe } from "./api/auth";
import { clearToken, getToken, setToken } from "../shared/tokenStorage";

type AuthState = {
    me: MeResponse | null;
    isLoading: boolean; // 初期ロード中
    hasToken: boolean; // token があるか
    isAuthed: boolean; // 「ログイン状態」判定（= hasToken）
    setAccessToken: (token: string) => Promise<void>;
    logout: () => void;
    refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [me, setMe] = useState<MeResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasToken, setHasToken] = useState(!!getToken());

    const refreshMe = async () => {
        const token = getToken();
        setHasToken(!!token);

        if (!token) {
            setMe(null);
            return;
        }

        try {
            const data = await fetchMe();
            setMe(data);
        } catch {
            // token が死んでる or サーバー側で無効化 etc
            clearToken();
            setHasToken(false);
            setMe(null);
        }
    };

    const setAccessTokenAndLoadMe = async (token: string) => {
        setToken(token);
        setHasToken(true);
        await refreshMe();
    };

    useEffect(() => {
        (async () => {
            setIsLoading(true);
            await refreshMe();
            setIsLoading(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const value = useMemo<AuthState>(
        () => ({
            me,
            isLoading,
            hasToken,
            isAuthed: hasToken,
            setAccessToken: setAccessTokenAndLoadMe,
            logout: () => {
                clearToken();
                setHasToken(false);
                setMe(null);
            },
            refreshMe,
        }),
        [me, isLoading, hasToken],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
