// auth/pages/RegisterPage.tsx
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { register } from "../api/auth";

function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function normalizeFrom(from?: string): string {
    const f = (from ?? "").trim();
    if (!f) return "/";
    if (!f.startsWith("/") || f.startsWith("//")) return "/";

    if (f === "/votes") return "/me/votes";
    if (f === "/identity/link") return "/me/identity";
    if (f === "/identity/pending") return "/me/identity/pending";

    return f;
}

export function RegisterPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as { from?: string } | null;

    const from = normalizeFrom(state?.from);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");

    const [showPw, setShowPw] = useState(false);

    const [msg, setMsg] = useState<string | null>(null);
    const [fieldErr, setFieldErr] = useState<{
        email?: string;
        password?: string;
        password2?: string;
    }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = useMemo(() => {
        const e = email.trim();
        if (!e || !password || !password2) return false;
        if (!isValidEmail(e)) return false;
        if (password !== password2) return false;
        return !isSubmitting;
    }, [email, password, password2, isSubmitting]);

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
        if (password && password.length < 8)
            nextErr.password = "パスワードは8文字以上にしてください（仮）";

        if (!password2)
            nextErr.password2 = "確認用パスワードを入力してください";
        else if (password && password2 && password !== password2)
            nextErr.password2 = "パスワードが一致しません";

        if (nextErr.email || nextErr.password || nextErr.password2) {
            setFieldErr(nextErr);
            return;
        }

        try {
            setIsSubmitting(true);
            await register(em, password);

            nav("/verify", { replace: true, state: { email: em, from } });
        } catch (err: any) {
            const apiMsg = err?.response?.data?.message ?? "Register failed";
            setMsg(apiMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isDev = import.meta.env?.DEV;

    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 420 }}>
            <h2>Register</h2>

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
                            autoComplete="new-password"
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
                    <small>※ 仮：8文字以上</small>
                    {fieldErr.password && (
                        <small style={{ color: "crimson" }}>
                            {fieldErr.password}
                        </small>
                    )}
                </label>

                <label style={{ display: "grid", gap: 4 }}>
                    <span>Password (confirm)</span>
                    <input
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value)}
                        placeholder="password (confirm)"
                        type={showPw ? "text" : "password"}
                        autoComplete="new-password"
                    />
                    {fieldErr.password2 && (
                        <small style={{ color: "crimson" }}>
                            {fieldErr.password2}
                        </small>
                    )}
                </label>

                <button type="submit" disabled={!canSubmit}>
                    {isSubmitting ? "Creating..." : "Create"}
                </button>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link to="/login" state={{ email: email.trim(), from }}>
                        ログインへ
                    </Link>
                </div>
            </form>

            {isDev && (
                <details>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(
                            { email, msg, isSubmitting, fieldErr, from },
                            null,
                            2,
                        )}
                    </pre>
                </details>
            )}
        </div>
    );
}
