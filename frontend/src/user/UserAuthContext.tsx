// frontend/src/auth/UserAuthContext.tsx
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import type { MeResponse } from "../auth/model/authTypes";
import { fetchMe } from "../user/api/userAuthApi";
import { userToken } from "../shared/tokenStorage";

type AuthState = {
    me: MeResponse | null;
    isLoading: boolean;
    hasToken: boolean;
    isAuthed: boolean;
    setAccessToken: (token: string) => Promise<void>;
    logout: () => void;
    refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [me, setMe] = useState<MeResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasToken, setHasToken] = useState(!!userToken.get());

    const refreshMe = async () => {
        const token = userToken.get();
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
            userToken.clear(); // subscribe が走る想定
            setHasToken(false);
            setMe(null);
        }
    };

    const setAccessTokenAndLoadMe = async (token: string) => {
        userToken.set(token); // subscribe が走る想定
        setHasToken(true);
        await refreshMe();
    };

    // 初期ロード
    useEffect(() => {
        (async () => {
            setIsLoading(true);
            await refreshMe();
            setIsLoading(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // token変更（別タブ含む）に追従
    useEffect(() => {
        const unsub = userToken.subscribe(() => {
            const token = userToken.get();
            setHasToken(!!token);

            if (!token) setMe(null);
            // token がセットされた時は setAccessToken() 側で refreshMe するのでここでは呼ばない
        });
        return unsub;
    }, []);

    const value = useMemo<AuthState>(
        () => ({
            me,
            isLoading,
            hasToken,
            isAuthed: hasToken,
            setAccessToken: setAccessTokenAndLoadMe,
            logout: () => {
                userToken.clear();
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
