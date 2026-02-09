// frontend/src/auth/pages/LoginPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../../user/api/userAuthApi";
import { useAuth } from "../../user/UserAuthContext";
import { sanitizeReturnTo } from "../../auth/routes/returnTo";
import { Card, Page, DevDebug } from "../../shared/ui/page";
import {
    fetchDemoPersonas,
    type DemoPersonaDto,
} from "../../demo/api/demoPersonas";

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

    const isDev = import.meta.env?.DEV;

    // ===== DEV: dynamic personas =====
    const [devPersonas, setDevPersonas] = useState<DemoPersonaDto[]>([]);
    const [devLoading, setDevLoading] = useState(false);
    const [devErr, setDevErr] = useState<string | null>(null);

    useEffect(() => {
        if (state.verified) {
            setMsg("メール認証が完了しました。ログインしてください。");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isDev) return;

        let cancelled = false;

        (async () => {
            try {
                setDevErr(null);
                setDevLoading(true);
                const list = await fetchDemoPersonas();
                if (cancelled) return;
                setDevPersonas(Array.isArray(list) ? list : []);
            } catch (e: any) {
                if (cancelled) return;
                const m =
                    e?.response?.data?.message ??
                    e?.message ??
                    "DEV personas の取得に失敗しました";
                setDevErr(m);
                setDevPersonas([]);
            } finally {
                if (!cancelled) setDevLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isDev]);

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

                        <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    flexWrap: "wrap",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            setDevErr(null);
                                            setDevLoading(true);
                                            const list =
                                                await fetchDemoPersonas();
                                            setDevPersonas(
                                                Array.isArray(list) ? list : [],
                                            );
                                        } catch (e: any) {
                                            const m =
                                                e?.response?.data?.message ??
                                                e?.message ??
                                                "DEV personas の取得に失敗しました";
                                            setDevErr(m);
                                        } finally {
                                            setDevLoading(false);
                                        }
                                    }}
                                    disabled={isSubmitting || devLoading}
                                    style={{
                                        fontSize: 12,
                                        padding: "6px 10px",
                                    }}
                                >
                                    {devLoading ? "読み込み中..." : "再読込"}
                                </button>
                            </div>

                            {devErr && (
                                <div
                                    style={{
                                        color: "crimson",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {devErr}
                                </div>
                            )}

                            {devPersonas.map((p) => (
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

                            {!devLoading &&
                                !devErr &&
                                devPersonas.length === 0 && (
                                    <div style={{ opacity: 0.8, fontSize: 12 }}>
                                        DEVユーザーが0件です（/api/demo/personas
                                        を確認）
                                    </div>
                                )}
                        </div>

                        <DevDebug
                            value={{
                                email,
                                isSubmitting,
                                fieldErr,
                                state,
                                returnTo,
                                devPersonas,
                                devLoading,
                                devErr,
                            }}
                        />
                    </details>
                </Card>
            )}
        </Page>
    );
}
