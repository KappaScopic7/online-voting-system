// frontend/src/auth/pages/RegisterPage.tsx
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { register } from "../../user/api/userAuthApi";
import { sanitizeReturnTo } from "../../auth/routes/returnTo";
import { Card, Page, DevDebug } from "../../shared/ui/page";

type LocationState = { email?: string; from?: string };

function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function RegisterPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const returnTo = useMemo(
        () => sanitizeReturnTo(state.from, "/"),
        [state.from],
    );

    const [email, setEmail] = useState(state.email ?? "");
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
        const em = email.trim();
        if (!em || !password || !password2) return false;
        if (!isValidEmail(em)) return false;
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
        else if (password !== password2)
            nextErr.password2 = "パスワードが一致しません";

        if (nextErr.email || nextErr.password || nextErr.password2) {
            setFieldErr(nextErr);
            return;
        }

        try {
            setIsSubmitting(true);
            await register(em, password);

            nav("/verify", {
                replace: true,
                state: { email: em, from: returnTo },
            });
        } catch (err: any) {
            setMsg(
                err?.response?.data?.message ??
                    err?.message ??
                    "登録に失敗しました",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const isDev = import.meta.env?.DEV;

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>新規登録</h1>}
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
                        エラー
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
                                autoComplete="new-password"
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
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                            ※ 仮：8文字以上
                        </div>
                        {fieldErr.password && (
                            <small style={{ color: "crimson" }}>
                                {fieldErr.password}
                            </small>
                        )}
                    </label>

                    <label style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 900 }}>
                            パスワード（確認）
                        </div>
                        <input
                            value={password2}
                            onChange={(e) => setPassword2(e.target.value)}
                            placeholder="パスワード（確認）"
                            type={showPw ? "text" : "password"}
                            autoComplete="new-password"
                            disabled={isSubmitting}
                            style={{
                                padding: "10px 12px",
                                borderRadius: 10,
                                border: "1px solid #e5e5e5",
                            }}
                        />
                        {fieldErr.password2 && (
                            <small style={{ color: "crimson" }}>
                                {fieldErr.password2}
                            </small>
                        )}
                    </label>

                    <button type="submit" disabled={!canSubmit || isSubmitting}>
                        {isSubmitting ? "登録中..." : "登録する"}
                    </button>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <Link
                            to="/login"
                            state={{ email: email.trim(), from: returnTo }}
                        >
                            ログインへ
                        </Link>
                    </div>
                </form>
            </Card>

            {isDev && (
                <DevDebug
                    value={{ email, msg, isSubmitting, fieldErr, returnTo }}
                />
            )}
        </Page>
    );
}
