// auth/pages/LoginPage.tsx
import { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../AuthContext";

type LocationState = {
    email?: string;
    from?: string; // 保護ルートから来た場合の戻り先を入れる想定
};

function isValidEmail(v: string) {
    // 仮の軽いチェック（後でzod等に差し替えOK）
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function LoginPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;
    const from = state.from ?? loc.pathname + loc.search;

    const { setAccessToken } = useAuth();

    const [email, setEmail] = useState(state.email ?? "");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);

    const [msg, setMsg] = useState<string | null>(null);
    const [fieldErr, setFieldErr] = useState<{
        email?: string;
        password?: string;
    }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = useMemo(() => {
        if (!email.trim() || !password) return false;
        if (!isValidEmail(email.trim())) return false;
        return !isSubmitting;
    }, [email, password, isSubmitting]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        setFieldErr({});

        // 1) フロントバリデーション（仮）
        const nextErr: typeof fieldErr = {};
        if (!email.trim()) nextErr.email = "メールアドレスを入力してください";
        else if (!isValidEmail(email.trim()))
            nextErr.email = "メールアドレスの形式が不正です";
        if (!password) nextErr.password = "パスワードを入力してください";
        if (nextErr.email || nextErr.password) {
            setFieldErr(nextErr);
            return;
        }

        // 2) API
        try {
            setIsSubmitting(true);
            const token = await login(email.trim(), password);
            await setAccessToken(token.accessToken);

            // 3) 遷移（fromがあればそこへ）
            const to = state.from ?? "/";
            nav(to, { replace: true });
        } catch (err: any) {
            // 4) エラーハンドリング（仮置き）
            const apiMsg = err?.response?.data?.message ?? "Login failed";
            const apiCode = err?.response?.data?.code;

            // 例：メール未認証ならverifyへ誘導したい場合（コードは仮）
            if (apiCode === "EMAIL_NOT_VERIFIED") {
                setMsg(
                    "メール認証が完了していません。認証画面へ進んでください。",
                );
                // nav("/verify", { state: { email: email.trim(), from: state.from } });
            } else {
                setMsg(apiMsg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const isDev = import.meta.env?.DEV;

    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 420 }}>
            <h2>Login</h2>

            {/* グローバルメッセージ */}
            {msg && (
                <div
                    role="alert"
                    style={{ padding: 8, border: "1px solid #ccc" }}
                >
                    {msg}
                </div>
            )}

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
                <label style={{ display: "grid", gap: 4 }}>
                    <span>Email</span>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email"
                        autoComplete="email"
                        inputMode="email"
                    />
                    {fieldErr.email && (
                        <small style={{ color: "crimson" }}>
                            {fieldErr.email}
                        </small>
                    )}
                </label>

                <label style={{ display: "grid", gap: 4 }}>
                    <span>Password</span>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="password"
                            type={showPw ? "text" : "password"}
                            autoComplete="current-password"
                            style={{ flex: 1 }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw((v) => !v)}
                            aria-pressed={showPw}
                        >
                            {showPw ? "Hide" : "Show"}
                        </button>
                    </div>
                    {fieldErr.password && (
                        <small style={{ color: "crimson" }}>
                            {fieldErr.password}
                        </small>
                    )}
                </label>

                <button type="submit" disabled={!canSubmit}>
                    {isSubmitting ? "Logging in..." : "Login"}
                </button>

                {/* 追加導線（仮） */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link to="/register" state={{ email, from }}>
                        新規登録
                    </Link>
                    <Link to="/password/forgot" state={{ email, from }}>
                        パスワードを忘れた
                    </Link>
                    <Link to="/verify" state={{ email, from }}>
                        メール認証へ
                    </Link>
                </div>
            </form>

            {/* DEV用デバッグ（passwordは出さない） */}
            {isDev && (
                <details>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(
                            {
                                email,
                                msg,
                                isSubmitting,
                                fieldErr,
                                locationState: state,
                            },
                            null,
                            2,
                        )}
                    </pre>
                </details>
            )}
        </div>
    );
}
