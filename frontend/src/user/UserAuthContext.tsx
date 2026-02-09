// frontend/src/auth/UserAuthContext.tsx
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import type { MeResponse } from "./model/userAuthTypes";
import { fetchMe } from "../user/api/userAuthApi";
import { publicToken, staffToken, userToken } from "../shared/tokenStorage";

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

// --- JWT expiry guard (to avoid /api/auth/me 401 at startup) ---
function base64UrlDecode(input: string): string {
    // base64url -> base64
    let s = input.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    // decode
    const decoded = atob(s);
    // handle unicode safely
    try {
        return decodeURIComponent(
            Array.from(decoded)
                .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                .join(""),
        );
    } catch {
        return decoded;
    }
}

function isJwtExpired(token: string, skewSec = 10): boolean {
    // if token isn't a JWT, don't block the request (fallback)
    const parts = token.split(".");
    if (parts.length < 2) return false;

    try {
        const payloadJson = base64UrlDecode(parts[1]);
        const payload = JSON.parse(payloadJson) as { exp?: number };
        if (!payload?.exp) return false; // no exp -> treat as not expired

        const nowSec = Math.floor(Date.now() / 1000);
        return payload.exp <= nowSec + skewSec;
    } catch {
        return false;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [me, setMe] = useState<MeResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [hasToken, setHasToken] = useState(() => {
        const t = userToken.get();
        return !!t && !isJwtExpired(t);
    });

    // ✅ React StrictMode で useEffect が2回走るのを抑制（DEVの無駄リクエスト減）
    const didInitRef = useRef(false);

    const refreshMe = async (): Promise<void> => {
        const token = userToken.get();

        // 未ログイン or 期限切れは「叩かない」
        if (!token || isJwtExpired(token)) {
            if (token) userToken.clear();
            setHasToken(false);
            setMe(null);
            return;
        }

        setHasToken(true);

        try {
            const data = await fetchMe();
            setMe(data);
        } catch {
            // token が死んでる / サーバ側で無効化 / role変更など
            userToken.clear();
            setHasToken(false);
            setMe(null);
        }
    };

    const setAccessTokenAndLoadMe = async (token: string): Promise<void> => {
        publicToken.clear();
        staffToken.clear();

        userToken.set(token);
        setHasToken(true);
        await refreshMe();
    };

    // 初期ロード
    useEffect(() => {
        if (didInitRef.current) return;
        didInitRef.current = true;

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
            const t = userToken.get();

            // 期限切れなら即クリア（401を出さない）
            if (t && isJwtExpired(t)) {
                userToken.clear();
                setHasToken(false);
                setMe(null);
                return;
            }

            setHasToken(!!t);

            if (!t) setMe(null);
            // token セット時の refreshMe は setAccessToken() が担当
        });

        return unsub;
    }, []);

    const value = useMemo<AuthState>(
        () => ({
            me,
            isLoading,
            hasToken,
            // 「トークンあるだけ」を authed 扱いにするならこのまま
            // 「me が取れて初めて authed」にしたいなら: isAuthed: !!me
            isAuthed: hasToken,
            setAccessToken: setAccessTokenAndLoadMe,
            logout: () => {
                userToken.clear();
                // 任意（混線防止）
                publicToken.clear();
                staffToken.clear();

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
