// frontend/src/auth/pages/LoginPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../../user/api/userAuthApi";
import { useAuth } from "../../user/UserAuthContext";
import { demoPersonas } from "../../demo/personas";
import { sanitizeReturnTo } from "../../auth/routes/returnTo";
import { Card, Page, DevDebug } from "../../shared/ui/page";

type LocationState = {
    email?: string;
    from?: string;
    verified?: boolean;
};

function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function LoginPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const returnTo = useMemo(
        () => sanitizeReturnTo(state.from, "/"),
        [state.from],
    );

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

    useEffect(() => {
        if (state.verified) {
            setMsg("メール認証が完了しました。ログインしてください。");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                err?.response?.data?.message ??
                err?.message ??
                "ログインに失敗しました";
            const apiCode = err?.response?.data?.code;

            if (apiCode === "EMAIL_NOT_VERIFIED") {
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
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>ログイン</h1>}
            actions={
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link to={returnTo}>← 戻る</Link>
                </div>
            }
            maxWidth={520}
        >
            {msg && (
                <Card role="alert">
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>
                        メッセージ
                    </div>
                    <div style={{ opacity: 0.9, lineHeight: 1.6 }}>{msg}</div>
                </Card>
            )}

            <Card>
                <form
                    onSubmit={onSubmit}
                    aria-busy={isSubmitting}
                    style={{ display: "grid", gap: 10 }}
                >
                    <label style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 900 }}>
                            メールアドレス
                        </div>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="例: user@example.com"
                            autoComplete="email"
                            inputMode="email"
                            disabled={isSubmitting}
                            style={{
                                padding: "10px 12px",
                                borderRadius: 10,
                                border: "1px solid #e5e5e5",
                            }}
                        />
                        {fieldErr.email && (
                            <small style={{ color: "crimson" }}>
                                {fieldErr.email}
                            </small>
                        )}
                    </label>

                    <label style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 900 }}>
                            パスワード
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="パスワード"
                                type={showPw ? "text" : "password"}
                                autoComplete="current-password"
                                style={{
                                    flex: 1,
                                    padding: "10px 12px",
                                    borderRadius: 10,
                                    border: "1px solid #e5e5e5",
                                }}
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw((v) => !v)}
                                aria-pressed={showPw}
                                disabled={isSubmitting}
                                style={{ padding: "0 10px" }}
                            >
                                {showPw ? "非表示" : "表示"}
                            </button>
                        </div>
                        {fieldErr.password && (
                            <small style={{ color: "crimson" }}>
                                {fieldErr.password}
                            </small>
                        )}
                    </label>

                    <button type="submit" disabled={!canSubmit || isSubmitting}>
                        {isSubmitting ? "ログイン中..." : "ログイン"}
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
            </Card>

            {isDev && (
                <Card>
                    <details>
                        <summary style={{ cursor: "pointer" }}>
                            DEV tools
                        </summary>
                        <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
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
                        <DevDebug
                            value={{
                                email,
                                isSubmitting,
                                fieldErr,
                                state,
                                returnTo,
                            }}
                        />
                    </details>
                </Card>
            )}
        </Page>
    );
}
