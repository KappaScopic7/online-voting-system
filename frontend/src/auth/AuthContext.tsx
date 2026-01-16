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
    isLoading: boolean;
    isAuthed: boolean;
    setAccessToken: (token: string) => Promise<void>; // ★ async
    logout: () => void;
    refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [me, setMe] = useState<MeResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshMe = async () => {
        const token = getToken();
        if (!token) {
            setMe(null);
            return;
        }
        try {
            const data = await fetchMe();
            setMe(data);
        } catch {
            clearToken();
            setMe(null);
        }
    };

    const setAccessTokenAndLoadMe = async (token: string) => {
        setToken(token);
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
            isAuthed: !!me,
            setAccessToken: setAccessTokenAndLoadMe, // ← 絶対これを返す
            logout: () => {
                clearToken();
                setMe(null);
            },
            refreshMe,
        }),
        [me, isLoading],
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
