import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../../user/api/userAuthApi";
import { useAuth } from "../../user/UserAuthContext";
import { demoPersonas } from "../../demo/personas";
import { sanitizeReturnTo } from "../../auth/routes/returnTo";

type LocationState = {
    email?: string;
    from?: string;
    verified?: boolean; // Verifyから戻ってきた合図（任意）
};

function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function LoginPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    // ★ auth全体で統一：戻り先は returnTo のみ
    const returnTo = useMemo(
        () => sanitizeReturnTo(state.from, "/"),
        [state.from],
    );

    const { setAccessToken } = useAuth();

    const [email, setEmail] = useState(state.email ?? "");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);

    const [msg, setMsg] = useState<string | null>(
        state.verified
            ? "メール認証が完了しました。ログインしてください。"
            : null,
    );
    const [fieldErr, setFieldErr] = useState<{
        email?: string;
        password?: string;
    }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = useMemo(() => {
        const em = email.trim();
        if (!em || !password) return false;
        if (!isValidEmail(em)) return false;
        return !isSubmitting;
    }, [email, password, isSubmitting]);

    const doLogin = async (em: string, pw: string) => {
        setMsg(null);
        setFieldErr({});
        try {
            setIsSubmitting(true);

            const token = await login(em, pw);
            await setAccessToken(token.accessToken);

            nav(returnTo, { replace: true });
        } catch (err: any) {
            const apiMsg =
                err?.response?.data?.message ?? err?.message ?? "Login failed";
            const apiCode = err?.response?.data?.code;

            if (apiCode === "EMAIL_NOT_VERIFIED") {
                // ★ verify へも returnTo を渡す（authページを戻り先にしない）
                nav("/verify", { state: { email: em, from: returnTo } });
                return;
            }

            if (apiCode === "INVALID_CREDENTIALS") {
                setMsg("メールアドレスまたはパスワードが違います");
                setPassword("");
                return;
            }

            setMsg(apiMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        setFieldErr({});

        const em = email.trim();
        const nextErr: typeof fieldErr = {};
        if (!em) nextErr.email = "メールアドレスを入力してください";
        else if (!isValidEmail(em))
            nextErr.email = "メールアドレスの形式が不正です";
        if (!password) nextErr.password = "パスワードを入力してください";

        if (nextErr.email || nextErr.password) {
            setFieldErr(nextErr);
            return;
        }

        await doLogin(em, password);
    };

    const isDev = import.meta.env?.DEV;

    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 420 }}>
            <h2 style={{ margin: 0 }}>Login</h2>

            {msg && (
                <div
                    role="alert"
                    style={{
                        padding: 10,
                        border: "1px solid #ddd",
                        borderRadius: 10,
                    }}
                >
                    {msg}
                </div>
            )}

            <form
                onSubmit={onSubmit}
                aria-busy={isSubmitting}
                style={{ display: "grid", gap: 10 }}
            >
                <label style={{ display: "grid", gap: 4 }}>
                    <span>Email</span>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email"
                        autoComplete="email"
                        inputMode="email"
                        disabled={isSubmitting}
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
                            disabled={isSubmitting}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw((v) => !v)}
                            aria-pressed={showPw}
                            disabled={isSubmitting}
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

                <button type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? "Logging in..." : "Login"}
                </button>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link to="/register" state={{ email, from: returnTo }}>
                        新規登録
                    </Link>
                    <Link
                        to="/password/forgot"
                        state={{ email, from: returnTo }}
                    >
                        パスワードを忘れた
                    </Link>
                    <Link to="/verify" state={{ email, from: returnTo }}>
                        メール認証へ
                    </Link>
                </div>
            </form>

            {isDev && (
                <details>
                    <summary>Debug</summary>
                    <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                        {Object.values(demoPersonas.voter).map((p) => (
                            <button
                                key={p.key}
                                type="button"
                                onClick={() => doLogin(p.email, p.password)}
                                disabled={isSubmitting}
                                style={{
                                    fontSize: 12,
                                    padding: "6px 10px",
                                    textAlign: "left",
                                }}
                                title={p.description}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(
                            { email, isSubmitting, fieldErr, state, returnTo },
                            null,
                            2,
                        )}
                    </pre>
                </details>
            )}
        </div>
    );
}
